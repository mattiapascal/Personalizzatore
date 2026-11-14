import { useEffect,useId,useRef,useState } from 'react';
import { profileKey,type ProductProfile } from '../catalog/schema';
import { fitComposition,type TemplateFit } from '../editor/format-adaptation';
import { measureFabric } from '../editor/fabric-adapter';
import type { GraphicDocument } from '../editor/model';
import type { WorkflowEditorApi } from './ConfigurationPanel';
import { DocumentPreview } from './DocumentPreview';
import { preserveDraftSnapshot } from './drafts';
import { INK_PREVIEWS,type InkColor } from '../editor/ink';
import { withVerifiedFontGeometry } from '../editor/verified-font-geometry';
export function ProductPanel({api,products,catalogVersion,onConfirm,onInk}:{api:WorkflowEditorApi;products:readonly ProductProfile[];catalogVersion:string;onConfirm:(key:string,source:GraphicDocument)=>boolean;onInk:(color:InkColor)=>void}){
 const[visible,setVisible]=useState(false),[source,setSource]=useState<GraphicDocument|null>(null),[chosen,setChosen]=useState(''),[fit,setFit]=useState<TemplateFit|null>(null),[error,setError]=useState(''),[working,setWorking]=useState(false),modal=useRef<HTMLDialogElement>(null),heading=useId();
 const [checking,setChecking]=useState(false),generation=useRef(0);
 useEffect(()=>()=>{generation.current++;},[]);
 const close=()=>{generation.current++;setChecking(false);setFit(null);setVisible(false);};
 const current=products.find(product=>product.productId===api.document.productId&&product.variantIds.includes(api.document.variantId??''));
 useEffect(()=>{const node=modal.current;if(!node)return;if(visible&&!node.open)node.showModal();else if(!visible&&node.open)node.close();},[visible]);
 const choose=async(key:string,doc=source)=>{const request=++generation.current;setChosen(key);setFit(null);setError('');setChecking(false);if(!doc)return;const product=products.find(item=>profileKey(item)===key);if(!product)return;setChecking(true);try{const result=await withVerifiedFontGeometry(doc,snapshot=>fitComposition(snapshot,product,catalogVersion,measureFabric,true));if(request===generation.current)setFit(result);}catch(cause){if(request===generation.current)setError(cause instanceof Error?cause.message:'Adattamento non disponibile');}finally{if(request===generation.current)setChecking(false);}};
 const open=()=>{generation.current++;setChosen('');setFit(null);setError('');setChecking(false);const doc=api.prepare();if(!doc)return;setSource(doc);if(current)void choose(profileKey(current),doc);setVisible(true);};
 const confirm=async()=>{if(!source||!fit||working)return;setWorking(true);setError('');try{
  if(!api.validate(source))throw new Error('La grafica è cambiata: chiudi e controlla nuovamente il cambio modello.');
  await preserveDraftSnapshot(source);
  if(!onConfirm(chosen,source))throw new Error('Cambio non applicato: il progetto precedente è conservato.');setVisible(false);
 }catch(cause){setError(cause instanceof Error?cause.message:'Cambio modello non riuscito');}finally{setWorking(false);}};
 return <section className="product-panel" aria-label="Modello del progetto"><strong>Modello</strong><p>{current?.title??'Formato del progetto'}</p><button type="button" disabled={api.busy||working} onPointerDown={event=>{if(event.isPrimary&&event.button===0)event.preventDefault();}} onClick={open}>Cambia modello</button><label>Colore impronta (prova)<select aria-label="Colore impronta (prova)" disabled={api.busy||working||current?.mechanism==='emboss'} value={api.document.inkColor??'black'} onChange={event=>onInk(event.target.value as InkColor)}>{Object.entries(INK_PREVIEWS).map(([key,ink])=><option key={key} value={key}>{ink.label}</option>)}</select></label><p className="caption">Colori dimostrativi; tamponi e prezzi reali non collegati.</p>
  <dialog ref={modal} className="configuration-dialog" aria-labelledby={heading} onCancel={event=>{event.preventDefault();if(!working)close();}}><div className="configuration-dialog-heading"><div><p className="configuration-kicker">Cambio locale · prezzi e opzioni commerciali non collegati</p><h2 id={heading}>Cambia modello e controlla la grafica</h2></div><button type="button" disabled={working} aria-label="Chiudi cambio modello" onClick={close}>×</button></div>
   <p>La composizione originale resterà recuperabile nelle bozze di questo browser. Il cambio si applica solo dopo la conferma ed è annullabile.</p><label>Nuovo modello<select aria-label="Nuovo modello" value={chosen} disabled={working} onChange={event=>void choose(event.target.value)}>{products.map(product=><option key={profileKey(product)} value={profileKey(product)}>{product.title}</option>)}</select></label>
   {checking&&<p role="status">Verifica dei font prima dell’adattamento…</p>}
   {error&&<p role="alert" className="error">{error}</p>}
   {source&&<div className="configuration-review has-previous"><div><h3>Modello attuale</h3><DocumentPreview document={source} label="Grafica prima del cambio modello"/><p>{source.areaMm.width} × {source.areaMm.height} mm</p></div>{fit&&<div><h3>Dopo la conferma</h3><DocumentPreview document={fit.document} label="Grafica dopo il cambio modello"/><p>{fit.document.areaMm.width} × {fit.document.areaMm.height} mm</p></div>}</div>}
   {fit&&<p>{fit.scale===1?'Misure fisiche e caratteri conservati; composizione centrata nel nuovo formato.':`Riduzione proporzionale proposta: ${(fit.scale*100).toFixed(1)}%. I caratteri rispettano il minimo TEST di 7 pt.`}</p>}
   <p className="caption">Profili TEST, margine di prova 1 mm. Nessun prezzo, disponibilità o idoneità produttiva certificati.</p><div className="configuration-dialog-actions"><button type="button" disabled={working} onClick={close}>Mantieni il modello attuale</button><button type="button" disabled={working||checking||!fit||chosen===(current?profileKey(current):'')} onClick={()=>void confirm()}>Conferma cambio modello</button></div>
  </dialog>
 </section>;
}
