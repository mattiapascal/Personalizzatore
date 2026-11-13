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
import{fontIssueSelectionTarget}from'./font-issue-selection';
import type{EditorRole}from'./object-properties';
import{ObjectIdentity}from'./ObjectIdentity';
import { FontProblemText } from './FontProblemText';
import { FontSupportFinder } from './FontSupportFinder';
import { fontProblemSegments } from './font-problem-text';

type Repair = (issue: FontIssue, fontId: string, revision: number) => Promise<boolean>;
function FontRepairRow({ issue, document:doc, busy, onOpen, onRepair }: { issue: FontIssue; document:GraphicDocument; busy: boolean; onOpen: () => void; onRepair: Repair }) {
  const revision=doc.revision,fontVersion=useSyncExternalStore(subscribeFonts, fontCatalogVersion);
  const [choice, setChoice] = useState(''), [pending, setPending] = useState(false), [error, setError] = useState('');
  const [preparing,setPreparing]=useState(false);
  const [attempt,setAttempt]=useState(0),[candidate,setCandidate]=useState<{key:string;ready:boolean;message:string;glyphs:string[]}|null>(null);
  const key=JSON.stringify([doc.documentId,revision,doc.pageId,issue.objectId,issue.fontId,issue.characters,choice,fontVersion,attempt]);
  const current=candidate?.key===key?candidate:null,ready=!!current?.ready;
  const variants = fontVariantChoices(choice);
  useEffect(() => { setChoice(''); setError('');setPreparing(false); }, [revision]);
  useEffect(()=>{
    if(!choice)return;let active=true;
    const inspect=async()=>{try{
      const asset=registeredFontAsset(choice);if(!asset||!isFontAvailable(choice))throw Error('File font non caricato: scegli un file disponibile nella libreria.');
      // Read-only proposal, through the very same validator used by Apply.
      const command=await missingCharacterFontCommand(doc,issue,asset),changed=command.arguments.object,original=doc.objects.find(object=>object.id===issue.objectId);
      if(changed.type!=='text'||original?.type!=='text')throw Error('Testo non più disponibile.');
      const before=characterStyles(original),after=characterStyles(changed),glyphs=[...new Set(fontProblemSegments(original,[issue]).filter(segment=>segment.problem).flatMap(segment=>Array.from(Array.from(segment.text).filter((_character,offset)=>{const index=segment.start+offset;return(before[index]?.fontFamily??original.fontFamily)===issue.fontId&&(after[index]?.fontFamily??changed.fontFamily)===choice;}).join('').normalize('NFC'))))];
      if(active)setCandidate({key,ready:true,message:'Il file scelto contiene tutti i caratteri da correggere.',glyphs});
    }catch(cause){if(active)setCandidate({key,ready:false,message:cause instanceof Error?cause.message:'Verifica del font non riuscita.',glyphs:[]});}};
    void inspect();return()=>{active=false;};
  },[key]);
  return <div className="font-repair-row" role="group" aria-label={`Correggi caratteri di ${issue.objectId}`}>
    <p className="caption">Scegli esplicitamente il file per i soli caratteri mancanti di questo testo. Gli altri caratteri mantengono il loro font. Le coordinate originali X/Y vengono conservate; controlla l’ingombro dopo la correzione.</p>
    <FontSupportFinder key={JSON.stringify([doc.documentId,revision,doc.pageId,issue.objectId,issue.fontId,issue.characters])} assets={doc.fontAssets??[]} characters={issue.characters??[]} disabled={busy||pending} onPreparing={setPreparing} onChoose={id=>{setChoice(id);setError('');}}/>
    <FontPicker label="Font per i caratteri mancanti" value={choice} emptyLabel="Scegli il font dei caratteri mancanti" disabled={busy || pending || preparing} onOpen={onOpen} onChange={id => { setChoice(id); setError(''); }}/>
    {variants.length > 1 && <label>File dello stile<select aria-label="File dello stile per i caratteri mancanti" disabled={busy || pending || preparing} value={choice} onChange={event => setChoice(event.target.value)}>{variants.map(face => <option key={face.id} value={face.id}>{fontVariantLabel(face.id)}</option>)}</select></label>}
    {choice&&<div className="font-repair-candidate" role="status" data-testid="font-repair-candidate" data-state={current?(ready?'ready':'rejected'):'checking'}><p className="caption">{current?.message??'Verifica dei caratteri nel file scelto…'}</p>{ready&&current.glyphs.length>0&&current.glyphs.every(character=>!/[\s\p{M}\p{Cf}]/u.test(character))&&<span role="img" aria-label="Anteprima dei caratteri con il font scelto" className="font-repair-preview" style={{fontFamily:renderFontFamily(choice),fontWeight:'normal',fontStyle:'normal'}}>{current.glyphs.slice(0,16).join('')}</span>}{current&&!ready&&<button type="button" disabled={busy||pending} onClick={()=>setAttempt(value=>value+1)}>Ricontrolla il font scelto</button>}</div>}
    <button disabled={!ready || busy || pending || preparing} onClick={async () => { if(!ready||busy||pending||preparing)return;setPending(true); setError(''); try { if (!await onRepair(issue, choice, revision)) setError('Correzione non applicata: controlla il messaggio dell’editor.'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Correzione non applicata.'); } finally { setPending(false); } }}>Applica ai soli caratteri mancanti</button>
    {error && <p role="status">{error}</p>}
  </div>;
}

export function FontCheckPanel({ document: doc, busy = false, onOpen = () => {}, onRepair,onPage,onSelectIssue,role='customer' }: { onSelectIssue?:(issue:FontIssue,revision:number)=>void;role?:EditorRole;onPage?:(pageId:string)=>void;document: GraphicDocument; busy?: boolean; onOpen?: () => void; onRepair?: Repair }) {
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
    {!report ? <p className="caption">Controllo dei caratteri…</p> : report.issues.length ? <div><p className="caption" role="status">Controlla questi testi prima di confermare la grafica.</p><ul>{report.issues.map((issue,index)=>{const target=fontIssueSelectionTarget(doc,issue,role),first=report.issues.findIndex(other=>other.objectId===issue.objectId&&other.pageId===issue.pageId)===index;return <li key={`${issue.pageId??''}:${issue.objectId}:${issue.fontId}:${issue.kind}`}>
      {first&&target&&<><FontProblemText object={target.object} issues={report.issues.filter(other=>other.pageId===issue.pageId&&other.objectId===issue.objectId)}/>{onSelectIssue&&<div className="font-issue-target"><ObjectIdentity object={target.object}/><button type="button" disabled={busy||!target.selectable} aria-label={`Apri testo ${issue.objectId}${issue.pageName?` di ${issue.pageName}`:''} nell’ispettore`} onClick={()=>onSelectIssue(issue,doc.revision)}>Apri nell’ispettore</button>{!target.selectable&&<p className="caption">Selezione bloccata dal template.</p>}</div>}</>}
      {fontIssueMessage(issue)}{issue.pageId&&issue.pageId!==activeGraphicPageId(doc)?(!onSelectIssue||!target?.selectable)&&<button type="button" disabled={busy} onClick={()=>onPage?.(issue.pageId!)}>Apri pagina {issue.pageName}</button>:issue.kind === 'missing-characters' && onRepair && <FontRepairRow issue={issue} document={doc} busy={busy} onOpen={onOpen} onRepair={onRepair}/>}</li>;})}</ul></div> : <p className="caption">I caratteri usati sono presenti nei {report.checkedFonts} file font controllati. Verifica comunque la resa nell’anteprima.</p>}
    {report?.issues.some(issue=>issue.kind==='unknown-coverage')&&<button type="button" disabled={busy} onClick={()=>{setResult(null);setRetry(value=>value+1);}}>Ricontrolla i font</button>}
  </section>;
}
