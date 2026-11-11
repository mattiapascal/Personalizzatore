import { describe, expect, it } from 'vitest';
import { crc32, pngInfo, rasterSourceFromBytes, RasterSourceSchema, validatePngData } from '../src/editor/raster-source';
import { binaryPixels, DEFAULT_RASTER } from '../src/editor/raster-processing';
import { testPng, pngChunk } from './helpers/png';
import { deflateSync } from 'node:zlib';
const dataUrl = (bytes: Uint8Array) => 'data:image/png;base64,' + Buffer.from(bytes).toString('base64');
describe('sorgenti PNG locali controllate', () => {
  it('CRC noto, firma e dimensioni di un PNG RGBA reale', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
    const bytes = testPng(), source = rasterSourceFromBytes('asset-test', bytes); expect(source).toMatchObject({ id: 'asset-test', mime: 'image/png', pixelWidth: 2, pixelHeight: 2 }); expect(pngInfo(source.dataUrl)).toEqual({ width: 2, height: 2, bytes: bytes.length }); expect(Buffer.from(source.dataUrl.split(',')[1]!, 'base64')).toEqual(bytes);
  });
  it('rifiuta URL remoti, SVG mascherato, dati troncati o oltre limite', () => {
    for (const data of ['https://example.com/image.png', 'data:image/svg+xml;base64,AAAA', 'data:image/png;base64,<svg/>', dataUrl(new Uint8Array(45)), dataUrl(testPng().subarray(0, 40)), dataUrl(new Uint8Array(20_000_001))]) expect(() => pngInfo(data)).toThrow();
  });
  it('rifiuta intestazioni corrotte, dimensioni dichiarate false e immagini troppo grandi', () => {
    const bytes = testPng(); bytes[16] = 1; expect(() => pngInfo(dataUrl(bytes))).toThrow('corrotta');
    const source = rasterSourceFromBytes('asset-test', testPng()); expect(() => RasterSourceSchema.parse({ ...source, pixelWidth: 3 })).toThrow('Dimensioni');
    const large = testPng(); large.writeUInt32BE(8000, 16); large.writeUInt32BE(4000, 20); large.writeUInt32BE(crc32(large.subarray(12, 29)), 29); expect(() => pngInfo(dataUrl(large))).toThrow('24 milioni');
  });
  it('rifiuta animazioni, EXIF, chunk troncati e dati aggiunti dopo IEND', () => {
    expect(() => pngInfo(dataUrl(testPng(2, 2, undefined, { kind: 'acTL', data: new Uint8Array(8) })))).toThrow('animati');
    expect(() => pngInfo(dataUrl(testPng(2, 2, undefined, { kind: 'eXIf', data: new Uint8Array(8) })))).toThrow('EXIF');
    expect(() => pngInfo(dataUrl(Buffer.concat([testPng(), Buffer.from('extra')])))).toThrow('fine');
    const broken = testPng(); broken.writeUInt32BE(100_000, 33); expect(() => pngInfo(dataUrl(broken))).toThrow('Struttura');
  });
  it('verifica contenuto compresso, filtri e numero esatto di byte prima del browser', async () => {
    await expect(validatePngData(dataUrl(testPng()))).resolves.toBeUndefined();
    const base = testPng(), signatureAndHeader = base.subarray(0, 33), ending = pngChunk('IEND', new Uint8Array());
    const input = (raw: Uint8Array) => dataUrl(Buffer.concat([signatureAndHeader, pngChunk('IDAT', deflateSync(raw)), ending]));
    await expect(validatePngData(input(new Uint8Array(18)))).resolves.toBeUndefined();
    for (const raw of [new Uint8Array(17), new Uint8Array(19), new Uint8Array(18).fill(5), new Uint8Array(1_000_000)]) await expect(validatePngData(input(raw))).rejects.toThrow('non decodificabile');
    const invalidZlib = dataUrl(Buffer.concat([signatureAndHeader, pngChunk('IDAT', new Uint8Array(16)), ending])); await expect(validatePngData(invalidZlib)).rejects.toThrow('non decodificabile');
  });
  it('riconosce i passaggi vuoti di Adam7 e i filtri dei passaggi non vuoti', async () => {
    const header = Buffer.from(testPng().subarray(0, 33)); header[28] = 1; header.writeUInt32BE(crc32(header.subarray(12, 29)), 29);
    // PNG 2×2 RGBA: passaggi 1, 6 e 7, righe rispettivamente di 5, 5 e 9 byte.
    const raw = new Uint8Array(19), build = () => dataUrl(Buffer.concat([header, pngChunk('IDAT', deflateSync(raw)), pngChunk('IEND', new Uint8Array())]));
    await expect(validatePngData(build())).resolves.toBeUndefined(); raw[10] = 5; await expect(validatePngData(build())).rejects.toThrow('non decodificabile');
  });
});
describe('conversione binaria non distruttiva', () => {
  it('distingue 127 da 128, conserva trasparenza piena e compone alpha parziale su bianco', () => {
    const source = new Uint8ClampedArray([0, 0, 0, 255, 127, 127, 127, 255, 128, 128, 128, 255, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 128]), saved = source.slice();
    const result = binaryPixels(source, DEFAULT_RASTER); expect([...result]).toEqual([0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 0, 255]); expect(source).toEqual(saved);
  });
  it('inverte soltanto i valori binari e rende opzionalmente trasparente il bianco', () => {
    const source = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0]);
    expect([...binaryPixels(source, { ...DEFAULT_RASTER, invert: true })]).toEqual([255, 255, 255, 255, 0, 0, 0, 255, 0, 0, 0, 0]);
    expect([...binaryPixels(source, { ...DEFAULT_RASTER, whiteTransparent: true })]).toEqual([0, 0, 0, 255, 255, 255, 255, 0, 255, 255, 255, 0]);
  });
  it('produce solo RGB e alpha a due valori, con tutti gli estremi della soglia', () => {
    const source = new Uint8ClampedArray(Array.from({ length: 4096 }, (_, i) => (i * 71 + 37) % 256));
    for (const threshold of [0, 1, 128, 254, 255]) {
      const output = binaryPixels(source, { threshold, invert: threshold % 2 === 0, whiteTransparent: true });
      expect([...output].every(value => value === 0 || value === 255)).toBe(true); for (let i = 0; i < output.length; i += 4) expect([output[i], output[i + 1], output[i + 2]]).toEqual([output[i], output[i], output[i]]);
    }
  });
  it('rifiuta parametri e buffer non validi', () => {
    expect(() => binaryPixels(new Uint8ClampedArray(3), DEFAULT_RASTER)).toThrow('RGBA');
    for (const threshold of [-1, 256, 1.5, NaN]) expect(() => binaryPixels(new Uint8ClampedArray(4), { ...DEFAULT_RASTER, threshold })).toThrow();
  });
});
