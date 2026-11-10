import { crc32 } from './raster-source';
export const PNG_EXPORT_DPI = [150, 300, 600] as const;
export type PngDpi = typeof PNG_EXPORT_DPI[number];
export const MAX_EXPORT_PIXELS = 16_000_000, MAX_EXPORT_SIDE = 8192;
export function pngExportSize(area: { width: number; height: number }, dpi: number) {
  if (!PNG_EXPORT_DPI.includes(dpi as PngDpi) || !Number.isFinite(area.width) || !Number.isFinite(area.height) || area.width <= 0 || area.height <= 0) throw new Error('Formato o risoluzione PNG non validi');
  const width = Math.max(1, Math.round(area.width * dpi / 25.4)), height = Math.max(1, Math.round(area.height * dpi / 25.4));
  if (width > MAX_EXPORT_SIDE || height > MAX_EXPORT_SIDE || width * height > MAX_EXPORT_PIXELS) throw new Error('PNG oltre il limite TEST: lato 8192 px e 16 milioni di pixel');
  return { width, height, pixelsPerMm: dpi / 25.4 };
}
/** pHYs specifica pixel per metro. Controllare i chunk senza i limiti dei PNG in ingresso. */
export function pngWithDpi(bytes: Uint8Array, dpi: number): Uint8Array<ArrayBuffer> {
  if (!PNG_EXPORT_DPI.includes(dpi as PngDpi)) throw new Error('Risoluzione PNG non valida');
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 45 || signature.some((value, index) => bytes[index] !== value)) throw new Error('PNG di esportazione non valido');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), parts: Uint8Array[] = [bytes.subarray(0, 8)];
  const physical = new Uint8Array(21), meta = new DataView(physical.buffer), ppm = Math.round(dpi / 0.0254);
  meta.setUint32(0, 9); physical.set(new TextEncoder().encode('pHYs'), 4); meta.setUint32(8, ppm); meta.setUint32(12, ppm); physical[16] = 1; meta.setUint32(17, crc32(physical.subarray(4, 17)));
  let offset = 8, inserted = false, imageData = false, end = false;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset), stop = offset + 12 + length;
    if (stop > bytes.length) throw new Error('Chunk PNG di esportazione troncato');
    const kind = new TextDecoder().decode(bytes.subarray(offset + 4, offset + 8));
    if (crc32(bytes.subarray(offset + 4, stop - 4)) !== view.getUint32(stop - 4)) throw new Error('CRC PNG di esportazione non valido');
    if (offset === 8 && (kind !== 'IHDR' || length !== 13)) throw new Error('Intestazione PNG di esportazione non valida');
    if (kind === 'IDAT') { imageData = true; if (!inserted) { parts.push(physical); inserted = true; } }
    if (kind !== 'pHYs') parts.push(bytes.subarray(offset, stop));
    offset = stop;
    if (kind === 'IEND') { if (length !== 0 || offset !== bytes.length) throw new Error('Fine PNG di esportazione non valida'); end = true; break; }
  }
  if (!end || !imageData) throw new Error('PNG di esportazione incompleto');
  const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0)); let cursor = 0;
  for (const part of parts) { output.set(part, cursor); cursor += part.length; }
  return output;
}
