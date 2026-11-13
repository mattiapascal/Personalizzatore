import { createTestDocument, TEST_DEFAULT_FONT } from './editor-fonts';
import type { TextObject } from '../../src/editor/text-style';
/** Portable TEST only: no private assets or installed computer fonts. */
export function textSkewFixture() {
  const document = createTestDocument(); document.areaMm = { width: 160, height: 100 }; document.colorMode = 'color';
  document.objects = [
    { id: 'skew-positive', type: 'text', xMm: 12, yMm: 12, text: 'TEST · Città', fontFamily: TEST_DEFAULT_FONT.id, fontSizePt: 24, fill: '#0088cc', textSkewXDeg: 24, rotationDeg: -12, textScaleX: 1.25, textAlign: 'center', stroke: '#000000', strokeMm: .15, strokeLineJoin: 'round', characterStyles: [{ start: 7, end: 12, style: { fill: '#aa3300', fontSizePt: 20, underline: true } }] },
    { id: 'skew-negative', type: 'text', xMm: 35, yMm: 50, text: 'Box fisso\nTesto editabile', fontFamily: TEST_DEFAULT_FONT.id, fontSizePt: 20, fill: '#000000', textSkewXDeg: -28, rotationDeg: 9, textAlign: 'center', lineHeight: 1, textBox: { widthMm: 70, heightMm: 24, autoWidth: false, autoHeight: true } },
  ] satisfies TextObject[];
  return document;
}
