import {textGeometryVerified} from './font-measurement';
import {useSyncExternalStore} from 'react';
import {fontCoverageVersion,subscribeFontCoverage} from './font-coverage-cache';
import { isTextPathGuide } from './text-path-model';
import { useEffect, useRef, useState } from 'react';
import type { GraphicDocument, SelectionTransformArguments, SelectionStyle } from './model';
import { selectionBounds, selectionUnits } from './selection';
import { measureFabric } from './fabric-adapter';
import { EditorButton, EditorIcon } from './EditorButton';
import { SelectionStyleInspector } from './SelectionStyleInspector';
import {GroupPropertiesPanel} from './GroupPropertiesPanel';
import type {GroupProperties} from './object-properties';
import {selectedRootGroups} from './object-properties';

type Field = 'x' | 'y' | 'width' | 'height' | 'rotation';
const format = (value: number) => String(Math.round(value * 1000) / 1000);
function MeasuredSelectionInspector({ document, ids, onMove, onTransform, onAlign, onDistribute, onStyle, onAlignArea, onAttachText,onGroupProperties }: {
  document: GraphicDocument; ids: string[]; onAttachText: (textId: string, pathId: string) => void;
  onGroupProperties?:(id:string,properties:GroupProperties)=>void;
  onMove: (x: number, y: number, revision: number) => number | null;
  onTransform: (args: Omit<SelectionTransformArguments, 'objectIds'>, revision: number) => number | null;
  onAlign: (alignment: 'left' | 'centerX' | 'right' | 'top' | 'centerY' | 'bottom') => void;
  onDistribute: (axis: 'horizontal' | 'vertical') => void;
  onStyle: (style: SelectionStyle, revision: number) => boolean;
  onAlignArea: (alignment: 'left' | 'centerX' | 'right' | 'top' | 'centerY' | 'bottom') => void;
}) {
  const objects = document.objects.filter(object => ids.includes(object.id)), bounds = selectionBounds(objects, measureFabric);
  const center = { x: bounds.xMm + bounds.widthMm / 2, y: bounds.yMm + bounds.heightMm / 2 }, key = ids.join(',');
  const initial = { x: format(center.x), y: format(center.y), width: format(bounds.widthMm), height: format(bounds.heightMm), rotation: '0' };
  const [values, setValues] = useState(initial), [status, setStatus] = useState('');
  const current = useRef(values), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const own = useRef<{ revision: number; key: string; field: Field | null }>({ revision: -1, key: '', field: null });
  const focused = useRef<Field | null>(null), lastEdited = useRef<Field | null>(null);
  const touched = useRef({ x: false, y: false, rotation: false }), sizeAxis = useRef<'width' | 'height' | null>(null);
  const latest = useRef({ bounds, center, revision: document.revision, onMove, onTransform }); latest.current = { bounds, center, revision: document.revision, onMove, onTransform };
  const cancel = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  const clearChanges = () => { touched.current = { x: false, y: false, rotation: false }; sizeAxis.current = null; };
  const flush = () => {
    if (!timer.current) return; cancel();
    const raw = current.current, x = Number(raw.x), y = Number(raw.y), width = Number(raw.width), height = Number(raw.height), rotation = Number(raw.rotation);
    if (Object.values(raw).some(value => !value.trim() || !Number.isFinite(Number(value))) || Math.abs(x) > 1000 || Math.abs(y) > 1000 || width <= 0 || height <= 0 || width > 4000 || height > 4000 || Math.abs(rotation) > 180) { setStatus('Completa o correggi il valore.'); return; }
    const saved = latest.current;
    const target = { xMm: touched.current.x ? x : saved.center.x, yMm: touched.current.y ? y : saved.center.y };
    const scale = sizeAxis.current === 'width' ? width / saved.bounds.widthMm : sizeAxis.current === 'height' ? height / saved.bounds.heightMm : 1;
    const revision = sizeAxis.current || touched.current.rotation
      ? saved.onTransform({ scale, rotationDeg: touched.current.rotation ? rotation : 0, center: target }, saved.revision)
      : saved.onMove(target.xMm - saved.center.x, target.yMm - saved.center.y, saved.revision);
    if (revision === null) setStatus('Modifica non applicata.');
    else { own.current = { revision, key, field: lastEdited.current }; clearChanges(); setStatus('Salvato nella bozza'); }
  };
  const change = (field: Field, value: string) => {
    cancel(); lastEdited.current = field;
    const next = { ...current.current, [field]: value };
    if (field === 'width' || field === 'height') {
      sizeAxis.current = field;
      if (value.trim() && Number.isFinite(Number(value)) && Number(value) > 0) {
        const source = latest.current.bounds;
        if (field === 'width') next.height = format(source.heightMm * Number(value) / source.widthMm);
        else next.width = format(source.widthMm * Number(value) / source.heightMm);
      }
    } else touched.current[field] = true;
    current.current = next; setValues(next); setStatus('Aggiornamento…'); timer.current = setTimeout(flush, 250);
  };
  useEffect(() => {
    cancel(); clearChanges();
    const ownUpdate = document.revision === own.current.revision && key === own.current.key, field = focused.current;
    const next = ownUpdate && field && field !== 'rotation' && field === own.current.field ? { ...initial, [field]: current.current[field] } : initial;
    current.current = next; setValues(next); if (!ownUpdate) setStatus('');
  }, [document.revision, key]);
  useEffect(() => cancel, []);
  const reset = () => { cancel(); clearChanges(); current.current = initial; setValues(initial); setStatus('Ripristinata la bozza'); };
  const text = objects.find(object => object.type === 'text' && !object.textPath), guide = objects.find(isTextPathGuide), canAttach = objects.length === 2 && text && guide && !document.groups?.some(group => group.objectIds.some(id => ids.includes(id)));
  const units = selectionUnits(document, ids), grouped = units.length === 1,root=grouped?selectedRootGroups(document,ids)[0]:undefined;
  const input = (field: Field, label: string, min: number, max: number) => <label key={field}>{label}<input aria-label={label} type="number" required min={min} max={max} step="any" value={values[field]} onFocus={() => { focused.current = field; }} onBlur={() => { focused.current = null; }} onChange={event => change(field, event.target.value)}/></label>;
  return <form className="object-inspector inspector-content" aria-label="Proprietà selezione" onSubmit={event => { event.preventDefault(); flush(); }} onBlur={flush} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); reset(); } }}>
    <div className="inspector-selection"><EditorIcon name={grouped ? 'group' : 'multiSelect'}/><div><strong>{root?.editor?.label||(grouped ? 'Gruppo' : 'Selezione')}{root?.editor?.reference?' · Guida':''} · {ids.length} elementi</strong>{root&&<span>{root.id}</span>}</div></div>
    {root&&onGroupProperties&&<GroupPropertiesPanel document={document} group={root} onChange={onGroupProperties}/>}
    {canAttach && <div className="button-row"><EditorButton icon="textPath" label="Applica testo al tracciato" onClick={() => onAttachText(text.id, guide.id)}/></div>}
    <h3>Geometria</h3>
    <div className="property-grid">{input('x', 'X selezione (mm)', -1000, 1000)}{input('y', 'Y selezione (mm)', -1000, 1000)}{input('width', 'Larghezza selezione (mm)', 0.01, 4000)}{input('height', 'Altezza selezione (mm)', 0.01, 4000)}{input('rotation', 'Ruota selezione di (°)', -180, 180)}</div>
    <p className="caption">Posizione del centro e dimensioni dell’ingombro. Proporzioni sempre mantenute; la scala comprende caratteri, spaziature e contorni. L’angolo è aggiuntivo rispetto alla composizione attuale e torna a zero dopo la rotazione.</p>
    <h3>Allinea gli elementi tra loro</h3>
    <div className="button-row">{([['left', 'Allinea a sinistra'], ['centerX', 'Centra orizzontalmente'], ['right', 'Allinea a destra'], ['top', 'Allinea in alto'], ['centerY', 'Centra verticalmente'], ['bottom', 'Allinea in basso']] as const).map(([alignment, label]) => <EditorButton key={alignment} icon={alignment} label={label} disabled={units.length < 2} onClick={() => onAlign(alignment)}/>)}</div>
    <div className="button-row"><EditorButton icon="distributeX" label="Distribuisci spazi orizzontali" disabled={units.length < 3} onClick={() => onDistribute('horizontal')}/><EditorButton icon="distributeY" label="Distribuisci spazi verticali" disabled={units.length < 3} onClick={() => onDistribute('vertical')}/></div>
    <p className="caption">Allineamento entro l’ingombro della selezione; distribuzione con spazi uguali e senza sovrapposizioni. I gruppi si comportano come unità. Separa un gruppo per modificare testo e forme al suo interno.</p>
    <h3>Allinea l’insieme all’area</h3>
    <div className="button-row">{([['left', 'Allinea selezione a sinistra dell’area'], ['centerX', 'Centra selezione orizzontalmente nell’area'], ['right', 'Allinea selezione a destra dell’area'], ['top', 'Allinea selezione in alto nell’area'], ['centerY', 'Centra selezione verticalmente nell’area'], ['bottom', 'Allinea selezione in basso nell’area']] as const).map(([alignment, label]) => <EditorButton key={alignment} icon={alignment} label={label} onClick={() => onAlignArea(alignment)}/>)}</div>
    <p className="caption">Bordi al margine TEST di 1 mm, centri al centro dell’area. Distanze interne conservate, nessun ridimensionamento.</p>
    <SelectionStyleInspector {...{ document, ids, onStyle }}/>
    <div className="inspector-footer"><span role="status">{status}</span></div>
  </form>;
}

export function SelectionInspector(props: Parameters<typeof MeasuredSelectionInspector>[0]) {
 useSyncExternalStore(subscribeFontCoverage,fontCoverageVersion);
 const blocked=props.document.objects.filter(object=>props.ids.includes(object.id)&&object.type==='text'&&!textGeometryVerified(object));
 return blocked.length?<div className="object-inspector" aria-label="Proprietà selezione"><p className="notice">Correggi i font prima di misurare o trasformare questa selezione. L’ingombro di {blocked.map(object=>object.id).join(', ')} non è verificato.</p><SelectionStyleInspector document={props.document} ids={props.ids} onStyle={props.onStyle}/></div>:<MeasuredSelectionInspector {...props}/>;
}
