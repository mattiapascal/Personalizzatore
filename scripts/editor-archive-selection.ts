import{realpath,stat,lstat}from'node:fs/promises';
import{resolve,join}from'node:path';
import type{EditorAdminStorage}from'./editor-admin-runtime';
import{MAX_LOCAL_ARCHIVE_BYTES}from'./editor-admin-read-cache';

/** Alternate launch only. No discovery, creation, migration or fallback. */
export async function selectedEditorArchive(environment:Record<string,string|undefined>,root=process.cwd()):Promise<EditorAdminStorage>{
 const backend=environment.EDITOR_ARCHIVE_BACKEND,path=environment.EDITOR_ARCHIVE_PATH;
 if(!['json','sqlite'].includes(backend??'')||typeof path!=='string'||!path.trim())throw Error('Specificare EDITOR_ARCHIVE_BACKEND=json oppure sqlite e EDITOR_ARCHIVE_PATH; nessun archivio viene scelto automaticamente');
 const selected=await realpath(resolve(root,path));
 if(backend==='sqlite'){const info=await stat(selected);if(!info.isFile()||info.nlink!==1)throw Error('Selezionare un file SQLite esistente e indipendente');return{kind:'sqlite',file:selected};}
 if(!(await stat(selected)).isDirectory())throw Error('Per JSON indicare la directory contenente state.json');
 const file=await lstat(join(selected,'state.json'));if(!file.isFile()||file.nlink!==1)throw Error('Il ritorno JSON richiede un file state.json indipendente');
 if(file.size>MAX_LOCAL_ARCHIVE_BYTES)throw Error('Il vecchio lettore JSON non può aprire un archivio oltre 512 MiB; usare il backup SQLite');
 return{kind:'json',directory:selected};
}
