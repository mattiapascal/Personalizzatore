import {plaqueMountingPoints} from './plaque';
import {z} from 'zod';
import type {GraphicDocument} from './model';
import type {ReservedRegion} from './regions';

/** Diagnostic sampling limits, not new production dimensions or a tolerance
 * granted to the customer. No sampled result certifies engraving feasibility. */
export const GEOMETRY_INSPECTION={pixelsPerMm:40,tileSide:512,maxPixels:64_000_000,maxMilliseconds:20000,maxSourcePixels:48_000_000}as const;
export const GeometryStatusSchema=z.enum(['clear','overlap','boundary','unconfigured','incomplete']);
export type GeometryStatus=z.infer<typeof GeometryStatusSchema>;
const point=z.strictObject({xMm:z.number().finite(),yMm:z.number().finite()});
export const GeometryRuleResultSchema=z.strictObject({id:z.string().max(64),label:z.string().max(120),kind:z.enum(['margin','reserved','mounting-hole','mounting-clearance']),status:GeometryStatusSchema,pixels:z.number().int().nonnegative(),witness:point.optional(),candidateObjectIds:z.array(z.string().max(64)).max(8).optional(),candidateObjectCount:z.number().int().nonnegative().optional(),message:z.string().max(1000).optional()});
export type GeometryRuleResult=z.infer<typeof GeometryRuleResultSchema>;
export const ProductionGeometryReportSchema=z.strictObject({
 schemaVersion:z.literal(1),documentId:z.string().uuid(),revision:z.number().int().nonnegative(),contentRevision:z.number().int().nonnegative(),resolutionMm:z.number().finite().positive(),status:GeometryStatusSchema,pixels:z.number().int().nonnegative(),
 pages:z.array(z.strictObject({id:z.string().max(64),name:z.string().max(120),profile:z.strictObject({id:z.string().uuid(),version:z.number().int().positive(),label:z.string().max(120)}).optional(),status:GeometryStatusSchema,rules:z.array(GeometryRuleResultSchema).max(29),message:z.string().max(1000).optional()})).min(1).max(100),
});
export type ProductionGeometryReport=z.infer<typeof ProductionGeometryReportSchema>;
export interface GeometryRule {id:string;label:string;kind:'margin'|'reserved'|'mounting-hole'|'mounting-clearance';unconfigured?:string;area:{width:number;height:number};round:boolean;marginMm?:number;region?:ReservedRegion;}
export interface GeometryTile {x:number;y:number;width:number;height:number;pixelsPerMm:number;}
export interface GeometryWitness {status:'overlap'|'boundary';xMm:number;yMm:number;}
export function geometryStatus(values:readonly GeometryStatus[]):GeometryStatus{
 for(const status of ['overlap','incomplete','unconfigured','boundary']as const)if(values.includes(status))return status;
 return values.length?'clear':'unconfigured';
}
export function geometryReportCurrent(report:ProductionGeometryReport,document:GraphicDocument):boolean{
 return report.documentId===document.documentId&&report.contentRevision===(document.contentRevision??document.revision);
}
export function pageGeometryRules(document:GraphicDocument):GeometryRule[]{
 const profile=document.productionProfile;if(!profile)return[];
 const base={area:{...document.areaMm},round:document.shape==='round'};
 return [{...base,id:'margin',label:'Margine della pagina',kind:'margin',...(profile.safeMarginMm===null?{}:{marginMm:profile.safeMarginMm})},...profile.reservedAreas.map(region=>({...base,id:region.id,label:region.label,kind:'reserved' as const,region:{...region}})),...mountingGeometryRules(document)];
}
/** Only the selected document mounting creates obstacles; available kits do not. */
export function mountingGeometryRules(document:GraphicDocument):GeometryRule[]{
 const mounting=document.plaque;if(!mounting)return[];
 const points=plaqueMountingPoints(document.areaMm,mounting),base={area:{...document.areaMm},round:document.shape==='round'};
 return points.flatMap((point,index)=>{
  const diameter=mounting.holeDiameterMm,clearance=mounting.clearanceMm;
  const rule=(kind:'mounting-hole'|'mounting-clearance',radius:number|undefined,message?:string):GeometryRule=>{
   const id=`${kind}-${index+1}`,label=`${kind==='mounting-hole'?'Foro':'Rispetto fissaggio'} ${index+1}`;
   return {...base,id,label,kind,...(radius===undefined?{unconfigured:message}:{region:{id,label,shape:'ellipse',xMm:point.xMm-radius,yMm:point.yMm-radius,widthMm:radius*2,heightMm:radius*2}})};
  };
  return [rule('mounting-hole',diameter===null?undefined:diameter/2,'Diametro reale del foro non definito: il simbolo indica soltanto la posizione.'),rule('mounting-clearance',diameter===null||clearance==null?undefined:diameter/2+clearance,diameter===null?'Definisci il diametro del foro prima di verificare la zona di rispetto.':'Distanza extra di rispetto dal bordo del foro non definita. Zero deve essere indicato esplicitamente.')];
 });
}
interface Box{x:number;y:number;right:number;bottom:number;}
function* boxTiles(box:Box,ppm:number,side:number):Generator<GeometryTile>{
 const left=Math.max(0,Math.floor(box.x*ppm)),top=Math.max(0,Math.floor(box.y*ppm)),right=Math.ceil(box.right*ppm),bottom=Math.ceil(box.bottom*ppm);
 for(let y=top;y<bottom;y+=side)for(let x=left;x<right;x+=side)yield{x,y,width:Math.min(side,right-x),height:Math.min(side,bottom-y),pixelsPerMm:ppm};
}
/** Visit only the strip/ring/region, never allocate a whole large-format sheet.
 * Round rows omit the central safe disk using a conservative row envelope. */
export function* geometryRuleTiles(rule:GeometryRule,ppm:number=GEOMETRY_INSPECTION.pixelsPerMm,side:number=GEOMETRY_INSPECTION.tileSide):Generator<GeometryTile>{
 if(!Number.isFinite(ppm)||ppm<=0||!Number.isInteger(side)||side<1||side>2048)throw Error('Griglia di controllo non valida');
 const {width:w,height:h}=rule.area,guard=2/ppm;
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0||w>3000||h>3000||rule.round&&w!==h)throw Error('Area di controllo non valida');
 if(rule.region){const r=rule.region;yield*boxTiles({x:r.xMm-guard,y:r.yMm-guard,right:Math.min(w,r.xMm+r.widthMm+guard),bottom:Math.min(h,r.yMm+r.heightMm+guard)},ppm,side);return;}
 const m=rule.marginMm;if(m===undefined||m===0)return;if(!Number.isFinite(m)||m<0||m*2>=Math.min(w,h))throw Error('Margine di controllo non valido');
 if(!rule.round){
  const edge=Math.min(h,m+guard),left=Math.min(w,m+guard),right=Math.max(left,w-m-guard),bottom=Math.max(edge,h-m-guard);
  for(const box of [{x:0,y:0,right:w,bottom:edge},{x:0,y:bottom,right:w,bottom:h},{x:0,y:edge,right:left,bottom},{x:right,y:edge,right:w,bottom}])yield*boxTiles(box,ppm,side);return;
 }
 const radius=w/2,inner=Math.max(0,radius-m-guard),rowSide=Math.min(side,Math.max(1,Math.ceil((m+guard)*ppm)));
 for(let y=0;y<Math.ceil(h*ppm);y+=rowSide){
  const top=y/ppm,bottom=Math.min(h,(y+rowSide)/ppm),near=top<=radius&&bottom>=radius?0:Math.min(Math.abs(top-radius),Math.abs(bottom-radius)),far=Math.max(Math.abs(top-radius),Math.abs(bottom-radius)),outerX=Math.sqrt(Math.max(0,radius*radius-near*near)),innerX=Math.sqrt(Math.max(0,inner*inner-far*far));
  const spans=innerX>0?[[radius-outerX,radius-innerX],[radius+innerX,radius+outerX]]:[[radius-outerX,radius+outerX]];
  for(const [left,right]of spans)yield*boxTiles({x:left!,y:top,right:right!,bottom},ppm,side);
 }
}
/** A positive sample well inside a forbidden area is an overlap witness at
 * this sampling resolution. Border/antialias samples stay explicitly uncertain. */
function cellRelation(rule:GeometryRule,x:number,y:number,step:number):'inside'|'edge'|'outside'{
 const guard=step,eps=1e-9,region=rule.region;
 if(region){
  const right=region.xMm+region.widthMm,bottom=region.yMm+region.heightMm;
  if(region.shape==='rectangle'){
   if(x+step<region.xMm-guard||y+step<region.yMm-guard||x>right+guard||y>bottom+guard)return'outside';
   return x>region.xMm+guard+eps&&y>region.yMm+guard+eps&&x+step<right-guard-eps&&y+step<bottom-guard-eps?'inside':'edge';
  }
  const rx=region.widthMm/2,ry=region.heightMm/2,cx=region.xMm+rx,cy=region.yMm+ry,nearX=Math.max(x-cx,cx-x-step,0),nearY=Math.max(y-cy,cy-y-step,0),farX=Math.max(Math.abs(x-cx),Math.abs(x+step-cx)),farY=Math.max(Math.abs(y-cy),Math.abs(y+step-cy)),t=guard/Math.min(rx,ry);
  if(Math.hypot(nearX/rx,nearY/ry)>1+t)return'outside';return Math.hypot(farX/rx,farY/ry)<1-t-eps?'inside':'edge';
 }
 const m=rule.marginMm??0;if(m===0)return'outside';
 if(rule.round){
  const cx=rule.area.width/2,cy=rule.area.height/2,inner=cx-m,nearX=Math.max(x-cx,cx-x-step,0),nearY=Math.max(y-cy,cy-y-step,0),farX=Math.max(Math.abs(x-cx),Math.abs(x+step-cx)),farY=Math.max(Math.abs(y-cy),Math.abs(y+step-cy));
  if(Math.hypot(farX,farY)<inner-guard)return'outside';return Math.hypot(nearX,nearY)>inner+guard+eps?'inside':'edge';
 }
 const left=Math.min(x,rule.area.width-x-step),top=Math.min(y,rule.area.height-y-step),farthestEdge=Math.min(x+step,rule.area.width-x,y+step,rule.area.height-y);
 if(left>m+guard&&top>m+guard)return'outside';return farthestEdge<m-guard-eps?'inside':'edge';
}
export function scanGeometryTile(pixels:Uint8ClampedArray,tile:GeometryTile,rule:GeometryRule,inkOnly:boolean):GeometryWitness|undefined{
 if(!Number.isInteger(tile.x)||tile.x<0||!Number.isInteger(tile.y)||tile.y<0||!Number.isInteger(tile.width)||tile.width<1||!Number.isInteger(tile.height)||tile.height<1||!Number.isFinite(tile.pixelsPerMm)||tile.pixelsPerMm<=0||pixels.length!==tile.width*tile.height*4)throw Error('Campione geometrico incompleto');
 const step=1/tile.pixelsPerMm;let boundary:GeometryWitness|undefined;
 for(let y=0;y<tile.height;y++)for(let x=0;x<tile.width;x++){
  const i=(y*tile.width+x)*4,alpha=pixels[i+3]!;if(!alpha)continue;
  // White covers lower black marks on a stamp; on printed supports white is
  // itself productive. The preview ink tint never enters this mask; an explicit
  // productive paper colour is rendered below the objects like every export.
  if(inkOnly&&pixels[i]===255&&pixels[i+1]===255&&pixels[i+2]===255)continue;
  const xMm=(tile.x+x)*step,yMm=(tile.y+y)*step,relation=cellRelation(rule,xMm,yMm,step);
  if(relation==='outside')continue;const witness={status:relation==='inside'?'overlap' as const:'boundary' as const,xMm:xMm+step/2,yMm:yMm+step/2};
  if(witness.status==='overlap')return witness;boundary??=witness;
 }return boundary;
}
