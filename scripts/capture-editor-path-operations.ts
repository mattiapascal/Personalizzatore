import { clickEditorButton } from '../tests/helpers/editor-ui';
import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const origin = 'http://127.0.0.1:5173', browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }), errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort()); await page.route('**/api/**', route => route.abort());
  await page.goto(`${origin}/editor?workspace=1`); await page.getByLabel('Riapri progetto JSON').setInputFiles('fixtures/illustrator/polygons.TEST.json'); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 1 ·');
  await clickEditorButton(page, { name: 'Tracciato · right-box', exact: true }); await page.getByRole('tab', { name: 'Nodi', exact: true }).click();
  await page.getByRole('button', { name: 'Rifletti tracciato orizzontalmente', exact: true }).click(); await page.getByRole('button', { name: 'Inverti ordine dei nodi', exact: true }).click();
  await page.getByRole('combobox', { name: 'Nodo', exact: true }).selectOption('2'); await page.getByRole('button', { name: 'Apri tracciato dal nodo selezionato', exact: true }).click(); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 4 ·'); const firstX = Number(await page.getByLabel('X nodo (mm)', { exact: true }).inputValue()); await page.getByLabel('X nodo (mm)', { exact: true }).fill(String(Math.round((firstX + 1) * 1000) / 1000)); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 5 ·');
  for (const [label, extension] of [['Esporta JSON', 'json'], ['Esporta SVG', 'svg']] as const) { const pending = page.waitForEvent('download'); await page.getByRole('button', { name: label, exact: true }).click(); await (await pending).saveAs(`fixtures/illustrator/path-operations.TEST.${extension}`); }
  mkdirSync('.local/previews', { recursive: true }); await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))); await page.screenshot({ path: '.local/previews/editor-path-operations-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 }); await page.getByRole('button', { name: 'Ispettore', exact: true }).click(); await expect(page.getByRole('button', { name: 'Inverti ordine dei nodi', exact: true })).toBeVisible(); await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: '.local/previews/editor-path-operations-mobile.png' }); expect(errors).toEqual([]);
  console.log('path-operations.TEST.json/svg e anteprime generati localmente; Illustrator da collaudare.');
} finally { await browser.close(); }
