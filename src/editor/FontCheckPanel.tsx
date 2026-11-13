import{allGraphicObjects,activeGraphicPageId}from'./pages';
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { GraphicDocument } from './model';
import { fontIssueMessage, inspectDocumentFonts, type FontReport } from './font-preflight';
import type { FontIssue } from './font-preflight';
import { FontPicker } from './FontPicker';
import { fontVariantChoices, fontVariantLabel, subscribeFonts, fontCatalogVersion } from './fonts';
import { fontCoverageVersion, subscribeFontCoverage } from './font-coverage-cache';
import {missingCharacterFontCommand} from './font-repair';
import {registeredFontAsset,renderFontFamily,isFontAvailable} from './fonts';
import {characterStyles} from './text-style';

type Repair = (issue: FontIssue, fontId: string, revision: number) => Promise<boolean>;
function FontRepairRow({ issue, document:doc, busy, onOpen, onRepair }: { issue: FontIssue; document:GraphicDocument; busy: boolean; onOpen: () => void; onRepair: Repair }) {
  const revision=doc.revision,fontVersion=useSyncExternalStore(subscribeFonts, fontCatalogVersion);
  const [choice, setChoice] = useState(''), [pending, setPending] = useState(false), [error, setError] = useState('');
  const [attempt,setAttempt]=useState(0),[candidate,setCandidate]=useState<{key:string;ready:boolean;message:string;glyphs:string[]}|null>(null);
  const key=JSON.stringify([doc.documentId,revision,doc.pageId,issue.objectId,issue.fontId,issue.characters,choice,fontVersion,attempt]);
  const current=candidate?.key===key?candidate:null,ready=!!current?.ready;
  const variants = fontVariantChoices(choice);
  useEffect(() => { setChoice(''); setError(''); }, [revision]);
  useEffect(()=>{
    if(!choice)return;let active=true;
    const inspect=async()=>{try{
      const asset=registeredFontAsset(choice);if(!asset||!isFontAvailable(choice))throw Error('File font non caricato: scegli un file disponibile nella libreria.');
      // Read-only proposal, through the very same validator used by Apply.
      const command=await missingCharacterFontCommand(doc,issue,asset),changed=command.arguments.object,original=doc.objects.find(object=>object.id===issue.objectId);
      if(changed.type!=='text'||original?.type!=='text')throw Error('Testo non più disponibile.');
      const before=characterStyles(original),after=characterStyles(changed),glyphs=[...new Set(Array.from(changed.text).filter((character,index)=>issue.characters?.includes(character)&&(before[index]?.fontFamily??original.fontFamily)===issue.fontId&&(after[index]?.fontFamily??changed.fontFamily)===choice))];
      if(active)setCandidate({key,ready:true,message:'Il file scelto contiene tutti i caratteri da correggere.',glyphs});
    }catch(cause){if(active)setCandidate({key,ready:false,message:cause instanceof Error?cause.message:'Verifica del font non riuscita.',glyphs:[]});}};
    void inspect();return()=>{active=false;};
  },[key]);
  return <div className="font-repair-row" role="group" aria-label={`Correggi caratteri di ${issue.objectId}`}>
    <p className="caption">Scegli esplicitamente il file per i soli caratteri mancanti di questo testo. Gli altri caratteri mantengono il loro font. Le coordinate originali X/Y vengono conservate; controlla l’ingombro dopo la correzione.</p>
    <FontPicker label="Font per i caratteri mancanti" value={choice} emptyLabel="Scegli il font dei caratteri mancanti" disabled={busy || pending} onOpen={onOpen} onChange={id => { setChoice(id); setError(''); }}/>
    {variants.length > 1 && <label>File dello stile<select aria-label="File dello stile per i caratteri mancanti" disabled={busy || pending} value={choice} onChange={event => setChoice(event.target.value)}>{variants.map(face => <option key={face.id} value={face.id}>{fontVariantLabel(face.id)}</option>)}</select></label>}
    {choice&&<div className="font-repair-candidate" role="status" data-testid="font-repair-candidate" data-state={current?(ready?'ready':'rejected'):'checking'}><p className="caption">{current?.message??'Verifica dei caratteri nel file scelto…'}</p>{ready&&current.glyphs.length>0&&current.glyphs.every(character=>!/[\s\p{M}\p{Cf}]/u.test(character))&&<span role="img" aria-label="Anteprima dei caratteri con il font scelto" className="font-repair-preview" style={{fontFamily:renderFontFamily(choice),fontWeight:'normal',fontStyle:'normal'}}>{current.glyphs.slice(0,16).join('')}</span>}{current&&!ready&&<button type="button" disabled={busy||pending} onClick={()=>setAttempt(value=>value+1)}>Ricontrolla il font scelto</button>}</div>}
    <button disabled={!ready || busy || pending} onClick={async () => { if(!ready||busy||pending)return;setPending(true); setError(''); try { if (!await onRepair(issue, choice, revision)) setError('Correzione non applicata: controlla il messaggio dell’editor.'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Correzione non applicata.'); } finally { setPending(false); } }}>Applica ai soli caratteri mancanti</button>
    {error && <p role="status">{error}</p>}
  </div>;
}

export function FontCheckPanel({ document: doc, busy = false, onOpen = () => {}, onRepair,onPage }: { onPage?:(pageId:string)=>void;document: GraphicDocument; busy?: boolean; onOpen?: () => void; onRepair?: Repair }) {
  const coverageVersion=useSyncExternalStore(subscribeFontCoverage,fontCoverageVersion);
  const [retry,setRetry]=useState(0);
  const [result, setResult] = useState<{ document: GraphicDocument; report: FontReport } | null>(null);
  const relevant = allGraphicObjects(doc).some(object => object.type === 'text');
  useEffect(() => {
    if (!relevant) return;
    let active = true;
    void inspectDocumentFonts(doc).then(report => { if (active) setResult({ document: doc, report }); });
    return () => { active = false; };
  }, [doc, relevant, retry, coverageVersion]);
  if (!relevant) return null;
  const report = result?.document === doc ? result.report : null;
  return <section aria-label="Controllo font del progetto" className="font-check-panel">
    <strong>Font del progetto</strong>
    {!report ? <p className="caption">Controllo dei caratteri…</p> : report.issues.length ? <div><p className="caption" role="status">Controlla questi testi prima di confermare la grafica.</p><ul>{report.issues.map(issue=><li key={`${issue.pageId??''}:${issue.objectId}:${issue.fontId}:${issue.kind}`}>{fontIssueMessage(issue)}{issue.pageId&&issue.pageId!==activeGraphicPageId(doc)?<button type="button" disabled={busy} onClick={()=>onPage?.(issue.pageId!)}>Apri pagina {issue.pageName}</button>:issue.kind === 'missing-characters' && onRepair && <FontRepairRow issue={issue} document={doc} busy={busy} onOpen={onOpen} onRepair={onRepair}/>}</li>)}</ul></div> : <p className="caption">I caratteri usati sono presenti nei {report.checkedFonts} file font controllati. Verifica comunque la resa nell’anteprima.</p>}
    {report?.issues.some(issue=>issue.kind==='unknown-coverage')&&<button type="button" disabled={busy} onClick={()=>{setResult(null);setRetry(value=>value+1);}}>Ricontrolla i font</button>}
  </section>;
}
