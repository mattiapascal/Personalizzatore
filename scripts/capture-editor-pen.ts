import { clickEditorButton } from '../tests/helpers/editor-ui';
import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const origin = 'http://127.0.0.1:5173', browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }), errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort()); await page.route('**/api/**', route => route.abort());
  await page.goto(`${origin}/editor`); await page.getByLabel('Riapri progetto JSON').setInputFiles('fixtures/illustrator/stamp.TEST.json');
  const doc = JSON.parse((await page.getByTestId('graphic-state').textContent())!); doc.objects = [{ id: 'title', type: 'text', xMm: 10, yMm: 4, text: 'PENNA · TEST', fontFamily: 'Arial', fontSizePt: 9, fill: '#000000', textAlign: 'center', textBox: { widthMm: 38, heightMm: 4, autoWidth: false, autoHeight: true } }];
  await page.getByLabel('Riapri progetto JSON').setInputFiles({ name: 'pen-seed.TEST.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(doc)) });
  const canvas = page.locator('.upper-canvas');
  await page.getByRole('button', { name: 'Disegna tracciato per punti', exact: true }).click();
  for (const [x, y] of [[28, 12], [33, 9], [38, 16], [47, 11]]) await canvas.click({ position: { x: x! * 8, y: y! * 8 } });
  await page.keyboard.press('Enter'); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 3 ·');
  await page.getByRole('button', { name: 'Disegna tracciato per punti', exact: true }).click();
  for (const [x, y] of [[8, 17], [13, 11], [18, 17]]) await canvas.click({ position: { x: x! * 8, y: y! * 8 } });
  await page.getByRole('button', { name: 'Chiudi tracciato disegnato', exact: true }).click(); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 4 ·');
  for (const [label, extension] of [['Esporta JSON', 'json'], ['Esporta SVG', 'svg']] as const) {
    const pending = page.waitForEvent('download'); await page.getByRole('button', { name: label, exact: true }).click(); await (await pending).saveAs(`fixtures/illustrator/pen.TEST.${extension}`);
  }
  await clickEditorButton(page, { name: 'Seleziona tutto', exact: true }); await page.getByRole('button', { name: 'Apri area di disegno a tutto schermo', exact: true }).click();
  mkdirSync('.local/previews', { recursive: true }); await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))); await page.screenshot({ path: '.local/previews/editor-pen-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 }); await page.getByRole('button', { name: 'Ispettore', exact: true }).click(); await expect(page.getByRole('form', { name: 'Proprietà selezione' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))); await page.screenshot({ path: '.local/previews/editor-pen-mobile.png' });
  expect(errors).toEqual([]); console.log('pen.TEST.json/svg e anteprime desktop/mobile generati senza API esterne. Illustrator da collaudare.');
} finally { await browser.close(); }
