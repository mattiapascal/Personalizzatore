import { clickEditorButton } from '../tests/helpers/editor-ui';
import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const origin = 'http://127.0.0.1:5173', browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }), errors: string[] = [], external: string[] = [];
  page.on('pageerror', error => errors.push(error.message)); page.on('request', request => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== origin) external.push(request.url()); });
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort()); await page.route('**/api/**', route => route.abort());
  await page.goto(`${origin}/editor`); await page.getByLabel('Riapri progetto JSON').setInputFiles('fixtures/illustrator/stamp.TEST.json'); const doc = JSON.parse((await page.getByTestId('graphic-state').textContent())!);
  doc.objects = [{ id: 'title', type: 'text', xMm: 8, yMm: 2, text: 'BÉZIER · TEST', fontFamily: 'Arial', fontSizePt: 9, fill: '#000000', textAlign: 'center', textBox: { widthMm: 42, heightMm: 4, autoWidth: false, autoHeight: true } }];
  await page.getByLabel('Riapri progetto JSON').setInputFiles({ name: 'bezier-seed.TEST.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(doc)) });
  const draw = async (nodes: [number, number, number?, number?][], closed: boolean) => {
    await page.getByRole('button', { name: 'Disegna curva Bézier', exact: true }).click(); const canvas = page.locator('.upper-canvas'); await canvas.scrollIntoViewIfNeeded(); const bounds = (await canvas.boundingBox())!;
    for (const [x, y, dx = 0, dy = 0] of nodes) { await page.mouse.move(bounds.x + x * 8, bounds.y + y * 8); await page.mouse.down(); if (dx || dy) await page.mouse.move(bounds.x + (x + dx) * 8, bounds.y + (y + dy) * 8, { steps: 8 }); await page.mouse.up(); }
    await page.getByRole('button', { name: closed ? 'Chiudi tracciato disegnato' : 'Termina tracciato aperto', exact: true }).click();
  };
  await draw([[8, 14, 3, -6], [22, 14, 3, -6]], false); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 3 ·');
  const first = JSON.parse((await page.getByTestId('graphic-state').textContent())!).objects.at(-1).id;
  await draw([[32, 15, 0, -4], [40, 9, 4, 0], [48, 15, 0, 4]], true); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 4 ·');
  for (const [label, extension] of [['Esporta JSON', 'json'], ['Esporta SVG', 'svg']] as const) {
    const pending = page.waitForEvent('download'); await page.getByRole('button', { name: label, exact: true }).click(); await (await pending).saveAs(`fixtures/illustrator/bezier.TEST.${extension}`);
  }
  await clickEditorButton(page, { name: `Curva Bézier · ${first}`, exact: true }); await page.getByRole('tab', { name: 'Nodi', exact: true }).click(); await page.getByRole('button', { name: 'Apri area di disegno a tutto schermo', exact: true }).click();
  mkdirSync('.local/previews', { recursive: true }); await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))); await page.screenshot({ path: '.local/previews/editor-bezier-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 }); await page.getByRole('button', { name: 'Ispettore', exact: true }).click(); await expect(page.getByLabel('X nodo curva (mm)', { exact: true })).toBeVisible(); await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))); await page.screenshot({ path: '.local/previews/editor-bezier-mobile.png' });
  expect(errors).toEqual([]); expect(external).toEqual([]); console.log('bezier.TEST.json/svg e anteprime desktop/mobile creati con penna e comandi locali. Illustrator da collaudare.');
} finally { await browser.close(); }
