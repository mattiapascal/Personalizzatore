import { useEffect, useState, useSyncExternalStore } from 'react';
import type { GraphicDocument } from './model';
import { fontIssueMessage, inspectDocumentFonts, type FontReport } from './font-preflight';
import type { FontIssue } from './font-preflight';
import { FontPicker } from './FontPicker';
import { fontVariantChoices, fontVariantLabel, subscribeFonts, fontCatalogVersion } from './fonts';

type Repair = (issue: FontIssue, fontId: string, revision: number) => Promise<boolean>;
function FontRepairRow({ issue, revision, busy, onOpen, onRepair }: { issue: FontIssue; revision: number; busy: boolean; onOpen: () => void; onRepair: Repair }) {
  useSyncExternalStore(subscribeFonts, fontCatalogVersion);
  const [choice, setChoice] = useState(''), [pending, setPending] = useState(false), [error, setError] = useState('');
  const variants = fontVariantChoices(choice);
  useEffect(() => { setChoice(''); setError(''); }, [revision]);
  return <div className="font-repair-row" role="group" aria-label={`Correggi caratteri di ${issue.objectId}`}>
    <p className="caption">Scegli esplicitamente il file per i soli caratteri mancanti di questo testo. Gli altri caratteri mantengono il loro font. Le coordinate originali X/Y vengono conservate; controlla l’ingombro dopo la correzione.</p>
    <FontPicker label="Font per i caratteri mancanti" value={choice} emptyLabel="Scegli il font dei caratteri mancanti" disabled={busy || pending} onOpen={onOpen} onChange={id => { setChoice(id); setError(''); }}/>
    {variants.length > 1 && <label>File dello stile<select aria-label="File dello stile per i caratteri mancanti" disabled={busy || pending} value={choice} onChange={event => setChoice(event.target.value)}>{variants.map(face => <option key={face.id} value={face.id}>{fontVariantLabel(face.id)}</option>)}</select></label>}
    <button disabled={!choice || busy || pending} onClick={async () => { setPending(true); setError(''); try { if (!await onRepair(issue, choice, revision)) setError('Correzione non applicata: controlla il messaggio dell’editor.'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Correzione non applicata.'); } finally { setPending(false); } }}>Applica ai soli caratteri mancanti</button>
    {error && <p role="status">{error}</p>}
  </div>;
}

export function FontCheckPanel({ document: doc, busy = false, onOpen = () => {}, onRepair }: { document: GraphicDocument; busy?: boolean; onOpen?: () => void; onRepair?: Repair }) {
  const [retry,setRetry]=useState(0);
  const [result, setResult] = useState<{ document: GraphicDocument; report: FontReport } | null>(null);
  const relevant = doc.objects.some(object => object.type === 'text');
  useEffect(() => {
    if (!relevant) return;
    let active = true;
    void inspectDocumentFonts(doc).then(report => { if (active) setResult({ document: doc, report }); });
    return () => { active = false; };
  }, [doc, relevant, retry]);
  if (!relevant) return null;
  const report = result?.document === doc ? result.report : null;
  return <section aria-label="Controllo font del progetto" className="font-check-panel">
    <strong>Font del progetto</strong>
    {!report ? <p className="caption">Controllo dei caratteri…</p> : report.issues.length ? <div><p className="caption" role="status">Controlla questi testi prima di confermare la grafica.</p><ul>{report.issues.map(issue=><li key={`${issue.objectId}:${issue.fontId}:${issue.kind}`}>{fontIssueMessage(issue)}{issue.kind === 'missing-characters' && onRepair && <FontRepairRow issue={issue} revision={doc.revision} busy={busy} onOpen={onOpen} onRepair={onRepair}/>}</li>)}</ul></div> : <p className="caption">I caratteri usati sono presenti nei {report.checkedFonts} file font controllati. Verifica comunque la resa nell’anteprima.</p>}
    {report?.issues.some(issue=>issue.kind==='unknown-coverage')&&<button type="button" disabled={busy} onClick={()=>{setResult(null);setRetry(value=>value+1);}}>Ricontrolla i font</button>}
  </section>;
}
