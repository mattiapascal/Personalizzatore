import { describe, expect, it } from 'vitest';
import { createDocument, DocumentStore, cloneGraphicDocument, type SceneObject, type Measure } from '../src/editor/model';
import { canReorderSelection } from '../src/editor/selection';
const measure: Measure = () => ({ widthMm: 5, heightMm: 4 });
const rectangle = (id: string): SceneObject => ({ id, type: 'rect', xMm: 10, yMm: 5, widthMm: 5, heightMm: 4, strokeMm: 0.25, stroke: '#000000' });
const order = (store: DocumentStore) => store.document.objects.map(object => object.id);
function storeFor(ids = ['a', 'b', 'c', 'd', 'e']) { const doc = createDocument(); doc.objects = ids.map(rectangle); return new DocumentStore(doc, measure); }
const command = (store: DocumentStore, position: string, objectIds: string[]) => ({ schemaVersion: 1, tool: 'reorderObjects', expectedRevision: store.document.revision, objectId: objectIds[0], arguments: { objectIds, position } });
describe('ordine dei livelli di selezioni e gruppi', () => {
  it('porta davanti e sul fondo preservando l’ordine relativo di selezionati e altri', () => {
    const store = storeFor(), before = cloneGraphicDocument(store.document); store.dispatch(command(store, 'front', ['a', 'c']), 'manual'); expect(order(store)).toEqual(['b', 'd', 'e', 'a', 'c']); store.dispatch(command(store, 'back', ['a', 'c']), 'manual'); expect(order(store)).toEqual(['a', 'c', 'b', 'd', 'e']); store.undo(); store.undo(); expect(store.document.objects).toEqual(before.objects); store.redo(); expect(order(store)).toEqual(['b', 'd', 'e', 'a', 'c']);
  });
  it('avanza/arretra blocchi contigui o sparsi di una unità senza inversioni', () => {
    for (const ids of [['a', 'b'], ['a', 'c']]) {
      const store = storeFor(['a', 'b', 'c', 'd']); store.dispatch(command(store, 'forward', ids), 'manual'); expect(order(store)).toEqual(ids[1] === 'b' ? ['c', 'a', 'b', 'd'] : ['b', 'a', 'd', 'c']); store.dispatch(command(store, 'backward', ids), 'manual'); expect(order(store)).toEqual(['a', 'b', 'c', 'd']);
    }
  });
  it('il gruppo è un’unica unità, anche se la selezione include altri elementi', () => {
    const store = storeFor(); store.dispatch({ schemaVersion: 1, tool: 'groupObjects', objectId: 'b', expectedRevision: 0, arguments: { objectIds: ['b', 'c'], groupId: 'g' } }, 'manual'); const grouped = cloneGraphicDocument(store.document);
    store.dispatch(command(store, 'forward', ['b', 'c']), 'ai-simulation'); expect(order(store)).toEqual(['a', 'd', 'b', 'c', 'e']); expect(store.document.groups).toEqual(grouped.groups);
    store.dispatch(command(store, 'back', ['a', 'b', 'c']), 'manual'); expect(order(store)).toEqual(['a', 'b', 'c', 'd', 'e']); expect(store.document.objects).toEqual(grouped.objects);
  });
  it('pulsanti indisponibili ai limiti e nessuna mutazione su errori o revisioni obsolete', () => {
    const store = storeFor(); expect(canReorderSelection(store.document, ['d', 'e'], 'front')).toBe(false); expect(canReorderSelection(store.document, ['d', 'e'], 'forward')).toBe(false); expect(canReorderSelection(store.document, ['a', 'b'], 'back')).toBe(false); expect(canReorderSelection(store.document, ['a', 'b'], 'backward')).toBe(false); expect(canReorderSelection(store.document, ['a', 'e'], 'front')).toBe(true);
    store.dispatch(command(store, 'front', ['a', 'b']), 'manual'); store.undo(); const before = cloneGraphicDocument(store.document);
    for (const raw of [{ ...command(store, 'back', ['a', 'b']), expectedRevision: 0 }, command(store, 'front', ['a', 'missing']), command(store, 'front', ['a', 'a']), command(store, 'invalid', ['a', 'b'])]) { expect(() => store.dispatch(raw, 'ai-simulation')).toThrow(); expect(store.document).toEqual(before); }
    store.redo(); expect(order(store)).toEqual(['c', 'd', 'e', 'a', 'b']);
  });
});
