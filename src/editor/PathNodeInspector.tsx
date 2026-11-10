import { useEffect, useState } from 'react';
import { NumberField } from './InspectorNumberField';
import { EditorButton } from './EditorButton';
import { deletePathNode, insertPathNode, movePathNode, pathWorldPoints, type PathObject } from './path-nodes';
import { measureFabric } from './fabric-adapter';
import { reflectPath, reversePath, openPathAtNode } from './path-operations';
export interface NodeFocus { objectId: string; index: number; }
export function PathNodeInspector({ object, revision, onChange, onFocusNode }: { object: PathObject; revision: number; onChange: (object: PathObject, immediate?: boolean) => void; onFocusNode: (focus: NodeFocus | null) => void }) {
  const [node, setNode] = useState(0), [error, setError] = useState('');
  const index = Math.min(node, object.points.length - 1), point = pathWorldPoints(object, measureFabric)[index]!;
  useEffect(() => { onFocusNode({ objectId: object.id, index }); return () => onFocusNode(null); }, [object.id, index]);
  useEffect(() => setError(''), [revision]);
  const change = (action: () => PathObject, immediate = false, nextNode = index) => {
    try { const next = action(); setError(''); onChange(next, immediate); setNode(nextNode); }
    catch (e) { setError(e instanceof Error ? e.message : 'Nodo non modificabile'); }
  };
  return <>
    <label>Nodo<select aria-label="Nodo" value={index} onChange={event => { setNode(Number(event.target.value)); setError(''); }}>{object.points.map((_, i) => <option key={i} value={i}>Nodo {i + 1}</option>)}</select></label>
    <div className="property-grid" key={index}>
      <NumberField label="X nodo (mm)" value={point.xMm} revision={revision} min={-1000} max={1000} onChange={xMm => change(() => movePathNode(object, index, { ...point, xMm }, measureFabric))}/>
      <NumberField label="Y nodo (mm)" value={point.yMm} revision={revision} min={-1000} max={1000} onChange={yMm => change(() => movePathNode(object, index, { ...point, yMm }, measureFabric))}/>
    </div>
    <div className="button-row">
      <EditorButton icon="insertNode" label="Inserisci punto medio dopo il nodo" disabled={object.points.length >= 512 || !object.closed && index === object.points.length - 1} onClick={() => change(() => insertPathNode(object, index, measureFabric), true, index + 1)}/>
      <EditorButton icon="deleteNode" label="Elimina nodo" disabled={object.points.length <= (object.closed ? 3 : 2)} onClick={() => change(() => deletePathNode(object, index, measureFabric), true, Math.max(0, index - 1))}/>
    </div>
    <p className="caption">Nodo {index + 1} di {object.points.length}. Coordinate assolute nel foglio. Trascina il punto verde nel canvas oppure modifica X/Y; gli altri nodi restano fermi. Esc annulla il trascinamento. La scheda Geometria ripristina le maniglie della forma.</p>
    <h3>Operazioni sul tracciato</h3>
    <div className="button-row">
      <EditorButton icon="flipX" label="Rifletti tracciato orizzontalmente" onClick={() => change(() => reflectPath(object, 'horizontal', measureFabric), true)}/>
      <EditorButton icon="flipY" label="Rifletti tracciato verticalmente" onClick={() => change(() => reflectPath(object, 'vertical', measureFabric), true)}/>
      <EditorButton icon="reverseNodes" label="Inverti ordine dei nodi" onClick={() => change(() => reversePath(object), true, object.points.length - 1 - index)}/>
      <EditorButton icon="openPath" label="Apri tracciato dal nodo selezionato" disabled={!object.closed || object.points.length >= 512} onClick={() => change(() => openPathAtNode(object, index), true, 0)}/>
    </div>
    <p className="caption">Riflessione rispetto agli assi del foglio, centro fermo. Aprire duplica il nodo scelto nelle due estremità: contorno conservato, riempimento rimosso. Richiede meno di 512 nodi.</p>
    {error && <p role="status" className="error">{error}</p>}
  </>;
}
