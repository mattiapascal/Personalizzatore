import{GRAPHIC_GEOMETRY_LIMITS}from'./limits';
import { useEffect, useState } from 'react';
import { NumberField } from './InspectorNumberField';
import { EditorButton } from './EditorButton';
import { measureFabric } from './fabric-adapter';
import { bezierWorldNodes, bezierPartAvailable, moveBezierPart, setBezierHandle, shapeBezierHandles, setBezierClosed, openBezierAtNode, insertBezierNode, deleteBezierNode, reverseBezier, reflectBezier, type BezierObject, type BezierPart } from './bezier-nodes';
import type { NodeFocus } from './PathNodeInspector';
export function BezierNodeInspector({ object, revision, onChange, onFocusNode }: { object: BezierObject; revision: number; onChange: (object: BezierObject, immediate?: boolean) => void; onFocusNode: (focus: NodeFocus | null) => void }) {
  const [selected, setSelected] = useState(0), [error, setError] = useState(''), [guide, setGuide] = useState<'in' | 'out'>('out');
  const index = Math.min(selected, object.nodes.length - 1), nodes = bezierWorldNodes(object, measureFabric), node = nodes[index]!;
  useEffect(() => { onFocusNode({ objectId: object.id, index }); return () => onFocusNode(null); }, [object.id, index]);
  useEffect(() => setError(''), [revision]);
  const change = (action: () => BezierObject, immediate = false, nextIndex = index) => {
    try { const next = action(); setError(''); onChange(next, immediate); setSelected(nextIndex); }
    catch (e) { setError(e instanceof Error ? e.message : 'Curva non modificabile'); }
  };
  const coordinates = (part: BezierPart, label: string) => {
    const p = part === 'point' ? node : node[part]; if (!p) return null;
    return <div className="property-grid" key={`${index}-${part}`}>
      <NumberField label={`X ${label} (mm)`} value={p.x} revision={revision} min={-GRAPHIC_GEOMETRY_LIMITS.coordinateMm} max={GRAPHIC_GEOMETRY_LIMITS.coordinateMm} onChange={x => change(() => moveBezierPart(object, index, part, { ...p, x }, measureFabric))}/>
      <NumberField label={`Y ${label} (mm)`} value={p.y} revision={revision} min={-GRAPHIC_GEOMETRY_LIMITS.coordinateMm} max={GRAPHIC_GEOMETRY_LIMITS.coordinateMm} onChange={y => change(() => moveBezierPart(object, index, part, { ...p, y }, measureFabric))}/>
    </div>;
  };
  return <>
    <label>Nodo curva<select aria-label="Nodo curva" value={index} onChange={event => { setSelected(Number(event.target.value)); setError(''); }}>{object.nodes.map((_, i) => <option key={i} value={i}>Nodo {i + 1}</option>)}</select></label>
    {coordinates('point', 'nodo curva')}
    {(['in', 'out'] as const).map(side => <div key={side}>
      <label className="ratio-toggle"><input type="checkbox" checked={!!object.nodes[index]![side]} disabled={!bezierPartAvailable(object, index, side)} onChange={event => change(() => setBezierHandle(object, index, side, event.target.checked, measureFabric), true)}/> {side === 'in' ? 'Attiva maniglia entrante' : 'Attiva maniglia uscente'}</label>
      {bezierPartAvailable(object, index, side) && coordinates(side, side === 'in' ? 'maniglia entrante' : 'maniglia uscente')}
    </div>)}
    <label>Maniglia guida del nodo<select aria-label="Maniglia guida del nodo" value={guide} onChange={event => setGuide(event.target.value as 'in' | 'out')}><option value="out">Uscente</option><option value="in">Entrante</option></select></label>
    <div className="button-row">
      <EditorButton icon="smoothNode" label="Allinea maniglie del nodo" disabled={!bezierPartAvailable(object, index, 'in') || !bezierPartAvailable(object, index, 'out')} onClick={() => change(() => shapeBezierHandles(object, index, 'align', guide, measureFabric), true)}/>
      <EditorButton icon="symmetricNode" label="Rendi simmetriche le maniglie del nodo" disabled={!bezierPartAvailable(object, index, 'in') || !bezierPartAvailable(object, index, 'out')} onClick={() => change(() => shapeBezierHandles(object, index, 'symmetric', guide, measureFabric), true)}/>
      <EditorButton icon="cornerNode" label="Rimuovi maniglie del nodo" disabled={!node.in && !node.out} onClick={() => change(() => shapeBezierHandles(object, index, 'remove', guide, measureFabric), true)}/>
    </div>
    <p className="caption">Allinea conserva le lunghezze; simmetria usa la lunghezza della guida. Senza maniglie, la direzione viene dai nodi vicini. I successivi trascinamenti restano indipendenti.</p>
    <div className="button-row"><EditorButton icon="insertNode" label="Dividi segmento curva a metà" disabled={object.nodes.length >= 64 || !object.closed && index === object.nodes.length - 1} onClick={() => change(() => insertBezierNode(object, index, measureFabric), true, index + 1)}/><EditorButton icon="deleteNode" label="Elimina nodo curva" disabled={object.nodes.length <= 2} onClick={() => change(() => deleteBezierNode(object, index, measureFabric), true, Math.max(0, index - 1))}/></div>
    <label className="ratio-toggle"><input type="checkbox" checked={object.closed} onChange={event => change(() => setBezierClosed(object, event.target.checked, measureFabric), true)}/> Curva chiusa</label>
    <EditorButton icon="openPath" label="Apri curva dal nodo selezionato" disabled={!object.closed || object.nodes.length >= 64} onClick={() => change(() => openBezierAtNode(object, index, measureFabric), true, 0)}/>
    {object.closed && <p className="caption">Apri dal nodo conserva tutto il contorno, duplica il nodo nelle due estremità e rimuove il riempimento. Richiede un nodo libero entro il limite di 64.</p>}
    <div className="button-row"><EditorButton icon="flipX" label="Rifletti curva orizzontalmente" onClick={() => change(() => reflectBezier(object, 'horizontal', measureFabric), true)}/><EditorButton icon="flipY" label="Rifletti curva verticalmente" onClick={() => change(() => reflectBezier(object, 'vertical', measureFabric), true)}/><EditorButton icon="reverseNodes" label="Inverti nodi curva" onClick={() => change(() => reverseBezier(object), true, object.nodes.length - 1 - index)}/></div>
    <p className="caption">Trascina il nodo quadrato o le maniglie circolari; Esc annulla. Muovere il nodo porta con sé le sue maniglie, gli altri punti restano fermi. La divisione conserva esattamente la curva; eliminare un nodo ne cambia la forma. Geometria ripristina le maniglie di trasformazione.</p>
    {error && <p role="status">{error}</p>}
  </>;
}
