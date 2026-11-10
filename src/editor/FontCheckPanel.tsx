import { useEffect, useState } from 'react';
import type { GraphicDocument } from './model';
import { fontIssueMessage, inspectDocumentFonts, type FontReport } from './font-preflight';

export function FontCheckPanel({ document: doc }: { document: GraphicDocument }) {
  const [result, setResult] = useState<{ document: GraphicDocument; report: FontReport } | null>(null);
  const relevant = doc.objects.some(object => object.type === 'text');
  useEffect(() => {
    if (!relevant) return;
    let active = true;
    void inspectDocumentFonts(doc).then(report => { if (active) setResult({ document: doc, report }); });
    return () => { active = false; };
  }, [doc, relevant]);
  if (!relevant) return null;
  const report = result?.document === doc ? result.report : null;
  return <section aria-label="Controllo font del progetto" className="font-check-panel">
    <strong>Font del progetto</strong>
    {!report ? <p className="caption">Controllo dei caratteri…</p> : report.issues.length ? <div role="status"><p className="caption">Controlla questi testi prima di confermare la grafica.</p><ul>{report.issues.map(issue=><li key={`${issue.objectId}:${issue.fontId}:${issue.kind}`}>{fontIssueMessage(issue)}</li>)}</ul></div> : <p className="caption">I caratteri usati sono presenti nei {report.checkedFonts} file font controllati. Verifica comunque la resa nell’anteprima.</p>}
  </section>;
}
