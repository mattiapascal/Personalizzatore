import { describe, expect, it } from 'vitest';
import { createDocument, DocumentStore, type Measure } from '../src/editor/model';
import { pathWorldPoints, movePathNode, insertPathNode, deletePathNode, type PathObject } from '../src/editor/path-nodes';
const measure: Measure = o => o.type === 'path' ? { widthMm: o.widthMm + o.strokeMm, heightMm: o.heightMm + o.strokeMm } : { widthMm: 4, heightMm: 4 };
const path = (angle = 0): PathObject => ({ id: 'path', type: 'path', xMm: 10, yMm: 5, widthMm: 10, heightMm: 6, points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }], closed: true, rotationDeg: angle, strokeMm: 0.25, stroke: '#000000', fill: '#ffffff' });
const near = (a: { xMm: number; yMm: number }, b: { xMm: number; yMm: number }) => { expect(a.xMm).toBeCloseTo(b.xMm, 7); expect(a.yMm).toBeCloseTo(b.yMm, 7); };
describe('nodi con coordinate assolute e riquadro rinormalizzato', () => {
  it('muove un vertice estremo mantenendo tutti gli altri fermi anche dopo rotazione', () => {
    for (const angle of [-135, -45, 0, 30, 90, 180]) {
      const object = path(angle), before = pathWorldPoints(object, measure), target = { xMm: before[0]!.xMm - 2, yMm: before[0]!.yMm - 1 }, changed = movePathNode(object, 0, target, measure), after = pathWorldPoints(changed, measure);
      near(after[0]!, target); before.slice(1).forEach((point, index) => near(after[index + 1]!, point)); expect(changed).toMatchObject({ id: 'path', rotationDeg: angle, strokeMm: 0.25, fill: '#ffffff', closed: true });
    }
  });
  it('inserisce a metà del segmento e chiude il segmento ultimo/primo senza spostare i vertici', () => {
    const object = path(30), before = pathWorldPoints(object, measure), changed = insertPathNode(object, 3, measure), after = pathWorldPoints(changed, measure);
    expect(after).toHaveLength(5); before.forEach((point, index) => near(after[index]!, point)); near(after[4]!, { xMm: (before[3]!.xMm + before[0]!.xMm) / 2, yMm: (before[3]!.yMm + before[0]!.yMm) / 2 });
  });
  it('elimina un vertice estremo rinormalizzando solo il riquadro', () => {
    const object = path(-45), before = pathWorldPoints(object, measure), after = pathWorldPoints(deletePathNode(object, 0, measure), measure);
    expect(after).toHaveLength(3); before.slice(1).forEach((point, index) => near(after[index]!, point));
  });
  it('conserva una retta aperta ruotata, ma permette di farla diventare un angolo', () => {
    const object = { ...path(30), closed: false, heightMm: 0, fill: 'none' as const, points: [{ x: 0, y: 0 }, { x: 1, y: 0 }] };
    const inserted = insertPathNode(object, 0, measure); expect(inserted.heightMm).toBe(0);
    const before = pathWorldPoints(inserted, measure), moved = movePathNode(inserted, 1, { xMm: before[1]!.xMm, yMm: before[1]!.yMm + 1 }, measure); expect(moved.heightMm).toBeGreaterThan(0); near(pathWorldPoints(moved, measure)[0]!, before[0]!);
  });
  it('rifiuta indici, limiti e degenerazioni, senza modificare l’originale', () => {
    const object = path(), original = structuredClone(object), triangle = deletePathNode(object, 0, measure);
    expect(() => deletePathNode(triangle, 0, measure)).toThrow('tre'); expect(() => movePathNode(object, -1, { xMm: 1, yMm: 2 }, measure)).toThrow('Nodo'); expect(() => movePathNode(object, 1, { xMm: NaN, yMm: 2 }, measure)).toThrow();
    expect(() => insertPathNode({ ...object, points: Array(512).fill({ x: 0, y: 0 }) }, 0, measure)).toThrow('512'); expect(() => insertPathNode({ ...object, closed: false }, 3, measure)).toThrow('finale'); expect(object).toEqual(original);
  });
  it('UI e AI usano updateObject con undo, rifiuto atomico e revisione iniziale', () => {
    const doc = createDocument(); doc.objects = [path(30)]; const store = new DocumentStore(doc, measure), changed = movePathNode(path(30), 0, { xMm: 8, yMm: 3 }, measure);
    store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: 'path', expectedRevision: 0, arguments: { object: changed } }, 'manual'); const saved = structuredClone(store.document); store.undo();
    expect(() => store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: 'path', expectedRevision: 0, arguments: { object: changed } }, 'ai-simulation')).toThrow('obsoleta'); store.redo(); expect(store.document.objects).toEqual(saved.objects);
  });
});
