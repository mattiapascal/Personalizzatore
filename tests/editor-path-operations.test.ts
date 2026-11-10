import { describe, expect, it } from 'vitest';
import { reflectPath, reversePath, openPathAtNode } from '../src/editor/path-operations';
import { pathWorldPoints, type PathObject } from '../src/editor/path-nodes';
import { createDocument, DocumentStore, objectCenter, type Measure } from '../src/editor/model';
const measure: Measure = object => object.type === 'path' ? { widthMm: object.widthMm + object.strokeMm, heightMm: object.heightMm + object.strokeMm } : { widthMm: 1, heightMm: 1 };
const path = (rotationDeg = 0): PathObject => ({ id: 'path', type: 'path', xMm: 10, yMm: 5, widthMm: 10, heightMm: 6, points: [{ x: 0, y: 0 }, { x: 1, y: 0.2 }, { x: 0.3, y: 1 }], closed: true, rotationDeg, strokeMm: 0.25, stroke: '#000000', fill: '#000000' });
const near = (a: { xMm: number; yMm: number }, b: { xMm: number; yMm: number }) => { expect(a.xMm).toBeCloseTo(b.xMm, 8); expect(a.yMm).toBeCloseTo(b.yMm, 8); };
describe('operazioni geometriche sui tracciati', () => {
  it('riflette i vertici rispetto agli assi del foglio a ogni rotazione mantenendo centro e sorgente', () => {
    for (const angle of [0, 30, 90, -135, 180]) for (const axis of ['horizontal', 'vertical'] as const) {
      const original = path(angle), saved = structuredClone(original), before = pathWorldPoints(original, measure), center = objectCenter(original, measure), reflected = reflectPath(original, axis, measure);
      pathWorldPoints(reflected, measure).forEach((point, index) => near(point, { xMm: axis === 'horizontal' ? 2 * center.xMm - before[index]!.xMm : before[index]!.xMm, yMm: axis === 'vertical' ? 2 * center.yMm - before[index]!.yMm : before[index]!.yMm })); near(objectCenter(reflected, measure), center);
      pathWorldPoints(reflectPath(reflected, axis, measure), measure).forEach((point, index) => near(point, before[index]!)); expect(original).toEqual(saved); expect(reflected).toMatchObject({ id: original.id, fill: original.fill, closed: true, strokeMm: original.strokeMm });
    }
  });
  it('tracciati piatti restano normalizzati e supportano la riflessione ruotata', () => {
    for (const flat of ['widthMm', 'heightMm'] as const) {
      const original: PathObject = { ...path(30), [flat]: 0, closed: false, fill: 'none', points: flat === 'widthMm' ? [{ x: 0, y: 0 }, { x: 0, y: 1 }] : [{ x: 0, y: 0 }, { x: 1, y: 0 }] };
      for (const axis of ['horizontal', 'vertical'] as const) { const reflected = reflectPath(original, axis, measure), doc = createDocument(); doc.objects = [reflected]; expect(() => new DocumentStore(doc, measure)).not.toThrow(); expect(reflected.points.map(point => point[flat === 'widthMm' ? 'x' : 'y'])).toEqual([0, 0]); }
    }
  });
  it('inverte l’ordine senza alterare le coordinate del contorno e la doppia inversione è identica', () => {
    const original = path(30), before = pathWorldPoints(original, measure), reversed = reversePath(original); expect(reversePath(reversed)).toEqual(original); pathWorldPoints(reversed, measure).forEach((point, index) => near(point, before[before.length - 1 - index]!)); expect(reversed.fill).toBe('#000000'); reversed.points[0]!.x = 0.9; expect(original.points[2]!.x).toBe(0.3);
  });
  it('apre dal vertice scelto duplicando l’estremità e conserva tutti i segmenti del contorno', () => {
    const original = path(30), before = pathWorldPoints(original, measure), opened = openPathAtNode(original, 1), after = pathWorldPoints(opened, measure); expect(opened).toMatchObject({ closed: false, fill: 'none', id: original.id }); expect(after).toHaveLength(4); [1, 2, 0, 1].forEach((index, i) => near(after[i]!, before[index]!)); expect(opened.points[0]).not.toBe(opened.points.at(-1)); expect(original.closed).toBe(true);
    for (const index of [-1, 3, 0.5]) expect(() => openPathAtNode(original, index)).toThrow('Nodo'); expect(() => openPathAtNode(opened, 0)).toThrow('già aperto'); expect(() => openPathAtNode({ ...original, points: Array(512).fill({ x: 0, y: 0 }) }, 0)).toThrow('512');
  });
  it('stesso updateObject per UI e AI con JSON, storico e revisione obsoleta respinta', () => {
    const doc = createDocument(); doc.objects = [path(30)]; const store = new DocumentStore(doc, measure), reflected = reflectPath(path(30), 'horizontal', measure); store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: 'path', expectedRevision: 0, arguments: { object: reflected } }, 'manual');
    const opened = openPathAtNode(reflected, 1); store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: 'path', expectedRevision: 1, arguments: { object: opened } }, 'ai-simulation'); const saved = JSON.parse(JSON.stringify(store.document)); store.undo(); expect(store.document.objects).toEqual([reflected]); expect(() => store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: 'path', expectedRevision: 1, arguments: { object: opened } }, 'ai-simulation')).toThrow('obsoleta'); store.redo(); expect(store.document.objects).toEqual(saved.objects);
  });
});
