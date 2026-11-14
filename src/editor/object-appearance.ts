import {hasEditableStrokeJoin} from './path-stroke';
import {hasEditableStrokeCap} from './stroke-cap';
import {preserveTextPathGuide} from './text-path-model';
import { cloneSceneObject, objectCenter, placeObjectAtCenter, type Measure, type SceneObject, type SelectionStyle } from './model';
import { applyCharacterStyle } from './text-style';
/** Proprietà comuni valide per ogni membro: mai saltare gli incompatibili. */
export function objectWithAppearance(object: SceneObject, style: SelectionStyle, measure: Measure): SceneObject {
  if(object.type==='qr')throw new Error('Il QR conserva contrasto bianco/nero: modifica contenuto e dimensioni nella sua scheda.');
  if (object.type === 'image') {
    if(Object.entries(style).some(([key,value])=>value!==undefined&&key!=='opacity'))throw new Error('Le immagini ammettono soltanto la trasparenza nello stile comune');
    return {...cloneSceneObject(object),opacity:style.opacity??object.opacity};
  }
  if(style.opacity!==undefined)throw new Error('La trasparenza immagine richiede una selezione di sole immagini');
  if(style.strokeLineCap!==undefined&&!hasEditableStrokeCap(object))throw new Error('Le estremità comuni richiedono soltanto linee o vettori SVG oppure tracciati a punti/Bézier');
  if((style.strokeLineJoin!==undefined||style.strokeMiterLimit!==undefined)&&!hasEditableStrokeJoin(object))throw new Error('Le giunzioni comuni richiedono rettangoli o tracciati');
  if (object.type === 'text') {
    if (style.strokeDash !== undefined || style.fill === 'none') throw new Error('Stile incompatibile con un testo della selezione');
    const next = applyCharacterStyle(object, { ...(style.fill === undefined ? {} : { fill: style.fill }), ...(style.fillOpacity === undefined ? {} : { fillOpacity: style.fillOpacity }), ...(style.stroke === undefined ? {} : { stroke: style.stroke }), ...(style.strokeMm === undefined ? {} : { strokeMm: style.strokeMm }), ...(style.strokeOpacity === undefined ? {} : { strokeOpacity: style.strokeOpacity }) });
    if(style.stroke===undefined&&style.strokeMm===undefined&&style.strokeOpacity===undefined)return next;
    return object.textPath ? preserveTextPathGuide(object, next, measure) : placeObjectAtCenter(next, objectCenter(object, measure), measure);
  }
  const center = objectCenter(object, measure);
  if ((object.type === 'line' || (object.type === 'path' || object.type === 'bezier') && !object.closed) && style.fill !== undefined && style.fill !== 'none') throw new Error('Un elemento aperto della selezione non ammette riempimento');
  if ((object.type === 'line' || object.type === 'path' || object.type === 'bezier') && style.stroke === 'none') throw new Error('Linee e tracciati richiedono un contorno nel profilo TEST');
  return placeObjectAtCenter(Object.assign(cloneSceneObject(object), style, (object.type==='path'||object.type==='bezier'||object.type==='vector')&&(style.strokeLineCap!==undefined||style.strokeLineJoin!==undefined||style.strokeMiterLimit!==undefined)?{strokeFrameVersion:1 as const}:{}), center, measure);
}
