import{lstat,mkdir,open,rename,unlink,rmdir}from'node:fs/promises';
import{resolve,join}from'node:path';import{createHash,randomUUID}from'node:crypto';import{connect}from'node:net';import{z}from'zod';
import{selectedEditorArchive}from'./editor-archive-selection';import{archiveIdentity,type EditorAdminStorage}from'./editor-admin-runtime';
import{canonicalArchivePath,isolatedArchivePaths}from'./editor-archive-paths';import{archiveFileHash,archiveValueHash}from'./editor-archive-copy';import{inspectSqliteArchive}from'./editor-archive-sqlite-maintenance';import{EditorAdminStore}from'./editor-admin-store';
const hash=z.string().regex(/^[a-f0-9]{64}$/),path=z.string().min(1).max(4096),backend=z.enum(['json','sqlite']);
const Marker=z.strictObject({kind:z.literal('editor-active-archive'),schemaVersion:z.literal(1),workspace:hash,backend,path,identity:hash,selectedAt:z.string().datetime(),verifiedRevision:z.number().int().nonnegative(),verifiedContent:hash});
const Descriptor=z.strictObject({backend,path,identity:hash,fileSha256:hash,walSha256:hash.nullable(),contentSha256:hash,revision:z.number().int().nonnegative(),records:z.number().int().nonnegative(),fonts:z.number().int().nonnegative()});
export const ArchiveSelectionPlan=z.strictObject({kind:z.literal('editor-archive-selection-plan'),schemaVersion:z.literal(1),workspace:hash,createdAt:z.string().datetime(),previousToken:hash.nullable(),current:Descriptor,target:Descriptor});
export type ArchiveSelectionProposal=z.infer<typeof ArchiveSelectionPlan>;
const Lock=z.strictObject({kind:z.literal('editor-archive-selection-lock'),workspace:hash,pid:z.number().int().positive(),previousToken:hash.nullable(),targetToken:hash,temp:z.string().regex(/^active-[a-f0-9-]{36}\.pending$/)});
const digest=(text:string)=>createHash('sha256').update(text).digest('hex');
async function location(root:string){const workspace=await canonicalArchivePath(resolve(root)),directory=join(workspace,'.local/editor-admin/archive-selection');return{workspace,id:digest(workspace),directory,active:join(directory,'active.json'),lock:join(directory,'selection.lock')};}
async function exists(file:string){try{await lstat(file);return true;}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return false;throw e;}}
async function smallText(file:string,max=8192){const info=await lstat(file);if(!info.isFile()||info.nlink!==1||info.size>max)throw Error('File di controllo archivio non valido');const handle=await open(file,'r');try{const buffer=Buffer.alloc(max+1),{bytesRead}=await handle.read(buffer,0,buffer.length,0);if(bytesRead>max)throw Error('File di controllo oltre il limite');return buffer.subarray(0,bytesRead).toString('utf8');}finally{await handle.close();}}
async function smallJson(file:string,max=8192){return JSON.parse(await smallText(file,max));}
async function controlToken(file:string){return await exists(file)?digest(await smallText(file)):null;}
function archiveFile(storage:EditorAdminStorage){return storage.kind==='json'?join(storage.directory,'state.json'):storage.file;}
async function unlockedChoice(root:string,ignoreLock=false){
 const loc=await location(root);if(!await exists(loc.directory))return{...loc,origin:'legacy' as const,token:null,storage:{kind:'json' as const,directory:join(loc.workspace,'.local/editor-admin')}};
 if(!(await lstat(loc.directory)).isDirectory())throw Error('Registro archivio non valido: nessun ripiego sul JSON');
 if(!ignoreLock&&await exists(loc.lock))throw Error('Cambio archivio in corso o interrotto: controllare il registro prima di avviare il laboratorio');
 if(!await exists(loc.active))throw Error('Registro archivio incompleto: nessun ripiego sul vecchio JSON');
 const text=await smallText(loc.active),token=digest(text),marker=Marker.parse(JSON.parse(text));if(marker.workspace!==loc.id)throw Error('Registro appartenente a un’altra cartella di progetto');
 const storage=await selectedEditorArchive({EDITOR_ARCHIVE_BACKEND:marker.backend,EDITOR_ARCHIVE_PATH:marker.path},loc.workspace),identity=archiveIdentity(marker.backend,archiveFile(storage));
 if(marker.identity!==identity)throw Error('Identità del registro non corrispondente: nessun ripiego sul JSON');
 if(await controlToken(loc.active)!==token||!ignoreLock&&await exists(loc.lock))throw Error('Registro cambiato durante la lettura: riavviare il laboratorio');
 return{...loc,origin:'configured' as const,token,storage,marker};
}
/** Only absence of the whole control directory preserves historical startup. */
export async function activeEditorArchive(root=process.cwd()){return unlockedChoice(root);}
async function optionalHash(file:string){return await exists(file)?await archiveFileHash(file):null;}
async function stamp(storage:EditorAdminStorage){const file=archiveFile(storage);if(await exists(file+'-journal'))throw Error('Archivio occupato da un journal: terminare i salvataggi prima di proseguire');return{fileSha256:await archiveFileHash(file),walSha256:storage.kind==='json'?null:await optionalHash(file+'-wal')};}
async function inspect(storage:EditorAdminStorage){
 const before=await stamp(storage);let content:{contentSha256:string;revision:number;records:number;fonts:number};
 if(storage.kind!=='json')content=await inspectSqliteArchive(storage.file);
 else{
  const store=new EditorAdminStore(storage.directory);try{const state=await store.read(),{records,fonts,...root}=state,hash=createHash('sha256').update('incisoria-archive-content-v1\0').update(archiveValueHash(root));for(const record of records)hash.update('\nrecord:'+archiveValueHash(record));for(const font of fonts)hash.update('\nfont:'+archiveValueHash(font));content={revision:state.revision,records:records.length,fonts:fonts.length,contentSha256:hash.digest('hex')};}finally{store.releaseReadCaches();}
 }
 if(archiveValueHash(before)!==archiveValueHash(await stamp(storage)))throw Error('Archivio cambiato durante la preparazione');
 const kind=storage.kind==='json'?'json' as const:'sqlite' as const;return Descriptor.parse({backend:kind,path:storage.kind==='json'?storage.directory:storage.file,identity:archiveIdentity(kind,archiveFile(storage)),...before,contentSha256:content.contentSha256,revision:content.revision,records:content.records,fonts:content.fonts});
}
async function storedStorage(value:z.infer<typeof Descriptor>,root:string){return selectedEditorArchive({EDITOR_ARCHIVE_BACKEND:value.backend,EDITOR_ARCHIVE_PATH:value.path},root);}
export async function prepareArchiveSelection(target:EditorAdminStorage,root=process.cwd()):Promise<ArchiveSelectionProposal>{
 if(target.kind==='sqlite-copy')throw Error('Selezionare un archivio completo, non la modalità di prova');
 const choice=await activeEditorArchive(root),normalized=await selectedEditorArchive({EDITOR_ARCHIVE_BACKEND:target.kind,EDITOR_ARCHIVE_PATH:target.kind==='json'?target.directory:target.file},choice.workspace),current=await inspect(choice.storage),next=await inspect(normalized);
 if(current.contentSha256!==next.contentSha256)throw Error('Gli archivi non contengono la stessa revisione e gli stessi dati: esportare o preparare una copia aggiornata');
 if((await activeEditorArchive(root)).token!==choice.token||archiveValueHash(await stamp(choice.storage))!==archiveValueHash({fileSha256:current.fileSha256,walSha256:current.walSha256}))throw Error('Selezione o sorgente cambiati durante la preparazione');
 return ArchiveSelectionPlan.parse({kind:'editor-archive-selection-plan',schemaVersion:1,workspace:choice.id,createdAt:new Date().toISOString(),previousToken:choice.token,current,target:next});
}
export async function writeArchiveSelectionProposal(plan:ArchiveSelectionProposal,output:string,root=process.cwd()){
 const parsed=ArchiveSelectionPlan.parse(plan),loc=await location(root);if(parsed.workspace!==loc.id)throw Error('Proposta appartenente a un altro progetto');
 const paths=await isolatedArchivePaths(archiveFile(await storedStorage(parsed.current,root)),output,join(loc.workspace,'.local/editor-admin'));await mkdir(resolve(paths.output,'..'),{recursive:true,mode:0o700});const file=await open(paths.output,'wx',0o600);try{await file.writeFile(JSON.stringify(parsed,null,2)+'\n');await file.sync();}finally{await file.close();}return paths.output;
}
async function requireStopped(port:number){
 if(!Number.isSafeInteger(port)||port<1||port>65535)throw Error('Porta di controllo non valida');
 const listening=await new Promise<boolean>((yes,no)=>{const socket=connect({host:'127.0.0.1',port});socket.setTimeout(1000);socket.once('connect',()=>{socket.destroy();yes(true);});socket.once('timeout',()=>{socket.destroy();no(Error('Impossibile verificare che il server sia fermo'));});socket.once('error',error=>{socket.destroy();if((error as NodeJS.ErrnoException).code==='ECONNREFUSED')yes(false);else no(error);});});if(listening)throw Error('Fermare il server sulla porta '+port+' prima di cambiare archivio');
}
function targetMarker(plan:ArchiveSelectionProposal){return Marker.parse({kind:'editor-active-archive',schemaVersion:1,workspace:plan.workspace,backend:plan.target.backend,path:plan.target.path,identity:plan.target.identity,selectedAt:plan.createdAt,verifiedRevision:plan.target.revision,verifiedContent:plan.target.contentSha256});}
async function syncFolder(directory:string){const file=await open(directory,'r');try{await file.sync();}finally{await file.close();}}
/** Explicit offline operation; never called by startup or import. */
export async function applyArchiveSelection(raw:unknown,options:{root?:string;port?:number}={}){
 const root=options.root??process.cwd(),port=options.port??5173,plan=ArchiveSelectionPlan.parse(raw),loc=await location(root);if(plan.workspace!==loc.id)throw Error('Proposta appartenente a un altro progetto');await requireStopped(port);
 const choice=await activeEditorArchive(root);if(choice.token!==plan.previousToken)throw Error('Registro cambiato: preparare una nuova proposta');
 const marker=targetMarker(plan),text=JSON.stringify(marker,null,2)+'\n',temp='active-'+randomUUID()+'.pending',lockValue=Lock.parse({kind:'editor-archive-selection-lock',workspace:loc.id,pid:process.pid,previousToken:choice.token,targetToken:digest(text),temp});let created=false,locked=false;
 await mkdir(resolve(loc.directory,'..'),{recursive:true,mode:0o700});try{await mkdir(loc.directory,{mode:0o700});created=true;}catch(e){if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e;}
 try{
  const lock=await open(loc.lock,'wx',0o600);locked=true;try{await lock.writeFile(JSON.stringify(lockValue));await lock.sync();}finally{await lock.close();}
  const actualToken=await controlToken(loc.active);if(actualToken!==plan.previousToken)throw Error('Registro cambiato prima del blocco');
  const current=choice.storage;if(archiveIdentity(current.kind==='json'?'json':'sqlite',archiveFile(current))!==plan.current.identity)throw Error('La proposta non descrive l’archivio attualmente selezionato');const target=await storedStorage(plan.target,root),a=await inspect(current),b=await inspect(target);
  if(archiveValueHash(a)!==archiveValueHash(plan.current)||archiveValueHash(b)!==archiveValueHash(plan.target)||a.contentSha256!==b.contentSha256)throw Error('Dati o revisione cambiati dalla proposta: nessun cambio applicato');
  const file=await open(join(loc.directory,temp),'wx',0o600);try{await file.writeFile(text);await file.sync();}finally{await file.close();}
  await requireStopped(port);if(archiveValueHash(await stamp(current))!==archiveValueHash({fileSha256:a.fileSha256,walSha256:a.walSha256})||archiveValueHash(await stamp(target))!==archiveValueHash({fileSha256:b.fileSha256,walSha256:b.walSha256})||await controlToken(loc.active)!==plan.previousToken)throw Error('Archivio o registro cambiati prima della pubblicazione');
  await rename(join(loc.directory,temp),loc.active);await syncFolder(loc.directory);return{backend:marker.backend,identity:marker.identity,revision:b.revision,records:b.records,fonts:b.fonts,selectionToken:digest(text),serverStarted:false};
 }finally{
  if(locked){await unlink(join(loc.directory,temp)).catch(()=>{});await unlink(loc.lock);await syncFolder(loc.directory);}
  if(created&&!await exists(loc.active))await rmdir(loc.directory).catch(()=>{});
 }
}
/** Recover only this control operation, never data. A live owner is not stale. */
export async function recoverArchiveSelection(options:{root?:string;port?:number}={}){
 const root=options.root??process.cwd(),loc=await location(root);await requireStopped(options.port??5173);const lock=Lock.parse(await smallJson(loc.lock));if(lock.workspace!==loc.id)throw Error('Blocco appartenente a un altro progetto');
 try{process.kill(lock.pid,0);throw Error('Il processo proprietario del blocco è ancora attivo');}catch(e){if((e as NodeJS.ErrnoException).code!=='ESRCH')throw e;}
 const token=await controlToken(loc.active);if(token!==lock.previousToken&&token!==lock.targetToken)throw Error('Registro differente da quello dell’operazione interrotta');
 if(token!==null)await unlockedChoice(root,true);else if(lock.previousToken!==null)throw Error('Registro precedente mancante');
 await unlink(join(loc.directory,lock.temp)).catch(e=>{if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;});await unlink(loc.lock);await syncFolder(loc.directory);if(token===null)await rmdir(loc.directory);return{recovered:true,selected:token===null?'legacy':'configured',dataChanged:false};
}
export async function readArchiveSelectionProposal(file:string){return ArchiveSelectionPlan.parse(await smallJson(file,32768));}
