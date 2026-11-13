import{dirname,resolve,join}from'node:path';
import{selectedEditorArchive}from'./editor-archive-selection';
import{openEditorAdminRuntime,archiveIdentity,type EditorAdminRuntime}from'./editor-admin-runtime';
import{EditorAdminSqlite}from'./editor-admin-sqlite';
import{EditorAdminStore,adminSnapshot}from'./editor-admin-store';
import{archiveValueHash}from'./editor-archive-copy';
import type{AdminSnapshot,AdminState}from'../src/editor-admin/schema';

export class FontAuditConflictError extends Error{}
export interface FontAuditLibrary{store:EditorAdminStore;backend:'json'|'sqlite';identity:string;file:string;close:()=>Promise<void>;}
export async function openFontAuditLibrary(options:{libraryDirectory?:string;sqliteFile?:string}):Promise<FontAuditLibrary>{
 if(options.sqliteFile!==undefined&&options.libraryDirectory!==undefined)throw Error('Scegli --sqlite-file oppure --library-dir, non entrambi');
 if(options.sqliteFile===undefined){const runtime:EditorAdminRuntime=await openEditorAdminRuntime({kind:'json',directory:options.libraryDirectory??'.local/editor-admin'},process.cwd());return{...runtime,file:join(runtime.directory,'state.json')};}
 const selected=await selectedEditorArchive({EDITOR_ARCHIVE_BACKEND:'sqlite',EDITOR_ARCHIVE_PATH:options.sqliteFile});if(selected.kind!=='sqlite')throw Error('Backend SQLite non selezionato');
 const file=resolve(selected.file),database=EditorAdminSqlite.open(file,true),store=new EditorAdminStore(dirname(file),undefined,undefined,database);let closed=false;
 return{store,file,backend:'sqlite',identity:archiveIdentity('sqlite',file),close:async()=>{if(closed)return;closed=true;await store.whenIdle();store.releaseReadCaches();database.close();}};
}
export function localFontAuditOrigin(value:string){
 const url=new URL(value);if(url.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('L’installazione font richiede l’origine HTTP di un server locale');return url.origin;
}
interface AuditState{snapshot:AdminSnapshot;fonts:AdminState['fonts'];records:[string,string][];metadata:string;}
/** Exact per-record fingerprints; SQLite never reconstructs the whole archive. */
export async function readFontAuditState(library:FontAuditLibrary):Promise<AuditState>{
 let snapshot:AdminSnapshot,fonts:AdminState['fonts'],records:[string,string][];
 if(library.backend==='json'){
  const state=await library.store.read();snapshot=adminSnapshot(state);fonts=state.fonts;records=state.records.map(record=>[record.id,archiveValueHash(record)]);
 }else{
  snapshot=await library.store.readSnapshot();const fontLibrary=await library.store.readFontLibrary();if(fontLibrary.revision!==snapshot.revision)throw new FontAuditConflictError('Archivio modificato durante il censimento');fonts=fontLibrary.fonts;records=[];
  for(const row of snapshot.records){const record=await library.store.readRecord(row.id);if(!record)throw new FontAuditConflictError('Progetto non più disponibile durante il censimento');records.push([row.id,archiveValueHash(record)]);}
 }
 if((await library.store.readFontLibrary()).revision!==snapshot.revision)throw new FontAuditConflictError('Archivio modificato durante il censimento');
 const{records:_r,fonts:_f,revision:_v,...metadata}=snapshot;return{snapshot,fonts,records,metadata:archiveValueHash(metadata)};
}
export function assertFontAuditPreserved(before:AuditState,after:AuditState){
 if(archiveValueHash(before.records)!==archiveValueHash(after.records)||before.metadata!==after.metadata)throw new FontAuditConflictError('Sono cambiati progetti, impostazioni o profili: nessun ripristino automatico');
 for(const font of before.fonts){const current=after.fonts.find(item=>item.id===font.id);if(!current||archiveValueHash(current)!==archiveValueHash(font))throw new FontAuditConflictError('Un font preesistente è cambiato: verificare le modifiche concorrenti');}
}
export async function checkedFontAuditServer(library:FontAuditLibrary,origin:string,expected:AdminSnapshot){
 let response:Response;try{response=await fetch(origin+'/__editor-local/admin/',{headers:{'X-Editor-Local':'1','X-Editor-Archive-Id':library.identity,Origin:origin},signal:AbortSignal.timeout(15000)});}catch{throw new FontAuditConflictError('Server locale non raggiungibile: nessuna installazione avviata');}
 if(!response.ok||response.headers.get('X-Editor-Archive-Id')!==library.identity)throw new FontAuditConflictError('Il server usa un archivio differente o non supporta la verifica di identità: nessuna installazione avviata');
 let value:AdminSnapshot;try{value=await response.json();}catch{throw new FontAuditConflictError('Risposta del server non verificabile: nessuna installazione avviata');}
 if(value.environment?.readOnly)throw new FontAuditConflictError('Il server usa una copia in sola lettura: nessuna installazione avviata');
 const{environment:_e,backend:_b,...snapshot}=value;if(archiveValueHash(snapshot)!==archiveValueHash(expected))throw new FontAuditConflictError('Revisione o contenuti del server differenti: nessuna installazione avviata');
}
export async function postFontAuditCommand(library:FontAuditLibrary,origin:string,command:unknown):Promise<AdminSnapshot>{
 let response:Response;try{response=await fetch(origin+'/__editor-local/admin/',{method:'POST',headers:{'X-Editor-Local':'1','X-Editor-Archive-Id':library.identity,'Content-Type':'application/json',Origin:origin},body:JSON.stringify(command),signal:AbortSignal.timeout(30000)});}catch{throw new FontAuditConflictError('Esito dell’installazione non confermato. Verificare il server; nessun retry automatico');}
 if(response.headers.get('X-Editor-Archive-Id')!==library.identity)throw new FontAuditConflictError('Identità del server cambiata durante l’installazione: interrompo senza retry');
 let value:any;try{value=await response.json();}catch{throw new FontAuditConflictError('Esito dell’installazione non leggibile. Verificare il server; nessun retry automatico');}
 if(!response.ok)throw new FontAuditConflictError(value?.error??'Installazione rifiutata: nessun retry automatico');if(!value||!Number.isSafeInteger(value.revision)||value.revision<0||!Array.isArray(value.fonts))throw new FontAuditConflictError('Esito dell’installazione incompleto: verificare il server, nessun retry automatico');return value;
}
