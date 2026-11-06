import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { mountFixtureCatalog, mountSnapshot } from '../src/catalog/adapter.ts';
import type { RuntimeState } from '../src/runtime/schema.ts';

const base = 'http://127.0.0.1:5173';
const runtime: RuntimeState = { csrfToken: 'TEST-layout-capture'.repeat(3), ai: { mode: 'demo', ready: false, reason: 'Cattura TEST senza AI', model: '', budgetUsd: 0, reservedUsd: 0, requests: 0 }, catalog: { version: mountFixtureCatalog.version, snapshot: mountSnapshot, checkedAt: null, pending: [] }, sync: { configured: false, intervalSeconds: 300, lastError: null, refreshing: false } };
const photos = new Set(mountSnapshot.products.flatMap(p => p.image ? [p.image.url] : []));
await mkdir('.local/previews', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.route('**/*', route => new URL(route.request().url()).origin === base || photos.has(route.request().url()) ? route.continue() : route.abort());
  await page.route('**/api/bootstrap', route => route.fulfill({ json: runtime }));
  await page.route('**/api/ai/interpret', route => route.abort());
  await page.goto(base);
  await page.getByLabel('Scrivi un messaggio', { exact: true }).fill('Timbro autoinchiostrante rettangolare, 50 x 20 mm');
  await page.getByRole('button', { name: 'Invia messaggio' }).click();
  await page.locator('.product-card').first().waitFor();
  await expect.poll(() => page.locator('.product-card').first().locator('img').evaluateAll(images => images.every(img => (img as HTMLImageElement).complete)), { timeout: 15_000 }).toBe(true);
  await page.locator('.chat-panel').scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.local/previews/chat-layout-desktop.png' });
  await page.locator('.product-card').first().screenshot({ path: '.local/previews/product-preview.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.chat-panel').screenshot({ path: '.local/previews/chat-layout-mobile.png' });
  console.log(JSON.stringify({ captured: ['desktop', 'mobile', 'product'], photosLoaded: await page.locator('.product-card img').evaluateAll(images => images.filter(img => (img as HTMLImageElement).naturalWidth > 0).length), aiCalls: 0 }));
} finally { await browser.close(); }
