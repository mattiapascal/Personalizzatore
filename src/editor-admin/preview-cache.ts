const DATABASE = 'incisoria-archive-previews-v1', STORE = 'images';
const MAX_BYTES = 64 * 1024 * 1024, MAX_IMAGES = 2000;
interface CachedImage { key: string; blob: Blob; touched: number; }
let opened: Promise<IDBDatabase> | undefined;
function database(): Promise<IDBDatabase> {
  if (!opened) opened = new Promise<IDBDatabase>((resolve,reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, {keyPath:'key'});
    request.onsuccess = () => {const db=request.result;db.onversionchange=()=>{db.close();opened=undefined;};resolve(db);};
    request.onerror = () => reject(request.error);request.onblocked = () => reject(new Error('Cache miniature occupata'));
  }).catch(error => {opened=undefined;throw error;});
  return opened;
}
/** Cache failures are recoverable: never prevent opening or editing the source. */
export async function readPreviewImage(key: string): Promise<Blob | undefined> {
  try { const db=await database();return await new Promise<Blob|undefined>((resolve,reject) => {
    const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE),request=store.get(key);let blob:Blob|undefined;
    request.onsuccess=()=>{const row=request.result as CachedImage|undefined;if(row?.blob instanceof Blob&&row.blob.type==='image/png'&&row.blob.size>0){blob=row.blob;store.put({...row,touched:Date.now()});}else if(row)store.delete(key);};
    tx.oncomplete=()=>resolve(blob);tx.onabort=()=>reject(tx.error);tx.onerror=()=>{};
  }); } catch {return undefined;}
}
export async function writePreviewImage(key: string, blob: Blob): Promise<void> {
  if(blob.type!=='image/png'||!blob.size||blob.size>MAX_BYTES)return;
  try {const db=await database();await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE),request=store.getAll();
    request.onsuccess=()=>{const rows=(request.result as CachedImage[]).filter(row=>row.key!==key).sort((a,b)=>a.touched-b.touched);let bytes=rows.reduce((sum,row)=>sum+row.blob.size,blob.size);while(rows.length>=MAX_IMAGES||bytes>MAX_BYTES){const oldest=rows.shift();if(!oldest)break;bytes-=oldest.blob.size;store.delete(oldest.key);}store.put({key,blob,touched:Date.now()} satisfies CachedImage);};
    tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);tx.onerror=()=>{};
  });}catch{/* Quota/private mode: the in-memory image remains usable. */}
}
