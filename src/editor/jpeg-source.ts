import { MAX_RASTER_BYTES, MAX_RASTER_PIXELS, MAX_RASTER_SIDE } from './raster-limits';
export type ExifOrientation = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export interface JpegInfo { width: number; height: number; rawWidth: number; rawHeight: number; bytes: number; orientation: ExifOrientation; progressive: boolean; }
interface Parsed { info: JpegInfo; app1: [number, number][]; }
const prefix = 'data:image/jpeg;base64,', checked = new Map<string, Parsed>();
export function jpegBytes(dataUrl: string): Uint8Array {
  if (!dataUrl.startsWith(prefix)) throw new Error('È richiesto un JPEG locale incorporato, senza URL esterni');
  const encoded = dataUrl.slice(prefix.length);
  if (encoded.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new Error('Codifica JPEG base64 non valida');
  const length = encoded.length / 4 * 3 - (encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0);
  if (length > MAX_RASTER_BYTES) throw new Error('JPEG oltre 256 KB');
  return Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
}
function exifOrientation(bytes: Uint8Array): ExifOrientation {
  // bytes starts at the TIFF header, immediately after Exif\0\0.
  if (bytes.length < 8) throw new Error('EXIF troncato');
  const little = bytes[0] === 0x49 && bytes[1] === 0x49;
  if (!little && !(bytes[0] === 0x4d && bytes[1] === 0x4d)) throw new Error('Ordine byte EXIF non valido');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint16(2, little) !== 42) throw new Error('Intestazione TIFF EXIF non valida');
  const offset = view.getUint32(4, little); if (offset < 8 || offset + 2 > bytes.length) throw new Error('Offset EXIF fuori dal file');
  const count = view.getUint16(offset, little); if (count > 256 || offset + 2 + count * 12 + 4 > bytes.length) throw new Error('Directory EXIF troncata o troppo complessa');
  let orientation: ExifOrientation = 1, seen = false;
  for (let i = 0; i < count; i++) {
    const at = offset + 2 + i * 12; if (view.getUint16(at, little) !== 0x112) continue;
    if (seen || view.getUint16(at + 2, little) !== 3 || view.getUint32(at + 4, little) !== 1) throw new Error('Tag orientamento EXIF non valido o duplicato');
    const value = view.getUint16(at + 8, little); if (value < 1 || value > 8) throw new Error('Orientamento EXIF fuori da 1–8'); orientation = value as ExifOrientation; seen = true;
  }
  return orientation;
}
function parse(dataUrl: string): Parsed {
  const cached = checked.get(dataUrl); if (cached) return cached;
  const bytes = jpegBytes(dataUrl), view = new DataView(bytes.buffer), app1: [number, number][] = [];
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('Firma JPEG non valida');
  let offset = 2, rawWidth = 0, rawHeight = 0, orientation: ExifOrientation = 1, exif = false, progressive = false, scans = 0, quant = false, huffman = false, ended = false;
  const components = new Set<number>();
  while (offset < bytes.length) {
    const start = offset; if (bytes[offset++] !== 0xff) throw new Error('Marker JPEG non valido');
    while (bytes[offset] === 0xff) offset++; const marker = bytes[offset++];
    if (marker === 0xd9) { if (offset !== bytes.length || !scans) throw new Error('Dati dopo la fine del JPEG o scansione assente'); ended = true; break; }
    if (marker === undefined || marker === 0 || marker === 0xd8 || marker >= 0xd0 && marker <= 0xd7) throw new Error('Marker JPEG inatteso');
    if (offset + 2 > bytes.length) throw new Error('Segmento JPEG troncato'); const size = view.getUint16(offset), data = offset + 2, end = offset + size;
    if (size < 2 || end > bytes.length) throw new Error('Lunghezza segmento JPEG non valida');
    if (marker === 0xc0 || marker === 0xc2) {
      if (rawWidth || size < 11) throw new Error('Intestazione JPEG duplicata o troncata');
      const count = bytes[data + 5]!; if (bytes[data] !== 8 || ![1, 3].includes(count)) throw new Error('JPEG supportati: 8 bit grigi/RGB; CMYK e altre codifiche non supportati');
      if (size !== 8 + count * 3) throw new Error('Componenti JPEG non validi'); rawHeight = view.getUint16(data + 1); rawWidth = view.getUint16(data + 3); progressive = marker === 0xc2;
      if (!rawWidth || !rawHeight || rawWidth > MAX_RASTER_SIDE || rawHeight > MAX_RASTER_SIDE || rawWidth * rawHeight > MAX_RASTER_PIXELS) throw new Error('JPEG oltre il limite TEST: 1.000.000 pixel e lato massimo 4096 pixel');
      for (let i = 0; i < count; i++) {
        const at = data + 6 + i * 3, id = bytes[at]!, sampling = bytes[at + 1]!, x = sampling >> 4, y = sampling & 15;
        if (components.has(id) || x < 1 || x > 4 || y < 1 || y > 4 || bytes[at + 2]! > 3) throw new Error('Campionamento JPEG non valido'); components.add(id);
      }
    } else if (marker === 0xe1) {
      app1.push([start, end]);
      if ([0x45, 0x78, 0x69, 0x66, 0, 0].every((value, i) => bytes[data + i] === value)) { if (exif) throw new Error('EXIF duplicato'); orientation = exifOrientation(bytes.subarray(data + 6, end)); exif = true; }
    } else if (marker === 0xdb) {
      let at = data; while (at < end) { const table = bytes[at++]!, precision = table >> 4; if (precision > 1 || (table & 15) > 3 || at + 64 * (precision + 1) > end) throw new Error('Tabella quantizzazione JPEG non valida'); for (let i = 0; i < 64; i++) { if ((precision ? view.getUint16(at) : bytes[at]) === 0) throw new Error('Quantizzazione JPEG nulla'); at += precision + 1; } } if (at === data) throw new Error('Tabella quantizzazione JPEG vuota'); quant = true;
    } else if (marker === 0xc4) {
      let at = data; while (at < end) { const table = bytes[at++]!; if ((table >> 4) > 1 || (table & 15) > 3 || at + 16 > end) throw new Error('Tabella Huffman JPEG non valida'); let count = 0, slots = 1; for (let i = 0; i < 16; i++) { const n = bytes[at++]!; count += n; slots = slots * 2 - n; if (slots < 0) throw new Error('Codici Huffman JPEG non validi'); } if (!count || count > 256 || at + count > end) throw new Error('Simboli Huffman JPEG non validi'); at += count; } if (at === data) throw new Error('Tabella Huffman JPEG vuota'); huffman = true;
    } else if (marker === 0xdd) { if (size !== 4) throw new Error('Intervallo restart JPEG non valido'); }
    else if (marker === 0xda) {
      const count = bytes[data]!; if (!rawWidth || !quant || !huffman || size !== 6 + count * 2 || !count || count > components.size) throw new Error('Scansione JPEG non valida o tabelle assenti');
      const seen = new Set<number>(); for (let i = 0; i < count; i++) { const id = bytes[data + 1 + i * 2]!, table = bytes[data + 2 + i * 2]!; if (!components.has(id) || seen.has(id) || (table >> 4) > 3 || (table & 15) > 3) throw new Error('Componenti scansione JPEG non validi'); seen.add(id); }
      const ss = bytes[end - 3]!, se = bytes[end - 2]!, approximation = bytes[end - 1]!;
      if (ss > se || se > 63 || (approximation >> 4) > 13 || (approximation & 15) > 13 || !progressive && (ss !== 0 || se !== 63 || approximation !== 0)) throw new Error('Parametri scansione JPEG non validi');
      scans++; if (scans > 256) throw new Error('JPEG con troppe scansioni'); offset = end; let entropy = 0;
      while (offset < bytes.length) {
        if (bytes[offset] !== 0xff) { offset++; entropy++; continue; }
        const markerStart = offset; while (bytes[offset] === 0xff) offset++; const next = bytes[offset];
        if (next === 0 || next !== undefined && next >= 0xd0 && next <= 0xd7) { offset++; entropy++; continue; }
        offset = markerStart; break;
      }
      if (!entropy) throw new Error('Scansione JPEG senza dati'); continue;
    } else if (!(marker >= 0xe0 && marker <= 0xef || marker === 0xfe)) throw new Error('Codifica JPEG non supportata: usare baseline o progressivo a 8 bit');
    offset = end;
  }
  if (!ended || !rawWidth || !scans) throw new Error('JPEG incompleto: mancano immagine, scansione o fine');
  const swap = orientation >= 5, result: Parsed = { info: { width: swap ? rawHeight : rawWidth, height: swap ? rawWidth : rawHeight, rawWidth, rawHeight, orientation, progressive, bytes: bytes.length }, app1 };
  checked.set(dataUrl, result); if (checked.size > 16) checked.delete(checked.keys().next().value!); return result;
}
export function jpegInfo(dataUrl: string): JpegInfo { return { ...parse(dataUrl).info }; }
/** Decode a derived stream without EXIF/XMP; original bytes remain in the project. */
export function jpegWithoutApp1(dataUrl: string): Uint8Array<ArrayBuffer> {
  const parsed = parse(dataUrl), bytes = jpegBytes(dataUrl), size = bytes.length - parsed.app1.reduce((sum, [start, end]) => sum + end - start, 0), result = new Uint8Array(size); let source = 0, target = 0;
  for (const [start, end] of parsed.app1) { result.set(bytes.subarray(source, start), target); target += start - source; source = end; } result.set(bytes.subarray(source), target); return result;
}
/** Pixel-edge transforms: EXIF first, then the existing crop/filters. */
export function jpegOrientationMatrix(orientation: ExifOrientation, width: number, height: number): [number, number, number, number, number, number] {
  switch (orientation) {
    case 1: return [1, 0, 0, 1, 0, 0]; case 2: return [-1, 0, 0, 1, width, 0]; case 3: return [-1, 0, 0, -1, width, height]; case 4: return [1, 0, 0, -1, 0, height];
    case 5: return [0, 1, 1, 0, 0, 0]; case 6: return [0, 1, -1, 0, height, 0]; case 7: return [0, -1, -1, 0, height, width]; case 8: return [0, -1, 1, 0, 0, width];
  }
}
