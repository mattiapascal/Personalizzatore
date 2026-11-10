import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const origin = 'http://127.0.0.1:5173', browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }), errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort()); await page.route('**/api/**', route => route.abort());
  await page.goto(`${origin}/editor?workspace=1`); await page.getByLabel('Riapri progetto JSON').setInputFiles('fixtures/illustrator/raster-filters.TEST.json'); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 1 ·');
  await page.getByText('Esportazione PNG della bozza', { exact: true }).click();
  for (const [dpi, transparent, filename] of [[300, false, 'preview-raster-300dpi'], [150, true, 'preview-raster-transparent-150dpi']] as const) {
    await page.getByLabel('Risoluzione PNG', { exact: true }).selectOption(String(dpi)); await page.getByLabel('Sfondo PNG trasparente', { exact: true }).setChecked(transparent);
    const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Esporta PNG', exact: true }).click(); await (await pending).saveAs(`fixtures/illustrator/${filename}.TEST.png`);
  }
  mkdirSync('.local/previews', { recursive: true }); await page.getByRole('button', { name: 'Esporta PNG', exact: true }).scrollIntoViewIfNeeded(); await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))); await page.screenshot({ path: '.local/previews/editor-png-export-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 }); await page.getByRole('button', { name: 'Strumenti', exact: true }).click(); await page.getByRole('button', { name: 'Esporta PNG', exact: true }).scrollIntoViewIfNeeded(); await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: '.local/previews/editor-png-export-mobile.png' }); expect(errors).toEqual([]);
  console.log('PNG di bozza 300 dpi bianco/150 dpi trasparente e anteprime generati localmente.');
} finally { await browser.close(); }
