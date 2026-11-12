import { z } from 'zod';
import { createDocument,DocumentSchema,SceneObjectSchema,SceneGroupSchema } from './model';
import { FontAssetsSchema } from './font-assets';
import { EDITOR_LIMITS } from './limits';
import { MAX_PROJECT_BYTES } from './project-limits';
import type { GraphicClipboard } from './clipboard';
export const GRAPHIC_CLIPBOARD_DATABASE='incisoria-editor-clipboard-v1';
const changedKey='incisoria-editor-clipboard-changed',eventName='editor-clipboard-changed';
const schema=z.strictObject({objects:z.array(SceneObjectSchema).min(1).max(EDITOR_LIMITS.objects),groups:z.array(SceneGroupSchema).max(EDITOR_LIMITS.groups),fontAssets:FontAssetsSchema.optional()});
export function validatedClipboard(raw:unknown):GraphicClipboard{
 const clipboard=schema.parse(raw);
 DocumentSchema.parse({...createDocument(),colorMode:'color',objects:clipboard.objects,groups:clipboard.groups,fontAssets:clipboard.fontAssets});
 if(new TextEncoder().encode(JSON.stringify(clipboard)).byteLength>MAX_PROJECT_BYTES)throw Error('Gli appunti superano il limite locale di 120 MB. Copia meno oggetti.');
 return clipboard;
}
let opened:Promise<IDBDatabase>|undefined;
function database():Promise<IDBDatabase>{
 return opened??=new Promise<IDBDatabase>((resolve,reject)=>{
  if(typeof indexedDB==='undefined'){reject(Error('Appunti condivisi non disponibili in questo browser.'));return;}
  const request=indexedDB.open(GRAPHIC_CLIPBOARD_DATABASE,1);
  request.onupgradeneeded=()=>{request.result.createObjectStore('content');request.result.createObjectStore('metadata');};
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();opened=undefined;};resolve(db);};
  request.onerror=()=>reject(Error('Impossibile aprire gli appunti locali.'));
  request.onblocked=()=>reject(Error('Chiudi le altre schede del configuratore e riprova la copia.'));
 }).catch(error=>{opened=undefined;throw error;});
}
const failed=(tx:IDBTransaction)=>Error(tx.error?.name==='QuotaExceededError'?'Spazio locale esaurito: gli appunti precedenti sono conservati.':'Operazione sugli appunti non riuscita. Riprova.');
function notify():void{if(typeof window==='undefined')return;window.dispatchEvent(new Event(eventName));try{localStorage.setItem(changedKey,crypto.randomUUID());}catch{/* Content remains in IndexedDB even if notification storage is unavailable. */}}
export async function writeGraphicClipboard(raw:GraphicClipboard):Promise<void>{
 const clipboard=validatedClipboard(raw),db=await database();
 await new Promise<void>((resolve,reject)=>{const tx=db.transaction(['content','metadata'],'readwrite');tx.oncomplete=()=>resolve();tx.onabort=()=>reject(failed(tx));try{tx.objectStore('content').put(clipboard,'current');tx.objectStore('metadata').put(clipboard.objects.length,'count');}catch(error){tx.abort();reject(error);}});notify();
}
export async function readGraphicClipboard():Promise<GraphicClipboard|null>{
 const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('content','readonly'),request=tx.objectStore('content').get('current');tx.oncomplete=()=>{try{resolve(request.result===undefined?null:validatedClipboard(request.result));}catch{reject(Error('Gli appunti sono danneggiati: copia nuovamente gli oggetti dal documento originale.'));}};tx.onabort=()=>reject(failed(tx));});
}
export async function graphicClipboardCount():Promise<number>{const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('metadata','readonly'),request=tx.objectStore('metadata').get('count');tx.oncomplete=()=>resolve(Number.isInteger(request.result)&&request.result>0?request.result:0);tx.onabort=()=>reject(failed(tx));});}
export function subscribeGraphicClipboard(changed:()=>void):()=>void{
 const storage=(event:StorageEvent)=>{if(event.key===changedKey)changed();};window.addEventListener(eventName,changed);window.addEventListener('storage',storage);window.addEventListener('focus',changed);
 return()=>{window.removeEventListener(eventName,changed);window.removeEventListener('storage',storage);window.removeEventListener('focus',changed);};
}

export async function clearGraphicClipboard():Promise<void>{const db=await database();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(['content','metadata'],'readwrite');tx.objectStore('content').clear();tx.objectStore('metadata').clear();tx.oncomplete=()=>resolve();tx.onabort=()=>reject(failed(tx));});notify();}
