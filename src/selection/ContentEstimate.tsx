import { useMemo } from 'react';
import { estimateTextArea, type ContentBrief } from './content';
import type { Requirements } from './schema';

export function ContentEstimate({ brief, onUse }: { brief?: ContentBrief; onUse: (patch: Requirements) => void }) {
  const estimate = useMemo(() => {
    if (!brief?.text) return null;
    const context = document.createElement('canvas').getContext('2d');
    return context ? estimateTextArea(brief.text, (line, pt) => { context.font = `${pt}pt Arial`; return context.measureText(line).width * 25.4 / 96; }) : null;
  }, [brief?.text]);
  if (!brief?.kind && !brief?.text && !brief?.graphicSubject) return null;
  return <section className="content-estimate" aria-label="Contenuto del timbro">
    <strong>{brief.purpose === 'exlibris' ? 'Il tuo ex-libris' : 'Contenuto del timbro'}</strong>
    {brief.graphicSubject && <p>Soggetto: {brief.graphicSubject}</p>}
    {estimate && <><p>{estimate.lines} {estimate.lines === 1 ? 'riga di testo' : 'righe di testo'} · ingombro indicativo {estimate.small.width} × {estimate.small.height} – {estimate.large.width} × {estimate.large.height} mm.</p><p className="caption">Stima con Arial 7–9 pt e margine di prova 1 mm. Font, impaginazione e area utile vanno verificati nel canvas.</p></>}
    {estimate && brief.kind === 'text' ? <button onClick={() => onUse({ minimumAreaMm: estimate.large, diameterMm: null, sizeUnknown: false, sizeIsEstimate: true, lines: estimate.lines })}>Cerca usando questa stima</button> : <p className="caption">Per illustrazioni e composizioni miste il formato dipende anche dalla grafica: il solo numero di righe non basta.</p>}
  </section>;
}
