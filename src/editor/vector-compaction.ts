import { mapVector, type VectorCommand } from './vector-geometry';
import type { SceneObject } from './model';
type Vector = Extract<SceneObject,{type:'vector'}>;
/** Merge consecutive, equally painted paths only when their ink bounds do not overlap. */
export function compactVectors(objects: readonly Vector[]):Vector[]{
 const result:Vector[]=[],chunk:Vector[]=[];let count=0;
 const flush=()=>{if(!chunk.length)return;if(chunk.length===1){result.push(chunk[0]!);chunk.length=0;count=0;return;}const x=Math.min(...chunk.map(o=>o.xMm)),y=Math.min(...chunk.map(o=>o.yMm)),width=Math.max(...chunk.map(o=>o.xMm+o.widthMm))-x,height=Math.max(...chunk.map(o=>o.yMm+o.heightMm))-y;const commands:VectorCommand[]=chunk.flatMap(o=>mapVector(o.commands,(cx,cy)=>({x:(o.xMm+cx*o.widthMm-x)/width,y:(o.yMm+cy*o.heightMm-y)/height})));const merged={...chunk[0]!,xMm:x,yMm:y,widthMm:width,heightMm:height,commands};delete merged.clipRect;result.push(merged);chunk.length=0;count=0;};
 for(const source of objects){const object={...source};if(object.clipRect&&object.stroke==='none'){const c=object.clipRect;if(c.left<=1e-8&&c.top<=1e-8&&c.right>=1-1e-8&&c.bottom>=1-1e-8)delete object.clipRect;}
  const eligible=object.stroke==='none'&&object.fill!=='none'&&!object.clipRect&&object.widthMm>0&&object.heightMm>0;
  if(!eligible){flush();result.push(object);continue;}
  if(chunk.length&&(chunk[0]!.fill!==object.fill||chunk[0]!.fillRule!==object.fillRule||count+object.commands.length>4096||chunk.some(o=>o.xMm<object.xMm+object.widthMm-1e-9&&object.xMm<o.xMm+o.widthMm-1e-9&&o.yMm<object.yMm+object.heightMm-1e-9&&object.yMm<o.yMm+o.heightMm-1e-9)))flush();
  chunk.push(object);count+=object.commands.length;
 }
 flush();return result;
}
