import { describe, expect, it } from 'vitest';
import { pngExportSize, pngWithDpi } from '../src/editor/png-export';
import { crc32 } from '../src/editor/raster-source';
import { pngChunk, testPng } from './helpers/png';
function chunks(bytes: Uint8Array) {
  const result: { kind: string; data: Uint8Array; checksum: number }[] = [], view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = 8; offset < bytes.length;) { const size = view.getUint32(offset), kind = new TextDecoder().decode(bytes.subarray(offset + 4, offset + 8)); result.push({ kind, data: bytes.subarray(offset + 8, offset + 8 + size), checksum: view.getUint32(offset + 8 + size) }); offset += size + 12; }
  return result;
}
describe('dimensioni e metadati del PNG di bozza', () => {
  it('calcola dimensioni fisiche arrotondate indipendentemente da zoom e retina', () => {
    expect(pngExportSize({ width: 58, height: 22 }, 300)).toEqual({ width: 685, height: 260, pixelsPerMm: 300 / 25.4 });
    expect(pngExportSize({ width: 58, height: 22 }, 150)).toMatchObject({ width: 343, height: 130 }); expect(pngExportSize({ width: 58, height: 22 }, 600)).toMatchObject({ width: 1370, height: 520 }); expect(pngExportSize({ width: 0.001, height: 0.001 }, 300)).toMatchObject({ width: 1, height: 1 });
  });
  it('blocca allocazioni oltre i limiti, DPI e aree non validi', () => {
    for (const area of [{ width: 200, height: 200 }, { width: 800, height: 2 }]) expect(() => pngExportSize(area, 600)).toThrow('limite TEST');
    for (const area of [{ width: 0, height: 20 }, { width: -1, height: 20 }, { width: Infinity, height: 20 }, { width: 58, height: NaN }]) expect(() => pngExportSize(area, 300)).toThrow('non validi');
    for (const dpi of [0, 72, 300.1, 1200, NaN, Infinity]) expect(() => pngExportSize({ width: 58, height: 22 }, dpi)).toThrow('non validi');
  });
  it('inserisce pHYs con CRC corretto prima di IDAT senza cambiare pixel compressi o sorgente', () => {
    const source = testPng(), saved = source.slice(), result = pngWithDpi(source, 300), parsed = chunks(result), physical = parsed.find(chunk => chunk.kind === 'pHYs')!;
    expect(parsed.map(chunk => chunk.kind)).toEqual(['IHDR', 'pHYs', 'IDAT', 'IEND']); const view = new DataView(physical.data.buffer, physical.data.byteOffset, physical.data.byteLength); expect(view.getUint32(0)).toBe(11811); expect(view.getUint32(4)).toBe(11811); expect(physical.data[8]).toBe(1); expect(physical.checksum).toBe(crc32(new Uint8Array([...new TextEncoder().encode('pHYs'), ...physical.data])));
    expect(parsed.find(chunk => chunk.kind === 'IDAT')!.data).toEqual(new Uint8Array(chunks(source).find(chunk => chunk.kind === 'IDAT')!.data)); expect(source).toEqual(saved);
  });
  it('sostituisce metadati DPI preesistenti e non applica i limiti dei file in ingresso', () => {
    const source = testPng(2, 2, undefined, { kind: 'pHYs', data: new Uint8Array(9) }), result = chunks(pngWithDpi(source, 600)); expect(result.filter(chunk => chunk.kind === 'pHYs')).toHaveLength(1);
    const large = testPng(2, 2, undefined, { kind: 'tEXt', data: new Uint8Array(300_000) }); expect(pngWithDpi(large, 150).length).toBe(large.length + 21);
  });
  it('respinge output troncato, CRC errati, IEND mancante e DPI arbitrari', () => {
    const source = testPng(), wrong = source.slice(); wrong[40] = wrong[40]! ^ 1;
    for (const bytes of [source.subarray(0, 35), source.subarray(0, source.length - 12), wrong, Buffer.concat([source, Buffer.from('extra')]), new Uint8Array(100)]) expect(() => pngWithDpi(bytes, 300)).toThrow();
    expect(() => pngWithDpi(source, 96)).toThrow('Risoluzione');
    const noData = Buffer.concat([source.subarray(0, 33), pngChunk('IEND', new Uint8Array())]); expect(() => pngWithDpi(noData, 300)).toThrow('incompleto');
  });
});
