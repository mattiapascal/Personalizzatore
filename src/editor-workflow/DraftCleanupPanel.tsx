import './drafts.css';
import {useEffect,useState} from 'react';
import {deleteDrafts,draftMatchesTemplate,draftsOlderThan,listDrafts,subscribeDrafts,type DraftContext,type DraftSummary} from './drafts';
/** Cleanup always asks for a concrete count. Saved archive records are outside this browser store. */
export function DraftCleanupPanel({context,title,disabled=false,onDeleted}:{context?:DraftContext;title?:string;disabled?:boolean;onDeleted?:()=>void}){
 const [items,setItems]=useState<DraftSummary[]>([]),[days,setDays]=useState('30'),[pending,setPending]=useState<DraftSummary[]|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const refresh=()=>listDrafts().then(setItems).catch(cause=>setError(cause instanceof Error?cause.message:'Archivio bozze non disponibile.'));
 useEffect(()=>{void refresh();return subscribeDrafts(()=>{void refresh();});},[]);
 useEffect(()=>{setPending(null);setNotice('');setError('');},[context?.templateId,context?.templateDocumentId]);
 const matching=context?items.filter(item=>draftMatchesTemplate(item,context)):items;
 const prepare=async()=>{setBusy(true);setError('');setNotice('');try{const latest=await listDrafts();setItems(latest);setPending(context?latest.filter(item=>draftMatchesTemplate(item,context)):draftsOlderThan(latest,Number(days)));}catch(cause){setError(cause instanceof Error?cause.message:'Controlla il numero di giorni.');}finally{setBusy(false);}};
 const remove=async()=>{if(!pending?.length)return;setBusy(true);setError('');try{await deleteDrafts(pending);setNotice(`${pending.length} bozze eliminate da questo browser.`);setPending(null);await refresh();onDeleted?.();}catch(cause){setPending(null);setError(cause instanceof Error?cause.message:'Eliminazione non riuscita.');await refresh();}finally{setBusy(false);}};
 return <section className="draft-cleanup" aria-label={context?'Pulizia bozze del template':'Pulizia bozze del browser'}>
  <h3>{context?`Bozze del template${title?` «${title}»`:''}`:'Pulizia bozze di tutti i template'}</h3>
  <p>{matching.length} bozze su questo browser. Template e progetti salvati nell’archivio rimangono conservati.</p>
  {!context&&<label>Elimina bozze più vecchie di (giorni)<input type="number" min="1" max="36500" step="1" required value={days} disabled={busy||disabled} onChange={event=>{setDays(event.target.value);setPending(null);}}/></label>}
  {pending?<><p role="status">{pending.length?`Eliminare ${pending.length} bozze${context?' di questo template':` salvate prima del ${new Date(Date.now()-Number(days)*86400000).toLocaleDateString('it-IT')}`}? L’operazione non si può annullare.`:'Nessuna bozza da eliminare.'}</p><div className="button-row"><button type="button" disabled={busy} onClick={()=>setPending(null)}>Annulla pulizia</button>{pending.length>0&&<button type="button" disabled={busy||disabled} onClick={()=>void remove()}>Conferma eliminazione {pending.length} bozze</button>}</div></>:<button type="button" disabled={busy||disabled||!!context&&!matching.length||!context&&(!Number.isInteger(Number(days))||Number(days)<1||Number(days)>36500)} onClick={()=>void prepare()}>{context?'Elimina tutte le bozze di questo template':'Controlla bozze da eliminare'}</button>}
  {error&&<p role="alert" className="error">{error}</p>}{notice&&<p role="status">{notice}</p>}
 </section>;
}
