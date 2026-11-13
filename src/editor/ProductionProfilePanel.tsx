import {useState} from 'react';
import {GeometryInspectionPanel} from './GeometryInspectionPanel';
import type {ProductionGeometryReport} from './production-geometry';
import type {GraphicDocument,GraphicCatalogContext} from './model';
import {profileKindLabel,type ProductionProfile} from './production-profile';
import {assertProfileForPage,profileForPage} from './production-profile-link';
import {readAdminSnapshot} from '../editor-admin/api';

export function ProductionProfilePanel({document:doc,catalog,admin,disabled,onSet,onLocate,onResetFocus}:{document:GraphicDocument;catalog?:GraphicCatalogContext;admin:boolean;disabled:boolean;onSet:(profile:ProductionProfile|null,revision:number)=>boolean;onLocate?:(report:ProductionGeometryReport,pageId:string,ruleId:string)=>void;onResetFocus?:()=>void}){
 const [profiles,setProfiles]=useState<ProductionProfile[]|null>(null),[id,setId]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const load=async()=>{setBusy(true);setError('');try{setProfiles((await readAdminSnapshot()).productionProfiles??[]);}catch(error){setError(error instanceof Error?error.message:'Elenco profili non disponibile');}finally{setBusy(false);}};
 const current=doc.productionProfile,resolved=current?profileForPage(current,doc):undefined,selected=profiles?.find(profile=>profile.id===id&&!profile.archived);
 let incompatibility='';if(selected)try{assertProfileForPage(selected,doc,catalog,true);}catch(error){incompatibility=error instanceof Error?error.message:'Profilo incompatibile';}
 const apply=async()=>{
  if(!selected)return;const revision=doc.revision;setBusy(true);setError('');
  try{const latest=(await readAdminSnapshot()).productionProfiles?.find(profile=>profile.id===selected.id);if(!latest||latest.archived||latest.version!==selected.version)throw Error('Il profilo è cambiato: aggiorna l’elenco e controlla la nuova versione prima di collegarla.');onSet(selected,revision);}
  catch(error){setError(error instanceof Error?error.message:'Collegamento non riuscito');}finally{setBusy(false);}
 };
 if(!admin&&!current)return null;
 return <details className="font-check-panel production-link-panel" onToggle={event=>{if(event.currentTarget.open&&admin&&profiles===null&&!busy)void load();}}><summary>Profilo tecnico della pagina{current?` · ${current.label}`:''}</summary>
  {current?<><p><strong>{current.label}</strong> · v{current.version} · {profileKindLabel(current.kind)}</p><p>{current.sizeMode==='document'?'Misure della pagina':'Misure fisse'}: {resolved!.usableArea?.widthMm} × {resolved!.usableArea?.heightMm} mm.</p><ul><li>Testo minimo: {current.minFontSizePt??(current.kind==='stamp-ink'?7:'non definito')}{current.minFontSizePt!==null||current.kind==='stamp-ink'?' pt':''}.</li><li>Immagini: {current.rasterMode==='binary'?'solo bianco/nero':current.rasterMode==='color'?'anche a colori':'regola da definire'}.</li><li>Margine: {current.safeMarginMm===null?'da definire':`${current.safeMarginMm} mm`}. Zone riservate: {current.reservedAreas.length}.</li></ul><p className="caption">Corpo minimo e regole immagini controllati alla conferma. Margine e zone sono guide visuali; il pulsante sotto permette di controllare le sovrapposizioni alla precisione indicata. La lavorabilità dell’incisione non è ancora verificata. Questa versione resta nel progetto anche se il profilo viene aggiornato in amministrazione.</p></>:<p>Nessun profilo tecnico collegato. Restano i controlli del formato TEST, quando presenti.</p>}
  {admin&&<fieldset disabled={disabled||busy} className="inspector-arrangement"><label>Profilo da collegare<select aria-label="Profilo da collegare" value={id} onChange={event=>{setId(event.target.value);setError('');}}><option value="">Scegli un profilo locale</option>{profiles?.filter(profile=>!profile.archived).map(profile=><option key={profile.id} value={profile.id}>{profile.label} · v{profile.version}</option>)}</select></label><button type="button" onClick={()=>void load()}>Aggiorna elenco profili</button>{profiles?.length===0&&<p>Nessun profilo salvato. Crealo nella gestione configuratore.</p>}{incompatibility&&<p role="status">{incompatibility}</p>}<button type="button" disabled={!selected||!!incompatibility} onClick={()=>void apply()}>Collega profilo alla pagina</button>{current&&<button type="button" onClick={()=>onSet(null,doc.revision)}>Scollega profilo dalla pagina</button>}<p className="caption">Il collegamento non cambia misure, colori, fissaggi o prodotto associato e non modifica altri template. Puoi annullarlo con Annulla.</p></fieldset>}
  {current&&<GeometryInspectionPanel document={doc} disabled={disabled||busy} onLocate={onLocate} onResetFocus={onResetFocus}/>}
  {busy&&<p role="status">Caricamento profili…</p>}{error&&<p role="alert">{error}</p>}
 </details>;
}
