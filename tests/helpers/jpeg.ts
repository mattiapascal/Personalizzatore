import { readFileSync } from 'node:fs';
export const testJpeg = (kind: 'baseline' | 'progressive' | 'grayscale' | 'cmyk' = 'baseline'): Buffer => readFileSync(new URL(`../fixtures/jpeg/${kind}.TEST.jpg`, import.meta.url));
export function jpegSegment(marker: number, payload: Uint8Array): Buffer { const header = Buffer.alloc(4); header[0] = 0xff; header[1] = marker; header.writeUInt16BE(payload.length + 2, 2); return Buffer.concat([header, payload]); }
export function jpegWithExif(bytes: Uint8Array, orientation: number, little = true): Buffer {
  const tiff = Buffer.alloc(26); tiff.write(little ? 'II' : 'MM');
  const u16 = (value: number, at: number) => little ? tiff.writeUInt16LE(value, at) : tiff.writeUInt16BE(value, at), u32 = (value: number, at: number) => little ? tiff.writeUInt32LE(value, at) : tiff.writeUInt32BE(value, at);
  u16(42, 2); u32(8, 4); u16(1, 8); u16(0x112, 10); u16(3, 12); u32(1, 14); u16(orientation, 18);
  return Buffer.concat([bytes.subarray(0, 2), jpegSegment(0xe1, Buffer.concat([Buffer.from('Exif\0\0'), tiff])), bytes.subarray(2)]);
}
export const jpegDataUrl = (bytes: Uint8Array): string => 'data:image/jpeg;base64,' + Buffer.from(bytes).toString('base64');
