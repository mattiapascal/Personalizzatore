import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { createCatalog } from '../src/catalog/adapter.ts';
import { recommendProducts } from '../src/selection/rules.ts';
import { RuntimeSchema } from '../src/runtime/schema.ts';

// Collaudo esplicito a pagamento, solo frasi TEST; escluso da npm run check.
const baseUrl = 'http://127.0.0.1:5173';
const status = RuntimeSchema.parse(await (await fetch(baseUrl + '/api/bootstrap')).json());
if (!status.ai?.ready || status.ai.mode !== 'openai') throw new Error('Avvia il laboratorio con provider OpenAI configurato');
if (status.sync.stale) throw new Error('Aggiornare il catalogo prima del collaudo a pagamento');
const candidates = recommendProducts(createCatalog(status.catalog.snapshot, status.catalog.version), { family: 'stamp', mechanism: 'automatic', shape: 'rectangle', minimumAreaMm: { width: 50, height: 20 } });
if (!candidates.length) throw new Error('Nessun candidato atteso nel catalogo attuale');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await page.route('**/*', route => new URL(route.request().url()).origin === baseUrl ? route.continue() : route.abort());
  await page.goto(baseUrl);
  for (const message of ['Voglio fare un timbro per le fatture', 'Autoinchiostrante', 'Rettangolare', '50 x 20 mm']) {
    const before = await page.locator('.chat-message.assistant').count();
    await page.getByLabel('Scrivi un messaggio', { exact: true }).fill(message);
    await page.getByRole('button', { name: 'Invia messaggio' }).click();
    await expect.poll(async () => await page.locator('.chat-message.assistant').count() > before || await page.getByRole('region', { name: 'Verifica privacy prima dell’invio' }).count() > 0, { timeout: 30_000 }).toBe(true);
    if (await page.getByRole('region', { name: 'Verifica privacy prima dell’invio' }).count()) {
      const panel = page.getByRole('region', { name: 'Verifica privacy prima dell’invio' });
      await panel.getByRole('button', { name: 'Sì, controlliamo', exact: true }).click();
      while (await panel.count()) await panel.getByRole('button', { name: 'Sì, è riservata', exact: true }).click();
    }
    await expect(page.locator('.chat-message.assistant')).toHaveCount(before + 1, { timeout: 30_000 });
    const reply = await page.locator('.chat-message.assistant').last().innerText();
    if (/non disponibile|non valida|Quota|Riserva prudenziale|Limite locale|non raggiungibile|occupato|rifiutato/i.test(reply)) throw new Error('Colloquio interrotto: servizio o quota non disponibile');
  }
  for (const field of ['prodotto', 'montatura', 'forma', 'dimensioni']) await expect(page.getByTestId('field-' + field)).toHaveClass(/answered/);
  await expect(page.locator('.product-card')).toHaveCount(candidates.length);
  await expect(page.getByTestId('field-dimensioni')).toContainText('50 × 20');
  await mkdir('.local/previews', { recursive: true });
  await page.screenshot({ path: '.local/previews/chat-ai-reale.png', fullPage: true });
  console.log(`PASS dialogo AI reale: quattro risposte, riepilogo completo, ${candidates.length} candidati dal catalogo attuale. Nessun dato cliente reale.`);
} finally { await browser.close(); }
