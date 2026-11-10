import { z } from 'zod';
import { jpegInfo } from './jpeg-source';
import { MAX_RASTER_BYTES, MAX_RASTER_PIXELS, MAX_RASTER_SIDE } from './raster-limits';
export { MAX_RASTER_BYTES, MAX_RASTER_PIXELS, MAX_RASTER_SIDE } from './raster-limits';
export const MAX_PNG_BYTES = MAX_RASTER_BYTES;
const prefix = 'data:image/png;base64,';
export interface PngInfo { width: number; height: number; bytes: number; }
const checked = new Map<string, PngInfo>();
export function crc32(bytes: Uint8Array): number {
  let value = 0xffffffff;
  for (const byte of bytes) { value ^= byte; for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0); }
  return (value ^ 0xffffffff) >>> 0;
}
/** Firma, dimensioni, struttura e CRC IHDR; la decodifica browser segue prima del comando. */
export function pngInfo(dataUrl: string): PngInfo {
  const cached = checked.get(dataUrl); if (cached) return cached;
  if (!dataUrl.startsWith(prefix)) throw new Error('È richiesto un PNG locale incorporato, senza URL esterni');
  const encoded = dataUrl.slice(prefix.length);
  if (encoded.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new Error('Codifica PNG base64 non valida');
  const length = encoded.length / 4 * 3 - (encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0);
  if (length > MAX_PNG_BYTES) throw new Error('PNG oltre 256 KB');
  if (length < 45) throw new Error('PNG troncato');
  const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0)), view = new DataView(bytes.buffer);
  if ([137, 80, 78, 71, 13, 10, 26, 10].some((value, index) => bytes[index] !== value) || view.getUint32(8) !== 13 || String.fromCharCode(...bytes.subarray(12, 16)) !== 'IHDR') throw new Error('Firma o intestazione PNG non valida');
  if (crc32(bytes.subarray(12, 29)) !== view.getUint32(29)) throw new Error('Intestazione PNG corrotta');
  const width = view.getUint32(16), height = view.getUint32(20);
  if (!width || !height || width > MAX_RASTER_SIDE || height > MAX_RASTER_SIDE || width * height > MAX_RASTER_PIXELS) throw new Error('PNG oltre il limite TEST: 1.000.000 pixel e lato massimo 4096 pixel');
  const depths: Record<number, number[]> = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] };
  if (!depths[bytes[25]!] ?.includes(bytes[24]!) || bytes[26] !== 0 || bytes[27] !== 0 || bytes[28]! > 1) throw new Error('Formato dei pixel PNG non valido');
  let offset = 8, ended = false, imageData = false;
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) throw new Error('Chunk PNG troncato');
    const size = view.getUint32(offset), end = offset + size + 12, kind = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (end > bytes.length || !/^[A-Za-z]{4}$/.test(kind) || offset !== 8 && kind === 'IHDR') throw new Error('Struttura PNG non valida');
    if (crc32(bytes.subarray(offset + 4, end - 4)) !== view.getUint32(end - 4)) throw new Error('Chunk PNG corrotto');
    if (['acTL', 'fcTL', 'fdAT'].includes(kind)) throw new Error('PNG animati non supportati in questo incremento');
    if (kind === 'eXIf') throw new Error('PNG con orientamento EXIF: salva una copia con orientamento normalizzato');
    if (kind === 'IDAT') imageData = true;
    if (kind === 'IEND') { if (size !== 0 || end !== bytes.length) throw new Error('Dati dopo la fine del PNG'); ended = true; break; }
    offset = end;
  }
  if (!ended || !imageData) throw new Error('PNG incompleto: manca il contenuto o la fine');
  const info = { width, height, bytes: length }; checked.set(dataUrl, info); if (checked.size > 16) checked.delete(checked.keys().next().value!); return info;
}
/** Convalida limitata al volume di pixel dichiarato, prima del decoder permissivo del browser. */
export async function validatePngData(dataUrl: string): Promise<void> {
  const info = pngInfo(dataUrl), bytes = Uint8Array.from(atob(dataUrl.slice(prefix.length)), c => c.charCodeAt(0)), view = new DataView(bytes.buffer);
  const chunks: Uint8Array[] = []; let total = 0;
  for (let offset = 8; offset < bytes.length;) {
    const size = view.getUint32(offset), kind = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (kind === 'IDAT') { const chunk = bytes.subarray(offset + 8, offset + 8 + size); chunks.push(chunk); total += chunk.length; }
    offset += size + 12;
  }
  const compressed = new Uint8Array(total); let position = 0; for (const chunk of chunks) { compressed.set(chunk, position); position += chunk.length; }
  const channels: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }, bits = channels[bytes[25]!]! * bytes[24]!;
  const rows: number[] = [], passes = bytes[28] === 0 ? [[0, 0, 1, 1]] : [[0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4], [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]];
  for (const [startX, startY, stepX, stepY] of passes) {
    const width = Math.max(0, Math.ceil((info.width - startX!) / stepX!)), height = Math.max(0, Math.ceil((info.height - startY!) / stepY!));
    if (width && height) for (let row = 0; row < height; row++) rows.push(Math.ceil(width * bits / 8) + 1);
  }
  if (typeof DecompressionStream === 'undefined') throw new Error('Questo browser non supporta la verifica locale dei PNG');
  let inputOffset = 0;
  const stream = new ReadableStream<BufferSource>({ pull(controller) { if (inputOffset >= compressed.length) { controller.close(); return; } controller.enqueue(compressed.subarray(inputOffset, inputOffset + 1024)); inputOffset += 1024; } });
  const reader = stream.pipeThrough(new DecompressionStream('deflate')).getReader(), expected = rows.reduce((a, b) => a + b, 0);
  let count = 0, nextRow = 0, row = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      const end = count + value.length; if (end > expected) throw new Error('Dati in eccesso');
      while (nextRow < end) { if (value[nextRow - count]! > 4) throw new Error('Filtro non valido'); nextRow += rows[row++]!; }
      count = end;
    }
    if (count !== expected || row !== rows.length) throw new Error('Dati incompleti');
  } catch { await reader.cancel().catch(() => {}); throw new Error('PNG non decodificabile: dati compressi o righe non validi'); }
  finally { reader.releaseLock(); }
}
export const RasterSourceSchema = z.strictObject({
  id: z.string().regex(/^[a-zA-Z][a-zA-Z0-9-]{0,63}$/), mime: z.enum(['image/png', 'image/jpeg']),
  pixelWidth: z.number().int().min(1).max(MAX_RASTER_SIDE), pixelHeight: z.number().int().min(1).max(MAX_RASTER_SIDE), dataUrl: z.string().max(341_360),
}).superRefine((source, ctx) => {
  try { const info = source.mime === 'image/jpeg' ? jpegInfo(source.dataUrl) : pngInfo(source.dataUrl); if (info.width !== source.pixelWidth || info.height !== source.pixelHeight) throw new Error('Dimensioni dichiarate diverse dall’immagine orientata'); }
  catch (e) { ctx.addIssue({ code: 'custom', message: e instanceof Error ? e.message : 'Immagine non valida' }); }
});
export type RasterSource = z.infer<typeof RasterSourceSchema>;
export function rasterSourceFromBytes(id: string, bytes: Uint8Array): RasterSource {
  if (bytes.byteLength > MAX_RASTER_BYTES) throw new Error('Immagine oltre 256 KB');
  let binary = ''; for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  const mime = bytes[0] === 0xff && bytes[1] === 0xd8 ? 'image/jpeg' : 'image/png', dataUrl = `data:${mime};base64,` + btoa(binary), info = mime === 'image/jpeg' ? jpegInfo(dataUrl) : pngInfo(dataUrl);
  return RasterSourceSchema.parse({ id, mime, pixelWidth: info.width, pixelHeight: info.height, dataUrl });
}
