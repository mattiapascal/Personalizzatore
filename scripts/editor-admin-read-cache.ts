import{validateDocumentPngCopies}from'./png-copy-validation';
import {readFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {AdminStateSchema,DEFAULT_ADMIN_SETTINGS,type AdminState} from '../src/editor-admin/schema';
import {AdminRevisionConflictError} from '../src/editor-admin/errors';
export const MAX_LOCAL_ARCHIVE_BYTES=512*1024*1024;
interface ArchiveSnapshot {state:AdminState;key:string;}
/** Clone only mutable JSON containers; immutable resource strings are shared. */
export function cloneArchiveValue<T>(value:T):T {
 if(Array.isArray(value))return value.map(cloneArchiveValue) as T;
 if(value!==null&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,entry])=>[key,cloneArchiveValue(entry)])) as T;
 return value;
}
/** Resource strings are immutable. Sharing equal bytes avoids retaining one
 * copy of a font/material per template without changing the JSON on disk. */
export function internArchiveResourceStrings(state:AdminState):{unique:number;aliases:number}{
 const pool=new Map<string,string>();let aliases=0;const share=(value:string)=>{const existing=pool.get(value);if(existing!==undefined){aliases++;return existing;}pool.set(value,value);return value;};
 for(const font of state.fonts)font.dataBase64=share(font.dataBase64);
 for(const record of state.records){for(const font of record.document.fontAssets??[])font.dataBase64=share(font.dataBase64);for(const object of record.document.objects)if(object.type==='image')object.source.dataUrl=share(object.source.dataUrl);}
 return{unique:pool.size,aliases};
}
/** Internal validated snapshot. Never expose its mutable containers to callers. */
export class EditorAdminReadCache {
 private entry:{key:string;pending:Promise<ArchiveSnapshot>}|null=null;
 private readonly file:string;
 constructor(directory:string,private readonly loadText:(file:string)=>Promise<string>=file=>readFile(file,'utf8')){this.file=join(directory,'state.json');}
 private async fileKey():Promise<string>{
  try{const info=await stat(this.file,{bigint:true});if(info.size>BigInt(MAX_LOCAL_ARCHIVE_BYTES))throw Error('Archivio locale oltre 512 MB: occorre estendere la capacità prima di caricarlo');return[info.dev,info.ino,info.size,info.mtimeNs,info.ctimeNs].map(String).join(':');}
  catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return'absent';throw e;}
 }
 async isCurrent(key:string):Promise<boolean>{return await this.fileKey()===key;}
 invalidate():void{this.entry=null;}
 private async stableSnapshot(key:string):Promise<ArchiveSnapshot>{
  for(let attempt=0;attempt<3;attempt++){
   let state:AdminState;
   try{state=key==='absent'?{schemaVersion:1,revision:0,settings:{...DEFAULT_ADMIN_SETTINGS},records:[],fonts:[]}:AdminStateSchema.parse(JSON.parse(await this.loadText(this.file)));internArchiveResourceStrings(state);await validateDocumentPngCopies(state.records.map(record=>record.document));}
   catch(e){const next=await this.fileKey();if(next!==key){key=next;continue;}throw e;}
   const next=await this.fileKey();if(next===key)return{state,key};key=next;
  }
  throw new AdminRevisionConflictError();
 }
 async get():Promise<ArchiveSnapshot>{
  const key=await this.fileKey();let entry=this.entry;
  if(!entry||entry.key!==key){const fresh={key,pending:this.stableSnapshot(key)};this.entry=entry=fresh;void fresh.pending.then(value=>{if(this.entry===fresh)fresh.key=value.key;},()=>{if(this.entry===fresh)this.entry=null;});}
  return entry.pending;
 }
}
