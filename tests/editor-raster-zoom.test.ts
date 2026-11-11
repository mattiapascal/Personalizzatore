import { expect, it } from 'vitest';
import { rasterContentZoom, zoomRasterContents, positionRasterContents } from '../src/editor/raster-crop-edit';
import { checkedRasterCrop, type ImageObject } from '../src/editor/raster-geometry';
import { createDocument, DocumentStore, parseGraphicDocument, type Measure } from '../src/editor/model';
import { rasterSourceFromBytes } from '../src/editor/raster-source';
import { testPng } from './helpers/png';
const source = rasterSourceFromBytes('photo-zoom-TEST', testPng(160, 120));
const photo = (): ImageObject => ({ id: 'photo', type: 'image', xMm: 8, yMm: 10, widthMm: 40.2, heightMm: 21.075, pixelAspectRatio: 4 / 3, rotationDeg: 30, flipX: true, source, crop: { leftPx: 20.25, topPx: 10.5, widthPx: 100.5, heightPx: 70.25 }, raster: { mode: 'original', threshold: 128, invert: false, whiteTransparent: false }, editor: { transformLocked: true } });
const measure: Measure = object => object.type === 'image' ? { widthMm: object.widthMm, heightMm: object.heightMm } : { widthMm: 1, heightMm: 1 };
const verify = (object: ImageObject) => { const doc = createDocument(); doc.colorMode = 'color'; doc.areaMm = { width: 100, height: 80 }; doc.objects = [object]; return parseGraphicDocument(JSON.parse(JSON.stringify(doc))); };
it('percentuale rispetto alla massima finestra proporzionale e zoom centrato nella cornice fissa', () => {
  const before = photo(), zoom = rasterContentZoom(before), next = zoomRasterContents(before, 200), crop = next.crop!;
  expect(zoom.value).toBeCloseTo(160 / 100.5 * 100, 10); expect(zoom.max).toBeCloseTo(160 / 100.5 * 70.25 * 100, 10);
  expect(crop.widthPx).toBeCloseTo(80, 12); expect(crop.heightPx).toBeCloseTo(80 * 70.25 / 100.5, 12);
  expect(crop.leftPx + crop.widthPx / 2).toBeCloseTo(70.5, 12); expect(crop.topPx + crop.heightPx / 2).toBeCloseTo(45.625, 12);
  const { crop: _old, ...frame } = before, { crop: _next, ...after } = next; expect(after).toEqual(frame); verify(next);
  expect(rasterContentZoom(next).value).toBeCloseTo(200, 10); expect(zoomRasterContents(before, zoom.value)).toBe(before);
});
it('ingrandimento conserva sorgente, filtri e cornice con rotazioni, riflessioni e pixel non uniformi', () => {
  for (const rotationDeg of [0, 30, -90]) for (const flipX of [false, true]) for (const flipY of [false, true]) {
    const before = { ...photo(), rotationDeg, flipX, flipY }, next = zoomRasterContents(before, 250);
    const { crop: _a, ...frame } = before, { crop: _b, ...result } = next; expect(result).toEqual(frame); verify(next);
    expect(next.crop!.widthPx / next.crop!.heightPx).toBeCloseTo(before.crop!.widthPx / before.crop!.heightPx, 12);
  }
});
it('riduzione al minimo riempie sempre la cornice e corregge soltanto i limiti del centro visibile', () => {
  for (const x of [-999, 999]) for (const y of [-999, 999]) {
    const before = positionRasterContents(zoomRasterContents(photo(), 400), { x, y }), next = zoomRasterContents(before, 100), crop = checkedRasterCrop(source, next.crop);
    expect(crop.widthPx).toBe(160); expect(crop.leftPx).toBe(0); expect(crop.topPx).toBeGreaterThanOrEqual(0); expect(crop.topPx + crop.heightPx).toBeLessThanOrEqual(120);
    expect(rasterContentZoom(next).value).toBe(100); verify(next);
  }
  const full = { ...photo(), widthMm: 64, heightMm: 48, pixelAspectRatio: 1, crop: undefined };
  expect(zoomRasterContents(full, 100)).toBe(full); expect(zoomRasterContents(full, 200).crop).toEqual({ leftPx: 40, topPx: 30, widthPx: 80, heightPx: 60 });
});
it('massimo a un pixel e nessuna deriva delle proporzioni dopo zoom e ripristini ripetuti', () => {
  let object = photo(); const max = rasterContentZoom(object).max;
  const limit = zoomRasterContents(object, max); expect(Math.min(limit.crop!.widthPx, limit.crop!.heightPx)).toBe(1); verify(limit);
  for (let index = 0; index < 120; index++) {
    object = zoomRasterContents(object, index % 3 === 0 ? 100 : index % 3 === 1 ? 123.456 : 500);
    verify(object); expect(object.crop!.widthPx / object.crop!.heightPx).toBeCloseTo(100.5 / 70.25, 10);
  }
  const tiny = { ...photo(), widthMm: .4, heightMm: .3, pixelAspectRatio: 1, crop: { leftPx: 2, topPx: 3, widthPx: 4 / 3, heightPx: 1 } };
  expect(rasterContentZoom(zoomRasterContents(tiny, rasterContentZoom(tiny).max)).value).toBeCloseTo(rasterContentZoom(tiny).max, 8);
});
it('valori non finiti e fuori intervallo rifiutati, nessuna riparazione di crop importati errati', () => {
  const object = photo(), before = structuredClone(object);
  for (const percent of [NaN, Infinity, -Infinity, 0, 99.999, rasterContentZoom(object).max + 1]) expect(() => zoomRasterContents(object, percent)).toThrow();
  expect(() => zoomRasterContents({ ...object, crop: { ...object.crop!, leftPx: 159 } }, 200)).toThrow(); expect(object).toEqual(before);
});
it('UI e AI condividono updateObject, JSON e storico; comando obsoleto conserva il redo', () => {
  const doc = verify(photo()), store = new DocumentStore(doc, measure), command = (object: ImageObject, revision: number) => ({ schemaVersion: 1, tool: 'updateObject', expectedRevision: revision, objectId: object.id, arguments: { object } });
  const manual = zoomRasterContents(photo(), 200); store.dispatch(command(manual, 0), 'manual');
  const ai = zoomRasterContents(manual, 300); store.dispatch(command(ai, 1), 'ai-simulation'); expect(parseGraphicDocument(JSON.parse(JSON.stringify(store.document))).objects).toEqual([ai]);
  store.undo(); expect(store.document.objects).toEqual([manual]); const before = structuredClone(store.document); expect(() => store.dispatch(command(ai, 1), 'manual')).toThrow('obsoleta'); expect(store.document).toEqual(before);
  store.redo(); expect(store.document.objects).toEqual([ai]); store.undo(); store.undo(); expect(store.document.objects).toEqual(doc.objects);
});
