import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { testPng } from '../tests/helpers/png';
const origin = 'http://127.0.0.1:5173', width = 160, height = 80, rgba = new Uint8Array(width * height * 4);
const cropMode = process.argv.includes('--crop'), filterMode = process.argv.includes('--filters'), sample = filterMode ? 'raster-filters' : cropMode ? 'raster-crop' : 'raster', sourceName = filterMode ? 'raster-gradient' : 'raster-source';
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const index = (y * width + x) * 4, value = filterMode ? Math.round(x / (width - 1) * 255) : [0, 90, 180, 255][Math.floor(x / 40)]!;
  rgba[index] = rgba[index + 1] = rgba[index + 2] = value; rgba[index + 3] = x < 4 || x >= width - 4 || y < 4 || y >= height - 4 ? 0 : 255;
  if (Math.hypot(x - width / 2, y - height / 2) < 20) { rgba[index] = 180; rgba[index + 1] = 30; rgba[index + 2] = 80; }
}
writeFileSync(`fixtures/illustrator/${sourceName}.TEST.png`, testPng(width, height, rgba));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }), errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort()); await page.route('**/api/**', route => route.abort());
  await page.goto(`${origin}/editor`); await page.getByLabel('Riapri progetto JSON').setInputFiles('fixtures/illustrator/stamp.TEST.json');
  const doc = JSON.parse((await page.getByTestId('graphic-state').textContent())!); doc.objects = [{ id: 'title', type: 'text', xMm: 10, yMm: 3, text: 'PNG · TEST', fontFamily: 'Arial', fontSizePt: 9, fill: '#000000', textAlign: 'center', textBox: { widthMm: 38, heightMm: 4, autoWidth: false, autoHeight: true } }];
  await page.getByLabel('Riapri progetto JSON').setInputFiles({ name: 'raster-seed.TEST.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(doc)) });
  await page.getByLabel('File immagine locale', { exact: true }).setInputFiles(`fixtures/illustrator/${sourceName}.TEST.png`); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 3 ·');
  await page.getByLabel('Y (mm)', { exact: true }).fill('14'); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 4 ·'); await page.getByRole('tab', { name: 'Immagine', exact: true }).click();
  await page.getByLabel('Soglia bianco/nero', { exact: true }).fill('160'); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 5 ·'); await page.getByLabel('Bianco trasparente', { exact: true }).check(); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 6 ·');
  if (filterMode) {
    await page.getByLabel('Metodo bianco/nero', { exact: true }).selectOption('diffusion'); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 7 ·');
    await page.getByLabel('Luminosità', { exact: true }).fill('8'); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 8 ·');
    await page.getByLabel('Contrasto', { exact: true }).fill('20'); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 9 ·');
  }
  if (cropMode) {
    await page.getByRole('tab', { name: 'Ritaglio', exact: true }).click(); await page.getByLabel('Sinistra ritaglio (px)', { exact: true }).fill('40'); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 7 ·');
    await page.getByRole('tab', { name: 'Immagine', exact: true }).click(); await page.getByRole('button', { name: 'Rifletti immagine orizzontalmente', exact: true }).click(); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 8 ·'); await page.getByRole('tab', { name: 'Ritaglio', exact: true }).click();
  }
  for (const [label, extension] of [['Esporta JSON', 'json'], ['Esporta SVG', 'svg']] as const) {
    const pending = page.waitForEvent('download'); await page.getByRole('button', { name: label, exact: true }).click(); await (await pending).saveAs(`fixtures/illustrator/${sample}.TEST.${extension}`);
  }
  await page.getByRole('button', { name: 'Apri area di disegno a tutto schermo', exact: true }).click();
  mkdirSync('.local/previews', { recursive: true }); await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))); await page.screenshot({ path: `.local/previews/editor-${sample}-desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 }); await page.getByRole('button', { name: 'Ispettore', exact: true }).click(); await expect(page.getByLabel(cropMode ? 'Sinistra ritaglio (px)' : 'Soglia bianco/nero', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: `.local/previews/editor-${sample}-mobile.png` }); expect(errors).toEqual([]);
  console.log(`${sourceName}.TEST.png, ${sample}.TEST.json/svg e anteprime desktop/mobile generati senza servizi esterni. Illustrator da collaudare.`);
} finally { await browser.close(); }
