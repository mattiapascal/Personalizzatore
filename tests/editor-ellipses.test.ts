import { describe, expect, it } from 'vitest';
import { createDocument, DocumentStore, objectCenter, objectGeometry, objectIntersectsArea, parseGraphicDocument, type Measure, type SceneObject } from '../src/editor/model';
import { primitiveFromEndpoints, constrainedPrimitiveEnd } from '../src/editor/primitive-geometry';
const ellipse = (): Extract<SceneObject, { type: 'ellipse' }> => ({ id: 'oval', type: 'ellipse', xMm: 10, yMm: 5, rxMm: 4, ryMm: 2, rotationDeg: 0, strokeMm: 0.25, stroke: '#000000' });
const measure: Measure = o => o.type === 'ellipse' ? { widthMm: o.rxMm * 2 + (o.stroke === 'none' ? 0 : o.strokeMm), heightMm: o.ryMm * 2 + (o.stroke === 'none' ? 0 : o.strokeMm) } : { widthMm: 4, heightMm: 4 };
const command = (revision: number, tool: string, args: unknown) => ({ schemaVersion: 1, tool, expectedRevision: revision, objectId: 'oval', arguments: args });
describe('ellissi nel documento condiviso', () => {
  it('aggiunta manuale, trasformazione simulata, copia, riapertura e storico', () => {
    const doc = createDocument(); doc.objects = []; const store = new DocumentStore(doc, measure);
    store.dispatch(command(0, 'addObject', { object: ellipse() }), 'manual');
    store.dispatch(command(1, 'transformObject', { xMm: 12, yMm: 4, rotationDeg: 90, size: { type: 'ellipse', rxMm: 6, ryMm: 3 } }), 'ai-simulation');
    const bounds = objectGeometry(store.document.objects[0]!, measure); expect(bounds.widthMm).toBeCloseTo(6.25, 8); expect(bounds.heightMm).toBeCloseTo(12.25, 8);
    store.dispatch(command(2, 'duplicateObject', { newObjectId: 'copy', xMm: 30, yMm: 4 }), 'manual');
    expect(store.document.objects[1]).toMatchObject({ rxMm: 6, ryMm: 3, rotationDeg: 90, id: 'copy' });
    const saved = structuredClone(store.document); store.import(JSON.parse(JSON.stringify(saved))); expect(store.document.objects).toEqual(saved.objects);
    store.undo(); store.undo(); expect(store.document.objects).toHaveLength(1); store.undo(); expect(store.document.objects).toEqual([ellipse()]);
  });
  it('scala e rotazione dell’insieme preservano raggi, ID e contorno', () => {
    const doc = createDocument(); doc.objects = [ellipse(), { ...ellipse(), id: 'b', xMm: 22 }]; const store = new DocumentStore(doc, measure);
    store.dispatch(command(0, 'groupObjects', { objectIds: ['oval', 'b'], groupId: 'g' }), 'manual');
    store.dispatch(command(1, 'transformObjects', { objectIds: ['oval', 'b'], scale: 1.5, rotationDeg: 30, center: { xMm: 29, yMm: 11 } }), 'manual');
    expect(store.document.objects[0]).toMatchObject({ id: 'oval', rxMm: 6, ryMm: 3, strokeMm: 0.375, rotationDeg: 30 }); expect(store.document.groups).toEqual([{ id: 'g', objectIds: ['oval', 'b'] }]);
  });
  it('valida raggi, stile, revisione e compatibilità v1 senza perdere redo', () => {
    const doc = createDocument(); doc.objects = []; const store = new DocumentStore(doc, measure);
    store.dispatch(command(0, 'addObject', { object: ellipse() }), 'manual'); store.undo(); const before = structuredClone(store.document);
    for (const object of [{ ...ellipse(), rxMm: 0 }, { ...ellipse(), ryMm: -1 }, { ...ellipse(), rxMm: Infinity }, { ...ellipse(), rotationDeg: 181 }, { ...ellipse(), fill: 'red' }]) {
      expect(() => store.dispatch(command(before.revision, 'addObject', { object }), 'manual')).toThrow(); expect(store.document).toEqual(before);
    }
    expect(() => store.dispatch(command(0, 'addObject', { object: ellipse() }), 'ai-simulation')).toThrow('obsoleta'); store.redo(); expect(store.document.objects).toEqual([ellipse()]);
    expect(() => parseGraphicDocument({ ...doc, schemaVersion: 1, objects: [ellipse()] })).toThrow();
  });
  it('disegno tra angoli, Maiusc circolare e coordinate centrali coerenti', () => {
    const start = { xMm: 20, yMm: 10 }, end = { xMm: 10, yMm: 4 };
    const object = primitiveFromEndpoints('ellipse', 'oval', start, end); expect(object).toMatchObject({ xMm: 9.875, yMm: 3.875, rxMm: 5, ryMm: 3 }); expect(objectCenter(object, measure)).toEqual({ xMm: 15, yMm: 7 });
    const circular = primitiveFromEndpoints('ellipse', 'oval', start, constrainedPrimitiveEnd('ellipse', start, end)); expect(circular).toMatchObject({ rxMm: 5, ryMm: 5 });
  });
  it('uscita ruotata: distingue l’ellisse dalla cornice, anche nell’area tonda', () => {
    const object = { ...ellipse(), rxMm: 6, ryMm: 0.5, rotationDeg: -45 }, geometry = objectGeometry(object, measure);
    object.xMm = -3 - geometry.widthMm / 2; object.yMm = -3 - geometry.heightMm / 2;
    expect(object.xMm + geometry.widthMm).toBeGreaterThan(0); expect(objectIntersectsArea(createDocument(), object, measure)).toBe(false);
    const visible = { ...ellipse(), xMm: -4, yMm: 5 }; expect(objectIntersectsArea(createDocument(), visible, measure)).toBe(true);
  });
});
