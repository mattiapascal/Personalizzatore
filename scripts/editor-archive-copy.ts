import{createHash,randomUUID}from'node:crypto';import{createReadStream}from'node:fs';
import{readFile,stat,mkdir,link,unlink,open}from'node:fs/promises';import{dirname,resolve}from'node:path';
import{AdminStateSchema,type AdminState}from'../src/editor-admin/schema';import{EditorAdminSqlite}from'./editor-admin-sqlite';
import{MAX_LOCAL_ARCHIVE_BYTES,internArchiveResourceStrings}from'./editor-admin-read-cache';import{adminSnapshot}from'./editor-admin-store';
export async function archiveFileHash(file:string){const hash=createHash('sha256');for await(const bytes of createReadStream(file))hash.update(bytes);return hash.digest('hex');}
/** Stable semantic hash without constructing a string for the entire archive. */
export function archiveValueHash(value:unknown){const hash=createHash('sha256');const visit=(v:unknown)=>{if(Array.isArray(v)){hash.update('[');v.forEach((entry,index)=>{if(index)hash.update(',');visit(entry);});hash.update(']');}else if(v!==null&&typeof v==='object'){hash.update('{');Object.keys(v).filter(key=>(v as Record<string,unknown>)[key]!==undefined).sort().forEach((key,index)=>{if(index)hash.update(',');hash.update(JSON.stringify(key)+':');visit((v as Record<string,unknown>)[key]);});hash.update('}');}else{const json=JSON.stringify(v);if(json===undefined)throw Error('Valore non JSON');hash.update(json);}};visit(value);return hash.digest('hex');}
async function legacy(file:string){if((await stat(file)).size>MAX_LOCAL_ARCHIVE_BYTES)throw Error('Sorgente JSON oltre 512 MiB');const state=AdminStateSchema.parse(JSON.parse(await readFile(file,'utf8')));internArchiveResourceStrings(state);return state;}
async function publish(temp:string,output:string){await link(temp,output);await unlink(temp);const directory=await open(dirname(output),'r');try{await directory.sync();}finally{await directory.close();}}
function isolatedOutput(source:string,output:string){if(resolve(source)===resolve(output)||resolve(dirname(source))===resolve(dirname(output)))throw Error('La copia deve essere in una directory separata dal sorgente');const live=resolve('.local/editor-admin');if(resolve(output)===live||resolve(output).startsWith(live+'/'))throw Error('Questa prova non scrive nell’archivio attivo');}
export async function verifyArchiveCopy(state:AdminState,database:EditorAdminSqlite){
 const{records,fonts,...root}=state,snapshot=await database.readSnapshot(),{records:summaryRecords,fonts:summaryFonts,...actualRoot}=snapshot;
 if(archiveValueHash(root)!==archiveValueHash(actualRoot)||records.length!==summaryRecords.length||fonts.length!==summaryFonts.length)throw Error('Indice della copia differente dal sorgente');
 for(const[index,record]of records.entries()){
  const actual=await database.readRecord(record.id);if(!actual||archiveValueHash(actual)!==archiveValueHash(record))throw Error('Record differente: '+record.id);
  const expected=adminSnapshot({...state,records:[record],fonts:[]}).records[0];if(archiveValueHash(expected)!==archiveValueHash(summaryRecords[index]))throw Error('Indice/miniatura differente: '+record.id);
 }
 const actualFonts=await database.readFonts();for(const[index,font]of fonts.entries()){
  if(archiveValueHash(font)!==archiveValueHash(actualFonts[index]))throw Error('Font differente: '+font.id);
  const expected=adminSnapshot({...state,records:[],fonts:[font]}).fonts[0];if(archiveValueHash(expected)!==archiveValueHash(summaryFonts[index]))throw Error('Indice font differente: '+font.id);
 }
 database.verifyDatabase();const{resources,resourceBytes}=database.resourceCounts();return{revision:state.revision,records:records.length,fonts:fonts.length,resources,resourceBytes,rootHash:archiveValueHash(root)};
}
export async function prepareArchiveCopy(source:string,output:string){
 isolatedOutput(source,output);const before=await archiveFileHash(source),state=await legacy(source);await mkdir(dirname(output),{recursive:true});const temp=output+'.preparing-'+randomUUID();let database:EditorAdminSqlite|undefined;
 try{database=await EditorAdminSqlite.create(temp,state);const result=await verifyArchiveCopy(state,database);database.close();database=undefined;if(await archiveFileHash(source)!==before)throw Error('Sorgente cambiato durante la preparazione');await publish(temp,output);return{...result,sourceSha256:before,sourceUnchanged:true,sourceBytes:(await stat(source)).size,sqliteBytes:(await stat(output)).size,output};}
 finally{database?.close();await unlink(temp).catch(()=>{});}
}
export async function verifyArchiveFiles(source:string,copy:string){const before=await archiveFileHash(source),database=EditorAdminSqlite.open(copy,true);try{const result=await verifyArchiveCopy(await legacy(source),database);if(await archiveFileHash(source)!==before)throw Error('Sorgente cambiato durante il confronto');return{...result,sourceSha256:before,sourceUnchanged:true};}finally{database.close();}}
/** Streaming legacy export: a large shared library must not require one giant
 * JSON string or hold another archive beside the selective reader. */
export async function exportArchiveCopy(source:string,output:string){
 isolatedOutput(source,output);const before=await archiveFileHash(source),database=EditorAdminSqlite.open(source,true);await mkdir(dirname(output),{recursive:true});const temp=output+'.exporting-'+randomUUID();let file:Awaited<ReturnType<typeof open>>|undefined;
 try{file=await open(temp,'wx',0o600);const write=async(value:string)=>{const bytes=Buffer.from(value);for(let offset=0;offset<bytes.length;){const result=await file!.write(bytes,offset,bytes.length-offset,null);if(!result.bytesWritten)throw Error('Scrittura JSON incompleta');offset+=result.bytesWritten;}};
  const snapshot=await database.readSnapshot(),{records,fonts:_fontSummaries,...root}=snapshot;await write('{');let comma=false;for(const[key,value]of Object.entries(root)){if(comma)await write(',');comma=true;await write(JSON.stringify(key)+':'+JSON.stringify(value));}
  await write(',"records":[');for(const[index,summary]of records.entries()){const record=await database.readRecord(summary.id);if(!record)throw Error('Record scomparso durante esportazione');if(index)await write(',');await write(JSON.stringify(record));}await write('],"fonts":[');
  for(const[index,font]of(await database.readFonts()).entries()){if(index)await write(',');await write(JSON.stringify(font));}await write(']}');await file.sync();await file.close();file=undefined;
  if(await archiveFileHash(source)!==before)throw Error('Copia SQLite cambiata durante esportazione');await publish(temp,output);return{records:records.length,fonts:snapshot.fonts.length,revision:snapshot.revision,sourceSha256:before,sourceUnchanged:true,outputBytes:(await stat(output)).size,output};
 }finally{if(file)await file.close();database.close();await unlink(temp).catch(()=>{});}
}
