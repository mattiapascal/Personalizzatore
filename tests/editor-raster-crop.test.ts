import { describe, expect, it } from 'vitest';
import { createDocument, DocumentStore, objectCenter, placeObjectAtCenter, cloneSceneObject, type Measure } from '../src/editor/model';
import { changeRasterCrop, checkedRasterCrop, fullRasterCrop, type ImageObject } from '../src/editor/raster-geometry';
import { rasterSourceFromBytes } from '../src/editor/raster-source';
import { DEFAULT_RASTER } from '../src/editor/raster-processing';
import { testPng } from './helpers/png';
const image = (): ImageObject => ({ id: 'image', type: 'image', xMm: 10, yMm: 5, widthMm: 8, heightMm: 8, rotationDeg: 30, source: rasterSourceFromBytes('asset-image', testPng()), raster: { ...DEFAULT_RASTER } });
const measure: Measure = o => o.type === 'image' ? { widthMm: o.widthMm, heightMm: o.heightMm } : { widthMm: 4, heightMm: 4 };
describe('ritaglio raster non distruttivo', () => {
  it('ritaglia senza deformare i pixel, conserva sorgente e centro ruotato', () => {
    const original = image(), center = objectCenter(original, measure), changed = placeObjectAtCenter(changeRasterCrop(original, { leftPx: 1 }), center, measure) as ImageObject;
    expect(changed).toMatchObject({ widthMm: 4, heightMm: 8, crop: { leftPx: 1, topPx: 0, widthPx: 1, heightPx: 2 }, source: original.source, rotationDeg: 30 });
    expect(objectCenter(changed, measure).xMm).toBeCloseTo(center.xMm, 8); expect(objectCenter(changed, measure).yMm).toBeCloseTo(center.yMm, 8);
    expect(checkedRasterCrop(changed.source, changed.crop).widthPx / changed.widthMm).toBe(original.source.pixelWidth / original.widthMm);
  });
  it('ripristina l’intera sorgente alla scala corrente, compresi i vecchi oggetti senza crop', () => {
    const original = image(); expect(checkedRasterCrop(original.source)).toEqual(fullRasterCrop(original.source));
    const cropped = changeRasterCrop(original, { leftPx: 1, topPx: 1 }), resized = { ...cropped, widthMm: 6, heightMm: 6 }, restored = changeRasterCrop(resized, fullRasterCrop(original.source));
    expect(restored).toMatchObject({ widthMm: 12, heightMm: 12, crop: { leftPx: 0, topPx: 0, widthPx: 2, heightPx: 2 } });
    const copy = cloneSceneObject(restored); copy.crop!.leftPx = 1; expect(restored.crop!.leftPx).toBe(0);
  });
  it('rifiuta finestre vuote, non finite o fuori dall’originale', () => {
    for (const change of [{ leftPx: -1 }, { leftPx: 2 }, { widthPx: 0 }, { widthPx: 3 }, { heightPx: NaN }]) expect(() => changeRasterCrop(image(), change)).toThrow();
  });
  it('comandi e JSON conservano ritaglio/riflessioni e rifiutano errori senza perdere redo', () => {
    const doc = createDocument(); doc.objects = [image()]; const store = new DocumentStore(doc, measure), object = { ...changeRasterCrop(image(), { leftPx: 1 }), flipX: true, flipY: true };
    const command = (revision: number, changed: unknown) => ({ schemaVersion: 1, tool: 'updateObject', objectId: 'image', expectedRevision: revision, arguments: { object: changed } });
    store.dispatch(command(0, object), 'manual'); const saved = JSON.parse(JSON.stringify(store.document)); store.import(saved); expect(store.document.objects).toEqual(saved.objects); store.undo(); store.undo();
    const before = JSON.parse(JSON.stringify(store.document)); for (const bad of [{ ...object, crop: { ...object.crop, leftPx: 2 } }, { ...object, heightMm: 4 }, { ...object, flipX: 'true' }]) { expect(() => store.dispatch(command(before.revision, bad), 'ai-simulation')).toThrow(); expect(store.document).toEqual(before); }
    store.redo(); expect(store.document.objects).toEqual([object]);
  });
});
