import { describe, expect, it } from 'vitest';
import { jpegInfo, jpegWithoutApp1, jpegOrientationMatrix, type ExifOrientation } from '../src/editor/jpeg-source';
import { testJpeg, jpegWithExif, jpegDataUrl, jpegSegment } from './helpers/jpeg';
const info = (bytes: Uint8Array) => jpegInfo(jpegDataUrl(bytes));
describe('JPEG locali con originali conservati e orientamento esplicito', () => {
  it('riconosce JPEG reali baseline, progressivi e grigi', () => {
    for (const kind of ['baseline', 'progressive', 'grayscale'] as const) { const bytes = testJpeg(kind); expect(info(bytes)).toEqual({ width: 40, height: 24, rawWidth: 40, rawHeight: 24, bytes: bytes.length, orientation: 1, progressive: kind === 'progressive' }); expect(jpegWithoutApp1(jpegDataUrl(bytes))).toEqual(new Uint8Array(bytes)); }
  });
  it('legge tutti gli orientamenti EXIF, nei due ordini byte, senza cambiare l’originale', () => {
    const original = testJpeg();
    for (const little of [false, true]) for (let orientation = 1; orientation <= 8; orientation++) {
      const bytes = jpegWithExif(original, orientation, little), saved = bytes.slice(); expect(info(bytes)).toMatchObject({ width: orientation >= 5 ? 24 : 40, height: orientation >= 5 ? 40 : 24, orientation }); expect(jpegWithoutApp1(jpegDataUrl(bytes))).toEqual(new Uint8Array(original)); expect(bytes).toEqual(saved);
    }
  });
  it('orienta gli angoli dei pixel entro le dimensioni finali senza deformazioni', () => {
    for (let orientation = 1; orientation <= 8; orientation++) {
      const [a, b, c, d, e, f] = jpegOrientationMatrix(orientation as ExifOrientation, 40, 24), points = [[0, 0], [40, 0], [0, 24], [40, 24]].map(([x, y]) => ({ x: a * x! + c * y! + e, y: b * x! + d * y! + f }));
      expect(Math.min(...points.map(p => p.x))).toBe(0); expect(Math.min(...points.map(p => p.y))).toBe(0); expect(Math.max(...points.map(p => p.x))).toBe(orientation >= 5 ? 24 : 40); expect(Math.max(...points.map(p => p.y))).toBe(orientation >= 5 ? 40 : 24); expect(Math.abs(a * d - b * c)).toBe(1);
    }
  });
  it('rifiuta URL remoti, formati mascherati, file lunghi/troncati e dati dopo EOI', () => {
    for (const source of ['https://example.com/photo.jpg', 'data:image/png;base64,AAAA', 'data:image/jpeg;base64,<svg/>', jpegDataUrl(new Uint8Array(45)), jpegDataUrl(new Uint8Array(20_000_001)), jpegDataUrl(testJpeg().subarray(0, -2)), jpegDataUrl(Buffer.concat([testJpeg(), Buffer.from('extra')]))]) expect(() => jpegInfo(source)).toThrow();
  });
  it('rifiuta CMYK, precisione/marker e dimensioni non supportati', () => {
    expect(() => info(testJpeg('cmyk'))).toThrow('CMYK');
    const source = testJpeg(), sof = source.indexOf(Buffer.from([0xff, 0xc0])); expect(sof).toBeGreaterThan(0);
    for (const edit of [(b: Buffer) => { b[sof + 1] = 0xc3; }, (b: Buffer) => { b[sof + 4] = 12; }, (b: Buffer) => { b.writeUInt16BE(8000, sof + 5); b.writeUInt16BE(4000, sof + 7); }, (b: Buffer) => { b.writeUInt16BE(0, sof + 5); }, (b: Buffer) => { b[sof + 11] = 0; }]) { const bytes = Buffer.from(source); edit(bytes); expect(() => info(bytes)).toThrow(); }
  });
  it('rifiuta directory EXIF, offset, tipi e orientamenti ambigui', () => {
    for (const orientation of [0, 9, 65535]) expect(() => info(jpegWithExif(testJpeg(), orientation))).toThrow('Orientamento');
    const source = jpegWithExif(testJpeg(), 6), tiff = 12;
    for (const edit of [(b: Buffer) => { b.writeUInt32LE(0xfffffff0, tiff + 4); }, (b: Buffer) => { b.writeUInt16LE(257, tiff + 8); }, (b: Buffer) => { b.writeUInt16LE(4, tiff + 12); }, (b: Buffer) => { b.writeUInt32LE(2, tiff + 14); }, (b: Buffer) => { b[tiff] = 0; }]) { const bytes = Buffer.from(source); edit(bytes); expect(() => info(bytes)).toThrow('EXIF'); }
    expect(() => info(jpegWithExif(source, 6))).toThrow('EXIF duplicato');
  });
  it('controlla segmenti, tabelle e scansioni prima del decoder browser', () => {
    const source = testJpeg(), sos = source.indexOf(Buffer.from([0xff, 0xda])), dqt = source.indexOf(Buffer.from([0xff, 0xdb])), dht = source.indexOf(Buffer.from([0xff, 0xc4]));
    for (const edit of [(b: Buffer) => { b.writeUInt16BE(65535, dqt + 2); }, (b: Buffer) => { b[dqt + 5] = 0; }, (b: Buffer) => { b[dht + 5] = 255; }, (b: Buffer) => { b[sos + 5] = 255; }, (b: Buffer) => { b[sos + 4] = 0; }]) { const bytes = Buffer.from(source); edit(bytes); expect(() => info(bytes)).toThrow(); }
    const noData = Buffer.concat([source.subarray(0, sos + 2 + source.readUInt16BE(sos + 2)), Buffer.from([0xff, 0xd9])]); expect(() => info(noData)).toThrow('senza dati');
    const metadata = jpegSegment(0xe1, Buffer.from('http://ns.adobe.com/xap/1.0/\0<xml>local-only</xml>')); const xmp = Buffer.concat([source.subarray(0, 2), metadata, source.subarray(2)]); expect(jpegWithoutApp1(jpegDataUrl(xmp))).toEqual(new Uint8Array(source));
  });
});

import { rasterSourceFromBytes, RasterSourceSchema } from '../src/editor/raster-source';
import { DocumentStore, createDocument, cloneGraphicDocument, parseGraphicDocument, type Measure, type SceneObject } from '../src/editor/model';
import { DEFAULT_RASTER } from '../src/editor/raster-processing';
const measure: Measure = object => object.type === 'image' ? { widthMm: object.widthMm, heightMm: object.heightMm } : { widthMm: 4, heightMm: 3 };
it('JPEG nei comandi comuni: pixel orientati, sorgente immutabile, filtri/crop e storico', () => {
  const bytes = jpegWithExif(testJpeg(), 6), source = rasterSourceFromBytes('asset-jpeg', bytes); expect(source).toMatchObject({ mime: 'image/jpeg', pixelWidth: 24, pixelHeight: 40 }); expect(Buffer.from(source.dataUrl.split(',')[1]!, 'base64')).toEqual(bytes); expect(() => RasterSourceSchema.parse({ ...source, mime: 'image/png' })).toThrow(); expect(() => RasterSourceSchema.parse({ ...source, pixelWidth: 40, pixelHeight: 24 })).toThrow('Dimensioni');
  const doc = createDocument(); doc.objects = []; const store = new DocumentStore(doc, measure), object: SceneObject = { id: 'image', type: 'image', source, raster: DEFAULT_RASTER, xMm: 10, yMm: 4, widthMm: 6, heightMm: 10 };
  store.dispatch({ schemaVersion: 1, tool: 'addObject', objectId: 'image', expectedRevision: 0, arguments: { object } }, 'manual'); const changed = { ...object, widthMm: 3, crop: { leftPx: 12, topPx: 0, widthPx: 12, heightPx: 40 }, raster: { ...DEFAULT_RASTER, invert: true } }; store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: 'image', expectedRevision: 1, arguments: { object: changed } }, 'ai-simulation');
  const saved = cloneGraphicDocument(store.document); expect(parseGraphicDocument(JSON.parse(JSON.stringify(saved)))).toEqual(saved); expect(() => store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: 'image', expectedRevision: 2, arguments: { object: { ...changed, source: rasterSourceFromBytes('asset-other', testJpeg()) } } }, 'ai-simulation')).toThrow('immutabile'); expect(store.document).toEqual(saved); store.undo(); expect(store.document.objects[0]).toEqual(object); store.redo(); expect(store.document.objects[0]).toEqual(changed);
});
