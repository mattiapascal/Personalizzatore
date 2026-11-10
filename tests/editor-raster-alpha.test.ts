import { describe, it, expect } from 'vitest';
import { analyzeRasterPixels } from '../src/editor/raster-analysis';
import { DEFAULT_RASTER, RasterParametersSchema, rasterPixels, binaryPixels } from '../src/editor/raster-processing';
const params = { ...DEFAULT_RASTER, backgroundRemoval: 'luminance' as const };
describe('riconoscimento grigi e rimozione del bianco tramite alpha', () => {
  it('riconosce grigi salvati in RGBA, escludendo soltanto i pixel invisibili', () => {
    expect(analyzeRasterPixels(new Uint8ClampedArray([0, 0, 0, 255, 77, 77, 77, 128, 255, 0, 0, 0]))).toMatchObject({ kind: 'grayscale', visiblePixels: 2, maxChannelDifference: 0 });
    expect(analyzeRasterPixels(new Uint8ClampedArray([0, 0, 0, 0, 255, 0, 0, 0]))).toMatchObject({ kind: 'empty', visiblePixels: 0 });
  });
  it('segnala differenze piccole e rifiuta conversioni silenziose di colori reali', () => {
    expect(analyzeRasterPixels(new Uint8ClampedArray([100, 101, 103, 255]))).toMatchObject({ kind: 'near-grayscale', maxChannelDifference: 3 });
    expect(analyzeRasterPixels(new Uint8ClampedArray([100, 100, 104, 1]))).toMatchObject({ kind: 'color', visiblePixels: 1 });
    for (const source of [new Uint8ClampedArray([100, 101, 103, 255]), new Uint8ClampedArray([255, 0, 0, 255])]) expect(() => rasterPixels(source, params)).toThrow('canali RGB');
  });
  it('genera nero con copertura continua, bianco trasparente e alpha originale moltiplicato', () => {
    const source = new Uint8ClampedArray([0, 0, 0, 255, 77, 77, 77, 255, 128, 128, 128, 255, 255, 255, 255, 255, 0, 0, 0, 128, 128, 128, 128, 128]), saved = source.slice();
    const result = rasterPixels(source, params); expect([...result]).toEqual([0, 0, 0, 255, 0, 0, 0, 178, 0, 0, 0, 127, 0, 0, 0, 0, 0, 0, 0, 128, 0, 0, 0, 64]); expect(source).toEqual(saved);
  });
  it('conserva l’aspetto dei grigi composti su bianco e ignora soglia e mezzitoni in modalità alpha', () => {
    const source = new Uint8ClampedArray(Array.from({ length: 256 }, (_, gray) => [gray, gray, gray, 255]).flat()), output = rasterPixels(source, { ...params, method: 'diffusion', threshold: 3, whiteTransparent: false }, 16);
    for (let gray = 0; gray < 256; gray++) expect(255 - output[gray * 4 + 3]!).toBe(gray);
    expect(output).toEqual(rasterPixels(source, { ...params, method: 'ordered', threshold: 244, whiteTransparent: true }, 16));
  });
  it('applica luminosità/contrasto e inversione senza recuperare pixel trasparenti', () => {
    const source = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0]); expect([...rasterPixels(source, { ...params, invert: true })]).toEqual([0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0]);
    expect(rasterPixels(source, { ...params, brightness: 100 })[3]).toBe(0); expect(rasterPixels(source, { ...params, brightness: -100 })[7]).toBe(255);
  });
  it('mantiene la conversione binaria esistente e rifiuta parametri o geometrie invalidi', () => {
    const source = new Uint8ClampedArray([0, 0, 0, 255, 128, 128, 128, 255]); expect(rasterPixels(source, DEFAULT_RASTER)).toEqual(binaryPixels(source, DEFAULT_RASTER));
    expect(() => RasterParametersSchema.parse({ ...params, backgroundRemoval: 'ai' })).toThrow(); expect(() => rasterPixels(new Uint8ClampedArray(5), params)).toThrow(); expect(() => rasterPixels(source, params, 3)).toThrow();
  });
});
