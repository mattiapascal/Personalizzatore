import { describe, it, expect } from 'vitest';
import { createDocument, DocumentStore, cloneGraphicDocument, parseGraphicDocument, type Measure } from '../src/editor/model';
const measure: Measure = object => object.type === 'rect' ? { widthMm: object.widthMm + object.strokeMm, heightMm: object.heightMm + object.strokeMm } : { widthMm: 5, heightMm: 3 };
const seed = () => { const doc = createDocument(); doc.objects = ['a', 'b', 'c', 'd', 'e'].map((id, i) => ({ id, type: 'rect', xMm: 4 + i * 8, yMm: 5, widthMm: 5, heightMm: 3, strokeMm: 0.25, stroke: '#000000' })); doc.groups = [{ id: 'g', objectIds: ['b', 'c'] }]; return doc; };
const place = (revision: number, ids: string[], targetObjectId: string, side: 'above' | 'below') => ({ schemaVersion: 1, tool: 'placeObjects', objectId: ids[0], expectedRevision: revision, arguments: { objectIds: ids, targetObjectId, side } });
const order = (store: DocumentStore) => store.document.objects.map(object => object.id);
describe('livelli posizionati rispetto a un altro livello tramite comando condiviso', () => {
  it('sposta un elemento sopra/sotto un gruppo senza alterare geometrie o struttura', () => {
    const doc = seed(), store = new DocumentStore(doc, measure); store.dispatch(place(0, ['a'], 'b', 'above'), 'manual'); expect(order(store)).toEqual(['b', 'c', 'a', 'd', 'e']); store.dispatch(place(1, ['e'], 'c', 'below'), 'ai-simulation'); expect(order(store)).toEqual(['e', 'b', 'c', 'a', 'd']); expect(store.document.groups).toEqual(doc.groups);
    for (const object of doc.objects) expect(store.document.objects.find(item => item.id === object.id)).toEqual(object);
  });
  it('sposta gruppi e selezioni non contigue conservando l’ordine relativo', () => {
    const store = new DocumentStore(seed(), measure); store.dispatch(place(0, ['b', 'c'], 'e', 'above'), 'manual'); expect(order(store)).toEqual(['a', 'd', 'e', 'b', 'c']); store.dispatch(place(1, ['c', 'b', 'a'], 'd', 'above'), 'ai-simulation'); expect(order(store)).toEqual(['d', 'a', 'b', 'c', 'e']); expect(store.document.groups).toEqual(seed().groups);
  });
  it('rifiuta gruppi parziali, bersagli selezionati/assenti, ID duplicati e revisioni obsolete atomicamente', () => {
    const store = new DocumentStore(seed(), measure); store.dispatch(place(0, ['a'], 'e', 'above'), 'manual'); store.undo(); const before = cloneGraphicDocument(store.document), rev = before.revision;
    for (const command of [place(rev, ['b'], 'e', 'above'), place(rev, ['a'], 'a', 'below'), place(rev, ['b', 'c'], 'c', 'below'), place(rev, ['a'], 'missing', 'above'), place(rev, ['a', 'a'], 'd', 'above'), place(0, ['a'], 'e', 'above')]) { expect(() => store.dispatch(command, 'ai-simulation')).toThrow(); expect(store.document).toEqual(before); } store.redo(); expect(order(store)).toEqual(['b', 'c', 'd', 'e', 'a']);
  });
  it('JSON e storico mantengono ordine, ID e gruppi', () => {
    const store = new DocumentStore(seed(), measure); store.dispatch(place(0, ['d', 'e'], 'b', 'below'), 'manual'); const saved = cloneGraphicDocument(store.document); expect(parseGraphicDocument(JSON.parse(JSON.stringify(saved)))).toEqual(saved); store.undo(); expect(order(store)).toEqual(['a', 'b', 'c', 'd', 'e']); store.redo(); expect(store.document.objects).toEqual(saved.objects);
  });
});
