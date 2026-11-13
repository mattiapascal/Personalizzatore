import { z } from 'zod';
import { checkClipMaskCommands } from './clip-masks';
import { VectorCommandsSchema,type VectorCommand } from './vector-geometry';
import { EDITOR_LIMITS } from './limits';
export const TEXT_MASK_LOCAL_LIMIT=1e6;
const coordinate=z.number().finite().min(-TEXT_MASK_LOCAL_LIMIT).max(TEXT_MASK_LOCAL_LIMIT);
/** Millimetres in the glyph plane, before text stretch/shear/rotation. The frame
 * is independent of content, font metrics and the wrapping box. */
export const TextClipMaskSchema=z.strictObject({commands:VectorCommandsSchema,fillRule:z.enum(['nonzero','evenodd']),frameMm:z.strictObject({x:coordinate,y:coordinate,width:z.number().finite().positive().max(TEXT_MASK_LOCAL_LIMIT),height:z.number().finite().positive().max(TEXT_MASK_LOCAL_LIMIT)})}).superRefine((mask,ctx)=>checkClipMaskCommands(mask.commands,ctx));
export const TextClipMasksSchema=z.array(TextClipMaskSchema).min(1).max(8).refine(masks=>masks.reduce((n,m)=>n+m.commands.length,0)<=EDITOR_LIMITS.vectorCommandsPerObject,'Maschere oltre il budget vettoriale per oggetto');
export type TextClipMask=z.infer<typeof TextClipMaskSchema>;
export function textClipCommands(mask:TextClipMask,pixelsPerMm=1):VectorCommand[]{
 const f=mask.frameMm;return mask.commands.map(command=>{if(command[0]==='Z')return ['Z'];const result=[...command] as VectorCommand;for(let i=1;i<command.length;i+=2){(result as (string|number)[])[i]=(f.x+(command[i] as number)*f.width)*pixelsPerMm;(result as (string|number)[])[i+1]=(f.y+(command[i+1] as number)*f.height)*pixelsPerMm;}return result;});
}
export function scaleTextClipMasks(masks:readonly TextClipMask[],factor:number):TextClipMask[]{
 return masks.map(mask=>({...mask,commands:mask.commands.map(command=>[...command]) as VectorCommand[],frameMm:{x:mask.frameMm.x*factor,y:mask.frameMm.y*factor,width:mask.frameMm.width*factor,height:mask.frameMm.height*factor}}));
}
export function textClipExtent(object:{textClipMasks?:readonly TextClipMask[];textScaleX?:number;textScaleY?:number;textSkewXDeg?:number;rotationDeg?:number}):number{
 let extent=0;const sx=object.textScaleX??1,sy=object.textScaleY??1,k=Math.tan((object.textSkewXDeg??0)*Math.PI/180),a=(object.rotationDeg??0)*Math.PI/180;
 for(const mask of object.textClipMasks??[]){const f=mask.frameMm;for(const x of[f.x,f.x+f.width])for(const y of[f.y,f.y+f.height]){const px=sx*x+k*sy*y,py=sy*y;extent=Math.max(extent,Math.abs(px*Math.cos(a)-py*Math.sin(a)),Math.abs(px*Math.sin(a)+py*Math.cos(a)));}}
 return extent;
}
export function rectangularTextMask(width:number,height:number):TextClipMask{return{commands:[['M',0,0],['L',1,0],['L',1,1],['L',0,1],['Z']],fillRule:'nonzero',frameMm:{x:-width/2,y:-height/2,width,height}};}
