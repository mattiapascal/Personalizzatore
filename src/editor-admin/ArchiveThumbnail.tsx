import{graphicPages}from'../editor/pages';
import {archivePreviewError,ADMIN_PREVIEW_OUTDATED_EVENT} from './preview-errors';
import { useEffect,useRef,useState } from 'react';
import { readArchiveRecord } from './api';
import { ArchiveRecordSchema,type ArchiveRecord } from './schema';
import { archivePreviewKey, ARCHIVE_PREVIEW_SIDE, type ArchivePreviewMode } from './preview-key';
import { readPreviewImage, writePreviewImage } from './preview-cache';
const cache=new Map<string,Blob>();let queue=Promise.resolve();
function queued<T>(job:()=>Promise<T>):Promise<T>{const work=queue.then(job);queue=work.then(()=>{},()=>{});return work;}
async function renderRecord(record:ArchiveRecord,mode:ArchivePreviewMode):Promise<Blob>{
 if(mode==='technical'){const{exportReferenceThumbnail}=await import('../editor/reference-thumbnail');return exportReferenceThumbnail(graphicPages(record.document)[0]!,ARCHIVE_PREVIEW_SIDE);}
 const {exportDocumentThumbnail}=await import('../editor/fabric-adapter');
 return exportDocumentThumbnail(graphicPages(record.document)[0]!, ARCHIVE_PREVIEW_SIDE);
}
function remember(key:string,preview:Blob){cache.delete(key);cache.set(key,preview);let bytes=[...cache.values()].reduce((sum,value)=>sum+value.size,0);while(cache.size>128||bytes>16*1024*1024){const first=cache.keys().next().value;if(!first)break;bytes-=cache.get(first)!.size;cache.delete(first);}}
export function ArchiveThumbnail({id,version,title,previewKey,record,large=false,attempt=0,mode='production'}:{id:string;version:number;title:string;previewKey?:string;record?:ArchiveRecord;large?:boolean;attempt?:number;mode?:ArchivePreviewMode}){
 const ref=useRef<HTMLSpanElement>(null),[active,setActive]=useState(large),[result,setResult]=useState<{key:unknown;mode:ArchivePreviewMode;url?:string;error?:string}|null>(null);
 const viewKey=previewKey??record?.document??`${id}:${version}`,current=result?.key===viewKey&&result.mode===mode?result:null,url=current?.url,error=current?.error;
 useEffect(()=>{if(large){setActive(true);return;}const element=ref.current;if(!element)return;if(typeof IntersectionObserver==='undefined'){setActive(true);return;}const observer=new IntersectionObserver(entries=>setActive(entries.some(entry=>entry.isIntersecting)),{rootMargin:'120px'});observer.observe(element);return()=>observer.disconnect();},[large]);
 useEffect(()=>{let current=true,uri='';setResult(null);if(!active)return;
 void queued(async()=>{
   if(!current)return;
   // A server content fingerprint lets a hit skip both source/font downloads and rendering.
   let source=record,key=source?await archivePreviewKey(source.document,mode):previewKey;
   if(key){const cached=cache.get(key)??await readPreviewImage(key);if(cached){remember(key,cached);return cached;}}
   if(!current)return;
   source??=ArchiveRecordSchema.parse(await readArchiveRecord(id));
   if(source.version!==version)throw new Error('Archivio aggiornato: premi Aggiorna.');
   const actual=await archivePreviewKey(source.document,mode);
   if(key&&key!==actual)throw new Error('Grafica aggiornata: premi Aggiorna.');
   key=actual;
   const cached=cache.get(key)??await readPreviewImage(key);if(cached){remember(key,cached);return cached;}
   if(!current)return;
   const preview=await renderRecord(source,mode);remember(key,preview);await writePreviewImage(key,preview);return preview;
 }).then(preview=>{if(!current||!preview)return;uri=URL.createObjectURL(preview);setResult({key:viewKey,mode,url:uri});}).catch(cause=>{if(current){const error=archivePreviewError(cause);setResult({key:viewKey,mode,error:error.message});if(error.outdated)window.dispatchEvent(new Event(ADMIN_PREVIEW_OUTDATED_EVENT));}});
 return()=>{current=false;if(uri)URL.revokeObjectURL(uri);};},[active,id,version,previewKey,record,viewKey,attempt,mode]);
 return <span ref={ref} className={large?'archive-large-image':'archive-thumbnail'}>{url?<img src={url} alt={`${large?'Anteprima':'Miniatura'} ${title}`}/>:<span className="caption" title={error}>{error&&!large&&error.startsWith('Correggi i font')?'Font da correggere':error||(!active?'Anteprima':'Preparazione…')}</span>}</span>;
}
