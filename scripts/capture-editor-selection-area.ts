import { clickEditorButton } from '../tests/helpers/editor-ui';
import { chromium, expect } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
const origin = 'http://127.0.0.1:5173', browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }), errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort()); await page.route('**/api/**', route => route.abort());
  const seed = JSON.parse(readFileSync('fixtures/illustrator/selection.TEST.json', 'utf8')); seed.objects = seed.objects.filter((object: { id: string }) => object.id !== 'right-box');
  await page.goto(`${origin}/editor?workspace=1`); await page.getByLabel('Riapri progetto JSON').setInputFiles({ name: 'area-seed.TEST.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(seed)) }); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 1 ·');
  await clickEditorButton(page, { name: 'Rettangolo · left-box', exact: true }); await page.getByRole('button', { name: 'Centra selezione orizzontalmente nell’area', exact: true }).click(); await page.getByRole('button', { name: 'Centra selezione verticalmente nell’area', exact: true }).click(); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 3 ·');
  for (const [label, extension] of [['Esporta JSON', 'json'], ['Esporta SVG', 'svg']] as const) { const pending = page.waitForEvent('download'); await page.getByRole('button', { name: label, exact: true }).click(); await (await pending).saveAs(`fixtures/illustrator/selection-area.TEST.${extension}`); }
  mkdirSync('.local/previews', { recursive: true }); await page.getByRole('button', { name: 'Centra selezione verticalmente nell’area', exact: true }).scrollIntoViewIfNeeded(); await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))); await page.screenshot({ path: '.local/previews/editor-selection-area-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 }); await page.getByRole('button', { name: 'Ispettore', exact: true }).click(); await page.getByRole('button', { name: 'Centra selezione verticalmente nell’area', exact: true }).scrollIntoViewIfNeeded(); await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: '.local/previews/editor-selection-area-mobile.png' }); expect(errors).toEqual([]);
  console.log('selection-area.TEST.json/svg e anteprime generati localmente; Illustrator da collaudare.');
} finally { await browser.close(); }
