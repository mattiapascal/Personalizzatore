import{realpath,lstat}from'node:fs/promises';
import{resolve,dirname,basename,relative,join,sep}from'node:path';
async function canonicalDestination(path:string):Promise<string>{
 const absolute=resolve(path);let ancestor=absolute;
 while(true){try{return join(await realpath(ancestor),relative(ancestor,absolute));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;const parent=dirname(ancestor);if(parent===ancestor)throw error;ancestor=parent;}}
}
/** Resolve aliases before creating directories; trial output cannot be live data. */
export async function isolatedArchivePaths(source:string,output:string,activeRoot=resolve('.local/editor-admin')){
 const actualSource=await realpath(source),targetDirectory=await canonicalDestination(dirname(output)),target=join(targetDirectory,basename(output)),active=await canonicalDestination(activeRoot);
 if(actualSource===target||dirname(actualSource)===targetDirectory)throw Error('La copia deve essere in una directory separata dal sorgente');
 if(target===active||target.startsWith(active+sep))throw Error('Questa prova non scrive nell’archivio attivo');
 for(const path of[target,target+'-wal',target+'-shm',target+'-journal']){
  try{await lstat(path);}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')continue;throw error;}
  throw Object.assign(Error('EEXIST: destinazione o file journal già esistente; nessuna sovrascrittura'),{code:'EEXIST'});
 }
 return{source:actualSource,output:target};
}
