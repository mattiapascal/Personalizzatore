import {selectableObjectIds} from './object-properties';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { GraphicDocument, SceneObject } from './model';
import { expandSelection, canReorderSelection } from './selection';
import { EditorButton, EditorIcon } from './EditorButton';
import { ObjectIdentity, objectTypeLabel } from './ObjectIdentity';
interface Drag { ids: string[]; revision: number; documentId: string; }
interface Drop { id: string; side: 'above' | 'below'; }
export function LayersPanel({ customer=false,document: doc, selectedIds, disabled, multiple, onSelect, onPlace, onReorder, actions }: {
  customer?:boolean;actions: ReactNode; document: GraphicDocument; selectedIds: string[]; disabled: boolean; multiple: boolean;
  onSelect: (id: string, additive: boolean) => void;
  onPlace: (ids: string[], target: string, side: 'above' | 'below', revision: number) => void;
  onReorder: (position: 'front' | 'forward' | 'backward' | 'back') => void;
}) {
  const drag = useRef<Drag | null>(null), pointer = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null), destination = useRef<Drop | null>(null), list = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Drop | null>(null), [dragging, setDragging] = useState(false);
  const clear = () => { drag.current = null; pointer.current = null; destination.current = null; setHover(null); setDragging(false); };
  useEffect(() => { const key = (event: KeyboardEvent) => { if (event.key === 'Escape' && drag.current) { event.preventDefault(); event.stopImmediatePropagation(); clear(); } }; window.addEventListener('keydown', key, true); return () => window.removeEventListener('keydown', key, true); }, []);
  useEffect(() => { if (disabled || drag.current?.documentId !== doc.documentId) clear(); }, [disabled, doc.documentId]);
  const begin = (object: SceneObject) => {
    if (disabled||customer&&!selectableObjectIds(doc,[object.id],'customer').length) return;
    const ids = selectedIds.includes(object.id) ? selectedIds : expandSelection(doc, [object.id]);
    drag.current = { ids: [...ids], revision: doc.revision, documentId: doc.documentId }; setDragging(true);
  };
  const locate = (element: HTMLElement | null, y: number) => {
    const row = element?.closest<HTMLElement>('[data-layer-id]'), id = row?.dataset.layerId;
    if (!row || !list.current?.contains(row) || !id || !drag.current || expandSelection(doc, [id]).some(id => drag.current!.ids.includes(id))) { destination.current = null; setHover(null); return; }
    const bounds = row.getBoundingClientRect(), drop: Drop = { id, side: y < bounds.y + bounds.height / 2 ? 'above' : 'below' }; destination.current = drop; setHover(drop);
  };
  const commit = () => {
    const source = drag.current, target = destination.current; clear();
    if (source && target && !disabled && source.documentId === doc.documentId) onPlace(source.ids, target.id, target.side, source.revision);
  };
  const single = selectedIds.length === 1, labels = single ? ['Porta in primo piano', 'Avanti di un livello', 'Indietro di un livello', 'Porta sul fondo'] : ['Porta selezione in primo piano', 'Avanza selezione di un livello', 'Arretra selezione di un livello', 'Porta selezione sul fondo'];
  return <fieldset className="editor-actions layers-content" disabled={disabled}><legend>Livelli</legend>
    <div className="layers-actions">{actions}</div>
    <div className="button-row" role="group" aria-label="Ordine livelli">{(['front', 'forward', 'backward', 'back'] as const).map((position, index) => <EditorButton key={position} icon={position} label={labels[index]!} disabled={!selectedIds.length || !canReorderSelection(doc, selectedIds, position)} onClick={() => onReorder(position)}/>)}</div>
    <p className="caption">Primo piano in alto. Trascina una riga o la sua presa per cambiare ordine; i gruppi restano uniti.</p>
    <div ref={list} className="layer-list" role="group" aria-label="Oggetti del progetto" data-dragging={dragging}>
      {[...doc.objects].reverse().map(object => {
        const locked=customer&&!selectableObjectIds(doc,[object.id],'customer').length;
        const selected = selectedIds.includes(object.id), group = doc.groups?.find(group => group.objectIds.includes(object.id));
        const preview = object.type === 'text' ? object.text.replace(/\s+/gu, ' ').trim() : '';
        return <div key={object.id} className="layer-row" data-layer-id={object.id} data-selected={selected} data-grouped={!!group} data-drop={hover?.id === object.id ? hover.side : undefined} draggable={!disabled&&!locked}
          onDragStart={event => { if (disabled || locked || pointer.current) { event.preventDefault(); return; } begin(object); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('application/x-editor-layers', object.id); }} onDragEnd={clear}
          onDragOver={event => { if (!drag.current || disabled) return; event.preventDefault(); event.dataTransfer.dropEffect = 'move'; locate(event.currentTarget, event.clientY); }}
          onDrop={event => { if (!drag.current || disabled) return; event.preventDefault(); locate(event.currentTarget, event.clientY); commit(); }}>
          <button type="button" className="layer-select" disabled={locked} aria-label={`${objectTypeLabel(object)} · ${object.id}`} aria-pressed={selected} title={`${object.id}${preview ? ` - ${preview}` : ''}${group ? ` · Gruppo ${group.id}` : ''}`} onClick={event => onSelect(object.id, multiple || event.shiftKey || event.metaKey || event.ctrlKey)}>
            <ObjectIdentity object={object}/>{group && <span className="layer-group" title={`Gruppo ${group.id}`}><EditorIcon name="group"/></span>}
          </button>
          <button type="button" className="layer-grip" disabled={locked} aria-label={`Sposta livello ${object.id}`} title="Trascina per cambiare livello" onPointerDown={event => {
            if (disabled || locked || event.button !== 0) return; event.preventDefault(); begin(object); pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false }; event.currentTarget.setPointerCapture(event.pointerId);
          }} onPointerMove={event => {
            const active = pointer.current; if (!active || event.pointerId !== active.id) return;
            active.moved ||= Math.hypot(event.clientX - active.x, event.clientY - active.y) > 4; if (!active.moved) return;
            const bounds = list.current!.getBoundingClientRect(); if (event.clientY < bounds.top + 25) list.current!.scrollTop -= 12; else if (event.clientY > bounds.bottom - 25) list.current!.scrollTop += 12;
            locate(document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null, event.clientY);
          }} onPointerUp={event => { if (pointer.current?.id !== event.pointerId) return; const moved = pointer.current.moved; if (moved) commit(); else clear(); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={clear} onLostPointerCapture={() => { if (pointer.current) clear(); }}><EditorIcon name="grip"/></button>
        </div>;
      })}
      {!doc.objects.length && <p className="caption">Nessun livello. Aggiungi un testo, una forma o un’immagine.</p>}
    </div>
  </fieldset>;
}
