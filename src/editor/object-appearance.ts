import {preserveTextPathGuide} from './text-path-model';
import { cloneSceneObject, objectCenter, placeObjectAtCenter, type Measure, type SceneObject, type SelectionStyle } from './model';
import { applyCharacterStyle } from './text-style';
/** Proprietà comuni valide per ogni membro: mai saltare gli incompatibili. */
export function objectWithAppearance(object: SceneObject, style: SelectionStyle, measure: Measure): SceneObject {
  if (object.type === 'image') throw new Error('Le immagini non hanno riempimento o contorno modificabili');
  if (object.type === 'text') {
    if (style.strokeDash !== undefined || style.fill === 'none') throw new Error('Stile incompatibile con un testo della selezione');
    const next = applyCharacterStyle(object, { ...(style.fill === undefined ? {} : { fill: style.fill }), ...(style.fillOpacity === undefined ? {} : { fillOpacity: style.fillOpacity }), ...(style.stroke === undefined ? {} : { stroke: style.stroke }), ...(style.strokeMm === undefined ? {} : { strokeMm: style.strokeMm }), ...(style.strokeOpacity === undefined ? {} : { strokeOpacity: style.strokeOpacity }) });
    if(style.stroke===undefined&&style.strokeMm===undefined&&style.strokeOpacity===undefined)return next;
    return object.textPath ? preserveTextPathGuide(object, next, measure) : placeObjectAtCenter(next, objectCenter(object, measure), measure);
  }
  const center = objectCenter(object, measure);
  if ((object.type === 'line' || (object.type === 'path' || object.type === 'bezier') && !object.closed) && style.fill !== undefined && style.fill !== 'none') throw new Error('Un elemento aperto della selezione non ammette riempimento');
  if ((object.type === 'line' || object.type === 'path' || object.type === 'bezier') && style.stroke === 'none') throw new Error('Linee e tracciati richiedono un contorno nel profilo TEST');
  return placeObjectAtCenter(Object.assign(cloneSceneObject(object), style), center, measure);
}
