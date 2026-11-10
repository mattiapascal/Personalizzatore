import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

// Fixture ripetibile senza chiamate AI/Shopify o richieste esterne.
const origin = 'http://127.0.0.1:5173';
const fontMode = process.argv.includes('--fonts'), sample = fontMode ? 'fonts' : 'text-box', preview = fontMode ? 'fonts' : 'inspector';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.route('**/api/**', route => route.abort());
  await page.goto(`${origin}/editor`);
  await page.getByLabel('Riapri progetto JSON').setInputFiles('fixtures/illustrator/stamp.TEST.json');
  await page.getByText('Strumenti sviluppatore').click();
  const object = {
    id: 'text-1', type: 'text', xMm: 8, yMm: 5, text: 'Città · TEST\nTesto modificabile', fontSizePt: 9, fontFamily: fontMode ? 'Georgia' : 'Arial', fill: '#000000',
    textBox: { widthMm: 30, heightMm: 12, autoWidth: false, autoHeight: true },
    characterStyles: [{ start: 0, end: 5, style: { fontSizePt: 12, fontWeight: 'bold', ...(fontMode ? { fontFamily: 'Times New Roman' } : {}) } }, { start: 13, end: 18, style: { fontStyle: 'italic', underline: true, ...(fontMode ? { fontFamily: 'Courier New' } : {}) } }],
  };
  object.textBox.heightMm = await page.evaluate(async object => {
    const path = '/src/editor/fabric-adapter.ts'; return (await import(path)).measureTextFrame(object).heightMm;
  }, object);
  await page.getByLabel('Comando AI simulato').fill(JSON.stringify({ schemaVersion: 1, tool: 'updateObject', objectId: object.id, expectedRevision: 1, arguments: { object } }));
  await page.getByRole('button', { name: 'Esegui comando', exact: true }).click();
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 2 ·');
  for (const [button, extension] of [['Esporta JSON', 'json'], ['Esporta SVG', 'svg']] as const) {
    const download = page.waitForEvent('download'); await page.getByRole('button', { name: button, exact: true }).click();
    await (await download).saveAs(`fixtures/illustrator/${sample}.TEST.${extension}`);
  }
  await page.getByRole('group', { name: 'Oggetti del progetto' }).getByRole('button', { name: 'Testo · text-1', exact: true }).click();
  await page.getByRole('button', { name: 'Apri area di disegno a tutto schermo' }).click();
  await page.getByRole('tab', { name: 'Testo', exact: true }).click();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  mkdirSync('.local/previews', { recursive: true });
  await page.screenshot({ path: `.local/previews/editor-${preview}-desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Ispettore', exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await page.screenshot({ path: `.local/previews/editor-${preview}-mobile.png` });
  expect(errors).toEqual([]);
  console.log(`${sample}.TEST.json/svg e anteprime ispettore desktop/mobile generati. Illustrator da collaudare.`);
} finally { await browser.close(); }
