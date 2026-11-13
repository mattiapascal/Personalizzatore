import { expect, it } from 'vitest';
import { textFontDiagnosticKey, fontDiagnosticAssetKey } from '../src/editor/font-diagnostic-key';
import { readFontCoverage } from '../src/editor/font-coverage-cache';
import { TEST_DEFAULT_FONT } from './helpers/editor-fonts';
import { compressedTestWoff } from './helpers/compressed-fonts';
import type { TextObject } from '../src/editor/text-style';
const object: TextObject = { id: 'text-test', type: 'text', xMm: 5, yMm: 8, text: 'ABCéΩ', fontFamily: TEST_DEFAULT_FONT.id, fontSizePt: 18, fill: '#000000' };
it('geometria, colore e file estranei non invalidano la diagnosi dei caratteri del testo', () => {
  const key = textFontDiagnosticKey(object, [TEST_DEFAULT_FONT]);
  expect(textFontDiagnosticKey({ ...object, xMm: 50, rotationDeg: 20, fontSizePt: 30, fill: '#0088cc' }, [TEST_DEFAULT_FONT])).toBe(key);
  const unused = { ...TEST_DEFAULT_FONT, id: 'font-77777777-7777-4777-a777-777777777777' };
  expect(textFontDiagnosticKey(object, [unused, TEST_DEFAULT_FONT])).toBe(key); unused.dataBase64 = 'AAAA';
  expect(textFontDiagnosticKey(object, [TEST_DEFAULT_FONT, unused])).toBe(key);
});
it('identità, contenuto e font/stili locali invalidano soltanto il testo pertinente', () => {
  const key = textFontDiagnosticKey(object, [TEST_DEFAULT_FONT]);
  for (const changed of [{ ...object, id: 'altro' }, { ...object, text: 'ABC' }, { ...object, fontStyle: 'italic' as const }, { ...object, characterStyles: [{ start: 0, end: 1, style: { fontWeight: 'bold' as const } }] }]) expect(textFontDiagnosticKey(changed, [TEST_DEFAULT_FONT])).not.toBe(key);
  expect(textFontDiagnosticKey(object, [])).not.toBe(key);
  const local = { ...object, characterStyles: [{ start: 0, end: 1, style: { fontFamily: 'font-77777777-7777-4777-a777-777777777777' } }] }, file = { ...TEST_DEFAULT_FONT, id: local.characterStyles[0]!.style.fontFamily };
  expect(textFontDiagnosticKey(local, [TEST_DEFAULT_FONT, file])).not.toBe(textFontDiagnosticKey(local, [TEST_DEFAULT_FONT]));
});
it('byte, formato e metadati pertinenti cambiati anche sulla stessa istanza non riusano un esito precedente', () => {
  const file = { ...TEST_DEFAULT_FONT }, original = fontDiagnosticAssetKey(file);
  expect(fontDiagnosticAssetKey(file)).toEqual(original); file.dataBase64 = file.dataBase64.slice(0, -4) + 'AAAA';
  const bytes = fontDiagnosticAssetKey(file); expect(bytes).not.toEqual(original); file.format = 'woff';
  const format = fontDiagnosticAssetKey(file); expect(format).not.toEqual(bytes); file.label = 'Etichetta diversa'; expect(fontDiagnosticAssetKey(file)).not.toEqual(format);
  expect(fontDiagnosticAssetKey()).toBeNull();
});
it('una copertura pertinente preparata in seguito invalida il precedente stato sconosciuto, senza incorporare binari nella chiave', async () => {
  const packed = compressedTestWoff(), file = { ...TEST_DEFAULT_FONT, format: 'woff' as const, dataBase64: packed.bytes.toString('base64') };
  expect(packed.compressedCmap).toBe(true); const before = textFontDiagnosticKey(object, [file]);
  expect(await readFontCoverage(file)).toBeDefined(); const after = textFontDiagnosticKey(object, [file]); expect(after).not.toBe(before); expect(textFontDiagnosticKey(object, [file])).toBe(after); expect(after.length).toBeLessThan(500);
});
