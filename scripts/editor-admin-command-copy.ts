import type {AdminState,AdminCommand} from '../src/editor-admin/schema';
import {cloneArchiveValue} from './editor-admin-read-cache';
/** Only the validated command's possible mutation targets are copied. Unchanged
 * records keep their identity so persistence need not serialize them again. */
export function copyAdminCommandState(state:AdminState,command:AdminCommand):AdminState {
 const recordIds=new Set<string>(),fontIds=new Set<string>();
 switch(command.tool){
  case'bulkTemplateAssociations':case'bulkTemplateAssociationMap':for(const row of command.arguments.targets)recordIds.add(row.id);break;
  case'replaceRecord':case'updateRecord':case'archiveRecord':case'templateProducts':recordIds.add(command.arguments.id);break;
  case'archiveFont':case'updateFontMetadata':fontIds.add(command.arguments.id);break;
  case'setFontCategories':case'setFontFamilies':for(const id of command.arguments.ids)fontIds.add(id);break;
 }
 return{...state,settings:{...state.settings},records:state.records.map(record=>recordIds.has(record.id)?cloneArchiveValue(record):record),fonts:state.fonts.map(font=>fontIds.has(font.id)?{...font}:font),...(state.productionProfiles?{productionProfiles:cloneArchiveValue(state.productionProfiles)}:{}),...(state.productionProfileHistory?{productionProfileHistory:cloneArchiveValue(state.productionProfileHistory)}:{}),...(state.tagOrder?{tagOrder:[...state.tagOrder]}:{})};
}
