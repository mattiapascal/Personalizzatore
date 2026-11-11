import { expect, it } from 'vitest';
import { pitchprintImageGeometry, pitchprintImageUrl } from '../src/editor/pitchprint-image';
import { createDocument, DocumentSchema, DocumentStore, objectCenter, type Measure } from '../src/editor/model';
import { changeRasterCrop, fullRasterCrop, type ImageObject } from '../src/editor/raster-geometry';
import { cropRasterInPlace, dragRasterCrop } from '../src/editor/raster-crop-edit';
import { rasterSourceFromBytes, validatePngData } from '../src/editor/raster-source';
import { DEFAULT_RASTER } from '../src/editor/raster-processing';
import { testPng } from './helpers/png';

const source = rasterSourceFromBytes('image-original', testPng(16, 12));
const image = (): ImageObject => ({ id: 'image', type: 'image', xMm: 10, yMm: 5, source, raster: { ...DEFAULT_RASTER }, ...pitchprintImageGeometry({ width: 16, height: 12 }, source, 2, 3) });
const measure: Measure = object => object.type === 'image' ? { widthMm: object.widthMm, heightMm: object.heightMm } : { widthMm: 1, heightMm: 1 };
it('preferisce l’originale dichiarato e conserva la mappa pixel/mm senza normalizzare gli arrotondamenti', () => {
  expect(pitchprintImageUrl({ src: 'preview', url: 'original' })).toBe('original');
  expect(pitchprintImageUrl({ src: 'embedded', url: '' })).toBe('embedded');
  expect(() => pitchprintImageUrl({})).toThrow('sorgente');
  const geometry = pitchprintImageGeometry({ width: 16, height: 12 }, source, 250 / 709, 125 / 354);
  expect(geometry.widthMm).toBe(16 * 250 / 709); expect(geometry.heightMm).toBe(12 * 125 / 354);
  expect(geometry.pixelAspectRatio).toBeCloseTo(708 / 709, 12);
  expect(pitchprintImageGeometry({ width: 8, height: 6, cropX: 4, cropY: 3 }, source, 2, 3)).toMatchObject({ widthMm: 16, heightMm: 18, crop: { leftPx: 4, topPx: 3, widthPx: 8, heightPx: 6 } });
  // Fabric 3 samples at most the actual source size and stretches it to the declared size.
  expect(pitchprintImageGeometry({ width: 32, height: 24 }, source, 2, 3)).toMatchObject({ widthMm: 64, heightMm: 72, crop: fullRasterCrop(source) });
  for (const raw of [{ width: 8.5, height: 6 }, { width: 8, height: 6, cropX: .5 }, { width: 8, height: 6, cropY: -1 }, { width: 16, height: 12, cropX: 1 }, { width: 0, height: 12 }]) expect(() => pitchprintImageGeometry(raw, source, 2, 3)).toThrow();
});
it('ritaglio, ripristino e maniglie conservano entrambe le scale e i pixel fissi, anche con riflessioni/rotazione', () => {
  const original = image(), cropped = changeRasterCrop(original, { leftPx: 4, topPx: 3 });
  expect(cropped).toMatchObject({ widthMm: 24, heightMm: 27, pixelAspectRatio: 2 / 3 });
  expect(changeRasterCrop(cropped, fullRasterCrop(source))).toMatchObject({ widthMm: 32, heightMm: 36 });
  for (const rotationDeg of [0, 30, -90]) for (const flipX of [false, true]) for (const flipY of [false, true]) {
    const object = { ...original, rotationDeg, flipX, flipY }, a = rotationDeg * Math.PI / 180;
    const dx = 4 * Math.cos(a) - 9 * Math.sin(a), dy = 4 * Math.sin(a) + 9 * Math.cos(a);
    const next = dragRasterCrop(object, -1, -1, dx, dy, measure);
    expect(next.crop).toMatchObject({ widthPx: 14, heightPx: 9 });
    const crop = { leftPx: 4, topPx: 3, widthPx: 8, heightPx: 6 }, fixed = cropRasterInPlace(object, crop, measure);
    // Compare the same retained source pixel in world coordinates independently.
    const point = (o: ImageObject, x: number, y: number) => {
      const c = o.crop ?? fullRasterCrop(source), px = (x - c.leftPx) * o.widthMm / c.widthPx, py = (y - c.topPx) * o.heightMm / c.heightPx;
      const { xMm: cx, yMm: cy } = objectCenter(o, measure), x0 = (px - o.widthMm / 2) * (flipX ? -1 : 1), y0 = (py - o.heightMm / 2) * (flipY ? -1 : 1);
      return { x: cx + x0 * Math.cos(a) - y0 * Math.sin(a), y: cy + x0 * Math.sin(a) + y0 * Math.cos(a) };
    };
    expect(point(fixed, 6, 5).x).toBeCloseTo(point(object, 6, 5).x, 9); expect(point(fixed, 6, 5).y).toBeCloseTo(point(object, 6, 5).y, 9);
  }
});
it('mappa esplicita nel documento, stessi comandi manuali/AI, JSON e Undo; sostituzione nuova sorgente senza deformazione', () => {
  const doc = createDocument(); doc.objects = [image()]; const store = new DocumentStore(doc, measure);
  const object = changeRasterCrop(image(), { leftPx: 4 });
  store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: 'image', expectedRevision: 0, arguments: { object } }, 'manual');
  store.import(JSON.parse(JSON.stringify(store.document))); expect(store.document.objects[0]).toEqual(object);
  const before = store.document;
  for (const pixelAspectRatio of [0, .001, 101, Infinity, NaN, 1, undefined]) expect(() => DocumentSchema.parse({ ...doc, objects: [{ ...image(), pixelAspectRatio }] })).toThrow();
  expect(store.document).toEqual(before);
  const replacement = rasterSourceFromBytes('replacement', testPng());
  store.dispatch({ schemaVersion: 1, tool: 'replaceImageSource', objectId: 'image', expectedRevision: before.revision, arguments: { source: replacement } }, 'ai-simulation');
  expect(store.document.objects[0]).toMatchObject({ widthMm: 24, heightMm: 24, source: replacement });
  expect(store.document.objects[0]).not.toHaveProperty('pixelAspectRatio'); store.undo(); expect(store.document.objects[0]).toEqual(object); store.redo(); expect(store.document.objects[0]).not.toHaveProperty('crop');
});
it('decodifica un originale oltre il vecchio megapixel senza aumentare il limite dei byte', async () => {
  const bytes = testPng(1280, 1280), source = rasterSourceFromBytes('large-original', bytes);
  expect(bytes.length).toBeLessThan(256_000); expect(source.pixelWidth * source.pixelHeight).toBe(1_638_400); await validatePngData(source.dataUrl);
  expect(() => rasterSourceFromBytes('too-large', testPng(2001, 2000))).toThrow('4.000.000');
});
