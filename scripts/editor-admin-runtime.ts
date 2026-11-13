import{realpath,stat}from'node:fs/promises';import{resolve,dirname,sep}from'node:path';
import{EditorAdminStore}from'./editor-admin-store';import{EditorAdminSqlite}from'./editor-admin-sqlite';
import type{ShopProductDetail}from'../src/editor-admin/shop-catalog';
export type EditorAdminStorage={kind:'json';directory:string}|{kind:'sqlite';file:string}|{kind:'sqlite-copy';file:string;readOnly:boolean};
export interface EditorAdminRuntime {store:EditorAdminStore;directory:string;backend:'json'|'sqlite';copy?:{readOnly:boolean};close:()=>Promise<void>;}
/** Explicit configuration only; never discover or migrate an archive. */
export async function openEditorAdminRuntime(storage:EditorAdminStorage,root:string,product?:(id:string)=>Promise<ShopProductDetail>):Promise<EditorAdminRuntime>{
 if(!storage||!['json','sqlite','sqlite-copy'].includes(storage.kind)||storage.kind==='json'&&(typeof storage.directory!=='string'||!storage.directory.trim())||storage.kind!=='json'&&(typeof storage.file!=='string'||!storage.file.trim())||storage.kind==='sqlite-copy'&&typeof storage.readOnly!=='boolean')throw Error('Configurazione archivio esplicita non valida');
 if(storage.kind==='json'){const directory=resolve(root,storage.directory),store=new EditorAdminStore(directory,product);let closed=false;return{store,directory,backend:'json',close:async()=>{if(closed)return;closed=true;await store.whenIdle();store.releaseReadCaches();}};}
 const file=await realpath(resolve(root,storage.file)),active=await realpath(resolve(root,'.local/editor-admin')).catch(()=>resolve(root,'.local/editor-admin'));
 if(storage.kind==='sqlite-copy'&&(file===active||file.startsWith(active+sep)))throw Error('Il server di prova richiede una copia esterna all’archivio attivo');
 const info=await stat(file);if(!info.isFile()||info.nlink!==1)throw Error('Il runtime richiede un file SQLite indipendente, senza collegamenti fisici');const readOnly=storage.kind==='sqlite-copy'&&storage.readOnly,database=EditorAdminSqlite.open(file,readOnly),store=new EditorAdminStore(dirname(file),product,undefined,database);let closed=false;
 return{store,directory:dirname(file),backend:'sqlite',...(storage.kind==='sqlite-copy'?{copy:{readOnly}}:{}),close:async()=>{if(closed)return;closed=true;await store.whenIdle();store.releaseReadCaches();database.close();}};
}
const runtimeKey=Symbol.for('incisoria.editor.admin.runtime');
export function registerEditorAdminRuntime(server:object,runtime:EditorAdminRuntime){Object.defineProperty(server,runtimeKey,{value:runtime,configurable:true});}
export function editorAdminRuntime(server:object):EditorAdminRuntime{const runtime=(server as Record<symbol,unknown>)[runtimeKey]as EditorAdminRuntime|undefined;if(!runtime)throw Error('Archivio editor non inizializzato');return runtime;}
