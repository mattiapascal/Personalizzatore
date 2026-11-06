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
  await expect(page.locator('.chat-message.user')).toHaveCSS('background-color', 'rgb(217, 253, 211)');
  await expect(page.locator('.chat-message.assistant').first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.getByRole('button', { name: 'Mostra i modelli', exact: false })).toHaveCount(0);
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
  await page.evaluate(() => window.dispatchEvent(new MessageEvent('message', { origin: 'https://www.incisoriasacchetti.it', source: window, data: { type: 'is-assistant:theme', theme: { text: '#141414', heading: '#171717', accent: '#c71721', buttonText: '#ffffff', background: '#f1f1f1', radius: 15, availableHeight: window.innerHeight - 160 } } })));
  const send = page.getByRole('button', { name: 'Invia messaggio' });
  await expect(send).toHaveCSS('background-color', 'rgb(0, 128, 105)');
  await expect(send).toHaveCSS('border-radius', '50%');
  expect(await send.evaluate(el => { const button = el.getBoundingClientRect(), input = el.parentElement!.querySelector('textarea')!.getBoundingClientRect(); return button.width === 44 && button.right < input.right && button.bottom < input.bottom; })).toBe(true);
  await expect.poll(() => send.evaluate(el => el.getBoundingClientRect().bottom)).toBeLessThan(size.height - 160);
  await expect.poll(() => send.evaluate(el => el.getBoundingClientRect().bottom)).toBeGreaterThan(size.height - 200);
  await expect(page.getByTestId('chat-log')).toHaveCSS('background-color', 'rgb(239, 234, 226)');
  expect((await page.locator('.requirements-summary').boundingBox())!.y).toBeGreaterThan(size.height - 160);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(size.width);
  await page.screenshot({ path: `.local/previews/public-chat-${size.width}.png` });
});
test('Invio invia, Maiusc+Invio va a capo e la composizione IME non invia', async ({ page }) => {
  await setup(page); let calls = 0;
  await page.route('**/api/public/interpret', route => {
    calls++; const input = route.request().postDataJSON();
    return route.fulfill({ json: { schemaVersion: 1, tool: 'collectRequirements', expectedSessionId: input.sessionId, expectedRevision: input.revision, arguments: { family: 'stamp' }, clearFields: [], dialogueAct: 'answer', clarification: null } });
  });
  await page.goto('/'); await expect(page.locator('.security-check')).toHaveCount(0);
  const input = page.getByLabel('Scrivi un messaggio');
  await input.fill('Un timbro'); await input.press('Shift+Enter');
  await expect(input).toHaveValue('Un timbro\n'); expect(calls).toBe(0);
  await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true }); expect(calls).toBe(0);
  await input.press('Enter'); await expect.poll(() => calls).toBe(1);
  await expect(input).toHaveValue('');
});
test('la cronologia scorre senza aumentare l’altezza del riquadro', async ({ page }) => {
  await setup(page); await page.setViewportSize({ width: 1366, height: 768 });
  await page.route('**/api/public/interpret', route => {
    const input = route.request().postDataJSON();
    return route.fulfill({ json: { schemaVersion: 1, tool: 'collectRequirements', expectedSessionId: input.sessionId, expectedRevision: input.revision, arguments: { family: 'stamp' }, contentBrief: { purpose: 'loyalty' }, clearFields: [], dialogueAct: 'answer', clarification: null } });
  });
  await page.goto('/');
  await expect(page.locator('.security-check')).toHaveCount(0);
  await expect.poll(() => page.getByRole('button', { name: 'Invia messaggio' }).evaluate(el => el.getBoundingClientRect().bottom)).toBeGreaterThan(740);
  const log = page.getByTestId('chat-log');
  const before = await log.evaluate(el => el.clientHeight);
  for (let i = 0; i < 6; i++) {
    await page.getByLabel('Scrivi un messaggio').fill('Un timbro per le tessere del mio bar');
    await page.getByRole('button', { name: 'Invia messaggio' }).click();
    await expect(page.locator('.chat-message.user')).toHaveCount(i + 1);
    await expect(page.getByRole('button', { name: 'Attendi' })).toHaveCount(0);
  }
  await expect.poll(() => log.evaluate(el => el.clientHeight)).toBe(before);
  expect(await log.evaluate(el => el.scrollHeight > el.clientHeight && el.scrollHeight - el.scrollTop - el.clientHeight < 4)).toBe(true);
  await page.screenshot({ path: '.local/previews/public-chat-conversation.png' });
});
test('servizio indisponibile: percorso tradizionale disponibile senza campione o demo', async ({ page }) => {
  await setup(page, false, true); await page.goto('/');
  await expect(page.getByRole('link', { name: /Preferisci scegliere da solo/ })).toHaveAttribute('href', 'https://www.incisoriasacchetti.it/pages/timbri');
  await expect(page.getByRole('button', { name: 'Invia messaggio' })).toBeDisabled();
  await expect(page.locator('.product-card')).toHaveCount(0);
});
for (const failure of [false, true]) test(`Turnstile completato scompare anche se l’avvio chat ${failure ? 'fallisce' : 'è lento'}`, async ({ page }) => {
  await setup(page); let starts = 0;
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('https://challenges.cloudflare.com/**', route => route.fulfill({ contentType: 'text/javascript', body: 'window.turnstile={render:(node,opts)=>{if(opts.appearance!=="interaction-only")throw new Error("Widget troppo invasivo");node.textContent="Operazione completata";setTimeout(()=>{opts.callback("TEST-token");opts.callback("TEST-duplicate")},0);return "TEST"},remove:()=>{}}' }));
  await page.route('**/api/public/session', async route => {
    starts++; await gate;
    await route.fulfill(failure && starts === 1 ? { status: 503, json: { error: 'Il servizio è occupato. Riprova.' } } : { json: { token: 'a'.repeat(64), expiresAt: Date.now() + 60_000 } });
  });
  await page.setViewportSize({ width: 390, height: 667 }); await page.goto('/');
  await expect.poll(() => starts).toBe(1);
  await expect(page.getByText('Operazione completata', { exact: true })).not.toBeVisible();
  await expect(page.getByText('Avvio della chat…', { exact: true })).toBeVisible();
  release();
  if (failure) {
    await expect(page.getByText('Il servizio è occupato. Riprova.', { exact: true })).toBeVisible();
    await expect(page.getByText('Operazione completata', { exact: true })).not.toBeVisible();
    await page.getByRole('button', { name: 'Riprova la verifica' }).click();
    await expect.poll(() => starts).toBe(2);
  }
  await expect(page.locator('.security-check')).toHaveCount(0);
});
test('ricaricare riusa la capacità salvata senza aprire altre sessioni', async ({ page }) => {
  await setup(page); let starts = 0;
  await page.route('**/api/public/session', route => { starts++; return route.fulfill({ json: { token: 'a'.repeat(64), expiresAt: Date.now() + 60_000 } }); });
  await page.goto('/'); await expect.poll(() => starts).toBe(1);
  await expect(page.locator('.security-check')).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel('Scrivi un messaggio')).toBeVisible();
  await page.getByLabel('Scrivi un messaggio').fill('Un timbro');
  await expect(page.getByRole('button', { name: 'Invia messaggio' })).toBeEnabled();
  await expect(page.locator('.security-check')).toHaveCount(0); expect(starts).toBe(1);
});
test('errore invio: non ripete la domanda e conserva il testo per riprovare', async ({ page }) => {
  await setup(page); let calls = 0;
  await page.route('**/api/public/interpret', route => {
    calls++; const input = route.request().postDataJSON();
    return route.fulfill(calls === 1 ? { status: 503, json: { error: 'Il servizio è temporaneamente occupato. Riprova.' } } : { json: { schemaVersion: 1, tool: 'collectRequirements', expectedSessionId: input.sessionId, expectedRevision: input.revision, arguments: { family: 'stamp' }, clearFields: [], dialogueAct: 'answer', clarification: null } });
  });
  await page.goto('/'); await expect(page.locator('.security-check')).toHaveCount(0);
  const message = 'Un timbro per le fatture', input = page.getByLabel('Scrivi un messaggio');
  await input.fill(message); await input.press('Enter');
  await expect(page.getByTestId('selection-feedback')).toHaveText('AssistenteIl servizio è temporaneamente occupato. Riprova.');
  await expect(input).toHaveValue(message);
  await expect(page.getByTestId('field-prodotto')).toHaveClass(/missing/);
  await input.press('Enter'); await expect(page.getByTestId('field-prodotto')).toHaveClass(/answered/);
  await expect(input).toHaveValue('');
});
