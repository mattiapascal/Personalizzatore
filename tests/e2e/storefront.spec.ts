import { test, expect, type Page } from '@playwright/test';
import { mountFixtureCatalog } from '../../src/catalog/adapter.ts';
import { publicProduct } from '../../src/public/schema.ts';

async function setup(page: Page, ready = true, stale = false) {
  await page.route('https://cdn.shopify.com/**', route => route.abort());
  await page.route('https://challenges.cloudflare.com/**', route => route.fulfill({ contentType: 'text/javascript', body: 'window.turnstile={render:(node,opts)=>{setTimeout(()=>opts.callback("TEST-token"),0);return "TEST"},remove:()=>{}}' }));
  await page.route('**/api/public/bootstrap', route => route.fulfill({ json: { apiVersion: 1, catalogVersion: 'TEST-public', checkedAt: new Date().toISOString(), stale, aiReady: ready, siteKey: 'TEST-key', products: mountFixtureCatalog.list().map(publicProduct) } }));
  await page.route('**/api/public/session', route => route.fulfill({ json: { token: 'a'.repeat(64), expiresAt: Date.now() + 60_000 } }));
}
test('pagina cliente: proposta reale e link prodotto, nessun laboratorio o diagnostica', async ({ page }) => {
  await setup(page);
  await page.route('**/api/public/interpret', async route => {
    const input = route.request().postDataJSON();
    expect(route.request().headers().authorization).toBe('Bearer ' + 'a'.repeat(64));
    await route.fulfill({ json: { schemaVersion: 1, tool: 'collectRequirements', expectedSessionId: input.sessionId, expectedRevision: input.revision, arguments: { family: 'stamp' }, contentBrief: { purpose: 'loyalty' }, clearFields: [], dialogueAct: 'answer', clarification: null } });
  });
  await page.goto('/');
  await page.getByLabel('Scrivi un messaggio').fill('Voglio timbrare le tessere abbonamento del mio bar');
  await page.getByRole('button', { name: 'Invia messaggio' }).click();
  await expect(page.getByTestId('selection-feedback')).toContainText('caselline');
  const card = page.locator('.product-card').filter({ hasText: 'Colop Printer Q12' });
  await expect(card).toBeVisible();
  await card.getByText('Perché questo modello').click();
  await expect(card).toContainText('La scheda prodotto indica:');
  await expect(card.getByRole('link', { name: 'Visualizza e personalizza' })).toHaveAttribute('href', /https:\/\/www\.incisoriasacchetti\.it\/products\/.*\?variant=\d+/);
  await expect(page.locator('body')).not.toContainText(/Shopify|Fabric|profilo TEST|revisione|Costo stimato|Demo a parole chiave|assegnata al cliente/);
});
test('privacy pubblica: nessuna chiamata prima delle due conferme, segnaposti verso il server', async ({ page }) => {
  await setup(page); let calls = 0;
  await page.route('**/api/public/interpret', async route => {
    calls++; const input = route.request().postDataJSON();
    expect(input.message).not.toContain('Mario Rossi'); expect(input.message).toContain('[RISERVATO_');
    await route.fulfill({ json: { schemaVersion: 1, tool: 'collectRequirements', expectedSessionId: input.sessionId, expectedRevision: input.revision, arguments: { family: 'stamp' }, clearFields: [], dialogueAct: 'answer', clarification: null } });
  });
  await page.goto('/'); await page.getByLabel('Scrivi un messaggio').fill('Un timbro per Mario Rossi');
  await page.getByRole('button', { name: 'Invia messaggio' }).click();
  await expect(page.getByRole('button', { name: 'Sì, controlliamo' })).toBeVisible(); expect(calls).toBe(0);
  await page.getByRole('button', { name: 'Sì, controlliamo' }).click();
  await expect(page.locator('.privacy-original mark')).toHaveCSS('color', 'rgb(146, 36, 30)'); expect(calls).toBe(0);
  await page.getByRole('button', { name: 'Sì, è riservata' }).click();
  await expect.poll(() => calls).toBe(1);
  expect(await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }))).not.toContain('Mario Rossi');
});
for (const size of [{ width: 1366, height: 768 }, { width: 390, height: 667 }]) test(`stile del tema e compositore visibile ${size.width}x${size.height}`, async ({ page }) => {
  await setup(page); await page.setViewportSize(size); await page.goto('/');
  await page.evaluate(() => window.dispatchEvent(new MessageEvent('message', { origin: 'https://www.incisoriasacchetti.it', source: window, data: { type: 'is-assistant:theme', theme: { text: '#141414', heading: '#171717', accent: '#c71721', buttonText: '#ffffff', radius: 15, availableHeight: window.innerHeight - 160 } } })));
  const send = page.getByRole('button', { name: 'Invia messaggio' });
  await expect(send).toHaveCSS('background-color', 'rgb(199, 23, 33)');
  await expect(send).toHaveCSS('border-radius', '15px');
  expect((await send.boundingBox())!.y + (await send.boundingBox())!.height).toBeLessThan(size.height - 140);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(size.width);
});
test('servizio indisponibile: percorso tradizionale disponibile senza campione o demo', async ({ page }) => {
  await setup(page, false, true); await page.goto('/');
  await expect(page.getByRole('link', { name: /Preferisci scegliere da solo/ })).toHaveAttribute('href', 'https://www.incisoriasacchetti.it/pages/timbri');
  await expect(page.getByRole('button', { name: 'Invia messaggio' })).toBeDisabled();
  await expect(page.locator('.product-card')).toHaveCount(0);
});
