import{DatabaseSync,backup,type BackupProgressInfo}from'node:sqlite';
import{createHash,randomUUID}from'node:crypto';
import{open,stat,mkdir,link,unlink}from'node:fs/promises';
import{dirname}from'node:path';
import{EditorAdminSqlite}from'./editor-admin-sqlite';
import{adminSnapshot}from'./editor-admin-store';
import{archiveValueHash,archiveFileHash}from'./editor-archive-copy';
import{isolatedArchivePaths}from'./editor-archive-paths';
import{MAX_LOCAL_ARCHIVE_BYTES}from'./editor-admin-read-cache';
import{AdminStateSchema,MAX_ARCHIVE_RECORDS,MAX_LIBRARY_FONTS}from'../src/editor-admin/schema';

/** Complete selective inspection. Never stringify the whole logical archive. */
export async function inspectSqliteArchive(source:string){
 const database=EditorAdminSqlite.open(source,true);
 try{
  const version=database.snapshotVersion(),snapshot=await database.readSnapshot(),{records,fonts,...root}=snapshot;
  const empty=AdminStateSchema.parse({...root,records:[],fonts:[]});
  if(records.length>MAX_ARCHIVE_RECORDS||fonts.length>MAX_LIBRARY_FONTS||new Set(records.map(r=>r.id)).size!==records.length||new Set(fonts.map(f=>f.id)).size!==fonts.length)throw Error('Indice archivio non valido');
  const hash=createHash('sha256').update('incisoria-archive-content-v1\0').update(archiveValueHash(root));
  let logicalJsonBytes=Buffer.byteLength(JSON.stringify(root))-1+Buffer.byteLength(',"records":[');
  for(const[index,summary]of records.entries()){
   const record=await database.readRecord(summary.id);if(!record)throw Error('Record mancante durante verifica');
   const expected=adminSnapshot({...empty,records:[record]}).records[0];if(archiveValueHash(summary)!==archiveValueHash(expected))throw Error('Indice/miniatura differente dal record: '+record.id);
   hash.update('\nrecord:'+archiveValueHash(record));logicalJsonBytes+=Buffer.byteLength(JSON.stringify(record))+(index?1:0);
  }
  logicalJsonBytes+=Buffer.byteLength('],"fonts":[');const actualFonts=await database.readFonts();
  for(const[index,font]of actualFonts.entries()){
   const expected=adminSnapshot({...empty,fonts:[font]}).fonts[0];if(archiveValueHash(fonts[index])!==archiveValueHash(expected))throw Error('Indice font differente dal file: '+font.id);
   hash.update('\nfont:'+archiveValueHash(font));logicalJsonBytes+=Buffer.byteLength(JSON.stringify(font))+(index?1:0);
  }
  logicalJsonBytes+=2;database.verifyDatabase();if(database.snapshotVersion()!==version)throw Error('Archivio cambiato durante la verifica');
  const physicalBytes=(await stat(source)).size;if(physicalBytes>MAX_LOCAL_ARCHIVE_BYTES)throw Error('File SQLite oltre il limite fisico locale');
  const{resources,resourceBytes}=database.resourceCounts();return{revision:snapshot.revision,records:records.length,fonts:fonts.length,resources,resourceBytes,logicalJsonBytes,physicalBytes,contentSha256:hash.digest('hex')};
 }finally{database.close();}
}

/** Native backup includes committed WAL pages. Publish only a closed, verified,
 * synced standalone file. Concurrent source changes are native SQLite snapshots. */
export async function backupSqliteArchive(source:string,output:string,options:{onProgress?:(info:BackupProgressInfo)=>void}={}){
 ({source,output}=await isolatedArchivePaths(source,output));
 const info=await stat(source);if(!info.isFile()||info.nlink!==1||info.size>MAX_LOCAL_ARCHIVE_BYTES)throw Error('Il backup richiede un file SQLite indipendente entro il limite fisico locale');
 const probe=EditorAdminSqlite.open(source,true);probe.close();
 await mkdir(dirname(output),{recursive:true});const temp=output+'.backing-up-'+randomUUID();let database:DatabaseSync|undefined;
 try{
  const file=await open(temp,'wx',0o600);await file.close();database=new DatabaseSync(source,{readOnly:true,allowExtension:false,timeout:1000});
  let observerFailed=false,observerError:unknown;const pages=await backup(database,temp,{rate:100,progress:info=>{if(!observerFailed)try{options.onProgress?.(info);}catch(error){observerFailed=true;observerError=error;}}});
  database.close();database=undefined;if(observerFailed)throw observerError;
  const target=new DatabaseSync(temp,{allowExtension:false,timeout:1000});try{target.exec('PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL;');}finally{target.close();}
  const result=await inspectSqliteArchive(temp),ready=await open(temp,'r+');try{await ready.sync();}finally{await ready.close();}
  await link(temp,output);await unlink(temp);const directory=await open(dirname(output),'r');try{await directory.sync();}finally{await directory.close();}
  return{...result,pages,sha256:await archiveFileHash(output),output,readOnlySource:true};
 }finally{database?.close();for(const suffix of['','-wal','-shm','-journal'])await unlink(temp+suffix).catch(()=>{});}
}
/** Restore is a new independent file, never an active-file swap. */
export async function restoreSqliteArchive(source:string,output:string){return backupSqliteArchive(source,output);}
