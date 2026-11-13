import {z} from 'zod';
import {GRAPHIC_GEOMETRY_LIMITS} from './limits';
export const MAX_LAYOUT_GUIDES=64;
export const LayoutGuideSchema=z.strictObject({id:z.string().regex(/^[a-zA-Z][a-zA-Z0-9-]{0,63}$/),axis:z.enum(['x','y']),positionMm:z.number().finite().min(-GRAPHIC_GEOMETRY_LIMITS.coordinateMm).max(GRAPHIC_GEOMETRY_LIMITS.coordinateMm)});
export const LayoutGuidesSchema=z.strictObject({items:z.array(LayoutGuideSchema).max(MAX_LAYOUT_GUIDES),visible:z.boolean(),locked:z.boolean()}).superRefine((value,ctx)=>{if(new Set(value.items.map(item=>item.id)).size!==value.items.length)ctx.addIssue({code:'custom',message:'ID guida duplicati'});});
export type LayoutGuide=z.infer<typeof LayoutGuideSchema>;
export type LayoutGuides=z.infer<typeof LayoutGuidesSchema>;
export const emptyLayoutGuides=():LayoutGuides=>({items:[],visible:true,locked:false});
export function assertGuideChange(before:LayoutGuides|undefined,after:LayoutGuides|null):void{
 if(before?.locked&&JSON.stringify(before.items)!==JSON.stringify(after?.items??[]))throw Error('Sblocca le guide prima di spostarle o eliminarle.');
}
/** Adaptive 1/2/5 ruler intervals: bounded work even at extreme zoom or PAN. */
export function rulerTicks(originPx:number,scalePxPerMm:number,lengthPx:number):{pixel:number;valueMm:number;major:boolean}[]{
 if(![originPx,scalePxPerMm,lengthPx].every(Number.isFinite)||scalePxPerMm<=0||lengthPx<=0)return[];
 const raw=60/scalePxPerMm,power=10**Math.floor(Math.log10(raw)),major=[1,2,5,10].map(n=>n*power).find(n=>n>=raw)!,minor=major/5;
 const first=Math.ceil(-originPx/scalePxPerMm/minor),last=Math.floor((lengthPx-originPx)/scalePxPerMm/minor),ticks=[];
 for(let index=first;index<=last&&ticks.length<512;index++){const valueMm=index*minor;ticks.push({pixel:originPx+valueMm*scalePxPerMm,valueMm:Math.round(valueMm*1e6)/1e6,major:index%5===0});}return ticks;
}
export function guidePosition(client:number,origin:number,scale:number):number{return Math.round((client-origin)/scale*1000)/1000;}
