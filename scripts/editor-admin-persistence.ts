import type {AdminState,AdminSnapshot,ArchiveRecord} from '../src/editor-admin/schema';
export interface AdminPersistenceSnapshot {state:AdminState;key:string;}
/** Backend contract shared by the default JSON and explicitly selected SQLite. */
export interface EditorAdminPersistence {
 get():Promise<AdminPersistenceSnapshot>;
 commit(before:AdminPersistenceSnapshot,state:AdminState):Promise<void>;
 readRecord(id:string):Promise<ArchiveRecord|undefined>;
 readFont(id:string):Promise<{format:string;dataBase64:string}|undefined>;
 readFonts():Promise<AdminState['fonts']>;
 readFontLibrary():Promise<Pick<AdminState,'revision'|'fonts'>>;
 readSnapshot():Promise<AdminSnapshot>;
}
