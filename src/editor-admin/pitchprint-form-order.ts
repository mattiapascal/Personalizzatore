import type {AdminState} from './schema';
import {pitchprintAscendingFormOrder,PITCHPRINT_FORM_ORDER_VERSION} from '../editor/pitchprint-form-order';

export interface FormOrderTarget{id:string;version:number;sourceHash:string;}
/** One explicit administrative operation. The caller clones only these records
 * and the archive commits all changes atomically with revision protection. */
export function migratePitchprintFormOrders(state:AdminState,targets:readonly FormOrderTarget[],now:string):boolean{
 if(new Set(targets.map(target=>target.id)).size!==targets.length)throw Error('Template duplicato nel piano degli ordini.');
 const records=targets.map(target=>{
  const record=state.records.find(record=>record.id===target.id);
  if(!record||record.kind!=='template'||!record.pitchprintSource)throw Error('La conversione degli ordini riguarda soltanto template importati da PitchPrint.');
  if(record.version!==target.version||record.pitchprintSource.sourceHash!==target.sourceHash)throw Error('Un template o il suo sorgente è cambiato: rigenera il piano senza sovrascrivere le modifiche.');
  return record;
 });
 let changed=false;
 for(const record of records){
  if(record.pitchprintSource!.formOrderVersion===PITCHPRINT_FORM_ORDER_VERSION)continue;
  const converted=pitchprintAscendingFormOrder(record.document);
  if(converted.changes.length){converted.document.revision++;if(converted.document.contentRevision!==undefined)converted.document.contentRevision++;record.document=converted.document;}
  record.pitchprintSource={...record.pitchprintSource!,formOrderVersion:PITCHPRINT_FORM_ORDER_VERSION};record.version++;record.updatedAt=now;changed=true;
 }
 return changed;
}
