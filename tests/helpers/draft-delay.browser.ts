type Handler=(this:IDBTransaction,event:Event)=>unknown;
let original:PropertyDescriptor|undefined,held:(()=>void)[]=[];
/** Delay acknowledgements, including the read that can deduplicate a snapshot.
 * The actual IndexedDB transactions and records remain real and committed. */
export function holdDraftCompletion(databaseName:string){
 if(original)throw Error('Draft delay already installed');original=Object.getOwnPropertyDescriptor(IDBTransaction.prototype,'oncomplete');if(!original?.set)throw Error('IDB completion descriptor unavailable');const native=original;
 Object.defineProperty(IDBTransaction.prototype,'oncomplete',{...native,set(this:IDBTransaction,handler:Handler|null){native.set!.call(this,handler&&function(this:IDBTransaction,event:Event){if(original&&this.db.name===databaseName)held.push(()=>handler.call(this,event));else handler.call(this,event);});}});
}
export const draftCompletionHeld=()=>held.length>0;
export function releaseDraftCompletion(){if(!original)return;Object.defineProperty(IDBTransaction.prototype,'oncomplete',original);original=undefined;const callbacks=held;held=[];for(const callback of callbacks)callback();}
