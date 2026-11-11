import { describe, expect, it } from 'vitest';
import { createDocument, DocumentStore, objectCenter, cloneGraphicDocument, type Measure, type SceneObject } from '../src/editor/model';
import { rasterSourceFromBytes } from '../src/editor/raster-source';
import { DEFAULT_RASTER } from '../src/editor/raster-processing';
import { testPng } from './helpers/png';
const measure: Measure = object => object.type === 'rect' ? { widthMm: object.widthMm + (object.stroke === 'none' ? 0 : object.strokeMm), heightMm: object.heightMm + (object.stroke === 'none' ? 0 : object.strokeMm) } : { widthMm: 5, heightMm: 3 };
const rect = (id: string, xMm = 10): SceneObject => ({ id, type: 'rect', xMm, yMm: 5, widthMm: 8, heightMm: 4, rotationDeg: 30, strokeMm: 0.2875, stroke: '#000000', fill: 'none' });
const text: SceneObject = { id: 'text', type: 'text', xMm: 30, yMm: 5, text: 'Città', fontFamily: 'Arial', fontSizePt: 9, fill: '#000000', characterStyles: [{ start: 0, end: 2, style: { fill: '#ffffff', fontWeight: 'bold' } }] };
function storeFor(objects: SceneObject[]) { const doc = createDocument(); doc.objects = objects; return new DocumentStore(doc, measure); }
const styleCommand = (store: DocumentStore, style: unknown, ids = store.document.objects.map(object => object.id)) => ({ schemaVersion: 1, tool: 'styleObjects', objectId: ids[0], expectedRevision: store.document.revision, arguments: { objectIds: ids, style } });
describe('stile comune di selezioni e gruppi', () => {
  it('riempie forme e testo completo eliminando soltanto i colori locali dei caratteri', () => {
    const store = storeFor([rect('rect'), text]); store.dispatch(styleCommand(store, { fill: '#ffffff' }), 'manual'); expect(store.document.revision).toBe(1); expect(store.document.objects[0]).toMatchObject({ fill: '#ffffff' }); expect(store.document.objects[1]).toMatchObject({ fill: '#ffffff', characterStyles: [{ start: 0, end: 2, style: { fontWeight: 'bold' } }] });
    store.undo(); expect(store.document.objects).toEqual([rect('rect'), text]); store.redo(); expect(store.document.objects[1]).toMatchObject({ fill: '#ffffff' });
  });
  it('contorno/spessore/tratteggio insieme in un gruppo con centri ruotati invariati', () => {
    const store = storeFor([rect('a'), rect('b', 30)]), centers = store.document.objects.map(object => objectCenter(object, measure));
    store.dispatch({ schemaVersion: 1, tool: 'groupObjects', objectId: 'a', expectedRevision: 0, arguments: { objectIds: ['a', 'b'], groupId: 'g' } }, 'manual');
    store.dispatch(styleCommand(store, { stroke: '#ffffff', strokeMm: 0.3375, strokeDash: 'dashed' }), 'ai-simulation'); const saved = JSON.parse(JSON.stringify(store.document)); expect(saved.groups).toEqual([{ id: 'g', objectIds: ['a', 'b'] }]);
    store.document.objects.forEach((object, index) => { const center = objectCenter(object, measure); expect(center.xMm).toBeCloseTo(centers[index]!.xMm, 8); expect(center.yMm).toBeCloseTo(centers[index]!.yMm, 8); expect(object).toMatchObject({ stroke: '#ffffff', strokeMm: 0.3375, strokeDash: 'dashed' }); });
    store.undo(); expect(store.document.objects).toEqual([rect('a'), rect('b', 30)]); store.redo(); expect(store.document.objects).toEqual(saved.objects);
  });
  it('riempimenti su aperti, contorni su testo e stile su immagini respinti atomicamente', () => {
    const line: SceneObject = { id: 'line', type: 'line', xMm: 20, yMm: 5, lengthMm: 8, strokeMm: 0.25, stroke: '#000000' }, image: SceneObject = { id: 'image', type: 'image', xMm: 20, yMm: 5, widthMm: 4, heightMm: 4, source: rasterSourceFromBytes('asset', testPng()), raster: { ...DEFAULT_RASTER } };
    for (const [object, style] of [[line, { fill: '#ffffff' }], [line, { stroke: 'none' }], [text, { strokeMm: 0.5 }], [text, { fill: 'none' }], [image, { fill: '#000000' }]] as const) {
      const store = storeFor([rect('rect'), object]), before = cloneGraphicDocument(store.document); expect(() => store.dispatch(styleCommand(store, style), 'ai-simulation')).toThrow(); expect(store.document).toEqual(before); expect(store.events).toEqual([]);
    }
  });
  it('stile vuoto, limiti, proprietà arbitrarie e gruppo incompleto non alterano il redo', () => {
    const store = storeFor([rect('a'), rect('b', 30), rect('c', 45)]); store.dispatch({ schemaVersion: 1, tool: 'groupObjects', objectId: 'a', expectedRevision: 0, arguments: { objectIds: ['a', 'b'], groupId: 'g' } }, 'manual'); store.dispatch(styleCommand(store, { fill: '#000000' }), 'manual'); store.undo(); const before = cloneGraphicDocument(store.document);
    for (const style of [{}, { strokeMm: 0 }, { strokeMm: 100.01 }, { opacity: 0.5 }]) { expect(() => store.dispatch(styleCommand(store, style), 'manual')).toThrow(); expect(store.document).toEqual(before); }
    expect(() => store.dispatch(styleCommand(store, { fill: '#000000' }, ['a', 'c']), 'manual')).toThrow('intero gruppo'); const stale = { ...styleCommand(store, { fill: '#000000' }), expectedRevision: 0 }; expect(() => store.dispatch(stale, 'ai-simulation')).toThrow('obsoleta'); store.redo(); expect(store.document.objects.every(object => object.type === 'rect' && object.fill === '#000000')).toBe(true);
  });
  it('nascondere il contorno e ripristinarlo conserva il centro e i parametri', () => {
    const store = storeFor([rect('a'), rect('b', 30)]), centers = store.document.objects.map(object => objectCenter(object, measure)); store.dispatch(styleCommand(store, { stroke: 'none' }), 'manual'); store.dispatch(styleCommand(store, { stroke: '#000000' }), 'manual'); store.document.objects.forEach((object, index) => { expect(objectCenter(object, measure)).toEqual(centers[index]); expect(object).toMatchObject({ strokeMm: 0.2875 }); });
  });
});
