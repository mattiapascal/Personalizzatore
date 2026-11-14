type Handler=(this:IDBTransaction,event:Event)=>unknown;
let original:PropertyDescriptor|undefined,held:(()=>void)|undefined;
/** Keep the real IndexedDB transaction and commit; delay only its acknowledgement
 * to expose selection/document changes during a slow clipboard operation. */
export function holdClipboardCompletion(databaseName:string){
 if(original)throw Error('Clipboard delay already installed');original=Object.getOwnPropertyDescriptor(IDBTransaction.prototype,'oncomplete');if(!original?.set)throw Error('IDB completion descriptor unavailable');const native=original;
 Object.defineProperty(IDBTransaction.prototype,'oncomplete',{...native,set(this:IDBTransaction,handler:Handler|null){native.set!.call(this,handler&&function(this:IDBTransaction,event:Event){if(this.db.name===databaseName&&this.mode==='readwrite')held=()=>handler.call(this,event);else handler.call(this,event);});}});
}
export const clipboardCompletionHeld=()=>!!held;
export function releaseClipboardCompletion(){const callback=held;if(!callback||!original)throw Error('Clipboard completion not held');Object.defineProperty(IDBTransaction.prototype,'oncomplete',original);original=undefined;held=undefined;callback();}
/** Abort a real test transaction before it commits; previous content must survive. */
export function abortNextClipboardWrite(databaseName:string){
 const originalTransaction=IDBDatabase.prototype.transaction;
 IDBDatabase.prototype.transaction=function(this:IDBDatabase,...args:Parameters<IDBDatabase['transaction']>){const tx=originalTransaction.apply(this,args);if(this.name===databaseName&&args[1]==='readwrite'){IDBDatabase.prototype.transaction=originalTransaction;queueMicrotask(()=>tx.abort());}return tx;};
}
