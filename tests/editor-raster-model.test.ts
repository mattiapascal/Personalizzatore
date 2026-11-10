import { describe, expect, it } from 'vitest';
import { createDocument, DocumentStore, cloneGraphicDocument, parseGraphicDocument, type SceneObject, type Measure } from '../src/editor/model';
import { rasterSourceFromBytes } from '../src/editor/raster-source';
import { DEFAULT_RASTER } from '../src/editor/raster-processing';
import { measureFabric } from '../src/editor/fabric-adapter';
import { testPng } from './helpers/png';
const image = (): Extract<SceneObject, { type: 'image' }> => ({ id: 'image', type: 'image', xMm: 10, yMm: 5, widthMm: 8, heightMm: 8, source: rasterSourceFromBytes('asset-image', testPng()), raster: { ...DEFAULT_RASTER } });
const measure: Measure = o => o.type === 'image' ? { widthMm: o.widthMm, heightMm: o.heightMm } : { widthMm: 4, heightMm: 4 };
const command = (revision: number, tool: string, args: unknown) => ({ schemaVersion: 1, tool, objectId: 'image', expectedRevision: revision, arguments: args });
describe('immagini originali nel documento comune', () => {
  it('aggiunge, elabora, duplica e riapre senza cambiare i byte originali o l’ID sorgente', () => {
    const doc = createDocument(); doc.objects = []; const store = new DocumentStore(doc, measure), original = image();
    store.dispatch(command(0, 'addObject', { object: original }), 'manual');
    store.dispatch(command(1, 'updateObject', { object: { ...original, raster: { threshold: 64, invert: true, whiteTransparent: true } } }), 'ai-simulation');
    store.dispatch(command(2, 'duplicateObject', { newObjectId: 'copy', xMm: 25, yMm: 5 }), 'manual');
    const saved = cloneGraphicDocument(store.document); expect(saved.objects[0]).toMatchObject({ source: original.source, raster: { threshold: 64, invert: true } }); expect(saved.objects[1]).toMatchObject({ source: original.source });
    store.import(JSON.parse(JSON.stringify(saved))); expect(store.document.objects).toEqual(saved.objects); store.undo(); store.undo(); store.undo(); expect(store.document.objects).toEqual([original]); store.redo(); expect(store.document.objects[0]).toMatchObject({ source: original.source, raster: { threshold: 64 } });
  });
  it('impedisce sorgenti cambiate e deformazione, conservando scena e redo', () => {
    const doc = createDocument(); doc.objects = [image()]; const store = new DocumentStore(doc, measure);
    store.dispatch(command(0, 'moveObject', { xMm: 12, yMm: 5 }), 'manual'); store.undo(); const before = cloneGraphicDocument(store.document), object = image();
    for (const changed of [{ ...object, source: { ...object.source, id: 'other-source' } }, { ...object, widthMm: 10 }, { ...object, raster: { ...object.raster, threshold: 1.5 } }, { ...object, opacity: 0.5 }]) {
      expect(() => store.dispatch(command(before.revision, 'updateObject', { object: changed }), 'ai-simulation')).toThrow(); expect(store.document).toEqual(before);
    }
    store.redo(); expect(store.document.objects[0]!.xMm).toBe(12);
  });
  it('limita le immagini e rifiuta risorse diverse con lo stesso ID', () => {
    const doc = createDocument(); doc.objects = Array.from({ length: 4 }, (_, i) => ({ ...image(), id: i ? `copy-${i}` : 'image' })); const store = new DocumentStore(doc, measure);
    expect(() => store.dispatch(command(0, 'addObject', { object: { ...image(), id: 'fifth' } }), 'manual')).toThrow(); expect(store.document.revision).toBe(0);
    const other = rasterSourceFromBytes('asset-image', testPng(2, 2, new Uint8Array(16).fill(255)));
    expect(() => parseGraphicDocument({ ...doc, objects: [image(), { ...image(), id: 'copy', source: other }] })).toThrow('dati diversi');
    expect(() => parseGraphicDocument({ ...doc, schemaVersion: 1, objects: [image()] })).toThrow();
  });
  it('scala e ruota il gruppo senza introdurre stroke o modifiche alla sorgente', () => {
    const doc = createDocument(); doc.objects = [image(), { id: 'rect', type: 'rect', xMm: 25, yMm: 5, widthMm: 4, heightMm: 4, strokeMm: 0.25, stroke: '#000000' }]; const store = new DocumentStore(doc, measure);
    store.dispatch(command(0, 'groupObjects', { objectIds: ['image', 'rect'], groupId: 'g' }), 'manual');
    store.dispatch(command(1, 'transformObjects', { objectIds: ['image', 'rect'], scale: 1.5, rotationDeg: 30, center: { xMm: 29, yMm: 11 } }), 'manual');
    expect(store.document.objects[0]).toMatchObject({ type: 'image', widthMm: 12, heightMm: 12, rotationDeg: 30, source: image().source }); expect(store.document.objects[0]).not.toHaveProperty('strokeMm');
  });
  it('clona i metadati mutabili e il misuratore reale rifiuta risorse non decodificate', () => {
    const doc = createDocument(); doc.objects = [image()]; const copied = cloneGraphicDocument(doc), object = copied.objects[0];
    if (object?.type !== 'image') throw new Error('Tipo inatteso'); object.raster.threshold = 200; object.source.pixelWidth = 3; expect(doc.objects[0]).toEqual(image());
    expect(() => measureFabric(image())).toThrow('non preparata');
  });
});
