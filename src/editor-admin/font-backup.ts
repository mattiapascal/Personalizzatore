import { FontLibraryBackupSchema, type FontLibraryBackup, type AdminState } from './schema';
type FontBrief=Pick<AdminState['fonts'][number],'id'|'family'|'archived'>;
export interface FontRestorePlan {revision:number;added:FontBrief[];existing:FontBrief[];conflicts:FontBrief[];}
export function createFontLibraryBackup(fonts:AdminState['fonts']):FontLibraryBackup{return FontLibraryBackupSchema.parse({kind:'incisoria-font-library',schemaVersion:1,exportedAt:new Date().toISOString(),fonts});}
export function planFontLibraryRestore(backup:FontLibraryBackup,state:Pick<AdminState,'fonts'|'revision'>):FontRestorePlan{
 const plan:FontRestorePlan={revision:state.revision,added:[],existing:[],conflicts:[]};
 for(const font of backup.fonts){const current=state.fonts.find(item=>item.id===font.id),brief={id:font.id,family:font.family,archived:font.archived};if(!current)plan.added.push(brief);else if(current.format===font.format&&current.dataBase64===font.dataBase64)plan.existing.push(brief);else plan.conflicts.push(brief);}
 return plan;
}
