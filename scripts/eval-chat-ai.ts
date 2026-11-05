import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

// Collaudo esplicito a pagamento, solo frasi TEST; escluso da npm run check.
const baseUrl = 'http://127.0.0.1:5173';
const status = await (await fetch(baseUrl + '/api/bootstrap')).json();
if (!status.ai?.ready || status.ai.mode !== 'openai') throw new Error('Avvia il laboratorio con provider OpenAI configurato');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await page.route('**/*', route => new URL(route.request().url()).origin === baseUrl ? route.continue() : route.abort());
  await page.goto(baseUrl);
  for (const message of ['Voglio fare un timbro per le fatture', 'Autoinchiostrante', 'Rettangolare', '50 x 20 mm']) {
    const before = await page.locator('.chat-message.assistant').count();
    await page.getByLabel('Scrivi un messaggio', { exact: true }).fill(message);
    await page.getByRole('button', { name: 'Invia messaggio' }).click();
    await expect(page.locator('.chat-message.assistant')).toHaveCount(before + 1, { timeout: 30_000 });
    const reply = await page.locator('.chat-message.assistant').last().innerText();
    if (/non disponibile|non valida|Quota|non raggiungibile|occupato|rifiutato/i.test(reply)) throw new Error('Colloquio interrotto: servizio o quota non disponibile');
  }
  for (const field of ['prodotto', 'montatura', 'forma', 'dimensioni']) await expect(page.getByTestId('field-' + field)).toHaveClass(/answered/);
  await expect(page.locator('.product-card')).toHaveCount(2);
  await expect(page.getByTestId('field-dimensioni')).toContainText('50 × 20');
  await mkdir('.local/previews', { recursive: true });
  await page.screenshot({ path: '.local/previews/chat-ai-reale.png', fullPage: true });
  console.log('PASS dialogo AI reale: quattro risposte, riepilogo completo, candidati 4913/4915. Nessun dato cliente reale.');
} finally { await browser.close(); }
