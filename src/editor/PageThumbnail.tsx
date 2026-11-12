import {useEffect,useRef,useState,type RefObject} from 'react';
import type {GraphicDocument} from './model';
import {archivePreviewKey,ARCHIVE_PREVIEW_SIDE} from '../editor-admin/preview-key';
import {readPreviewImage,writePreviewImage} from '../editor-admin/preview-cache';
import {exportReferenceThumbnail} from './reference-thumbnail';
const memory=new Map<string,Blob>();let queue=Promise.resolve();
function queued<T>(job:()=>Promise<T>):Promise<T>{const work=queue.then(job);queue=work.then(()=>{},()=>{});return work;}
function remember(key:string,blob:Blob){memory.delete(key);memory.set(key,blob);let bytes=[...memory.values()].reduce((n,b)=>n+b.size,0);while(memory.size>128||bytes>16*1024*1024){const first=memory.keys().next().value;if(!first)break;bytes-=memory.get(first)!.size;memory.delete(first);}}
interface Preview {identity:string;key?:string;url?:string;error?:string;}
/** Only nearby pages are prepared. An unchanged page keeps its image through
 * navigation, metadata edits and updates to a different page. */
export function PageThumbnail({document:doc,label,root}:{document:GraphicDocument;label:string;root:RefObject<HTMLElement|null>}){
 const anchor=useRef<HTMLSpanElement>(null),identity=doc.documentId+'/'+(doc.pageId??'page-1'),[visible,setVisible]=useState(false),[result,setResult]=useState<Preview|null>(null),[pending,setPending]=useState(false),latest=useRef<Preview|null>(null);
 const current=result?.identity===identity?result:null;
 const publish=(value:Preview|null)=>{const old=latest.current;latest.current=value;setResult(value);if(old?.url&&old.url!==value?.url)URL.revokeObjectURL(old.url);};
 useEffect(()=>{const element=anchor.current;if(!element)return;if(typeof IntersectionObserver==='undefined'){setVisible(true);return;}const observer=new IntersectionObserver(entries=>setVisible(entries.some(entry=>entry.isIntersecting)),{root:root.current,rootMargin:'80px'});observer.observe(element);return()=>observer.disconnect();},[root]);
 useEffect(()=>{if(!visible){publish(null);setPending(false);return;}let active=true;setPending(true);
  void queued(async()=>{if(!active)return;const key=await archivePreviewKey(doc,'technical');if(!active)return;if(latest.current?.identity===identity&&latest.current.key===key&&latest.current.url){setPending(false);return;}
   let blob=memory.get(key)??await readPreviewImage(key);if(!active)return;if(!blob){blob=await exportReferenceThumbnail(doc,ARCHIVE_PREVIEW_SIDE);remember(key,blob);await writePreviewImage(key,blob);}else remember(key,blob);
   if(active){publish({identity,key,url:URL.createObjectURL(blob)});setPending(false);}
  }).catch(cause=>{if(active){publish({identity,error:cause instanceof Error?cause.message:'Anteprima non disponibile'});setPending(false);}});
  return()=>{active=false;};
 },[doc,identity,visible]);
 useEffect(()=>()=>{if(latest.current?.url)URL.revokeObjectURL(latest.current.url);},[]);
 return <span ref={anchor} className="page-thumbnail" aria-busy={pending}>{current?.url?<img src={current.url} alt={label}/>:<span className="caption" title={current?.error}>{current?.error?.startsWith('Correggi i font')?'Font da correggere':current?.error?'Anteprima non disponibile':visible?'Preparazione…':'Anteprima'}</span>}</span>;
}
