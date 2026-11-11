import { describe, it, expect } from 'vitest';
import { cropFromInsets, rasterInsets, checkedRasterCrop, type ImageObject } from '../src/editor/raster-geometry';
import { cropRasterInPlace, dragRasterCrop } from '../src/editor/raster-crop-edit';
import { createDocument, DocumentStore, objectCenter, type Measure } from '../src/editor/model';
import { rasterSourceFromBytes } from '../src/editor/raster-source';
import { DEFAULT_RASTER } from '../src/editor/raster-processing';
import { testPng } from './helpers/png';
const image = (): ImageObject => ({ id: 'image', type: 'image', xMm: 10, yMm: 5, widthMm: 16, heightMm: 12, source: rasterSourceFromBytes('asset-image', testPng(16, 12)), raster: { ...DEFAULT_RASTER } });
const measure: Measure = object => object.type === 'image' ? { widthMm: object.widthMm, heightMm: object.heightMm } : { widthMm: 4, heightMm: 3 };
const pixelPoint = (object: ImageObject, x: number, y: number) => { const crop = checkedRasterCrop(object.source, object.crop), center = objectCenter(object, measure), scale = object.widthMm / crop.widthPx, a = (object.rotationDeg ?? 0) * Math.PI / 180, dx = (x - crop.leftPx - crop.widthPx / 2) * scale * (object.flipX ? -1 : 1), dy = (y - crop.topPx - crop.heightPx / 2) * scale * (object.flipY ? -1 : 1); return { x: center.xMm + dx * Math.cos(a) - dy * Math.sin(a), y: center.yMm + dx * Math.sin(a) + dy * Math.cos(a) }; };
const near = (a: { x: number; y: number }, b: { x: number; y: number }) => { expect(a.x).toBeCloseTo(b.x, 8); expect(a.y).toBeCloseTo(b.y, 8); };
describe('ritaglio per bordi e trascinamento', () => {
  it('interpreta i quattro bordi indipendenti, anche dopo riflessioni', () => {
    const source = image(), crop = cropFromInsets(source, { left: 2, right: 3, top: 1, bottom: 4 }); expect(crop).toEqual({ leftPx: 2, topPx: 1, widthPx: 11, heightPx: 7 }); expect(rasterInsets({ ...source, crop })).toEqual({ left: 2, right: 3, top: 1, bottom: 4 }); const flipped = { ...source, crop, flipX: true, flipY: true }; expect(rasterInsets(flipped)).toEqual({ left: 3, right: 2, top: 4, bottom: 1 }); expect(cropFromInsets(flipped, { left: 4, top: 5 })).toEqual({ leftPx: 2, topPx: 1, widthPx: 10, heightPx: 6 }); for (const change of [{ left: -1 }, { right: 16 }, { bottom: NaN }]) expect(() => cropFromInsets(source, change)).toThrow();
  });
  it('conserva posizione e scala di tutti i pixel rimasti, ruotati e riflessi', () => {
    for (const angle of [0, 30, -90]) for (const flipX of [false, true]) for (const flipY of [false, true]) { const source = { ...image(), rotationDeg: angle, flipX, flipY }, next = cropRasterInPlace(source, { leftPx: 2, topPx: 3, widthPx: 9, heightPx: 6 }, measure); for (const point of [[2, 3], [5, 5], [11, 9]]) near(pixelPoint(next, point[0]!, point[1]!), pixelPoint(source, point[0]!, point[1]!)); expect(next.source).toEqual(source.source); }
  });
  it('trascina tutti gli otto lati/angoli in coordinate del foglio e recupera crop precedenti', () => {
    for (const angle of [0, 30]) for (const flipX of [false, true]) for (const flipY of [false, true]) for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]) { const source = { ...image(), rotationDeg: angle, flipX, flipY }, a = angle * Math.PI / 180, dx = -x! * 2, dy = -y! * 2, next = dragRasterCrop(source, x!, y!, dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a), measure), margins = rasterInsets(next); if (x) expect(x < 0 ? margins.left : margins.right).toBeCloseTo(2,9); if (y) expect(y < 0 ? margins.top : margins.bottom).toBeCloseTo(2,9); near(pixelPoint(source, 8, 6), pixelPoint(next, 8, 6)); }
    const source = image(), cropped = cropRasterInPlace(source, { leftPx: 4, topPx: 0, widthPx: 12, heightPx: 12 }, measure), restored = dragRasterCrop(cropped, -1, 0, -20, 0, measure); expect(restored.crop).toEqual({ leftPx: 0, topPx: 0, widthPx: 16, heightPx: 12 }); near(pixelPoint(restored, 8, 6), pixelPoint(source, 8, 6));
  });
  it('rispetta il minimo di un pixel e condivide comandi, Undo e revisione', () => {
    const source = image(), next = dragRasterCrop(source, -1, -1, 999, 999, measure); expect(next.crop).toMatchObject({ widthPx: 1, heightPx: 1 }); const doc = createDocument(); doc.objects = [source]; const store = new DocumentStore(doc, measure), command = { schemaVersion: 1, tool: 'updateObject', objectId: source.id, expectedRevision: 0, arguments: { object: next } }; store.dispatch(command, 'ai-simulation'); expect(store.document.objects[0]).toEqual(next); expect(() => store.dispatch(command, 'manual')).toThrow('obsoleta'); store.undo(); expect(store.document.objects[0]).toEqual(source);
  });
});
