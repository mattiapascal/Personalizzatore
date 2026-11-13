import { useEffect, useState, useSyncExternalStore } from 'react';
import { fontCatalogVersion, registeredFontAsset, subscribeFonts } from './fonts';
import { inspectDocumentFonts, fontIssueMessage, type FontReport } from './font-preflight';
import { textFontDiagnosticKey } from './font-diagnostic-key';
import type { TextObject } from './text-style';
import { fontCoverageVersion, subscribeFontCoverage } from './font-coverage-cache';
import { FontProblemText } from './FontProblemText';

/** Diagnostics only: no font substitution, measurements, commands or revisions. */
export function SelectedTextFontNotice({ object }: { object: TextObject }) {
  useSyncExternalStore(subscribeFonts, fontCatalogVersion);
  useSyncExternalStore(subscribeFontCoverage, fontCoverageVersion);
  const [attempt, setAttempt] = useState(0), [state, setState] = useState<{ key: string; report: FontReport } | null>(null);
  const ids = new Set([object.fontFamily, ...object.characterStyles?.flatMap(run => run.style.fontFamily ? [run.style.fontFamily] : []) ?? []]);
  const assets = [...ids].flatMap(id => { const asset = registeredFontAsset(id); return asset ? [asset] : []; });
  const key = JSON.stringify([textFontDiagnosticKey(object, assets), attempt]);
  useEffect(() => {
    let active = true;
    const snapshot = structuredClone(object), files = assets.map(asset => ({ ...asset }));
    void inspectDocumentFonts({ objects: [snapshot], fontAssets: files }).then(report => { if (active) setState({ key, report }); });
    return () => { active = false; };
  }, [key]);
  const report = state?.key === key ? state.report : null;
  if (!report?.issues.length) return null;
  return <div className="notice" data-testid="selected-text-font-issue" role="status">
    <p>{fontIssueMessage(report.issues[0]!)}</p>
    <FontProblemText object={object} issues={report.issues}/>
    <p className="caption">Il testo originale è conservato. Puoi correggere i soli caratteri interessati in «Font del progetto».</p>
    {report.issues.some(issue => issue.kind === 'unknown-coverage') && <button type="button" onClick={() => setAttempt(value => value + 1)}>Ricontrolla caratteri del testo</button>}
  </div>;
}
