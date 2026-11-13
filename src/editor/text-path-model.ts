import { EDITOR_LIMITS } from './limits';
import { objectCenter, placeObjectAtCenter, cloneSceneObject, type GraphicDocument, type SceneObject, type Measure } from './model';
import { TextPathGuideSchema, type TextPathBinding, type TextPathGuide } from './text-path-spec';
import type { TextObject } from './text-style';
export type GuideObject = Extract<SceneObject, { type: 'path' | 'bezier' | 'circle' | 'ellipse' | 'line' | 'vector' }>;
export function isTextPathGuide(object: SceneObject): object is GuideObject { return object.type === 'vector' ? !object.clipRect && !object.clipMasks && object.commands.filter(c => c[0] === 'M').length === 1 : ['path', 'bezier', 'circle', 'ellipse', 'line'].includes(object.type); }
export function textPathGuideCenter(object: TextObject, measure: Measure) {
  const center = objectCenter(object, measure), offset = measure(object).pathCenterOffsetMm ?? { x: 0, y: 0 }, a = (object.rotationDeg ?? 0) * Math.PI / 180;
  return { xMm: center.xMm - offset.x * Math.cos(a) + offset.y * Math.sin(a), yMm: center.yMm - offset.x * Math.sin(a) - offset.y * Math.cos(a) };
}
export function placeTextPathGuide(object: TextObject, center: { xMm: number; yMm: number }, measure: Measure): TextObject {
  const offset = measure(object).pathCenterOffsetMm ?? { x: 0, y: 0 }, a = (object.rotationDeg ?? 0) * Math.PI / 180;
  return placeObjectAtCenter(object, { xMm: center.xMm + offset.x * Math.cos(a) - offset.y * Math.sin(a), yMm: center.yMm + offset.x * Math.sin(a) + offset.y * Math.cos(a) }, measure) as TextObject;
}
export function preserveTextPathGuide(before: TextObject, after: TextObject, measure: Measure): TextObject { return placeTextPathGuide(after, textPathGuideCenter(before, measure), measure); }
export function textPathStyleChanged(before: TextObject, after: TextObject): boolean {
  return ['stroke', 'strokeMm', 'strokeOpacity', 'strokeLineJoin', 'strokeMiterLimit', 'text', 'fontSizePt', 'fontFamily', 'fontWeight', 'fontStyle', 'underline', 'overline', 'linethrough', 'characterStyles', 'letterSpacingPt', 'textAlign', 'textScaleX', 'textScaleY', 'textPath'].some(key => JSON.stringify(before[key as keyof TextObject]) !== JSON.stringify(after[key as keyof TextObject]));
}
function assertUngrouped(doc: GraphicDocument, ids: string[]) { if (doc.groups?.some(group => group.objectIds.some(id => ids.includes(id)))) throw new Error('Separa il gruppo prima di applicare o separare testo e tracciato'); }
export function attachTextPath(doc: GraphicDocument, textId: string, pathId: string, measure: Measure): SceneObject[] {
  const text = doc.objects.find(object => object.id === textId), path = doc.objects.find(object => object.id === pathId);
  if (text?.type !== 'text' || text.textPath || !path || !isTextPathGuide(path) || textId === pathId) throw new Error('Seleziona un testo libero e un tracciato, linea, cerchio o ellisse'); assertUngrouped(doc, [textId, pathId]);
  if(text.textClipMasks)throw new Error('Rimuovi la maschera del testo prima di applicarlo al tracciato');
  if (text.textSkewXDeg) throw new Error('Azzera l’inclinazione del box prima di applicare il testo al tracciato');
  const { id: _id, xMm: _x, yMm: _y, rotationDeg: _rotation, ...rawGuide } = path, guide = TextPathGuideSchema.parse(rawGuide), firstAlignment = text.lineStyles?.find(run => run.start === 0)?.alignment ?? text.textAlign ?? 'left';
  const next = cloneSceneObject(text), vertical = next.textScaleY ?? 1;
  next.text = next.text.replace(/\n/g, ' '); next.fontSizePt *= vertical; next.textScaleX = (next.textScaleX ?? 1) / vertical; next.textScaleY = 1;
  if (next.strokeMm !== undefined) next.strokeMm *= vertical;
  if (next.letterSpacingPt !== undefined) next.letterSpacingPt *= vertical;
  if (next.characterStyles) next.characterStyles = next.characterStyles.map(run => ({ ...run, style: { ...run.style, ...(run.style.strokeMm === undefined ? {} : { strokeMm: run.style.strokeMm * vertical }), ...(run.style.fontSizePt === undefined ? {} : { fontSizePt: run.style.fontSizePt * vertical }), ...(run.style.kerningPt === undefined ? {} : { kerningPt: run.style.kerningPt * vertical }) } }));
  delete next.textBox; delete next.lineStyles; next.textAlign = firstAlignment === 'justify-left' ? 'center' : firstAlignment; next.rotationDeg = path.rotationDeg ?? 0;
  next.textPath = { guide, originalPathId: path.id, offsetMm: 0, baseline: 'baseline', reversed: false, showGuide: false };
  const attached = placeTextPathGuide(next, objectCenter(path, measure), measure);
  return doc.objects.filter(object => object.id !== pathId).map(object => object.id === textId ? attached : object);
}
export function detachTextPath(doc: GraphicDocument, textId: string, pathId: string, measure: Measure): SceneObject[] {
  const text = doc.objects.find(object => object.id === textId); if (text?.type !== 'text' || !text.textPath) throw new Error('Il testo non è applicato a un tracciato');
  if (doc.objects.some(object => object.id === pathId) || doc.groups?.some(group => group.id === pathId)) throw new Error('ID del tracciato già presente'); if (doc.objects.length >= EDITOR_LIMITS.objects) throw new Error(`La separazione richiede un posto libero entro i ${EDITOR_LIMITS.objects} oggetti del laboratorio`); assertUngrouped(doc, [textId]);
  const guide = { ...structuredClone(text.textPath.guide), id: pathId, xMm: 0, yMm: 0, rotationDeg: text.textPath.guide.type === 'circle' ? 0 : text.rotationDeg ?? 0 } as GuideObject;
  const path = placeObjectAtCenter(guide, textPathGuideCenter(text, measure), measure), plain = cloneSceneObject(text); delete plain.textPath;
  const freeText = placeObjectAtCenter(plain, objectCenter(text, measure), measure);
  return doc.objects.flatMap(object => object.id === textId ? [path, freeText] : [object]);
}
export function updateTextPath(object: TextObject, change: Partial<Omit<TextPathBinding, 'guide' | 'originalPathId'>>, measure: Measure): TextObject {
  if (!object.textPath) throw new Error('Il testo non ha un tracciato'); return preserveTextPathGuide(object, { ...object, textPath: { ...object.textPath, ...change } }, measure);
}
export function guideClosed(guide: TextPathGuide): boolean { if (guide.type === 'vector') return guide.commands.at(-1)?.[0] === 'Z'; return guide.type === 'circle' || guide.type === 'ellipse' || (guide.type === 'path' || guide.type === 'bezier') && guide.closed; }
