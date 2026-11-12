import type {AdminState,AdminSnapshot,ArchiveRecord} from '../src/editor-admin/schema';
export interface AdminPersistenceSnapshot {state:AdminState;key:string;}
/** Explicit opt-in for isolated storage trials. The running editor keeps JSON. */
export interface EditorAdminPersistence {
 get():Promise<AdminPersistenceSnapshot>;
 commit(before:AdminPersistenceSnapshot,state:AdminState):Promise<void>;
 readRecord(id:string):Promise<ArchiveRecord|undefined>;
 readFont(id:string):Promise<{format:string;dataBase64:string}|undefined>;
 readFonts():Promise<AdminState['fonts']>;
 readSnapshot():Promise<AdminSnapshot>;
}
