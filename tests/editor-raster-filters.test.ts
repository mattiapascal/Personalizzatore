import { describe, expect, it } from 'vitest';
import { binaryPixels, DEFAULT_RASTER, RasterParametersSchema, type RasterParameters } from '../src/editor/raster-processing';
import { createDocument, DocumentStore, cloneGraphicDocument, type Measure, type SceneObject } from '../src/editor/model';
import { rasterSourceFromBytes } from '../src/editor/raster-source';
import { testPng } from './helpers/png';
const rgba = (values: number[], alphas?: number[]) => new Uint8ClampedArray(values.flatMap((value, index) => [value, value, value, alphas?.[index] ?? 255]));
const tones = (data: Uint8ClampedArray) => [...data].filter((_, i) => i % 4 === 0);
describe('elaborazione raster con mezzitoni binari', () => {
  it('mantiene i risultati preesistenti e regola luminosità/contrasto senza mutare la sorgente', () => {
    const input = rgba([0, 64, 127, 128, 192, 255]), original = input.slice();
    expect(tones(binaryPixels(input, DEFAULT_RASTER, 3))).toEqual([0, 0, 0, 255, 255, 255]);
    expect(tones(binaryPixels(input, { ...DEFAULT_RASTER, brightness: 100 }, 3))).toEqual([255, 255, 255, 255, 255, 255]);
    expect(tones(binaryPixels(input, { ...DEFAULT_RASTER, brightness: -100 }, 3))).toEqual([0, 0, 0, 0, 0, 0]);
    expect(tones(binaryPixels(input, { ...DEFAULT_RASTER, contrast: -100 }, 3))).toEqual([0, 0, 0, 0, 0, 0]);
    expect(tones(binaryPixels(input, { ...DEFAULT_RASTER, contrast: 100 }, 3))).toEqual([0, 0, 0, 255, 255, 255]); expect(input).toEqual(original);
  });
  it('matrice ordinata 4×4 riproducibile, con metà punti per il grigio medio', () => {
    const input = rgba(Array(16).fill(128)), params: RasterParameters = { ...DEFAULT_RASTER, method: 'ordered' }, expected = [255, 0, 255, 0, 0, 255, 0, 255, 255, 0, 255, 0, 0, 255, 0, 255];
    expect(tones(binaryPixels(input, params, 4))).toEqual(expected); expect(binaryPixels(input, params, 4)).toEqual(binaryPixels(input, params, 4));
    expect(tones(binaryPixels(input, { ...params, invert: true }, 4))).toEqual(expected.map(value => 255 - value));
  });
  it('diffusione su righe distinte: mezzitoni deterministici a due valori, senza puntini nei pieni', () => {
    const input = rgba(Array(16).fill(128)), params: RasterParameters = { ...DEFAULT_RASTER, method: 'diffusion' };
    const result = tones(binaryPixels(input, params, 4)); expect(result).toEqual([255, 0, 255, 0, 0, 255, 0, 255, 255, 0, 255, 0, 0, 255, 0, 255]);
    for (const value of [0, 255]) expect(tones(binaryPixels(rgba(Array(25).fill(value)), params, 5))).toEqual(Array(25).fill(value));
  });
  it('alpha piena preservata, bianco trasparente dopo inversione e nessuna diffusione attraverso un foro', () => {
    const input = rgba([128, 0, 128], [255, 0, 255]), params: RasterParameters = { ...DEFAULT_RASTER, method: 'diffusion' };
    const output = binaryPixels(input, params, 3); expect(output[3]).toBe(255); expect(output[7]).toBe(0); expect(output[11]).toBe(255); expect(tones(output)).toEqual([255, 255, 255]);
    const inverted = binaryPixels(input, { ...params, invert: true, whiteTransparent: true }, 3); expect(tones(inverted)).toEqual([0, 0, 0]); expect(inverted[7]).toBe(0); expect(inverted[3]).toBe(255);
  });
  it('dimensioni incoerenti, metodi e parametri fuori limite respinti', () => {
    for (const width of [0, -1, NaN, Infinity, 1.5, 3, 1e9]) expect(() => binaryPixels(rgba([0, 1, 2, 3]), DEFAULT_RASTER, width)).toThrow('Dimensioni');
    for (const params of [{ brightness: 101 }, { contrast: -101 }, { contrast: NaN }, { method: 'remote' }, { saturation: 10 }]) expect(() => RasterParametersSchema.parse({ ...DEFAULT_RASTER, ...params })).toThrow();
  });
  it('ogni metodo e tutti gli estremi producono soltanto RGB e alpha binari', () => {
    const input = new Uint8ClampedArray(Array.from({ length: 32 * 24 * 4 }, (_, i) => (i * 71 + 37) % 256));
    for (const method of ['threshold', 'ordered', 'diffusion'] as const) for (const threshold of [0, 1, 128, 254, 255]) {
      const output = binaryPixels(input, { threshold, method, brightness: -12.5, contrast: 23, invert: true, whiteTransparent: true }, 32);
      expect([...output].every(value => value === 0 || value === 255)).toBe(true); for (let i = 0; i < output.length; i += 4) expect(output[i]).toBe(output[i + 1]);
    }
  });
  it('parametri nello stesso updateObject manuale/AI, JSON e undo, con originale immutato', () => {
    const doc = createDocument(), image: SceneObject = { id: 'image', type: 'image', xMm: 10, yMm: 5, widthMm: 4, heightMm: 4, source: rasterSourceFromBytes('asset', testPng()), raster: { ...DEFAULT_RASTER } }; doc.objects = [image];
    const measure: Measure = object => object.type === 'image' ? { widthMm: object.widthMm, heightMm: object.heightMm } : { widthMm: 1, heightMm: 1 }, store = new DocumentStore(doc, measure);
    const changed = { ...image, raster: { ...DEFAULT_RASTER, method: 'diffusion', brightness: 10, contrast: 20 } }; store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: 'image', expectedRevision: 0, arguments: { object: changed } }, 'ai-simulation'); const saved = JSON.parse(JSON.stringify(store.document)); expect(saved.objects[0]).toEqual(changed);
    store.undo(); expect(store.document.objects).toEqual([image]); store.redo(); expect(store.document.objects).toEqual([changed]); const before = cloneGraphicDocument(store.document);
    expect(() => store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: 'image', expectedRevision: before.revision, arguments: { object: { ...changed, raster: { ...changed.raster, contrast: 101 } } } }, 'manual')).toThrow(); expect(store.document).toEqual(before);
  });
});
