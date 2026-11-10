import { z } from 'zod';
export const ReservedRegionSchema=z.strictObject({id:z.string().uuid(),label:z.string().trim().min(1).max(120),xMm:z.number().finite().min(0).max(1000),yMm:z.number().finite().min(0).max(1000),widthMm:z.number().finite().positive().max(1000),heightMm:z.number().finite().positive().max(1000),shape:z.enum(['rectangle','ellipse'])});
export const ReservedRegionsSchema=z.array(ReservedRegionSchema).max(20).refine(regions=>new Set(regions.map(region=>region.id)).size===regions.length,'ID duplicati nelle zone');
export type ReservedRegion=z.infer<typeof ReservedRegionSchema>;
export interface RegionArea {width:number;height:number;shape:'rectangle'|'square'|'round';}
const tolerance=1e-7;
const polynomial=(coefficients:readonly number[],x:number)=>coefficients.reduceRight((value,coefficient)=>value*x+coefficient,0);
/** Degree <= 4 roots on [0,1], isolated by the derivative's monotonic intervals. */
function roots01(raw:readonly number[]):number[]{
 const scale=Math.max(...raw.map(Math.abs));if(!scale)return[];const coefficients=raw.map(value=>value/scale);while(coefficients.length>1&&Math.abs(coefficients.at(-1)!)<1e-14)coefficients.pop();
 if(coefficients.length===1)return[];if(coefficients.length===2){const root=-coefficients[0]!/coefficients[1]!;return root>=0&&root<=1?[root]:[];}
 const derivative=coefficients.slice(1).map((value,index)=>value*(index+1)),critical=roots01(derivative),points=[0,...critical.filter(value=>value>0&&value<1),1].sort((a,b)=>a-b),roots:number[]=[];
 for(const point of points)if(Math.abs(polynomial(coefficients,point))<1e-11)roots.push(point);
 for(let i=1;i<points.length;i++){let left=points[i-1]!,right=points[i]!,fl=polynomial(coefficients,left),fr=polynomial(coefficients,right);if(fl*fr>=0)continue;for(let step=0;step<60;step++){const middle=(left+right)/2,value=polynomial(coefficients,middle);if(fl*value<=0){right=middle;fr=value;}else{left=middle;fl=value;}}roots.push((left+right)/2);}
 return roots.filter((value,index)=>roots.findIndex(other=>Math.abs(other-value)<1e-9)===index);
}
/** Maximum distance of an axis-aligned ellipse from a point; no bounding-box substitution. */
export function ellipseFarthestDistance(cx:number,cy:number,rx:number,ry:number):number{
 cx=Math.abs(cx);cy=Math.abs(cy);if(cx===0&&cy===0)return Math.max(rx,ry);if(Math.abs(rx-ry)<1e-12)return Math.hypot(cx,cy)+rx;
 const a=ry*ry-rx*rx,b=cx*rx,c=cy*ry,coefficients=[c*c,-2*b*c,b*b+c*c-a*a,-2*b*c,b*b],converted=Array(5).fill(0)as number[];
 const binomial=(n:number,k:number)=>{let result=1;for(let i=1;i<=k;i++)result=result*(n-i+1)/i;return result;};
 // t=tan(theta), u=t/(1+t): map the non-negative quartic roots to a bounded interval.
 for(let k=0;k<5;k++)for(let j=0;j<=4-k;j++)converted[k+j]!+=coefficients[k]!*binomial(4-k,j)*(j%2?-1:1);
 const angles=[0,Math.PI/2,...roots01(converted).filter(u=>u>0&&u<1).map(u=>Math.atan(u/(1-u)))];
 return Math.max(...angles.map(angle=>Math.hypot(cx+rx*Math.cos(angle),cy+ry*Math.sin(angle))));
}
export function regionFitsArea(region:ReservedRegion,area:RegionArea):boolean{
 if(!Number.isFinite(area.width)||!Number.isFinite(area.height)||area.width<=0||area.height<=0||area.shape!=='rectangle'&&area.width!==area.height)return false;
 if(region.xMm<-tolerance||region.yMm<-tolerance||region.xMm+region.widthMm>area.width+tolerance||region.yMm+region.heightMm>area.height+tolerance)return false;
 if(area.shape!=='round')return true;const radius=area.width/2,cx=region.xMm+region.widthMm/2-radius,cy=region.yMm+region.heightMm/2-radius;
 return region.shape==='ellipse'?ellipseFarthestDistance(cx,cy,region.widthMm/2,region.heightMm/2)<=radius+tolerance:[[region.xMm,region.yMm],[region.xMm+region.widthMm,region.yMm],[region.xMm,region.yMm+region.heightMm],[region.xMm+region.widthMm,region.yMm+region.heightMm]].every(([x,y])=>Math.hypot(x!-radius,y!-radius)<=radius+tolerance);
}
export function assertRegionsFit(regions:readonly ReservedRegion[],area:RegionArea):void{for(const region of regions)if(!regionFitsArea(region,area))throw new Error(`La zona «${region.label}» esce dall’area utile o dalla sua sagoma.`);}
