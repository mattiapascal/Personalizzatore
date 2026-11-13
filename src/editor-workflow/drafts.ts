import { MAX_PROJECT_BYTES } from '../editor/project-limits';
import { z } from 'zod';
import { parseGraphicDocument, type GraphicDocument } from '../editor/model';

export const DEFAULT_MAX_DRAFTS = 20;
export const MAX_DRAFTS = 100;
let configuredLimit = DEFAULT_MAX_DRAFTS;
export function configureDraftLimit(value: number = DEFAULT_MAX_DRAFTS) { configuredLimit = z.number().int().min(1).max(MAX_DRAFTS).parse(value); }
export interface DraftContext { templateId?: string; templateDocumentId?: string; }
export const DRAFTS_CHANGED = 'editor-local-drafts-changed';
function changed() { window.dispatchEvent(new Event(DRAFTS_CHANGED)); if(typeof BroadcastChannel!=='undefined'){const channel = new BroadcastChannel(DRAFTS_CHANGED); channel.postMessage('changed'); channel.close();} }
export function subscribeDrafts(listener: () => void): () => void { const channel = typeof BroadcastChannel!=='undefined'?new BroadcastChannel(DRAFTS_CHANGED):null; if(channel)channel.onmessage = listener; window.addEventListener(DRAFTS_CHANGED, listener); return () => { channel?.close(); window.removeEventListener(DRAFTS_CHANGED, listener); }; }
export const DRAFT_DATABASE = 'incisoria-editor-drafts-v1';
export const DraftSummarySchema = z.strictObject({
  templateId: z.string().uuid().nullable().optional(),
  id: z.string().uuid(), version: z.number().int().positive(), savedAt: z.string().datetime(),
  title: z.string().max(120), productId: z.string().nullable(), variantId: z.string().nullable(),
  catalogVersion: z.string().nullable(), widthMm: z.number().positive(), heightMm: z.number().positive(),
  documentId: z.string().uuid(), documentRevision: z.number().int().nonnegative(), bytes: z.number().int().nonnegative(),
});
export type DraftSummary = z.infer<typeof DraftSummarySchema>;
export interface LocalDraft { summary: DraftSummary; document: GraphicDocument; }
export const draftBinding = (doc: Pick<GraphicDocument,'productId'|'variantId'> & {templateId?:string|null;templateOrigin?:GraphicDocument['templateOrigin']}) => JSON.stringify([doc.productId,doc.variantId,doc.templateId??doc.templateOrigin?.id??null]);

export function draftMatchesTemplate(item: DraftSummary, context: DraftContext): boolean {
  return !!context.templateId && (item.templateId === context.templateId || !item.templateId && item.documentId === context.templateDocumentId);
}
export function draftRotationTargets(document: GraphicDocument, id: string, summaries: readonly DraftSummary[], context: DraftContext = {}, limit = configuredLimit): DraftSummary[] {
  z.number().int().min(1).max(MAX_DRAFTS).parse(limit);
  if(summaries.some(item=>item.id===id))return [];
  const templateId = context.templateId ?? document.templateOrigin?.id;
  const siblings = summaries.filter(item => item.id !== id && (templateId ? draftMatchesTemplate(item, {...context, templateId}) : !item.templateId && item.documentId === document.documentId));
  return [...siblings].sort((a,b) => a.savedAt.localeCompare(b.savedAt) || a.id.localeCompare(b.id)).slice(0, Math.max(0, siblings.length + 1 - limit));
}
export function prepareDraft(document: GraphicDocument, id: string, expectedVersion: number, summaries: readonly DraftSummary[], context: DraftContext = {}, limit = configuredLimit): LocalDraft {
  const parsed = parseGraphicDocument(document), previous = summaries.find(item=>item.id===id);
  if ((previous?.version ?? 0) !== expectedVersion) throw new Error('Questa bozza è cambiata in un’altra scheda. Salva una nuova copia per conservare le tue modifiche.');
  const removed = new Set(draftRotationTargets(parsed,id,summaries,context,limit).map(item=>item.id));
  const bytes = new TextEncoder().encode(JSON.stringify(parsed)).byteLength;
  if (bytes > MAX_PROJECT_BYTES || summaries.reduce((sum,item)=>sum+(item.id===id||removed.has(item.id)?0:item.bytes),0)+bytes > 256*1024*1024) throw new Error('Spazio delle bozze locali esaurito. Esporta o elimina una bozza; puoi sempre scaricare il progetto JSON.');
  return { document: parsed, summary: DraftSummarySchema.parse({templateId:context.templateId??parsed.templateOrigin?.id??previous?.templateId??null,id,version:expectedVersion+1,savedAt:new Date().toISOString(),title:parsed.objects.filter(o=>o.type==='text').map(o=>o.text.replace(/\s+/g,' ')).join(' · ').slice(0,120)||'Composizione grafica',productId:parsed.productId,variantId:parsed.variantId,catalogVersion:parsed.catalogVersion,widthMm:parsed.areaMm.width,heightMm:parsed.areaMm.height,documentId:parsed.documentId,documentRevision:parsed.revision,bytes}) };
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
const legacyOrigins = new Map<string,{version:number;templateId:string|null}>();
function enrichSummaries(transaction: IDBTransaction, items: DraftSummary[], done: () => void) {
  const legacy=items.filter(item=>item.templateId===undefined);let index=0;
  const next=()=>{
    const item=legacy[index++];if(!item){done();return;}
    const cached=legacyOrigins.get(item.id);if(cached?.version===item.version){item.templateId=cached.templateId;next();return;}
    const payload=transaction.objectStore('documents').get(item.id);
    payload.onsuccess=()=>{
      const document=payload.result?.document,valid=document?.documentId===item.documentId&&document?.revision===item.documentRevision;
      const id=z.string().uuid().safeParse(valid?document?.templateOrigin?.id:undefined);item.templateId=id.success?id.data:null;
      legacyOrigins.set(item.id,{version:item.version,templateId:item.templateId});
      if(legacyOrigins.size>1000)legacyOrigins.delete(legacyOrigins.keys().next().value!);
      next();
    };
  };next();
}
/** Legacy summaries are enriched in memory; their original payloads are never rewritten here. */
export async function listDrafts(): Promise<DraftSummary[]> {
  const db=await database();return new Promise((resolve,reject)=>{
    const transaction=db.transaction(['summaries','documents'],'readonly'),request=transaction.objectStore('summaries').getAll();let items:DraftSummary[]=[],error:unknown;
    request.onsuccess=()=>{try {
      items=z.array(DraftSummarySchema).parse(request.result);
      enrichSummaries(transaction,items,()=>{});
    }catch(cause){error=cause;transaction.abort();}};
    transaction.oncomplete=()=>resolve(items.sort((a,b)=>b.savedAt.localeCompare(a.savedAt)));
    transaction.onabort=()=>reject(error?new Error('Indice bozze non valido: i progetti originali non sono stati modificati.'):transactionError(transaction));
  });
}
export async function readDraft(id:string):Promise<LocalDraft> {
  const db=await database();return new Promise((resolve,reject)=>{
    const transaction=db.transaction(['summaries','documents'],'readonly'),summary=transaction.objectStore('summaries').get(id),payload=transaction.objectStore('documents').get(id);
    transaction.oncomplete=()=>{try{const metadata=DraftSummarySchema.parse(summary.result),document=parseGraphicDocument(payload.result?.document);if(document.documentId!==metadata.documentId||document.revision!==metadata.documentRevision)throw new Error();resolve({summary:metadata,document});}catch{reject(new Error('La bozza non è disponibile o è danneggiata. Le altre bozze restano conservate.'));}};
    transaction.onabort=()=>reject(transactionError(transaction));
  });
}
export async function writeDraft(document:GraphicDocument,id:string,expectedVersion:number,context:DraftContext={}):Promise<DraftSummary> {
  const db=await database();return new Promise((resolve,reject)=>{
    const transaction=db.transaction(['summaries','documents'],'readwrite'),store=transaction.objectStore('summaries'),request=store.getAll();let saved:LocalDraft|undefined,error:unknown;
    request.onsuccess=()=>{try{
      const summaries=z.array(DraftSummarySchema).parse(request.result);
      enrichSummaries(transaction,summaries,()=>{try {
        saved=prepareDraft(document,id,expectedVersion,summaries,context);
        const removed=draftRotationTargets(saved.document,id,summaries,{...context,templateId:saved.summary.templateId??undefined});
        for(const item of removed){store.delete(item.id);transaction.objectStore('documents').delete(item.id);}
        store.put(saved.summary);transaction.objectStore('documents').put({id,document:saved.document});
      }catch(cause){error=cause;transaction.abort();}});
    }catch(cause){error=cause;transaction.abort();}};
    transaction.oncomplete=()=>{legacyOrigins.delete(id);changed();resolve(saved!.summary);};transaction.onabort=()=>reject(error??transactionError(transaction));
  });
}
export async function deleteDraft(id:string,expectedVersion:number):Promise<void> { return deleteDrafts([{id,version:expectedVersion}]); }
/** The preview is checked again atomically: a changed/newer draft is never silently deleted. */
export async function deleteDrafts(targets:readonly Pick<DraftSummary,'id'|'version'>[]):Promise<void> {
  if(!targets.length)return;
  const db=await database();return new Promise((resolve,reject)=>{
    const transaction=db.transaction(['summaries','documents'],'readwrite'),store=transaction.objectStore('summaries');let error:unknown;
    for(const target of targets){const request=store.get(target.id);request.onsuccess=()=>{try{const item=DraftSummarySchema.safeParse(request.result);if(!item.success||item.data.version!==target.version)throw new Error('Una bozza è cambiata in un’altra scheda: aggiorna l’elenco prima di eliminarla.');store.delete(target.id);transaction.objectStore('documents').delete(target.id);}catch(cause){error=cause;transaction.abort();}};}
    transaction.oncomplete=()=>{for(const item of targets)legacyOrigins.delete(item.id);changed();resolve();};transaction.onabort=()=>reject(error??transactionError(transaction));
  });
}
export function draftsOlderThan(items:readonly DraftSummary[],days:number,now=Date.now()):DraftSummary[]{
  z.number().int().min(1).max(36500).parse(days);
  const cutoff=now-days*86400000;
  return items.filter(item=>Date.parse(item.savedAt)<cutoff);
}
/** Preserve the exact current composition before an explicit replacement/format transfer. */
export async function preserveDraftSnapshot(document:GraphicDocument,context:DraftContext={}):Promise<void>{
  if(!document.revision)return;
  const summaries=await listDrafts();
  if(summaries.some(item=>item.documentId===document.documentId&&item.documentRevision===document.revision&&draftBinding(item)===draftBinding(document)))return;
  await writeDraft(document,crypto.randomUUID(),0,context);
}
