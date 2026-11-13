import {cloneGraphicDocument,type GraphicDocument} from './model';

export const PITCHPRINT_FORM_ORDER_VERSION=1 as const;
/** PitchPrint gives larger indices precedence; the local editor gives smaller
 * values precedence. Dense ranks invert values without disturbing ties, layer
 * order, geometry or pages. Conversion is explicit, never applied on opening. */
export function pitchprintAscendingFormOrder(source:GraphicDocument){
 const document=cloneGraphicDocument(source),pages=[{id:document.pageId??'page-1',objects:document.objects,groups:document.groups},...document.otherPages??[]];
 const changes:{pageId:string;kind:'object'|'group';id:string;before:number;after:number}[]=[];
 for(const page of pages){
  const entries=[...page.objects.map(object=>({kind:'object' as const,item:object})),...(page.groups??[]).map(group=>({kind:'group' as const,item:group}))].filter(entry=>entry.item.editor?.order!==undefined);
  const values=[...new Set(entries.map(entry=>entry.item.editor!.order!))].sort((a,b)=>b-a),ranks=new Map(values.map((value,index)=>[value,index+1]));
  for(const {kind,item}of entries){const before=item.editor!.order!,after=ranks.get(before)!;if(before!==after){item.editor={...item.editor,order:after};changes.push({pageId:page.id,kind,id:item.id,before,after});}}
 }
 return{document,changes};
}
