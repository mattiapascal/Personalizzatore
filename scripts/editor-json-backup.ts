import{createReadStream,createWriteStream}from'node:fs';
import{pipeline}from'node:stream/promises';
import{Transform}from'node:stream';
import{mkdir,stat,open,link,unlink}from'node:fs/promises';
import{dirname}from'node:path';
import{randomUUID}from'node:crypto';
import{isolatedArchivePaths}from'./editor-archive-paths';
import{archiveFileHash}from'./editor-archive-copy';
import{MAX_LOCAL_ARCHIVE_BYTES}from'./editor-admin-read-cache';

/** Byte-identical legacy backup; never materialize a whole-archive string. */
export async function backupJsonArchive(source:string,output:string){
 ({source,output}=await isolatedArchivePaths(source,output));
 const info=await stat(source);if(!info.isFile()||info.nlink!==1||info.size>MAX_LOCAL_ARCHIVE_BYTES)throw Error('Il backup JSON richiede un file indipendente entro 512 MiB');
 const before=await archiveFileHash(source),temp=output+'.backing-up-'+randomUUID();await mkdir(dirname(output),{recursive:true,mode:0o700});let bytes=0;
 try{
  const budget=new Transform({transform(chunk:Buffer,_encoding,done){bytes+=chunk.length;if(bytes>MAX_LOCAL_ARCHIVE_BYTES)done(Error('Archivio JSON oltre 512 MiB durante il backup'));else done(null,chunk);}});
  await pipeline(createReadStream(source),budget,createWriteStream(temp,{flags:'wx',mode:0o600}));
  if(await archiveFileHash(temp)!==before||await archiveFileHash(source)!==before)throw Error('Archivio JSON cambiato durante il backup');
  const file=await open(temp,'r+');try{await file.sync();}finally{await file.close();}
  await link(temp,output);await unlink(temp);const folder=await open(dirname(output),'r');try{await folder.sync();}finally{await folder.close();}
  return{output,sha256:before,bytes,sourceUnchanged:true};
 }finally{await unlink(temp).catch(()=>{});}
}
