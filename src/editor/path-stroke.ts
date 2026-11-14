import {z} from 'zod';
import type {SceneObject} from './model';
import type {VectorCommand} from './vector-geometry';
import {bezierCommands} from './bezier-geometry';
import {effectiveStrokeCap} from './stroke-cap';
export const PathStrokeFields={strokeLineCap:z.enum(['butt','round','square']).optional(),strokeLineJoin:z.enum(['miter','round','bevel']).optional(),strokeMiterLimit:z.number().finite().min(1).max(100).optional(),strokeFrameVersion:z.literal(1).optional()};
export const ShapeJoinFields={strokeLineJoin:PathStrokeFields.strokeLineJoin,strokeMiterLimit:PathStrokeFields.strokeMiterLimit};
export type StrokeJoin='miter'|'round'|'bevel';
export function hasEditableStrokeJoin(object:SceneObject):object is Extract<SceneObject,{type:'rect'|'path'|'bezier'|'vector'}>{return ['rect','path','bezier','vector'].includes(object.type);}
export function effectiveStrokeJoin(object:Extract<SceneObject,{type:'rect'|'path'|'bezier'|'vector'}>):StrokeJoin{return object.strokeLineJoin??(object.type==='rect'?'miter':'round');}
export function effectiveMiterLimit(object:{strokeMiterLimit?:number}):number{return object.strokeMiterLimit??4;}
type XY={x:number;y:number};
type PathShape=Extract<SceneObject,{type:'path'|'bezier'|'vector'}>;
type PathGeometry=Pick<PathShape,'type'|'widthMm'|'heightMm'|'stroke'|'strokeMm'|'strokeDash'> & Partial<Pick<PathShape,'strokeFrameVersion'|'strokeLineCap'|'strokeLineJoin'|'strokeMiterLimit'>> & {points?:XY[];nodes?:Extract<SceneObject,{type:'bezier'}>['nodes'];commands?:VectorCommand[];closed?:boolean};
type Segment={start:XY;end:XY;incoming:XY;outgoing:XY};
const add=(a:XY,b:XY):XY=>({x:a.x+b.x,y:a.y+b.y}),sub=(a:XY,b:XY):XY=>({x:a.x-b.x,y:a.y-b.y}),mul=(p:XY,s:number):XY=>({x:p.x*s,y:p.y*s}),normal=(p:XY):XY=>({x:-p.y,y:p.x});
function direction(...candidates:XY[]):XY|null{for(const p of candidates){const length=Math.hypot(p.x,p.y);if(length>1e-12)return mul(p,1/length);}return null;}
function contours(object:PathGeometry):{segments:Segment[];closed:boolean}[]{
 const w=object.widthMm,h=object.heightMm,commands:VectorCommand[]=object.type==='vector'?object.commands!.map(c=>c[0]==='Z'?c:c.map((v,i)=>i?Number(v)*(i%2?w:h):v)as VectorCommand):object.type==='bezier'?bezierCommands(object.nodes!,!!object.closed,w,h):object.points!.map((p,i)=>[i?'L':'M',p.x*w,p.y*h]as VectorCommand).concat(object.closed?[['Z']]:[]),output:{segments:Segment[];closed:boolean}[]=[];
 let current:XY={x:0,y:0},start=current,part:{segments:Segment[];closed:boolean}|undefined;
 for(const c of commands){
  if(c[0]==='M'){current={x:c[1],y:c[2]};start=current;part={segments:[],closed:false};output.push(part);continue;}
  if(!part)throw Error('Contorno senza punto iniziale');
  const end=c[0]==='Z'?start:c[0]==='C'?{x:c[5],y:c[6]}:{x:c[1],y:c[2]},delta=sub(end,current),first=c[0]==='C'?direction(sub({x:c[1],y:c[2]},current),sub({x:c[3],y:c[4]},current),delta):direction(delta),last=c[0]==='C'?direction(sub(end,{x:c[3],y:c[4]}),sub(end,{x:c[1],y:c[2]}),delta):direction(delta);
  if(first&&last)part.segments.push({start:current,end,incoming:first,outgoing:last});current=end;if(c[0]==='Z')part.closed=true;
 }
 return output;
}
/** Extra painted polygons beyond the legacy body +/- half stroke. The miter
 * test uses actual endpoint tangents, including degenerate cubic handles. */
export function pathStrokeExtras(object:PathGeometry):XY[][]{
 const half=object.stroke==='none'?0:object.strokeMm/2;if(!half)return [];
 const join=object.strokeLineJoin??'round',cap=effectiveStrokeCap(object),limit=effectiveMiterLimit(object),polygons:XY[][]=[];
 const corner=(vertex:XY,a:XY,b:XY)=>{
  if(join!=='miter')return;const cosine=Math.max(-1,Math.min(1,a.x*b.x+a.y*b.y)),denominator=1+cosine;if(denominator<1e-12||Math.sqrt(2/denominator)>limit+1e-10)return;
  const n1=normal(a),n2=normal(b),tip=mul(add(n1,n2),half/denominator);
  for(const sign of[-1,1])polygons.push([add(vertex,mul(n1,half*sign)),add(vertex,mul(tip,sign)),add(vertex,mul(n2,half*sign))]);
 };
 const square=(p:XY,tangent:XY,sign:number)=>{const n=mul(normal(tangent),half),out=mul(tangent,half*sign);polygons.push([add(p,n),add(add(p,n),out),add(sub(p,n),out),sub(p,n)]);};
 for(const contour of contours(object)){
  const segments=contour.segments;if(!segments.length)continue;
  for(let i=1;i<segments.length;i++)corner(segments[i]!.start,segments[i-1]!.outgoing,segments[i]!.incoming);
  if(contour.closed)corner(segments[0]!.start,segments.at(-1)!.outgoing,segments[0]!.incoming);
  else if(cap==='square'){square(segments[0]!.start,segments[0]!.incoming,-1);square(segments.at(-1)!.end,segments.at(-1)!.outgoing,1);}
 }
 return polygons;
}
/** Symmetric frame keeps the centreline coordinate plane and existing nodes
 * stable. It contains the legacy frame and the computed join/cap protrusions. */
export function pathStrokeFrame(object:PathGeometry):{widthMm:number;heightMm:number}{
 const half=object.stroke==='none'?0:object.strokeMm/2,cap=effectiveStrokeCap(object),base=half*(cap==='square'&&object.strokeDash==='dashed'?Math.SQRT2:1),cx=object.widthMm/2,cy=object.heightMm/2;
 let x=cx+base,y=cy+base;for(const polygon of pathStrokeExtras(object))for(const p of polygon){x=Math.max(x,Math.abs(p.x-cx));y=Math.max(y,Math.abs(p.y-cy));}
 return{widthMm:2*x,heightMm:2*y};
}
/** Only used on commit. Stroke is fixed while the live handle scales its frame;
 * solve the coupled nominal dimensions after the corner angles change. */
export function resizedPathStrokeFrame(source:PathShape,scaleX:number,scaleY:number):Pick<PathShape,'widthMm'|'heightMm'>{
 if(![scaleX,scaleY].every(n=>Number.isFinite(n)&&n>0))throw Error('Scala del tracciato non valida');
 const frame=pathStrokeFrame(source),target={widthMm:frame.widthMm*scaleX,heightMm:frame.heightMm*scaleY},activeX=source.widthMm>0,activeY=source.heightMm>0;
 if(!activeX&&Math.abs(scaleX-1)>1e-12||!activeY&&Math.abs(scaleY-1)>1e-12)throw Error('Un asse di larghezza o altezza nulla non può essere ridimensionato.');
 let w=activeX?Math.max(.000001,source.widthMm*scaleX):0,h=activeY?Math.max(.000001,source.heightMm*scaleY):0;
 const at=(widthMm:number,heightMm:number)=>pathStrokeFrame({...source,widthMm,heightMm});
 for(let step=0;step<40;step++){
  const current=at(w,h),ex=current.widthMm-target.widthMm,ey=current.heightMm-target.heightMm;
  if((!activeX||Math.abs(ex)<1e-7)&&(!activeY||Math.abs(ey)<1e-7))return{widthMm:w,heightMm:h};
  const dx=Math.max(1e-6,w*1e-5),dy=Math.max(1e-6,h*1e-5),fx=at(w+dx,h),fy=at(w,h+dy),a=(fx.widthMm-current.widthMm)/dx,b=(fy.widthMm-current.widthMm)/dy,c=(fx.heightMm-current.heightMm)/dx,d=(fy.heightMm-current.heightMm)/dy,det=a*d-b*c;
  let dw=0,dh=0;if(activeX&&activeY){if(Math.abs(det)<1e-10)break;dw=(d*ex-b*ey)/det;dh=(a*ey-c*ex)/det;}else if(activeX){if(Math.abs(a)<1e-10)break;dw=ex/a;}else if(activeY){if(Math.abs(d)<1e-10)break;dh=ey/d;}
  // Damped steps avoid crossing degenerate axes or the miter/bevel threshold.
  let accepted=false;for(let damping=1;damping>=1/1024;damping/=2){const nw=activeX?w-dw*damping:0,nh=activeY?h-dh*damping:0;if(activeX&&nw<=0||activeY&&nh<=0)continue;const next=at(nw,nh);if(Math.abs(next.widthMm-target.widthMm)+Math.abs(next.heightMm-target.heightMm)<Math.abs(ex)+Math.abs(ey)+1e-10){w=nw;h=nh;accepted=true;break;}}if(!accepted)break;
 }
 throw Error('Il riquadro richiesto non è compatibile con lo spessore o il limite della giunzione. Riduci lo spessore o usa un ridimensionamento proporzionale.');
}
