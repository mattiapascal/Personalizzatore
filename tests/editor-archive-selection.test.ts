import{it,expect,beforeEach,afterEach}from'vitest';
import{mkdtemp,mkdir,rm,readFile,writeFile,stat,link,open}from'node:fs/promises';import{join}from'node:path';import{tmpdir}from'node:os';
import{selectedEditorArchive}from'../scripts/editor-archive-selection';import{openEditorAdminRuntime,type EditorAdminRuntime}from'../scripts/editor-admin-runtime';import{EditorAdminSqlite}from'../scripts/editor-admin-sqlite';
import{exportArchiveCopy}from'../scripts/editor-archive-copy';import{DEFAULT_ADMIN_SETTINGS,AdminStateSchema}from'../src/editor-admin/schema';import{createTestDocument}from'./helpers/editor-fonts';import{editorLabConfig}from'../scripts/editor-lab-config';
import{MAX_LOCAL_ARCHIVE_BYTES}from'../scripts/editor-admin-read-cache';
let root:string;const opened:EditorAdminRuntime[]=[];beforeEach(async()=>{root=await mkdtemp(join(tmpdir(),'archive-select-'));});afterEach(async()=>{for(const runtime of opened.splice(0))await runtime.close();await rm(root,{recursive:true,force:true});});
const settings={...DEFAULT_ADMIN_SETTINGS,editorName:'Archivio selezionato TEST'};
it('backend e percorso obbligatori: non scopre il JSON o SQLite e non crea dati in caso di errore',async()=>{
 for(const env of [{},{EDITOR_ARCHIVE_BACKEND:'sqlite'},{EDITOR_ARCHIVE_BACKEND:'auto',EDITOR_ARCHIVE_PATH:'archive.sqlite'}])await expect(selectedEditorArchive(env,root)).rejects.toThrow('Specificare');
 await expect(selectedEditorArchive({EDITOR_ARCHIVE_BACKEND:'sqlite',EDITOR_ARCHIVE_PATH:'missing.sqlite'},root)).rejects.toThrow('ENOENT');await expect(stat(join(root,'missing.sqlite'))).rejects.toMatchObject({code:'ENOENT'});
 await expect(selectedEditorArchive({EDITOR_ARCHIVE_BACKEND:'json',EDITOR_ARCHIVE_PATH:root},root)).rejects.toThrow('ENOENT');await expect(stat(join(root,'state.json'))).rejects.toMatchObject({code:'ENOENT'});
});
it('SQLite completo usa soltanto il file dichiarato, anche nella cartella attiva, con JSON esca invariato',async()=>{
 const directory=join(root,'.local','editor-admin'),file=join(directory,'archive.sqlite'),db=await EditorAdminSqlite.create(file,{schemaVersion:1,revision:8,settings,records:[],fonts:[]});db.close();const bait=join(directory,'state.json');await writeFile(bait,'TEST JSON esca non leggibile');
 const selected=await selectedEditorArchive({EDITOR_ARCHIVE_BACKEND:'sqlite',EDITOR_ARCHIVE_PATH:file},root),runtime=await openEditorAdminRuntime(selected,root);opened.push(runtime);expect(runtime.backend).toBe('sqlite');expect(runtime.copy).toBeUndefined();expect((await runtime.store.readSnapshot()).revision).toBe(8);await runtime.store.dispatch({tool:'settings',expectedRevision:8,arguments:{...settings,gridMm:2}});expect((await runtime.store.readSnapshot()).revision).toBe(9);expect(await readFile(bait,'utf8')).toBe('TEST JSON esca non leggibile');await runtime.close();const data=EditorAdminSqlite.open(file,true);try{expect((await data.readSnapshot()).settings.gridMm).toBe(2);}finally{data.close();}
});
it('il ritorno JSON apre la revisione esportata dopo le modifiche SQLite, senza metadati di runtime persistenti',async()=>{
 const file=join(root,'sqlite','archive.sqlite'),db=await EditorAdminSqlite.create(file,{schemaVersion:1,revision:0,settings,records:[],fonts:[]});db.close();const sql=await openEditorAdminRuntime(await selectedEditorArchive({EDITOR_ARCHIVE_BACKEND:'sqlite',EDITOR_ARCHIVE_PATH:file},root),root);opened.push(sql);
 const doc=createTestDocument();await sql.store.dispatch({tool:'saveRecord',expectedRevision:0,arguments:{kind:'template',title:'Ritorno TEST',tags:['TEST'],clientRef:'',document:doc}});const saved=await sql.store.read();await sql.close();const target=join(root,'returned','state.json');await exportArchiveCopy(file,target);
 const json=await openEditorAdminRuntime(await selectedEditorArchive({EDITOR_ARCHIVE_BACKEND:'json',EDITOR_ARCHIVE_PATH:join(root,'returned')},root),root);opened.push(json);expect(json.backend).toBe('json');expect(json.copy).toBeUndefined();expect(await json.store.read()).toEqual(saved);expect(AdminStateSchema.parse(JSON.parse(await readFile(target,'utf8')))).toEqual(saved);await json.store.dispatch({tool:'settings',expectedRevision:1,arguments:{...settings,gridMm:3}});expect((await json.store.readSnapshot()).revision).toBe(2);const original=EditorAdminSqlite.open(file,true);try{expect((await original.readSnapshot()).revision).toBe(1);}finally{original.close();}
});
it('nessun fallback su file SQLite corrotto e rifiuto dei collegamenti fisici',async()=>{
 const directory=join(root,'broken');await mkdir(directory);const file=join(directory,'archive.sqlite');await writeFile(file,'TEST non SQLite');await writeFile(join(directory,'state.json'),JSON.stringify({schemaVersion:1,revision:0,settings,records:[],fonts:[]}));const selection=await selectedEditorArchive({EDITOR_ARCHIVE_BACKEND:'sqlite',EDITOR_ARCHIVE_PATH:file},root);await expect(openEditorAdminRuntime(selection,root)).rejects.toThrow();
 const alias=join(root,'hard.sqlite');await link(file,alias);await expect(selectedEditorArchive({EDITOR_ARCHIVE_BACKEND:'sqlite',EDITOR_ARCHIVE_PATH:alias},root)).rejects.toThrow('indipendente');
});
it('il ritorno rifiuta un JSON oltre la capacità prima di caricarlo, senza alterarlo',async()=>{
 const directory=join(root,'large-json');await mkdir(directory);const file=await open(join(directory,'state.json'),'wx');try{await file.truncate(MAX_LOCAL_ARCHIVE_BYTES+1);}finally{await file.close();}
 await expect(selectedEditorArchive({EDITOR_ARCHIVE_BACKEND:'json',EDITOR_ARCHIVE_PATH:directory},root)).rejects.toThrow('oltre 512 MiB');expect((await stat(join(directory,'state.json'))).size).toBe(MAX_LOCAL_ARCHIVE_BYTES+1);
});
it('laboratorio completo conserva i plugin e usa una cache distinta dalla prova e dal normale avvio',()=>{
 const storage={kind:'sqlite' as const,file:'TEST/copy.sqlite'},full=editorLabConfig({port:5177,storage}),normal=editorLabConfig(),trial=editorLabConfig({trial:true,storage:{kind:'sqlite-copy',file:storage.file,readOnly:true}}),names=full.plugins.flat().map(plugin=>plugin.name);
 expect(names).toContain('editor-local-configurations');expect(names).not.toContain('editor-storage-trial-boundary');expect(full.plugins.flat().map(plugin=>plugin.name)).toEqual(normal.plugins.flat().map(plugin=>plugin.name));expect(full.server.port).toBe(5177);expect(full.cacheDir).toBeTruthy();expect(full.cacheDir).not.toBe(trial.cacheDir);expect(normal.cacheDir).toBeUndefined();
});
