import { useEffect,useRef,useState } from 'react';
import { readArchiveRecord } from './api';
import { ArchiveRecordSchema,type ArchiveRecord } from './schema';
import { archivePreviewKey, ARCHIVE_PREVIEW_SIDE } from './preview-key';
import { readPreviewImage, writePreviewImage } from './preview-cache';
const cache=new Map<string,Blob>();let queue=Promise.resolve();
function queued<T>(job:()=>Promise<T>):Promise<T>{const work=queue.then(job);queue=work.then(()=>{},()=>{});return work;}
async function renderRecord(record:ArchiveRecord):Promise<Blob>{
 const {exportDocumentThumbnail,prepareRasterSource}=await import('../editor/fabric-adapter'),{loadFontAssets}=await import('../editor/fonts');
 await Promise.all([loadFontAssets(record.document.fontAssets),...record.document.objects.filter(object=>object.type==='image').map(object=>prepareRasterSource(object.source))]);
 return exportDocumentThumbnail(record.document, ARCHIVE_PREVIEW_SIDE);
}
function remember(key:string,preview:Blob){cache.delete(key);cache.set(key,preview);let bytes=[...cache.values()].reduce((sum,value)=>sum+value.size,0);while(cache.size>128||bytes>16*1024*1024){const first=cache.keys().next().value;if(!first)break;bytes-=cache.get(first)!.size;cache.delete(first);}}
export function ArchiveThumbnail({id,version,title,previewKey,record,large=false}:{id:string;version:number;title:string;previewKey?:string;record?:ArchiveRecord;large?:boolean}){
 const ref=useRef<HTMLSpanElement>(null),[active,setActive]=useState(large),[url,setUrl]=useState(''),[error,setError]=useState('');
 useEffect(()=>{if(large){setActive(true);return;}const element=ref.current;if(!element)return;if(typeof IntersectionObserver==='undefined'){setActive(true);return;}const observer=new IntersectionObserver(entries=>setActive(entries.some(entry=>entry.isIntersecting)),{rootMargin:'120px'});observer.observe(element);return()=>observer.disconnect();},[large]);
 useEffect(()=>{let current=true,uri='';setUrl('');setError('');if(!active)return;
 void queued(async()=>{
   if(!current)return;
   // A server content fingerprint lets a hit skip both source/font downloads and rendering.
   let source=record,key=source?await archivePreviewKey(source.document):previewKey;
   if(key){const cached=cache.get(key)??await readPreviewImage(key);if(cached){remember(key,cached);return cached;}}
   if(!current)return;
   source??=ArchiveRecordSchema.parse(await readArchiveRecord(id));
   if(source.version!==version)throw new Error('Archivio aggiornato: premi Aggiorna.');
   const actual=await archivePreviewKey(source.document);
   if(key&&key!==actual)throw new Error('Grafica aggiornata: premi Aggiorna.');
   key=actual;
   const cached=cache.get(key)??await readPreviewImage(key);if(cached){remember(key,cached);return cached;}
   if(!current)return;
   const preview=await renderRecord(source);remember(key,preview);await writePreviewImage(key,preview);return preview;
 }).then(preview=>{if(!current||!preview)return;uri=URL.createObjectURL(preview);setUrl(uri);}).catch(cause=>{if(current)setError(cause instanceof Error?cause.message:'Miniatura non disponibile');});
 return()=>{current=false;if(uri)URL.revokeObjectURL(uri);};},[active,id,version,previewKey,record]);
 return <span ref={ref} className={large?'archive-large-image':'archive-thumbnail'}>{url?<img src={url} alt={`${large?'Anteprima':'Miniatura'} ${title}`}/>:<span className="caption">{error||(!active?'Anteprima':'Preparazione…')}</span>}</span>;
}
