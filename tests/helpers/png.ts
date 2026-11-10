import { deflateSync } from 'node:zlib';
import { crc32 } from '../../src/editor/raster-source';
export function pngChunk(kind: string, data: Uint8Array): Buffer {
  const output = Buffer.alloc(data.length + 12); output.writeUInt32BE(data.length, 0); output.write(kind, 4, 'ascii'); output.set(data, 8); output.writeUInt32BE(crc32(output.subarray(4, -4)), output.length - 4); return output;
}
export function testPng(width = 2, height = 2, rgba = new Uint8Array([0, 0, 0, 255, 127, 127, 127, 255, 255, 255, 255, 255, 0, 0, 0, 0]), extra?: { kind: string; data: Uint8Array }): Buffer {
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  const rows = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) rows.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk('IHDR', header), ...(extra ? [pngChunk(extra.kind, extra.data)] : []), pngChunk('IDAT', deflateSync(rows)), pngChunk('IEND', new Uint8Array())]);
}
