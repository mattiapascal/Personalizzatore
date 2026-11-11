import { EDITOR_LIMITS } from './limits';
import { useEffect, useRef, useState } from 'react';
import type { GraphicDocument, SelectionStyle } from './model';
import { PaintPicker } from './PaintPicker';
import { NumberField } from './InspectorNumberField';
import { selectionStyle } from './text-style';
export function SelectionStyleInspector({ document, ids, onStyle }: { document: GraphicDocument; ids: string[]; onStyle: (style: SelectionStyle, revision: number) => boolean }) {
  const objects = document.objects.filter(object => ids.includes(object.id));
  const hasImage = objects.some(object => object.type === 'image'), hasText = objects.some(object => object.type === 'text');
  const canFill = !hasImage && objects.every(object => object.type !== 'line' && (object.type !== 'path' && object.type !== 'bezier' || object.closed)), canStroke = !hasImage && !hasText;
  const common = <T,>(values: T[]): T | null => values.every(value => value === values[0]) ? values[0]! : null;
  const fill = common(objects.map(object => {
    if (object.type === 'image') return 'mixed';
    if (object.type !== 'text') return object.fill ?? 'none';
    const effective = selectionStyle(object, 0, Array.from(object.text).length);
    return effective.mixed.includes('fill') ? 'mixed' : effective.style.fill ?? object.fill;
  }));
  const strokes = objects.flatMap(object => object.type === 'text' || object.type === 'image' ? [] : [object]), stroke = common(strokes.map(object => object.stroke)), width = common(strokes.map(object => object.strokeMm)), dash = common(strokes.map(object => object.strokeDash ?? 'solid'));
  const [status, setStatus] = useState(''), timer = useRef<ReturnType<typeof setTimeout> | null>(null), pending = useRef<{ style: SelectionStyle; revision: number } | null>(null), ownRevision = useRef(-1);
  const apply = useRef(onStyle); apply.current = onStyle;
  const cancel = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; pending.current = null; };
  const flush = () => {
    const change = pending.current; if (!change) return; cancel();
    if (apply.current(change.style, change.revision)) { ownRevision.current = change.revision + 1; setStatus('Stile salvato nella bozza'); } else setStatus('Stile non applicato.');
  };
  const change = (style: SelectionStyle, immediate = true) => {
    const previous = pending.current; if (timer.current) clearTimeout(timer.current);
    pending.current = { style: { ...previous?.style, ...style }, revision: previous?.revision ?? document.revision };
    setStatus('Aggiornamento…');
    if (immediate) flush(); else timer.current = setTimeout(flush, 250);
  };
  useEffect(() => { cancel(); if (document.revision !== ownRevision.current) setStatus(''); }, [document.revision, ids.join(',')]);
  useEffect(() => cancel, []);
  if (!canFill && !canStroke) return <p className="caption">Riempimento e contorno comuni richiedono elementi compatibili. Seleziona separatamente testi, forme o immagini per modificarne lo stile.</p>;
  return <div className="selection-style" onBlur={flush} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); cancel(); setStatus('Stile ripristinato'); } }}>
    <h3>Stile comune</h3>
    {canFill && <><h4>Riempimento</h4><PaintPicker allowColor={document.colorMode==='color'} label="Riempimento selezione" value={fill ?? 'mixed'} allowNone={!hasText} onChange={fill => change({ fill })}/>{(fill === null || fill === 'mixed') && <p className="caption">Riempimenti misti</p>}</>}
    {canStroke && <>
      <h4>Contorno</h4><PaintPicker allowColor={document.colorMode==='color'} label="Contorno selezione" value={stroke ?? 'mixed'} allowNone={objects.every(object => object.type !== 'line' && object.type !== 'path' && object.type !== 'bezier')} onChange={stroke => change({ stroke })}/>
      {stroke === null && <p className="caption">Contorni misti</p>}
      <NumberField label="Spessore contorno selezione (mm)" value={pending.current?.style.strokeMm ?? width ?? strokes[0]!.strokeMm} mixed={width === null && !pending.current?.style.strokeMm} revision={document.revision} min={0.01} max={EDITOR_LIMITS.maxStrokeMm} step={0.05} disabled={stroke === 'none'} onChange={strokeMm => change({ strokeMm }, false)}/>
      <label>Tipo contorno selezione<select aria-label="Tipo contorno selezione" value={dash ?? ''} disabled={stroke === 'none'} onChange={event => change({ strokeDash: event.target.value as 'solid' | 'dashed' | 'dotted' })}>{dash === null && <option value="" disabled>Misto</option>}<option value="solid">Continuo</option><option value="dashed">Tratteggiato</option><option value="dotted">Punteggiato</option></select></label>
    </>}
    <p className="caption">Stesso stile per tutti gli elementi selezionati. Sui testi il colore riguarda tutti i caratteri; i centri delle forme restano fermi.</p>
    {status && <p className="caption" role="status">{status}</p>}
  </div>;
}
