import type { FontIssue } from './font-preflight';
import type { TextObject } from './text-style';
import { fontProblemSegments } from './font-problem-text';

/** A plain source transcript, never a substitute rendering of the design. */
export function FontProblemText({ object, issues }: { object: TextObject; issues: readonly FontIssue[] }) {
  const segments = fontProblemSegments(object, issues);
  if (!segments.some(segment => segment.problem)) return null;
  return <div className="font-problem-text">
    <p className="caption">Testo originale · rosso: caratteri da correggere o verificare</p>
    <p className="font-problem-source" aria-label="Testo originale con caratteri problematici" data-testid="font-problem-source">
      {segments.map(segment => segment.problem ? <mark key={segment.start} data-start={segment.start} data-end={segment.end}>{segment.text}</mark> : <span key={segment.start}>{segment.text}</span>)}
    </p>
  </div>;
}
