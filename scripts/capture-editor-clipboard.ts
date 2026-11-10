import { clickEditorButton } from '../tests/helpers/editor-ui';
import { chromium, expect } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
const origin = 'http://127.0.0.1:5173', browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }), errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort()); await page.route('**/api/**', route => route.abort());
  await page.goto(`${origin}/editor`); const seed = JSON.parse(readFileSync('fixtures/illustrator/selection.TEST.json', 'utf8')); seed.objects[0].yMm = 2.5; for (const object of seed.objects.slice(1)) object.yMm = 13.5; await page.getByLabel('Riapri progetto JSON').setInputFiles({ name: 'clipboard-seed.TEST.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(seed)) }); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 1 ·');
  await clickEditorButton(page, { name: 'Rettangolo · left-box', exact: true }); await clickEditorButton(page, { name: 'Copia negli appunti dell’editor', exact: true }); await clickEditorButton(page, { name: 'Incolla dagli appunti dell’editor', exact: true }); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 2 ·');
  const canvas = page.locator('.upper-canvas'); await canvas.focus(); for (let i = 0; i < 6; i++) await canvas.press('Shift+ArrowUp'); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 8 ·');
  for (const [label, extension] of [['Esporta JSON', 'json'], ['Esporta SVG', 'svg']] as const) { const pending = page.waitForEvent('download'); await page.getByRole('button', { name: label, exact: true }).click(); await (await pending).saveAs(`fixtures/illustrator/clipboard.TEST.${extension}`); }
  await page.getByRole('button', { name: 'Apri area di disegno a tutto schermo', exact: true }).click(); mkdirSync('.local/previews', { recursive: true }); await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))); await page.screenshot({ path: '.local/previews/editor-clipboard-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 }); await page.getByRole('button', { name: 'Pannello livelli', exact: true }).click(); await page.getByRole('button', { includeHidden: true, name: 'Incolla dagli appunti dell’editor', exact: true }).scrollIntoViewIfNeeded(); await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: '.local/previews/editor-clipboard-mobile.png' }); expect(errors).toEqual([]);
  console.log('clipboard.TEST.json/svg e anteprime desktop/mobile generati localmente; Illustrator da collaudare.');
} finally { await browser.close(); }
