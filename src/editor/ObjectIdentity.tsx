import type { SceneObject } from './model';
import { EditorIcon } from './EditorButton';
export const objectTypeLabel = (object: SceneObject): string => object.type === 'text' && object.textPath ? 'Testo su tracciato' : ({ qr:'Codice QR', vector: 'Vettore SVG', text: 'Testo', rect: 'Rettangolo', circle: 'Cerchio', ellipse: 'Ellisse', bezier: 'Curva Bézier', path: 'Tracciato', image: 'Immagine', line: 'Linea' })[object.type];
/** One representation of an object in both the inspector and Layers. */
export function ObjectIdentity({ object }: { object: SceneObject }) {
  const preview = object.type === 'text' ? object.text.replace(/\s+/gu, ' ').trim() : '';
  return <div className="object-identity"><EditorIcon name={object.type}/><div className="object-identity-body"><strong>{object.editor?.label||objectTypeLabel(object)}{object.editor?.reference?' · Guida':''}</strong><div className="object-identity-detail"><span className="object-identity-id">{object.id}</span>{preview && <span className="object-identity-preview"> - {preview}</span>}</div></div></div>;
}
