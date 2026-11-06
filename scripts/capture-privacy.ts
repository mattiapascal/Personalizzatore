import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { mountFixtureCatalog, mountSnapshot } from '../src/catalog/adapter.ts';
import type { RuntimeState } from '../src/runtime/schema.ts';

const base = 'http://127.0.0.1:5173';
const runtime: RuntimeState = { csrfToken: 'TEST-privacy-capture'.repeat(3), ai: { mode: 'openai', ready: true, reason: 'Trasporto TEST, nessuna rete AI', model: 'TEST', budgetUsd: 0, reservedUsd: 0, requests: 0, sessionBudgetUsd: 0.05, catalogContextEnabled: true }, catalog: { version: mountFixtureCatalog.version, snapshot: mountSnapshot, checkedAt: null, pending: [] }, sync: { configured: false, intervalSeconds: 300, lastError: null, refreshing: false } };
await mkdir('.local/previews', { recursive: true });
const browser = await chromium.launch();
let aiRequests = 0;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  await page.route('**/api/bootstrap', route => route.fulfill({ json: runtime }));
  await page.route('**/api/ai/interpret', route => { aiRequests++; return route.abort(); });
  await page.goto(base);
  await page.getByLabel('Scrivi un messaggio', { exact: true }).fill('Testo: Persona Esempio\nAzienda Fittizia Srl\ncliente@example.test');
  await page.getByRole('button', { name: 'Invia messaggio' }).click();
  const preview = page.getByRole('region', { name: 'Verifica privacy prima dell’invio' });
  await expect(preview).toBeVisible();
  await expect(page.getByLabel('Testo protetto da inviare a OpenAI')).not.toHaveValue(/Persona|Fittizia|example/);
  await preview.screenshot({ path: '.local/previews/privacy-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await preview.screenshot({ path: '.local/previews/privacy-mobile.png' });
  expect(aiRequests).toBe(0);
  console.log(JSON.stringify({ captured: ['desktop', 'mobile'], aiRequests }));
} finally { await browser.close(); }
