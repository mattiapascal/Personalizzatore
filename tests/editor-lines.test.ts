import { describe, expect, it } from 'vitest';
import { createDocument, DocumentStore, objectGeometry, objectCenter, placeObjectAtCenter, parseGraphicDocument, type SceneObject, type Measure } from '../src/editor/model';
const measure: Measure = o => o.type === 'line' ? { widthMm: o.lengthMm + o.strokeMm, heightMm: o.strokeMm } : { widthMm: 4, heightMm: 4 };
const line = (): Extract<SceneObject, { type: 'line' }> => ({ id: 'line', type: 'line', xMm: 10, yMm: 5, lengthMm: 12, strokeMm: 0.25, stroke: '#000000', strokeDash: 'solid' });
const command = (revision: number, tool: string, args: unknown) => ({ schemaVersion: 1, tool, objectId: 'line', expectedRevision: revision, arguments: args });
describe('linee vettoriali nel documento comune', () => {
  it('aggiunta, trasformazione, JSON e undo/redo conservano la linea e il tratto fisico', () => {
    const doc = createDocument(); doc.objects = []; const store = new DocumentStore(doc, measure);
    store.dispatch(command(0, 'addObject', { object: line() }), 'manual');
    store.dispatch(command(1, 'transformObject', { xMm: 15, yMm: 4, rotationDeg: 45, size: { type: 'line', lengthMm: 18 } }), 'ai-simulation');
    expect(store.document.objects[0]).toMatchObject({ lengthMm: 18, rotationDeg: 45, strokeMm: 0.25 });
    const saved = structuredClone(store.document); store.import(JSON.parse(JSON.stringify(saved))); store.undo(); store.undo(); expect(store.document.objects[0]).toEqual(line());
    store.redo(); expect(store.document.objects).toEqual(saved.objects);
  });
  it('a 90 gradi gli ingombri comprendono il tratto e il centro si conserva nelle modifiche', () => {
    const original = line(), center = objectCenter(original, measure), changed = placeObjectAtCenter({ ...original, lengthMm: 18, rotationDeg: 90, strokeMm: 0.5 }, center, measure);
    const bounds = objectGeometry(changed, measure); expect(bounds.widthMm).toBeCloseTo(0.5); expect(bounds.heightMm).toBeCloseTo(18.5); expect(objectCenter(changed, measure)).toEqual(center);
  });
  it('rifiuta lunghezza o tratto invalidi e un riempimento/contorno non ammesso, senza perdere redo', () => {
    const doc = createDocument(); doc.objects = []; const store = new DocumentStore(doc, measure); store.dispatch(command(0, 'addObject', { object: line() }), 'manual'); store.undo();
    const before = structuredClone(store.document);
    for (const object of [{ ...line(), lengthMm: 0 }, { ...line(), strokeMm: 0 }, { ...line(), stroke: 'none' }, { ...line(), fill: '#000000' }, { ...line(), lengthMm: NaN }, { ...line(), rotationDeg: 181 }]) {
      expect(() => store.dispatch(command(2, 'addObject', { object }), 'manual')).toThrow(); expect(store.document).toEqual(before);
    }
    store.redo(); expect(store.document.objects[0]).toEqual(line());
  });
  it('linee raggruppate scalano anche i tratti, mantengono ID e non entrano nei v1', () => {
    const doc = createDocument(); doc.objects = [line(), { ...line(), id: 'other', yMm: 9 }]; doc.groups = [{ id: 'g', objectIds: ['line', 'other'] }];
    const store = new DocumentStore(doc, measure);
    store.dispatch(command(0, 'transformObjects', { objectIds: ['line', 'other'], scale: 1.5, rotationDeg: 30, center: { xMm: 29, yMm: 11 } }), 'manual');
    expect(store.document.objects[0]).toMatchObject({ type: 'line', lengthMm: 18, strokeMm: 0.375, rotationDeg: 30 }); expect(store.document.groups).toEqual(doc.groups);
    expect(() => parseGraphicDocument({ ...doc, groups: undefined, schemaVersion: 1 })).toThrow();
  });
});

import { lineFromEndpoints, constrainedLineEnd } from '../src/editor/line-geometry';
describe('costruzione delle linee da due punti', () => {
  it('conserva estremità e centro in tutti i quadranti, incluse linee verticali', () => {
    for (const end of [{ xMm: 20, yMm: 10 }, { xMm: 3, yMm: 2 }, { xMm: 10, yMm: 17 }, { xMm: 20, yMm: 5 }]) {
      const start = { xMm: 10, yMm: 5 }, object = lineFromEndpoints('new-line', start, end), center = objectCenter(object, measure), angle = (object.rotationDeg ?? 0) * Math.PI / 180;
      expect(center.xMm - Math.cos(angle) * object.lengthMm / 2).toBeCloseTo(start.xMm, 8); expect(center.yMm - Math.sin(angle) * object.lengthMm / 2).toBeCloseTo(start.yMm, 8);
      expect(center.xMm + Math.cos(angle) * object.lengthMm / 2).toBeCloseTo(end.xMm, 8); expect(center.yMm + Math.sin(angle) * object.lengthMm / 2).toBeCloseTo(end.yMm, 8);
    }
  });
  it('vincola a multipli di 45° conservando la distanza e rifiuta punti degeneri', () => {
    const start = { xMm: 10, yMm: 5 }, end = { xMm: 20, yMm: 8 }, constrained = constrainedLineEnd(start, end);
    expect(constrained.yMm).toBe(5); expect(Math.hypot(constrained.xMm - start.xMm, constrained.yMm - start.yMm)).toBeCloseTo(Math.hypot(10, 3));
    expect(() => lineFromEndpoints('line', start, start)).toThrow('distinti'); expect(() => lineFromEndpoints('line', start, { xMm: NaN, yMm: 1 })).toThrow('finiti');
  });
});
