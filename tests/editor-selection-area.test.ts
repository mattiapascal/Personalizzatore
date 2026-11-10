import { describe, expect, it } from 'vitest';
import { createDocument, DocumentStore, cloneGraphicDocument, type SceneObject, type Measure } from '../src/editor/model';
import { selectionBounds } from '../src/editor/selection';
const measure: Measure = object => object.type === 'rect' ? { widthMm: object.widthMm + object.strokeMm, heightMm: object.heightMm + object.strokeMm } : { widthMm: 4, heightMm: 4 };
const rectangle = (id: string, xMm: number, yMm: number): SceneObject => ({ id, type: 'rect', xMm, yMm, widthMm: 8, heightMm: 4, rotationDeg: 30, strokeMm: 0.25, stroke: '#000000' });
function storeFor() { const doc = createDocument(); doc.objects = [rectangle('a', 5, 4), rectangle('b', 25, 6)]; doc.groups = [{ id: 'g', objectIds: ['a', 'b'] }]; return new DocumentStore(doc, measure); }
const command = (store: DocumentStore, alignment: string) => ({ schemaVersion: 1, tool: 'alignObjectsToArea', objectId: 'a', expectedRevision: store.document.revision, arguments: { objectIds: ['a', 'b'], alignment } });
describe('allineamento dell’insieme all’area nominale', () => {
  it('sei direzioni senza scala o modifiche delle distanze interne e dei gruppi', () => {
    for (const alignment of ['left', 'centerX', 'right', 'top', 'centerY', 'bottom']) {
      const store = storeFor(), before = cloneGraphicDocument(store.document); store.dispatch(command(store, alignment), 'manual'); const bounds = selectionBounds(store.document.objects, measure);
      if (alignment === 'left') expect(bounds.xMm).toBeCloseTo(1, 8); if (alignment === 'right') expect(bounds.xMm + bounds.widthMm).toBeCloseTo(57, 8); if (alignment === 'centerX') expect(bounds.xMm + bounds.widthMm / 2).toBeCloseTo(29, 8);
      if (alignment === 'top') expect(bounds.yMm).toBeCloseTo(1, 8); if (alignment === 'bottom') expect(bounds.yMm + bounds.heightMm).toBeCloseTo(21, 8); if (alignment === 'centerY') expect(bounds.yMm + bounds.heightMm / 2).toBeCloseTo(11, 8);
      expect(store.document.objects[1]!.xMm - store.document.objects[0]!.xMm).toBeCloseTo(20, 8); expect(store.document.objects[1]!.yMm - store.document.objects[0]!.yMm).toBeCloseTo(2, 8); expect(store.document.groups).toEqual(before.groups); store.document.objects.forEach(object => expect(object).toMatchObject({ widthMm: 8, heightMm: 4, rotationDeg: 30, strokeMm: 0.25 }));
    }
  });
  it('stesso comando AI e undo/redo, anche senza gruppo persistente', () => {
    const store = storeFor(); delete store.document.groups; const before = cloneGraphicDocument(store.document); store.dispatch(command(store, 'centerX'), 'ai-simulation'); const saved = cloneGraphicDocument(store.document); store.undo(); expect(store.document.objects).toEqual(before.objects); store.redo(); expect(store.document.objects).toEqual(saved.objects); expect(store.document.groups).toBeUndefined();
  });
  it('selezione incompleta o sconosciuta, direzione arbitraria e revisione obsoleta non cambiano lo storico', () => {
    const store = storeFor(); store.dispatch(command(store, 'centerX'), 'manual'); store.undo(); const before = cloneGraphicDocument(store.document);
    for (const raw of [{ ...command(store, 'left'), expectedRevision: 0 }, { ...command(store, 'top'), arguments: { objectIds: ['a', 'missing'], alignment: 'top' } }, command(store, 'diagonal')]) { expect(() => store.dispatch(raw, 'ai-simulation')).toThrow(); expect(store.document).toEqual(before); }
    const partial = storeFor(); partial.document.objects.push(rectangle('c', 40, 5)); expect(() => partial.dispatch({ ...command(partial, 'left'), arguments: { objectIds: ['a', 'c'], alignment: 'left' } }, 'manual')).toThrow('intero gruppo');
    store.redo(); expect(selectionBounds(store.document.objects, measure).xMm + selectionBounds(store.document.objects, measure).widthMm / 2).toBeCloseTo(29, 8);
  });
});
