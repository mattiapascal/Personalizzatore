import{z}from'zod';
import{VectorCommandsSchema,vectorBounds,type VectorCommand}from'./vector-geometry';
import{EDITOR_LIMITS}from'./limits';
const coordinate=z.number().finite().min(-1e6).max(1e6),extent=z.number().finite().positive().max(1e6);
/** A mask keeps its own normalized curve and a frame in object-relative units.
 * Layers intersect; contours within one layer use their declared fill rule. */
export const ClipMaskSchema=z.strictObject({commands:VectorCommandsSchema,frame:z.strictObject({left:coordinate,top:coordinate,width:extent,height:extent}),fillRule:z.enum(['nonzero','evenodd'])}).superRefine((mask,ctx)=>{
 const b=vectorBounds(mask.commands),near=(a:number,b:number)=>Math.abs(a-b)<1e-7;
 if(!near(b.x,0)||!near(b.y,0)||!near(b.width,1)||!near(b.height,1))ctx.addIssue({code:'custom',message:'Maschera non normalizzata o degenere'});
 let closed=true;for(const c of mask.commands){if(c[0]==='M'){if(!closed)ctx.addIssue({code:'custom',message:'Contorni della maschera non chiusi'});closed=false;}if(c[0]==='Z')closed=true;}if(!closed)ctx.addIssue({code:'custom',message:'Contorno finale della maschera non chiuso'});
});
export const ClipMasksSchema=z.array(ClipMaskSchema).min(1).max(8).refine(masks=>masks.reduce((n,m)=>n+m.commands.length,0)<=EDITOR_LIMITS.vectorCommandsPerObject,'Maschere oltre il budget vettoriale per oggetto');
export type ClipMask=z.infer<typeof ClipMaskSchema>;
export function clipMaskCommands(mask:ClipMask,width:number,height:number):VectorCommand[]{const f=mask.frame;return mask.commands.map(c=>{if(c[0]==='Z')return['Z'];const out=[...c]as VectorCommand;for(let i=1;i<c.length;i+=2){(out as (string|number)[])[i]=(f.left+(c[i]as number)*f.width-.5)*width;(out as (string|number)[])[i+1]=(f.top+(c[i+1]as number)*f.height-.5)*height;}return out;});}
export const maskedCommandCount=(object:{type:string;commands?:readonly unknown[];clipMasks?:readonly ClipMask[]})=>(object.type==='vector'?object.commands?.length??0:0)+(object.clipMasks?.reduce((n,m)=>n+m.commands.length,0)??0);
/** Cutting a frame edge preserves the original portion of its mask. Photo PAN
 * and content zoom deliberately leave the mask fixed to the frame instead. */
export function cropClipMasks(masks:readonly ClipMask[],before:{leftPx:number;topPx:number;widthPx:number;heightPx:number},after:typeof before):ClipMask[]{
 return ClipMasksSchema.parse(masks.map(mask=>({...mask,frame:{left:(before.leftPx+mask.frame.left*before.widthPx-after.leftPx)/after.widthPx,top:(before.topPx+mask.frame.top*before.heightPx-after.topPx)/after.heightPx,width:mask.frame.width*before.widthPx/after.widthPx,height:mask.frame.height*before.heightPx/after.heightPx}})));
}
