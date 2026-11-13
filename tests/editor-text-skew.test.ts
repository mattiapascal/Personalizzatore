import { expect, it } from 'vitest';
import { DocumentSchema, DocumentStore, objectCenter, placeObjectAtCenter, type Measure } from '../src/editor/model';
import { MAX_TEXT_SKEW_DEG } from '../src/editor/limits';
import { captureSelection, clipboardInsertion } from '../src/editor/clipboard';
import { resizeObjectDimension } from '../src/editor/resize-object';
import { createTestDocument } from './helpers/editor-fonts';
import type { TextObject } from '../src/editor/text-style';
import { fabricTextSkew, physicalTextSkew } from '../src/editor/text-skew';
import { archivePreviewContent } from '../src/editor-admin/preview-key';

// Geometry double: tests command semantics, not Fabric's font metrics.
const measure: Measure = object => {
  if (object.type !== 'text') return { widthMm: 20, heightMm: 10 };
  const width = object.textBox?.widthMm ?? object.fontSizePt * 2, height = object.fontSizePt / 2;
  return { widthMm: width + Math.abs(Math.tan((object.textSkewXDeg ?? 0) * Math.PI / 180)) * height, heightMm: height, textLayoutWidthMm: width, textLayoutHeightMm: height };
};
function setup() {
  const doc = createTestDocument(); doc.areaMm = { width: 200, height: 100 };
  doc.objects = [doc.objects.find(object => object.type === 'text')!]; return doc;
}
it('inclinazione finita e limitata, solo per il box; i vecchi documenti mantengono il valore implicito zero', () => {
  const doc = setup(), text = doc.objects[0]!;
  expect(DocumentSchema.parse(doc).objects[0]).not.toHaveProperty('textSkewXDeg');
  for (const value of [-MAX_TEXT_SKEW_DEG, 0, MAX_TEXT_SKEW_DEG]) expect(DocumentSchema.parse({ ...doc, objects: [{ ...text, textSkewXDeg: value }] }).objects[0]).toHaveProperty('textSkewXDeg', value);
  for (const value of [NaN, Infinity, -Infinity, 85.1, -85.1, '12']) expect(() => DocumentSchema.parse({ ...doc, objects: [{ ...text, textSkewXDeg: value }] })).toThrow();
});
it('manuale/AI, centro, stili locali, cronologia, revisione e JSON condividono la stessa trasformazione', () => {
  const doc = setup(), original = doc.objects[0] as TextObject;
  original.rotationDeg = 27; original.characterStyles = [{ start: 0, end: 2, style: { kerningPt: .2, underline: true } }];
  for (const source of ['manual', 'ai-simulation'] as const) {
    const store = new DocumentStore(doc, measure), center = objectCenter(original, measure);
    const skewed = placeObjectAtCenter({ ...original, textSkewXDeg: -19.5 }, center, measure);
    const command = { schemaVersion: 1, tool: 'updateObject', objectId: original.id, expectedRevision: 0, arguments: { object: skewed } };
    store.dispatch(command, source); expect(objectCenter(store.document.objects[0]!, measure)).toEqual(center);
    expect(store.document.objects[0]).toMatchObject({ text: original.text, characterStyles: original.characterStyles, textSkewXDeg: -19.5 });
    expect(DocumentSchema.parse(JSON.parse(JSON.stringify(store.document))).objects).toEqual(store.document.objects);
    expect(() => store.dispatch(command, source)).toThrow('obsoleta');
    store.undo(); expect(store.document.objects).toEqual(doc.objects); store.redo(); expect(store.document.objects).toEqual([skewed]);
    const before = structuredClone(store.document);
    expect(() => store.dispatch({ ...command, expectedRevision: before.revision, arguments: { object: { ...skewed, textSkewXDeg: 90 } } }, source)).toThrow();
    expect(store.document).toEqual(before);
  }
});
it('appunti fra documenti e ridimensionamento proporzionale conservano inclinazione e font esatto', () => {
  const doc = setup(); Object.assign(doc.objects[0]!, { textSkewXDeg: 24, textBox: { widthMm: 20, heightMm: 5, autoWidth: false, autoHeight: true } });
  const copied = captureSelection(doc, [doc.objects[0]!.id]), empty = setup(); empty.objects = [];
  const store = new DocumentStore(empty, measure); store.dispatch(clipboardInsertion(copied, 0, () => 'pasted'), 'manual');
  expect(store.document.objects[0]).toMatchObject({ id: 'pasted', textSkewXDeg: 24, fontFamily: (doc.objects[0] as TextObject).fontFamily });
  const scaled = resizeObjectDimension(store.document.objects[0]!, 'width', 40, true, measure);
  expect(scaled).toMatchObject({ textSkewXDeg: 24, fontSizePt: (doc.objects[0] as TextObject).fontSizePt * 2, textBox: { widthMm: 40 } });
  expect(objectCenter(scaled, measure)).toEqual(objectCenter(store.document.objects[0]!, measure));
});
it('il blocco delle trasformazioni impedisce l’inclinazione anche con il centro preservato', () => {
  const doc = setup(); doc.objects[0]!.editor = { transformLocked: true };
  for (const source of ['manual', 'ai-simulation'] as const) {
    const store = new DocumentStore(doc, measure), original = doc.objects[0]!;
    const skewed = placeObjectAtCenter({ ...original, textSkewXDeg: 10 } as TextObject, objectCenter(original, measure), measure);
    expect(() => store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: original.id, expectedRevision: 0, arguments: { object: skewed } }, source)).toThrow('Trasformazioni');
    expect(store.document).toEqual(doc);
  }
});
it('testo su percorso e box inclinato non vengono combinati o raddrizzati silenziosamente', () => {
  const doc = setup(); (doc.objects[0] as TextObject).textSkewXDeg = 10;
  doc.objects.push({ id: 'guide', type: 'line', xMm: 5, yMm: 20, lengthMm: 40, stroke: '#000000', strokeMm: .2 });
  const store = new DocumentStore(doc, measure);
  expect(() => store.dispatch({ schemaVersion: 1, tool: 'attachTextToPath', objectId: doc.objects[0]!.id, expectedRevision: 0, arguments: { pathObjectId: 'guide' } }, 'manual')).toThrow('Azzera');
  expect(store.document).toEqual(doc);
});
it('le miniature distinguono l’inclinazione, ignorando le sole etichette amministrative', () => {
  const doc = setup(), before = archivePreviewContent(doc), skewed = structuredClone(doc);
  (skewed.objects[0] as TextObject).textSkewXDeg = 18;
  expect(archivePreviewContent(skewed)).not.toBe(before);
  const key = archivePreviewContent(skewed); skewed.objects[0]!.editor = { label: 'TEST nuova etichetta' };
  expect(archivePreviewContent(skewed)).toBe(key);
});

it('angolo fisico indipendente dalla dilatazione: conversione Fabric invertibile senza perdita di segno', () => {
 for (const angle of [-85,-24,0,32,85]) for (const sx of [.1,.8,1,3,10]) for (const sy of [.1,1,10]) {
  const f = fabricTextSkew(angle,sx,sy); expect(Number.isFinite(f)).toBe(true); expect(physicalTextSkew(f,sx,sy)).toBeCloseTo(angle,9);
  expect(sx*Math.tan(f*Math.PI/180)).toBeCloseTo(sy*Math.tan(angle*Math.PI/180),8);
 }
});
