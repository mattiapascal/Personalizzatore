import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fixtureCatalog, snapshot } from '../src/catalog/adapter';
import type { RuntimeState } from '../src/runtime/schema';

// Campione riproducibile TEST. Solo loopback e fixture: nessuna AI o lettura Shopify.
const origin = 'http://127.0.0.1:5173';
const transforms = process.argv.includes('--transforms');
const workspace = process.argv.includes('--workspace');
const sample = transforms ? 'transforms' : 'objects';
const preview = workspace ? 'workspace' : sample;
const runtime: RuntimeState = {
  csrfToken: 'editor-fixture-local-token'.repeat(2),
  ai: { mode: 'demo', ready: false, reason: 'Cattura TEST', model: 'gpt-5.4-mini-2026-03-17', budgetUsd: 0, reservedUsd: 0, requests: 0 },
  catalog: { version: fixtureCatalog.version, snapshot: structuredClone(snapshot), checkedAt: null, pending: [] },
  sync: { configured: false, intervalSeconds: 300, lastError: null, refreshing: false },
};
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.route('**/api/**', route => route.abort());
  await page.route('**/api/bootstrap', route => route.fulfill({ json: runtime }));
  await page.goto(origin);
  await page.getByLabel('Scrivi un messaggio', { exact: true }).fill('Timbro autoinchiostrante rettangolare, non so le misure');
  await page.getByRole('button', { name: 'Invia messaggio' }).click();
  await page.locator('.product-card').filter({ has: page.getByRole('heading', { name: /4913/ }) }).getByRole('button', { name: 'Prova nel canvas' }).click();
  await page.getByLabel('Riapri progetto JSON').setInputFiles('fixtures/illustrator/stamp.TEST.json');
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 1 ·');
  await page.getByText('Strumenti sviluppatore').click();
  let revision = 1;
  const command = async (tool: string, objectId: string, args: unknown) => {
    await page.getByLabel('Comando AI simulato').fill(JSON.stringify({ schemaVersion: 1, tool, objectId, expectedRevision: revision, arguments: args }));
    await page.getByRole('button', { name: 'Esegui comando', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByTestId('revision')).toContainText(`Revisione grafica: ${++revision} ·`);
  };
  await command('duplicateObject', 'text-1', { newObjectId: 'copy-text-1', xMm: 5, yMm: 12 });
  await command('setText', 'copy-text-1', { text: 'COPIA' });
  await command('addObject', 'small-rect', { object: { id: 'small-rect', type: 'rect', xMm: 38, yMm: 5, widthMm: 10, heightMm: 5, strokeMm: 0.25, stroke: '#000000' } });
  await command('addObject', 'small-circle', { object: { id: 'small-circle', type: 'circle', xMm: 42, yMm: 12, radiusMm: 2, strokeMm: 0.25, stroke: '#000000' } });
  if (transforms) {
    await command('transformObject', 'small-rect', { xMm: 43, yMm: 4, rotationDeg: 30, size: { type: 'rect', widthMm: 10, heightMm: 5 } });
    await command('transformObject', 'copy-text-1', { xMm: 5, yMm: 12, rotationDeg: -15, size: { type: 'text', fontSizePt: 10 } });
    await command('alignObject', 'text-1', { alignment: 'centerX' });
    await command('reorderObject', 'small-rect', { position: 'back' });
  }
  for (const [button, extension] of [['Esporta JSON', 'json'], ['Esporta SVG', 'svg']] as const) {
    const pending = page.waitForEvent('download'); await page.getByRole('button', { name: button, exact: true }).click();
    await (await pending).saveAs(`fixtures/illustrator/${sample}.TEST.${extension}`);
  }
  await page.getByText('Strumenti sviluppatore').click();
  if (transforms) await page.getByRole('group', { name: 'Oggetti del progetto' }).getByRole('button', { name: 'Rettangolo · small-rect', exact: true }).click();
  if (workspace) await page.getByRole('button', { name: 'Apri area di disegno a tutto schermo' }).click();
  mkdirSync('.local/previews', { recursive: true });
  if (workspace) await page.screenshot({ path: `.local/previews/editor-${preview}-desktop.png` });
  else await page.locator('.lab').screenshot({ path: `.local/previews/editor-${preview}-desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (workspace) {
    await expect(page.getByRole('complementary', { name: 'Ispettore oggetto' })).toBeHidden();
    await page.getByRole('button', { name: 'Ispettore', exact: true }).click();
    await page.screenshot({ path: `.local/previews/editor-${preview}-mobile.png` });
  } else await page.locator('.lab').screenshot({ path: `.local/previews/editor-${preview}-mobile.png` });
  expect(errors).toEqual([]);
  console.log(`Campioni ${sample}.TEST.json/svg e anteprime desktop/mobile generati. Illustrator non collaudato.`);
} finally { await browser.close(); }
