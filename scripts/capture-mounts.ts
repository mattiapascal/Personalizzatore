import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { mountFixtureCatalog, mountSnapshot } from '../src/catalog/adapter.ts';
import type { RuntimeState } from '../src/runtime/schema.ts';

// Fixture e browser locale: nessuna chiamata AI o Shopify generata dalla cattura.
const baseUrl = 'http://127.0.0.1:5173';
const runtime: RuntimeState = {
  csrfToken: 'TEST-capture-mounts'.repeat(3),
  ai: { mode: 'demo', ready: false, reason: 'Cattura con fixture TEST, nessuna chiamata AI', model: '', budgetUsd: 0, reservedUsd: 0, requests: 0 },
  catalog: { version: mountFixtureCatalog.version, snapshot: mountSnapshot, checkedAt: null, pending: [] },
  sync: { configured: false, intervalSeconds: 300, lastError: null, refreshing: false },
};
const examples = [
  { file: 'automatic-round-30', request: 'Timbro autoinchiostrante rotondo diametro 30 mm', title: /Colop Printer R30/, variant: '' },
  { file: 'pocket-square-12', request: 'Timbro tascabile quadrato 12 x 12 mm', title: /Q12/, variant: '' },
  { file: 'emboss-round-41', request: 'Timbro a secco rotondo diametro 41 mm', title: /Trodat Ideal/, variant: 'Circolare 41' },
];
await mkdir('.local/previews', { recursive: true });
const browser = await chromium.launch();
try {
  for (const example of examples) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    await page.route('**/*', route => new URL(route.request().url()).origin === baseUrl ? route.continue() : route.abort());
    await page.route('**/api/bootstrap', route => route.fulfill({ json: runtime }));
    await page.route('**/api/ai/interpret', route => route.abort());
    await page.goto(baseUrl);
    await page.getByLabel('Scrivi un messaggio', { exact: true }).fill(example.request);
    await page.getByRole('button', { name: 'Invia messaggio' }).click();
    const card = page.locator('.product-card').filter({ has: page.getByRole('heading', { name: example.title }) }).filter({ hasText: example.variant }).first();
    await card.getByRole('button', { name: 'Prova nel canvas' }).click();
    await expect(page.getByRole('button', { name: 'Esporta SVG' })).toBeEnabled();
    for (const type of ['JSON', 'SVG']) {
      const download = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Esporta ' + type, exact: true }).click();
      await (await download).saveAs(`fixtures/illustrator/${example.file}.TEST.${type.toLowerCase()}`);
    }
    await page.locator('.lab').screenshot({ path: `.local/previews/${example.file}.png` });
    if (example.file === 'automatic-round-30') {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator('.lab').screenshot({ path: '.local/previews/automatic-round-30-mobile.png' });
    }
    await page.close(); console.log('PASS cattura ' + example.file);
  }
} finally { await browser.close(); }
