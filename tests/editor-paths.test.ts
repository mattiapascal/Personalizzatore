import { describe, expect, it } from 'vitest';
import { createDocument, DocumentStore, objectCenter, objectIntersectsArea, parseGraphicDocument, type SceneObject, type Measure } from '../src/editor/model';
import { strokeGeometry } from '../src/editor/path-geometry';
const path = (): Extract<SceneObject, { type: 'path' }> => ({ id: 'path', type: 'path', ...strokeGeometry([{ xMm: 10, yMm: 5 }, { xMm: 15, yMm: 10 }, { xMm: 20, yMm: 5 }]), closed: false, strokeMm: 0.25, stroke: '#000000' });
const measure: Measure = o => o.type === 'path' ? { widthMm: o.widthMm + o.strokeMm, heightMm: o.heightMm + o.strokeMm } : { widthMm: 4, heightMm: 4 };
const command = (revision: number, tool: string, args: unknown) => ({ schemaVersion: 1, tool, objectId: 'path', expectedRevision: revision, arguments: args });
describe('tracciati vettoriali nello store comune', () => {
  it('aggiunta manuale, trasformazione AI, copia e round-trip conservano nodi e identità', () => {
    const doc = createDocument(); doc.objects = []; const store = new DocumentStore(doc, measure);
    store.dispatch(command(0, 'addObject', { object: path() }), 'manual');
    store.dispatch(command(1, 'transformObject', { xMm: 12, yMm: 5, rotationDeg: 30, size: { type: 'path', widthMm: 12, heightMm: 6 } }), 'ai-simulation');
    expect(store.document.objects[0]).toMatchObject({ type: 'path', widthMm: 12, heightMm: 6, points: path().points, strokeMm: 0.25 });
    store.dispatch(command(2, 'duplicateObject', { newObjectId: 'copy', xMm: 30, yMm: 5 }), 'manual'); const saved = structuredClone(store.document);
    store.import(JSON.parse(JSON.stringify(saved))); expect(store.document.objects).toEqual(saved.objects);
    store.undo(); store.undo(); store.undo(); expect(store.document.objects).toEqual([path()]); store.redo(); expect(store.document.objects[0]).toMatchObject({ widthMm: 12 });
  });
  it('consente chiusura e riempimento, rifiuta il riempimento di un tracciato aperto', () => {
    const doc = createDocument(); doc.objects = [path()]; const store = new DocumentStore(doc, measure);
    store.dispatch(command(0, 'updateObject', { object: { ...path(), closed: true, fill: '#000000' } }), 'manual'); const before = structuredClone(store.document);
    expect(() => store.dispatch(command(1, 'updateObject', { object: { ...path(), fill: '#000000' } }), 'manual')).toThrow('aperto'); expect(store.document).toEqual(before);
  });
  it('rifiuta punti ostili, degeneri, non normalizzati e revisioni obsolete, conservando redo', () => {
    const doc = createDocument(); doc.objects = []; const store = new DocumentStore(doc, measure);
    store.dispatch(command(0, 'addObject', { object: path() }), 'manual'); store.undo(); const before = structuredClone(store.document);
    for (const object of [{ ...path(), points: [{ x: 0, y: 0 }] }, { ...path(), points: [{ x: 0, y: 0 }, { x: 2, y: 1 }] }, { ...path(), points: [{ x: 0.1, y: 0 }, { x: 1, y: 1 }] }, { ...path(), widthMm: 0, heightMm: 0 }, { ...path(), points: Array(513).fill({ x: 0, y: 0 }) }, { ...path(), stroke: 'none' }, { ...path(), code: 'alert(1)' }]) {
      expect(() => store.dispatch(command(2, 'addObject', { object }), 'ai-simulation')).toThrow(); expect(store.document).toEqual(before);
    }
    expect(() => store.dispatch(command(0, 'addObject', { object: path() }), 'manual')).toThrow('obsoleta'); store.redo(); expect(store.document.objects).toEqual([path()]);
    expect(() => parseGraphicDocument({ ...doc, schemaVersion: 1, objects: [path()] })).toThrow();
  });
  it('scala gruppi senza cambiare i punti e accetta tracciati perfettamente orizzontali', () => {
    const doc = createDocument(); doc.objects = [path(), { ...path(), id: 'flat', ...strokeGeometry([{ xMm: 30, yMm: 5 }, { xMm: 40, yMm: 5 }]) }]; const store = new DocumentStore(doc, measure);
    store.dispatch(command(0, 'groupObjects', { objectIds: ['path', 'flat'], groupId: 'g' }), 'manual');
    store.dispatch(command(1, 'transformObjects', { objectIds: ['path', 'flat'], scale: 1.5, rotationDeg: 20, center: { xMm: 29, yMm: 11 } }), 'manual');
    expect(store.document.objects[0]).toMatchObject({ widthMm: 15, heightMm: 7.5, strokeMm: 0.375, points: path().points, rotationDeg: 20 }); expect(store.document.objects[1]).toMatchObject({ heightMm: 0, widthMm: 15 });
  });
  it('il cestino usa i segmenti, includendo cap rotondi e contenimento del riempimento', () => {
    const doc = createDocument(), outside = { ...path(), ...strokeGeometry([{ xMm: -10, yMm: 2 }, { xMm: 2, yMm: -10 }]) };
    expect(outside.xMm + outside.widthMm).toBeGreaterThan(0); expect(outside.yMm + outside.heightMm).toBeGreaterThan(0); expect(objectIntersectsArea(doc, outside, measure)).toBe(false);
    const touching = { ...path(), ...strokeGeometry([{ xMm: -5, yMm: 5 }, { xMm: -0.1, yMm: 5 }]) }; expect(objectIntersectsArea(doc, touching, measure)).toBe(true);
    const box = { ...path(), ...strokeGeometry([{ xMm: -1, yMm: -1 }, { xMm: 59, yMm: -1 }, { xMm: 59, yMm: 23 }, { xMm: -1, yMm: 23 }]), closed: true };
    expect(objectIntersectsArea(doc, box, measure)).toBe(false); expect(objectIntersectsArea(doc, { ...box, fill: '#000000' }, measure)).toBe(true);
    expect(objectCenter(path(), measure)).toEqual({ xMm: 15, yMm: 7.5 });
  });
});
