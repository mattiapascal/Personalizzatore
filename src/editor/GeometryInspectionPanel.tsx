import {useEffect,useRef,useState} from 'react';
import type {GraphicDocument} from './model';
import {geometryReportCurrent,ProductionGeometryReportSchema,type ProductionGeometryReport,type GeometryStatus} from './production-geometry';
import {EditorIcon} from './EditorButton';
const statusLabel:Record<GeometryStatus,string>={clear:'Nessuna sovrapposizione rilevata',overlap:'Sovrapposizione rilevata',boundary:'Grafica vicina al limite: controlla l’anteprima',unconfigured:'Dati da definire',incomplete:'Controllo incompleto'};

export function GeometryInspectionPanel({document:doc,disabled,onLocate,onResetFocus}:{document:GraphicDocument;disabled:boolean;onLocate?:(report:ProductionGeometryReport,pageId:string,ruleId:string)=>void;onResetFocus?:()=>void}){
 const [report,setReport]=useState<ProductionGeometryReport|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),latest=useRef(doc),active=useRef<AbortController|null>(null);latest.current=doc;
 useEffect(()=>()=>active.current?.abort(),[]);
 const inspect=async()=>{
  const source=structuredClone(latest.current),controller=new AbortController();active.current?.abort();active.current=controller;onResetFocus?.();setBusy(true);setError('');setReport(null);
  try{
   const response=await fetch('/__editor-local/check-geometry',{method:'POST',headers:{'Content-Type':'application/json','X-Editor-Local':'1'},body:JSON.stringify(source),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(45000)])}),data=await response.json();
   if(!response.ok)throw Error(data.error??'Controllo non completato');const result=ProductionGeometryReportSchema.parse(data);
   if(!geometryReportCurrent(result,source)||!geometryReportCurrent(result,latest.current))throw Error('Il design è cambiato: ripeti il controllo.');
   if(active.current===controller)setReport(result);
  }catch(error){if(!controller.signal.aborted&&active.current===controller)setError(error instanceof Error?error.message:'Controllo non completato');}
  finally{if(active.current===controller){active.current=null;setBusy(false);}}
 };
 const current=report&&geometryReportCurrent(report,doc)?report:null;
 return <section aria-label="Controllo visuale di margini e zone" className="production-geometry-check">
  <button type="button" disabled={disabled||busy} onClick={()=>void inspect()}>Controlla margini e zone</button>
  <p className="caption">Controllo visuale a passi di 0,025 mm. Non sostituisce il collaudo produttivo; fissaggi e limiti d’incisione non sono inclusi.</p>
  {busy&&<p role="status">Controllo della grafica in corso…</p>}{error&&<p role="alert">{error}</p>}
  {report&&!current&&!busy&&<p role="status">Design modificato: ripeti il controllo di margini e zone.</p>}
  {current&&<div role="status" aria-label="Esito controllo visuale">
   <p><strong>{statusLabel[current.status]}</strong></p>
   {current.pages.map(page=><details key={page.id} open={current.pages.length===1||page.id===(doc.pageId??'page-1')}>
    <summary>{page.name} · {statusLabel[page.status]}</summary>
    {page.profile&&<p>{page.profile.label} v{page.profile.version}</p>}{page.message&&<p>{page.message}</p>}
    <ul>{page.rules.map(rule=><li key={rule.id}><strong>{rule.label}:</strong> {statusLabel[rule.status]}{rule.witness&&` · circa X ${rule.witness.xMm.toFixed(2)}, Y ${rule.witness.yMm.toFixed(2)} mm`}.{rule.message&&` ${rule.message}`}{rule.witness&&(rule.status==='overlap'||rule.status==='boundary')&&onLocate&&<button type="button" className="geometry-locate" aria-label={`Mostra ${rule.label} sulla pagina ${page.name}`} disabled={disabled||busy} onClick={()=>onLocate(current,page.id,rule.id)}><EditorIcon name="locate"/>Mostra sul canvas</button>}</li>)}</ul>
   </details>)}
  </div>}
 </section>;
}
