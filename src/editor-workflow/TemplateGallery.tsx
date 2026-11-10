import {editorMode} from '../editor/design-session';
import { useEffect, useState } from 'react';
import { fixtureCatalog } from '../catalog/adapter';
import { profileKey, type ProductProfile } from '../catalog/schema';
import { readAdminSnapshot, readArchiveRecord } from '../editor-admin/api';
import type { AdminSnapshot, ArchiveRecord } from '../editor-admin/schema';
import { loadFontAssets } from '../editor/fonts';
import { measureFabric, prepareRasterSource } from '../editor/fabric-adapter';
import { fitTemplate, smallestTemplateMount, type TemplateFit } from './template-fit';
import '../editor-admin/admin.css';
import { DocumentPreview } from './DocumentPreview';

export default function TemplateGallery(){
 const[state,setState]=useState<AdminSnapshot|null>(null),[record,setRecord]=useState<ArchiveRecord|null>(null),[fit,setFit]=useState<TemplateFit|null>(null),[product,setProduct]=useState<ProductProfile|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const mode=editorMode();
 const requested=new URLSearchParams(location.search).get('model');
 useEffect(()=>{void readAdminSnapshot().then(setState).catch(cause=>setError(cause.message));},[]);
 const choose=async(id:string)=>{setBusy(true);setError('');setRecord(null);setFit(null);setProduct(null);try{
  const source=await readArchiveRecord(id);if(source.document.plaque&&source.kind==='template'&&!source.archived){location.assign(`/editor/plaque?workspace=1&mode=${mode}&template=${source.id}&templateVersion=${source.version}`);return;}if(source.kind!=='template'||source.archived||!source.templateProducts)throw new Error('Questo template non ha modelli attivi associati');
  await Promise.all([loadFontAssets(source.document.fontAssets),...source.document.objects.filter(o=>o.type==='image').map(o=>prepareRasterSource(o.source))]);
  if(requested){const target=fixtureCatalog.list().find(item=>profileKey(item)===requested);if(!target||!source.templateProducts.profileKeys.includes(requested))throw new Error('Template non associato al modello richiesto');setProduct(target);setFit(fitTemplate(source.document,target,fixtureCatalog.version,measureFabric,true));}
  else{const result=smallestTemplateMount(source.document,fixtureCatalog.list(),source.templateProducts.profileKeys,fixtureCatalog.version,measureFabric);setProduct(result.product);setFit(result.fit);}
  setRecord(source);
 }catch(cause){setError(cause instanceof Error?cause.message:'Template non disponibile');}finally{setBusy(false);}};
 const changeModel=(key:string)=>{if(!record)return;setError('');setFit(null);const target=fixtureCatalog.get(key);setProduct(target);try{setFit(fitTemplate(record.document,target,fixtureCatalog.version,measureFabric,true));}catch(cause){setError(cause instanceof Error?cause.message:'Adattamento non disponibile');}};
 return <div className="editor-admin" data-editor-mode={mode}><header><div><strong>Scegli un template</strong><span>Prova locale · profili grafici TEST</span></div><a href={`/editor?workspace=1&mode=${mode}`}>Torna all’editor</a>{mode!=='customer'&&<a href="/editor/admin">Gestisci template</a>}</header><main className="template-gallery"><h1>Da un template al modello adatto</h1><p>Scegli una composizione. Per una targa potrai impostare le misure e vedere l’anteprima. Per un timbro verrà proposto il modello associato più piccolo che contiene la grafica; potrai cambiarlo prima di aprire l’editor.</p><p className="admin-notice">Compatibilità geometrica TEST, con margine di prova di 1 mm. Prezzi, disponibilità, tamponi e profili produttivi reali non sono collegati.</p>{error&&<p role="alert" className="error">{error}</p>}
 <div className="template-gallery-layout"><section className="admin-card" aria-label="Template disponibili"><h2>Template</h2>{!state?<p>Caricamento archivio…</p>:!state.records.some(item=>item.kind==='template'&&!item.archived)?<p>Nessun template. Importa o salva una composizione nel backend e associa i modelli ammessi.</p>:state.records.filter(item=>item.kind==='template'&&!item.archived).map(item=><button className="admin-record" key={item.id} disabled={busy||item.graphicFamily!=='plaque'&&(!item.templateProducts||!!requested&&!item.templateProducts.profileKeys.includes(requested))} aria-pressed={record?.id===item.id} onClick={()=>void choose(item.id)}><strong>{item.title}</strong><span>{item.graphicFamily==='plaque'?`Targa a misura · un template per più formati · v${item.version}`:item.templateProducts?`${item.templateProducts.profileKeys.length} modelli associati · v${item.version}`:'Associa i modelli dal backend per utilizzarlo'}</span></button>)}</section>
 {record&&product&&<section className="admin-card"><h2>{record.title}</h2><label>Modello del template<select aria-label="Modello del template" value={profileKey(product)} onChange={event=>changeModel(event.target.value)}>{fixtureCatalog.list().filter(item=>record.templateProducts!.profileKeys.includes(profileKey(item))).map(item=><option key={profileKey(item)} value={profileKey(item)}>{item.title}</option>)}</select></label><p>{product.nominalAreaMm.width} × {product.nominalAreaMm.height} mm</p>{fit&&<><DocumentPreview document={fit.document} label="Anteprima del template nel modello selezionato"/><p>{fit.scale===1?'Dimensioni della grafica conservate; composizione centrata.':`Proposta: riduzione proporzionale al ${(fit.scale*100).toFixed(1)}%. Controlla l’anteprima prima di confermare.`}</p><p>Il template originale resta invariato. Si aprirà una composizione modificabile con il modello scelto.</p><button disabled={busy} onClick={()=>{const query=new URLSearchParams({mode,workspace:'1',configurations:'1',format:profileKey(product),template:record.id,templateVersion:String(record.version),shrink:fit.scale<1?'1':'0'});location.assign(`/editor?${query}`);}}>Conferma e personalizza il template</button></>}</section>}
 </div></main></div>;
}
