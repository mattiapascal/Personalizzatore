import { z } from 'zod';
import { parseGraphicDocument, type GraphicDocument } from '../editor/model';

export const DRAFT_DATABASE = 'incisoria-editor-drafts-v1';
export const DraftSummarySchema = z.strictObject({
  id: z.string().uuid(), version: z.number().int().positive(), savedAt: z.string().datetime(),
  title: z.string().max(120), productId: z.string().nullable(), variantId: z.string().nullable(),
  catalogVersion: z.string().nullable(), widthMm: z.number().positive(), heightMm: z.number().positive(),
  documentId: z.string().uuid(), documentRevision: z.number().int().nonnegative(), bytes: z.number().int().nonnegative(),
});
export type DraftSummary = z.infer<typeof DraftSummarySchema>;
export interface LocalDraft { summary: DraftSummary; document: GraphicDocument; }
export const draftBinding = (doc: Pick<GraphicDocument,'productId'|'variantId'>) => JSON.stringify([doc.productId,doc.variantId]);

export function prepareDraft(document: GraphicDocument, id: string, expectedVersion: number, summaries: readonly DraftSummary[]): LocalDraft {
  const parsed = parseGraphicDocument(document), previous = summaries.find(item=>item.id===id);
  if ((previous?.version ?? 0) !== expectedVersion) throw new Error('Questa bozza è cambiata in un’altra scheda. Salva una nuova copia per conservare le tue modifiche.');
  if (!previous && summaries.length >= 20) throw new Error('Hai già 20 bozze su questo browser. Esporta o elimina una bozza prima di salvarne un’altra.');
  const bytes = new TextEncoder().encode(JSON.stringify(parsed)).byteLength;
  if (bytes > 10 * 1024 * 1024 || summaries.reduce((sum,item)=>sum+(item.id===id?0:item.bytes),0)+bytes > 64*1024*1024) throw new Error('Spazio delle bozze locali esaurito. Esporta o elimina una bozza; puoi sempre scaricare il progetto JSON.');
  return { document: parsed, summary: DraftSummarySchema.parse({id,version:expectedVersion+1,savedAt:new Date().toISOString(),title:parsed.objects.filter(o=>o.type==='text').map(o=>o.text.replace(/\s+/g,' ')).join(' · ').slice(0,120)||'Composizione grafica',productId:parsed.productId,variantId:parsed.variantId,catalogVersion:parsed.catalogVersion,widthMm:parsed.areaMm.width,heightMm:parsed.areaMm.height,documentId:parsed.documentId,documentRevision:parsed.revision,bytes}) };
}

let opened: Promise<IDBDatabase> | undefined;
function database(): Promise<IDBDatabase> {
  if (!opened) opened = new Promise<IDBDatabase>((resolve,reject)=>{
    if (typeof indexedDB === 'undefined') { reject(new Error('Il browser non consente il salvataggio locale. Scarica il progetto JSON.')); return; }
    const request=indexedDB.open(DRAFT_DATABASE,1);
    request.onupgradeneeded=()=>{request.result.createObjectStore('summaries',{keyPath:'id'});request.result.createObjectStore('documents',{keyPath:'id'});};
    request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();opened=undefined;};resolve(db);};
    request.onerror=()=>reject(new Error('Archivio bozze non disponibile. Scarica il progetto JSON.'));
    request.onblocked=()=>reject(new Error('Chiudi le altre schede dell’editor e riprova il salvataggio.'));
  }).catch(error=>{opened=undefined;throw error;});
  return opened;
}
function transactionError(transaction:IDBTransaction):Error {return new Error(transaction.error?.name==='QuotaExceededError'?'Spazio del browser esaurito. Scarica il progetto JSON.':'Salvataggio locale non riuscito. Scarica il progetto JSON e riprova.');}
export async function listDrafts(): Promise<DraftSummary[]> {
  const db=await database();return new Promise((resolve,reject)=>{
    const transaction=db.transaction('summaries','readonly'),request=transaction.objectStore('summaries').getAll();
    transaction.oncomplete=()=>{try{resolve(z.array(DraftSummarySchema).parse(request.result).sort((a,b)=>b.savedAt.localeCompare(a.savedAt)));}catch{reject(new Error('Indice bozze non valido: i progetti originali non sono stati modificati.'));}};
    transaction.onabort=()=>reject(transactionError(transaction));
  });
}
export async function readDraft(id:string):Promise<LocalDraft> {
  const db=await database();return new Promise((resolve,reject)=>{
    const transaction=db.transaction(['summaries','documents'],'readonly'),summary=transaction.objectStore('summaries').get(id),payload=transaction.objectStore('documents').get(id);
    transaction.oncomplete=()=>{try{const metadata=DraftSummarySchema.parse(summary.result),document=parseGraphicDocument(payload.result?.document);if(document.documentId!==metadata.documentId||document.revision!==metadata.documentRevision)throw new Error();resolve({summary:metadata,document});}catch{reject(new Error('La bozza non è disponibile o è danneggiata. Le altre bozze restano conservate.'));}};
    transaction.onabort=()=>reject(transactionError(transaction));
  });
}
export async function writeDraft(document:GraphicDocument,id:string,expectedVersion:number):Promise<DraftSummary> {
  const db=await database();return new Promise((resolve,reject)=>{
    const transaction=db.transaction(['summaries','documents'],'readwrite'),store=transaction.objectStore('summaries'),request=store.getAll();let saved:LocalDraft|undefined,error:unknown;
    request.onsuccess=()=>{try{saved=prepareDraft(document,id,expectedVersion,z.array(DraftSummarySchema).parse(request.result));store.put(saved.summary);transaction.objectStore('documents').put({id,document:saved.document});}catch(cause){error=cause;transaction.abort();}};
    transaction.oncomplete=()=>resolve(saved!.summary);transaction.onabort=()=>reject(error??transactionError(transaction));
  });
}
export async function deleteDraft(id:string,expectedVersion:number):Promise<void> {
  const db=await database();return new Promise((resolve,reject)=>{
    const transaction=db.transaction(['summaries','documents'],'readwrite'),store=transaction.objectStore('summaries'),request=store.get(id);let error:unknown;
    request.onsuccess=()=>{try{const summary=DraftSummarySchema.parse(request.result);if(summary.version!==expectedVersion)throw new Error('La bozza è cambiata in un’altra scheda: aggiorna l’elenco prima di eliminarla.');store.delete(id);transaction.objectStore('documents').delete(id);}catch(cause){error=cause;transaction.abort();}};
    transaction.oncomplete=()=>resolve();transaction.onabort=()=>reject(error??transactionError(transaction));
  });
}
/** Preserve the exact current composition before an explicit replacement/format transfer. */
export async function preserveDraftSnapshot(document:GraphicDocument):Promise<void>{
  if(!document.revision)return;
  const summaries=await listDrafts();
  if(summaries.some(item=>item.documentId===document.documentId&&item.documentRevision===document.revision&&draftBinding(item)===draftBinding(document)))return;
  await writeDraft(document,crypto.randomUUID(),0);
}
