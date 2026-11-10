import { clickEditorButton } from '../tests/helpers/editor-ui';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { testJpeg, jpegWithExif } from '../tests/helpers/jpeg';
const origin = 'http://127.0.0.1:5173', source = jpegWithExif(testJpeg(), 6), browser = await chromium.launch();
writeFileSync('fixtures/illustrator/jpeg-source.TEST.jpg', source);
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }), errors: string[] = [], external: string[] = [];
  page.on('pageerror', error => errors.push(error.message)); page.on('request', request => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== origin) external.push(request.url()); });
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort()); await page.route('**/api/**', route => route.abort());
  await page.goto(`${origin}/editor`); await page.getByLabel('Riapri progetto JSON').setInputFiles('fixtures/illustrator/stamp.TEST.json'); const doc = JSON.parse((await page.getByTestId('graphic-state').textContent())!);
  doc.objects = [{ id: 'title', type: 'text', xMm: 7, yMm: 2, text: 'JPEG EXIF · TEST', fontFamily: 'Arial', fontSizePt: 9, fill: '#000000', textAlign: 'center', textBox: { widthMm: 44, heightMm: 4, autoWidth: false, autoHeight: true } }];
  await page.getByLabel('Riapri progetto JSON').setInputFiles({ name: 'jpeg-seed.TEST.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(doc)) });
  await page.getByLabel('File immagine locale', { exact: true }).setInputFiles('fixtures/illustrator/jpeg-source.TEST.jpg'); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 3 ·');
  await page.getByLabel('X (mm)', { exact: true }).fill('19'); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 4 ·'); await page.getByLabel('Y (mm)', { exact: true }).fill('14'); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 5 ·');
  await clickEditorButton(page, { name: 'Duplica selezionato', exact: true }); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 6 ·'); await page.getByLabel('X (mm)', { exact: true }).fill('39'); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 7 ·');
  await page.getByRole('tab', { name: 'Ritaglio', exact: true }).click(); await page.getByLabel('Sinistra ritaglio (px)', { exact: true }).fill('12'); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 8 ·');
  await page.getByRole('tab', { name: 'Immagine', exact: true }).click(); await page.getByRole('button', { name: 'Rifletti immagine orizzontalmente', exact: true }).click(); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 9 ·');
  for (const [label, extension] of [['Esporta JSON', 'json'], ['Esporta SVG', 'svg']] as const) { const pending = page.waitForEvent('download'); await page.getByRole('button', { name: label, exact: true }).click(); await (await pending).saveAs(`fixtures/illustrator/jpeg.TEST.${extension}`); }
  await page.getByRole('tab', { name: 'Geometria', exact: true }).click(); await page.getByRole('button', { name: 'Apri area di disegno a tutto schermo', exact: true }).click();
  mkdirSync('.local/previews', { recursive: true }); await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))); await page.screenshot({ path: '.local/previews/editor-jpeg-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 }); await page.getByRole('button', { name: 'Ispettore', exact: true }).click(); await expect(page.getByLabel('X (mm)', { exact: true })).toBeVisible(); await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))); await page.screenshot({ path: '.local/previews/editor-jpeg-mobile.png' });
  expect(errors).toEqual([]); expect(external).toEqual([]); console.log('jpeg-source.TEST.jpg, jpeg.TEST.json/svg e anteprime desktop/mobile generati localmente. Illustrator da collaudare.');
} finally { await browser.close(); }
