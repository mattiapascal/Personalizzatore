import { TEST_DEFAULT_FONT, createTestDocument } from './editor-fonts';
import type { FontAsset } from '../../src/editor/font-assets';

/** OFL TEST file only: glyphs/metrics unchanged, closing cmap offset altered. */
export function legacyCmapFont(): FontAsset {
  const bytes = Buffer.from(TEST_DEFAULT_FONT.dataBase64, 'base64');
  const tables = Array.from({ length: bytes.readUInt16BE(4) }, (_, index) => {
    const at = 12 + index * 16;
    return { at, tag: bytes.toString('ascii', at, at + 4), start: bytes.readUInt32BE(at + 8), length: bytes.readUInt32BE(at + 12) };
  });
  const cmap = tables.find(table => table.tag === 'cmap')!, head = tables.find(table => table.tag === 'head')!, offsets = new Set<number>();
  for (let index = 0; index < bytes.readUInt16BE(cmap.start + 2); index++) {
    const base = cmap.start + bytes.readUInt32BE(cmap.start + 8 + index * 8), format = bytes.readUInt16BE(base);
    if (format === 12) throw Error('Il controllo TEST deve usare una cmap BMP.');
    if (format !== 4 || offsets.has(base)) continue;
    offsets.add(base); const segments = bytes.readUInt16BE(base + 6) / 2, last = segments - 1;
    if (bytes.readUInt16BE(base + 14 + last * 2) !== 0xffff || bytes.readUInt16BE(base + 16 + segments * 2 + last * 2) !== 0xffff) throw Error('Sentinella TEST assente.');
    bytes.writeUInt16BE(0xffff, base + 16 + segments * 6 + last * 2);
  }
  if (!offsets.size) throw Error('Cmap TEST assente.');
  const checksum = (data: Buffer) => { let sum = 0; for (let at = 0; at < data.length; at += 4) { let word = 0; for (let i = 0; i < 4; i++) word = (word * 256 + (data[at + i] ?? 0)) >>> 0; sum = (sum + word) >>> 0; } return sum; };
  bytes.writeUInt32BE(0, head.start + 8);
  for (const table of [cmap, head]) bytes.writeUInt32BE(checksum(bytes.subarray(table.start, table.start + table.length)), table.at + 4);
  bytes.writeUInt32BE((0xb1b0afba - checksum(bytes)) >>> 0, head.start + 8);
  return { ...TEST_DEFAULT_FONT, id: 'font-66666666-2222-4222-a222-222222222222', familyGroup: 'Legacy cmap TEST', label: 'Arimo · sentinella legacy TEST', dataBase64: bytes.toString('base64') };
}
export function legacyCmapFixture() {
  const document = createTestDocument(); document.documentId = '66666666-1111-4111-a111-111111111111'; document.areaMm = { width: 80, height: 40 }; document.fontAssets = [legacyCmapFont()];
  document.objects = [
    { id: 'frame', type: 'rect', xMm: 4, yMm: 4, widthMm: 72, heightMm: 32, fill: 'none', stroke: '#000000', strokeMm: .25 },
    { id: 'legacy-text', type: 'text', xMm: 10, yMm: 12, text: 'ABCéΩ', fontFamily: document.fontAssets[0]!.id, fontSizePt: 18, fill: '#000000' },
  ];
  return document;
}
