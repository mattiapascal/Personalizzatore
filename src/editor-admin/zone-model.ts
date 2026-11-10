import { z } from 'zod';
import { ReservedRegionSchema,ReservedRegionsSchema,regionFitsArea,type ReservedRegion,type RegionArea } from '../editor/regions';
const base={expectedRevision:z.number().int().nonnegative()};
export const ZoneCommandSchema=z.discriminatedUnion('tool',[
 z.strictObject({...base,tool:z.literal('addZone'),arguments:ReservedRegionSchema}),
 z.strictObject({...base,tool:z.literal('updateZone'),arguments:ReservedRegionSchema}),
 z.strictObject({...base,tool:z.literal('removeZone'),arguments:z.strictObject({id:z.string().uuid()})}),
]);
export type ZoneCommand=z.infer<typeof ZoneCommandSchema>;
export interface ZoneState {revision:number;zones:ReservedRegion[];}
export function applyZoneCommand(state:ZoneState,raw:unknown,area:RegionArea):ZoneState{
 const command=ZoneCommandSchema.parse(raw);if(command.expectedRevision!==state.revision)throw new Error('Le zone sono cambiate: ripeti la modifica sullo stato aggiornato.');
 const zones=state.zones.map(zone=>({...zone})),id=command.arguments.id,index=zones.findIndex(zone=>zone.id===id);
 if(command.tool==='addZone'){if(index>=0)throw new Error('ID zona già presente');zones.push({...command.arguments});}
 else{if(index<0)throw new Error('Zona non trovata');if(command.tool==='removeZone')zones.splice(index,1);else zones[index]={...command.arguments};}
 const parsed=ReservedRegionsSchema.parse(zones);if(command.tool!=='removeZone'&&!regionFitsArea(command.arguments,area))throw new Error('La zona deve rimanere completamente nell’area utile e nella sua sagoma.');
 // Unchanged zones may need repair after the owner explicitly changes the area. Final saving validates all.
 return{revision:state.revision+1,zones:parsed};
}
export class ZoneHistory{
 state:ZoneState;private past:ReservedRegion[][]=[];private future:ReservedRegion[][]=[];
 constructor(zones:readonly ReservedRegion[]=[],readonly area:RegionArea){this.state={revision:0,zones:ReservedRegionsSchema.parse(zones)};}
 get canUndo(){return !!this.past.length;}get canRedo(){return !!this.future.length;}
 dispatch(raw:unknown){const next=applyZoneCommand(this.state,raw,this.area);this.past.push(structuredClone(this.state.zones));this.future=[];this.state=next;}
 undo(){this.travel(this.past,this.future);}redo(){this.travel(this.future,this.past);}
 private travel(from:ReservedRegion[][],to:ReservedRegion[][]){const zones=from.pop();if(!zones)return;to.push(structuredClone(this.state.zones));this.state={revision:this.state.revision+1,zones};}
}
export type ZoneHandle='tl'|'tr'|'bl'|'br'|'ml'|'mr'|'mt'|'mb';
export function resizeRegion(original:ReservedRegion,handle:ZoneHandle,point:{x:number;y:number},proportional=false):ReservedRegion{
 let left=original.xMm,top=original.yMm,right=left+original.widthMm,bottom=top+original.heightMm;
 if(handle.includes('l'))left=Math.min(point.x,right-.001);if(handle.includes('r'))right=Math.max(point.x,left+.001);if(handle.includes('t'))top=Math.min(point.y,bottom-.001);if(handle.includes('b'))bottom=Math.max(point.y,top+.001);
 if(proportional&&handle.length===2&&handle!=='ml'&&handle!=='mr'&&handle!=='mt'&&handle!=='mb'){const ratio=original.widthMm/original.heightMm,width=right-left,height=bottom-top;if(width/height>ratio){if(handle.includes('t'))top=bottom-width/ratio;else bottom=top+width/ratio;}else if(handle.includes('l'))left=right-height*ratio;else right=left+height*ratio;}
 return{...original,xMm:left,yMm:top,widthMm:right-left,heightMm:bottom-top};
}
