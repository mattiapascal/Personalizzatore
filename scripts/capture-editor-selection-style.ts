import { clickEditorButton } from '../tests/helpers/editor-ui';
import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const origin = 'http://127.0.0.1:5173', browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }), errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort()); await page.route('**/api/**', route => route.abort());
  await page.goto(`${origin}/editor?workspace=1`); await page.getByLabel('Riapri progetto JSON').setInputFiles('fixtures/illustrator/selection.TEST.json'); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 1 ·');
  await clickEditorButton(page, { name: 'Rettangolo · left-box', exact: true }); await page.getByRole('button', { name: 'Riempimento selezione: Nero', exact: true }).click(); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 2 ·');
  await page.getByLabel('Spessore contorno selezione (mm)', { exact: true }).fill('0.3'); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 3 ·'); await page.getByLabel('Tipo contorno selezione', { exact: true }).selectOption('dashed'); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 4 ·');
  await clickEditorButton(page, { name: 'Porta selezione in primo piano', exact: true }); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 5 ·');
  for (const [label, extension] of [['Esporta JSON', 'json'], ['Esporta SVG', 'svg']] as const) { const pending = page.waitForEvent('download'); await page.getByRole('button', { name: label, exact: true }).click(); await (await pending).saveAs(`fixtures/illustrator/selection-style.TEST.${extension}`); }
  mkdirSync('.local/previews', { recursive: true }); await page.getByLabel('Spessore contorno selezione (mm)', { exact: true }).scrollIntoViewIfNeeded(); await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))); await page.screenshot({ path: '.local/previews/editor-selection-style-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 }); await page.getByRole('button', { name: 'Ispettore', exact: true }).click(); await page.getByLabel('Spessore contorno selezione (mm)', { exact: true }).scrollIntoViewIfNeeded(); await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: '.local/previews/editor-selection-style-mobile.png' }); expect(errors).toEqual([]);
  console.log('selection-style.TEST.json/svg e anteprime generati localmente; Illustrator da collaudare.');
} finally { await browser.close(); }
