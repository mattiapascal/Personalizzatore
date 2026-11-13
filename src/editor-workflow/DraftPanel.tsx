import {DraftCleanupPanel} from './DraftCleanupPanel';
import {DraftThumbnail} from './DraftThumbnail';
import { useEffect, useId, useRef, useState,type RefObject } from 'react';
import type { WorkflowEditorApi } from './ConfigurationPanel';
import { deleteDraft, draftBinding, listDrafts, readDraft, writeDraft, subscribeDrafts,type DraftContext, type DraftSummary } from './drafts';

export interface DraftControl{discard:()=>Promise<void>;}
type Active = {id:string;version:number;documentId:string;binding:string};
const signature=(id:string,doc:WorkflowEditorApi['document'])=>`${id}:${doc.documentId}:${doc.revision}`;
export function DraftPanel({api,leaving,emergency=false,dirty=true,control,templateContext={}}:{api:WorkflowEditorApi;leaving?:RefObject<boolean>;emergency?:boolean;dirty?:boolean;control?:RefObject<DraftControl|null>;templateContext?:DraftContext}) {
  const [active,setActive]=useState<Active|null>(null),[recovery,setRecovery]=useState<DraftSummary|null>(null),[drafts,setDrafts]=useState<DraftSummary[]>([]);
  const [phase,setPhase]=useState<'loading'|'offer'|'ready'|'blocked'>('loading'),[status,setStatus]=useState(''),[error,setError]=useState(''),[working,setWorking]=useState(false),[retry,setRetry]=useState(0);
  const [visible,setVisible]=useState(false),[removing,setRemoving]=useState<DraftSummary|null>(null),modal=useRef<HTMLDialogElement>(null),heading=useId();
  const binding=draftBinding({...api.document,templateId:templateContext.templateId}),savedKey=useRef(''),saving=useRef(false),generation=useRef(0),initialRevision=useRef(api.document.revision);
  const pendingSave=useRef<Promise<DraftSummary>|null>(null),writingId=useRef<string|null>(null);
  const previousBinding=useRef<string|null>(null);
  const live=useRef({api,active,phase,binding,dirty});live.current={api,active,phase,binding,dirty};
  const startNew=()=>{const doc=live.current.api.peek();savedKey.current='';setRecovery(null);setError('');setActive({id:crypto.randomUUID(),version:0,documentId:doc.documentId,binding:live.current.binding});setPhase('ready');setStatus('Le nuove modifiche saranno salvate in una nuova bozza, nel limite impostato.');};
  useEffect(()=>{
    const switched=previousBinding.current!==null&&previousBinding.current!==binding;previousBinding.current=binding;
    const epoch=++generation.current;setPhase('loading');setActive(null);setRecovery(null);setError('');savedKey.current='';initialRevision.current=api.document.revision;
    void listDrafts().then(items=>{
      if(generation.current!==epoch)return;setDrafts(items);
      const explicit=new URLSearchParams(location.search),previous=items.find(item=>draftBinding(item)===binding);
      if(previous&&!switched&&!explicit.has('archive')&&!explicit.has('configuration')&&!explicit.has('template')){setRecovery(previous);setPhase('offer');}
      else {const doc=live.current.api.peek();setActive({id:crypto.randomUUID(),version:0,documentId:doc.documentId,binding});setPhase('ready');setStatus('Le modifiche concluse saranno salvate su questo browser.');}
    }).catch(cause=>{if(generation.current===epoch){setPhase('blocked');setError(cause instanceof Error?cause.message:'Archivio locale non disponibile');}});
    return()=>{generation.current++;};
  },[binding]);
  const persist=async()=>{
    const current=live.current;if(emergency&&!current.dirty)return true;if(leaving?.current||saving.current||current.phase!=='ready'||!current.active||current.api.busy||current.active.binding!==current.binding)return;
    const doc=current.api.peek();if(!doc.revision&&!current.active.version)return true;
    const fork=doc.documentId!==current.active.documentId,id=fork?crypto.randomUUID():current.active.id,key=signature(id,doc);
    if(savedKey.current===key)return true;
    const epoch=generation.current;saving.current=true;setWorking(true);setStatus('Salvataggio della bozza…');
    try {
      writingId.current=id;pendingSave.current=writeDraft(doc,id,fork?0:current.active.version,templateContext);const summary=await pendingSave.current;
      if(generation.current!==epoch)return;
      savedKey.current=key;setActive({id,version:summary.version,documentId:doc.documentId,binding:current.binding});setError('');setStatus(`Bozza salvata su questo browser · ${new Date(summary.savedAt).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}`);
      return true;
    }catch(cause){if(generation.current===epoch){setPhase('blocked');setError(cause instanceof Error?cause.message:'Salvataggio non riuscito: scarica il progetto JSON.');}return false;}
    finally{saving.current=false;pendingSave.current=null;writingId.current=null;setWorking(false);}
  };
  const persistRef=useRef(persist);persistRef.current=persist;
  useEffect(()=>{
    if(phase==='offer'&&api.document.revision>initialRevision.current&&!api.busy){startNew();return;}
    if(phase!=='ready'||api.busy||active?.binding!==binding||leaving?.current||emergency&&!dirty)return;
    const timer=setTimeout(()=>void persistRef.current(),700);return()=>clearTimeout(timer);
  },[api.document,api.busy,active,phase,binding,retry,dirty,emergency]);
  useEffect(()=>{
    const hidden=()=>{if(!leaving?.current&&document.visibilityState==='hidden')void persistRef.current();};
    const warnLeaving=(event:BeforeUnloadEvent)=>{const current=live.current;if(leaving?.current||emergency)return;if(current.phase==='loading')return;const doc=current.api.peek(),pending=current.api.busy||doc.revision>0&&(!current.active||savedKey.current!==signature(current.active.id,doc));if(pending){void persistRef.current();event.preventDefault();event.returnValue='';}};
    document.addEventListener('visibilitychange',hidden);window.addEventListener('beforeunload',warnLeaving);window.addEventListener('pagehide',hidden);
    return()=>{document.removeEventListener('visibilitychange',hidden);window.removeEventListener('beforeunload',warnLeaving);window.removeEventListener('pagehide',hidden);};
  },[]);
  useEffect(()=>{const node=modal.current;if(!node)return;if(visible&&!node.open)node.showModal();else if(!visible&&node.open)node.close();},[visible]);
  const discard=async()=>{
    const ids=new Set([live.current.active?.id,writingId.current].filter((id):id is string=>!!id));
    ++generation.current;live.current.phase='blocked';setPhase('blocked');
    if(pendingSave.current)await pendingSave.current.catch(()=>{});
    if(ids.size){const items=await listDrafts();for(const item of items.filter(item=>ids.has(item.id)))await deleteDraft(item.id,item.version);}
    savedKey.current='';setRecovery(null);const doc=live.current.api.peek();setActive({id:crypto.randomUUID(),version:0,documentId:doc.documentId,binding:live.current.binding});setPhase('ready');setError('');setStatus('Nessuna modifica da recuperare.');
  };
  const discardRef=useRef(discard);discardRef.current=discard;
  useEffect(()=>{if(control)control.current={discard:()=>discardRef.current()};return()=>{if(control)control.current=null;};},[control]);
  const run=async(operation:()=>Promise<void>)=>{if(working||saving.current)return;setWorking(true);setError('');try{await operation();}catch(cause){setError(cause instanceof Error?cause.message:'Operazione non riuscita');}finally{setWorking(false);}};
  const recover=async(summary:DraftSummary)=>{
    if(live.current.phase==='ready'&&!await persistRef.current())throw new Error('Prima di cambiare bozza conserva le modifiche attuali: scarica il JSON oppure risolvi il salvataggio.');
    const before=api.peek(),draft=await readDraft(summary.id);

    const current=api.peek();if(current.documentId!==before.documentId||current.revision!==before.revision)throw new Error('La grafica è cambiata durante il caricamento. Ripeti il recupero.');
    if(!await api.open(draft.document))throw new Error('Bozza non aperta. Controlla il formato e la versione del catalogo; il file salvato è conservato.');
    savedKey.current='';setActive({id:summary.id,version:draft.summary.version,documentId:draft.document.documentId,binding});setRecovery(null);setPhase('ready');setVisible(false);setStatus('Bozza recuperata. Le prossime modifiche saranno salvate su questo browser.');
  };
  // A cleanup in another tab must not resurrect an unchanged draft or block the next edit.
  useEffect(()=>subscribeDrafts(()=>{void listDrafts().then(items=>{
    setDrafts(items);const current=live.current;
    if(current.active?.version&&!items.some(item=>item.id===current.active!.id)&&!saving.current){
      const doc=current.api.peek(),id=crypto.randomUUID();savedKey.current=signature(id,doc);
      setActive({id,version:0,documentId:doc.documentId,binding:current.binding});setPhase('ready');setRecovery(null);
      setStatus('Bozze eliminate. Le prossime modifiche saranno salvate in una nuova bozza.');
    }
  }).catch(()=>{});}),[]);
  const openList=()=>void run(async()=>{await persistRef.current();setDrafts(await listDrafts());setRemoving(null);setVisible(true);});
  return <section className="draft-panel" aria-label="Bozze su questo browser">{emergency&&<p className="caption">Recupero d’emergenza del browser. Il progetto viene salvato soltanto con Conferma design.</p>}
    {recovery&&phase==='offer'?<><strong>Hai una bozza da recuperare</strong><p>{recovery.title} · {new Date(recovery.savedAt).toLocaleString('it-IT')}</p><button type="button" disabled={working||api.busy} onClick={()=>void run(()=>recover(recovery))}>Riprendi la bozza</button><button type="button" disabled={working||api.busy} onClick={startNew}>Continua con una nuova bozza</button></>:<p className="caption">{phase==='loading'?'Controllo bozze salvate…':emergency?(dirty?'Copia di recupero automatica; modifiche ancora da confermare.':'Nessuna modifica da confermare.'):status}</p>}
    {!visible&&error&&<p role="alert" className="error">{error}</p>}
    {phase==='blocked'&&<div><button type="button" disabled={working} onClick={()=>{if(!active)startNew();else setPhase('ready');setRetry(value=>value+1);}}>Riprova salvataggio</button><button type="button" disabled={working||api.busy} onClick={startNew}>Salva come nuova bozza</button></div>}
    <button type="button" className="draft-list-button" disabled={working||api.busy} onClick={openList}>Bozze salvate su questo browser</button>
    <dialog ref={modal} className="configuration-dialog draft-dialog" aria-labelledby={heading} onCancel={event=>{event.preventDefault();if(!working)setVisible(false);}}>
      <div className="configuration-dialog-heading"><div><p className="configuration-kicker">Archivio di questo browser · nessun account online</p><h2 id={heading}>{removing?'Eliminare questa bozza?':'Bozze salvate'}</h2></div><button type="button" aria-label="Chiudi elenco bozze" disabled={working} onClick={()=>setVisible(false)}>×</button></div>
      {error&&<p role="alert" className="error">{error}</p>}
      {removing?<><p>Eliminerai soltanto «{removing.title}» da questo browser. Le configurazioni confermate nel carrello di prova restano indipendenti.</p><div className="configuration-dialog-actions"><button type="button" disabled={working} onClick={()=>setRemoving(null)}>Mantieni bozza</button><button type="button" disabled={working} onClick={()=>void run(async()=>{await deleteDraft(removing.id,removing.version);setDrafts(await listDrafts());setRemoving(null);})}>Conferma eliminazione bozza</button></div></>:<>
      {templateContext.templateId&&<DraftCleanupPanel context={templateContext} disabled={working||api.busy}/>}
      <p>Riprendi un lavoro oppure scaricane il JSON. Le bozze restano su questo browser e possono essere perse cancellando i dati del browser.</p>
      {!drafts.length&&<p>Nessuna bozza salvata.</p>}
      <div className="draft-list">{drafts.map(item=><article key={item.id} data-testid="local-draft"><DraftThumbnail summary={item}/><h3>{item.title}</h3><p>{item.widthMm} × {item.heightMm} mm · {new Date(item.savedAt).toLocaleString('it-IT')}{active?.id===item.id?' · Bozza aperta':''}</p><div className="button-row"><button type="button" disabled={working||api.busy} onClick={()=>void run(()=>recover(item))}>Riprendi questa bozza</button><button type="button" disabled={working} onClick={()=>void run(async()=>{const draft=await readDraft(item.id),url=URL.createObjectURL(new Blob([JSON.stringify(draft.document,null,2)],{type:'application/json'})),anchor=document.createElement('a');anchor.href=url;anchor.download='bozza.TEST.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);})}>Scarica JSON</button><button type="button" disabled={working||item.id===active?.id} onClick={()=>setRemoving(item)}>Elimina bozza</button></div>{draftBinding(item)!==binding&&<p className="caption">Il formato della bozza sarà recuperato dal documento.</p>}</article>)}</div>
      <div className="configuration-dialog-actions"><button type="button" disabled={working} onClick={()=>setVisible(false)}>Torna all’editor</button></div></>}
    </dialog>
  </section>;
}
