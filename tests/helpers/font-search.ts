import { createTestDocument, TEST_DEFAULT_FONT } from './editor-fonts';
export function fontSearchFixture() {
  const document = createTestDocument(); document.documentId = '77777777-2222-4222-a222-222222222222'; document.areaMm = { width: 80, height: 40 }; document.fontAssets = [TEST_DEFAULT_FONT];
  document.objects = [{ id: 'search-text', type: 'text', text: 'TEST · Città', xMm: 10, yMm: 10, fontFamily: TEST_DEFAULT_FONT.id, fontSizePt: 18, fill: '#000000' }];
  return document;
}
