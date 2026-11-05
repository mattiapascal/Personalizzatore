import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fixtureCatalog, snapshot, mountSnapshot, mountFixtureCatalog } from '../../src/catalog/adapter';
import type { RuntimeState } from '../../src/runtime/schema';

function demoRuntime(): RuntimeState {
  return { csrfToken: 'test-local-session-token'.repeat(2), ai: { mode: 'demo', ready: false, reason: 'Demo esplicita per i test browser', model: 'gpt-5.4-mini-2026-03-17', budgetUsd: 1, reservedUsd: 0, requests: 0 }, catalog: { version: fixtureCatalog.version, snapshot: structuredClone(snapshot), checkedAt: null, pending: [] }, sync: { configured: false, intervalSeconds: 300, lastError: null, refreshing: false } };
}
test.beforeEach(async ({ page }) => {
  // Mai chiamate AI a pagamento nella suite automatica browser.
  await page.route('**/api/bootstrap', route => route.fulfill({ json: demoRuntime() }));
  await page.route('**/api/ai/interpret', route => route.fulfill({ status: 503, json: { error: 'Trasporto AI non predisposto da questo test' } }));
});
async function sendMessage(page: Page, message: string) {
  const before = await page.locator('.chat-message.assistant').count();
  await page.getByLabel('Scrivi un messaggio', { exact: true }).fill(message);
  await page.getByRole('button', { name: 'Invia messaggio' }).click();
  await expect(page.locator('.chat-message.assistant')).toHaveCount(before + 1);
}
const latest = (page: Page) => page.locator('.chat-message.assistant').last();
async function openProductCanvas(page: Page, model = '4913') {
  await page.goto('/');
  await sendMessage(page, 'Timbro autoinchiostrante rettangolare, non so le misure');
  await page.locator('.product-card').filter({ has: page.getByRole('heading', { name: new RegExp(model) }) }).getByRole('button', { name: 'Prova nel canvas' }).click();
  await expect(page.locator('.canvas-container')).toBeVisible();
}
async function writeOnCanvas(page: Page, text: string) {
  const canvas = page.locator('.upper-canvas'); await canvas.scrollIntoViewIfNeeded();
  await canvas.dblclick({ position: { x: 60, y: 66 } });
  const input = page.getByLabel('Testo nel canvas', { exact: true }); await expect(input).toBeFocused();
  await input.fill(text);
  await expect(page.getByRole('button', { name: 'Esporta JSON', exact: true })).toBeDisabled();
  await input.press('Escape');
}

test('conversazione senza campi esterni: domande successive e riepilogo rosso/verde', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  for (const field of ['prodotto', 'montatura', 'forma', 'dimensioni']) await expect(page.getByTestId('field-' + field)).toHaveClass(/missing/);
  await sendMessage(page, 'Voglio fare un timbro per le fatture');
  await expect(latest(page)).toContainText('autoinchiostrante, manuale, tascabile oppure a secco');
  await expect(page.getByTestId('field-prodotto')).toHaveClass(/answered/);
  await expect(page.getByTestId('field-montatura')).toHaveClass(/missing/);
  await sendMessage(page, 'Non so le misure');
  await expect(latest(page)).toContainText('autoinchiostrante');
  await expect(page.getByTestId('field-dimensioni')).toHaveClass(/answered/);
  await expect(page.getByTestId('field-dimensioni')).toContainText('Non note');
  await sendMessage(page, 'Autoinchiostrante');
  await expect(latest(page)).toContainText('rettangolare, quadrata o rotonda');
  await expect.poll(() => page.getByTestId('chat-log').evaluate(el => el.scrollHeight - el.clientHeight - el.scrollTop)).toBeLessThan(3);
  await expect(page.locator('.product-card')).toHaveCount(0);
  await sendMessage(page, 'Rettangolare');
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.getByTestId('chat-log').evaluate(el => el.scrollHeight - el.clientHeight - el.scrollTop)).toBeLessThan(3);
  await expect(page.locator('.product-card')).toHaveCount(3);
  for (const field of ['prodotto', 'montatura', 'forma', 'dimensioni']) await expect(page.getByTestId('field-' + field)).toHaveClass(/answered/);
  await expect(page.locator('input')).toHaveCount(0);
  await expect(page.locator('textarea')).toHaveCount(1);
  await page.getByRole('button', { name: 'Mostra i modelli' }).click();
  await expect(page.getByRole('heading', { name: 'Possibilità da verificare' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('chat conserva requisiti dopo reload, corregge misure e apre URL veri senza rete esterna', async ({ page }) => {
  const external: string[] = []; page.on('request', req => { if (!req.url().startsWith('http://127.0.0.1:5173') && !req.url().startsWith('data:')) external.push(req.url()); });
  await page.goto('/');
  await sendMessage(page, 'Un timbro autoinchiostrante rettangolare con logo e sei righe, 50 x 20 mm');
  await expect(page.locator('.product-card')).toHaveCount(2);
  const first = page.locator('.product-card').first();
  await expect(first).toContainText('4913');
  await expect(first.getByRole('link')).toHaveAttribute('href', 'https://www.incisoriasacchetti.it/products/trodat-4913');
  await page.reload(); await expect(page.locator('.product-card')).toHaveCount(2);
  await expect(page.locator('.chat-message.user')).toHaveCount(0);
  await sendMessage(page, 'Ora 60 x 23 mm');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.locator('.product-card')).toContainText('4915');
  await expect(page.getByTestId('requirements')).toContainText('"hasLogo": true');
  await expect(page.getByTestId('field-dimensioni')).toContainText('60 × 23');
  expect(external).toEqual([]);
});

test('richieste ignote e nessun candidato hanno riscontro; reset azzera anche il riepilogo', async ({ page }) => {
  await page.goto('/');
  await sendMessage(page, 'abracadabra');
  await expect(latest(page)).toContainText('Non ho riconosciuto');
  await sendMessage(page, 'Timbro manuale in legno rettangolare, non so le misure');
  await expect(latest(page)).toContainText('Nessun modello corrisponde');
  await expect(page.locator('.product-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Azzera conversazione e requisiti' }).click();
  await expect(page.getByTestId('field-prodotto')).toHaveClass(/missing/);
  await expect(page.getByRole('log')).not.toContainText('abracadabra');
});

test('Fabric reale: testo diretto, comando, SVG vettoriale, JSON e persistenza fra sezioni', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await openProductCanvas(page); await writeOnCanvas(page, 'Città & realtà');
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 1 ·');
  await page.getByText('Strumenti sviluppatore').click();
  await page.getByRole('button', { name: 'Esegui comando', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('obsoleta');
  await page.getByRole('button', { name: 'Prepara comando aggiornato' }).click();
  await page.getByRole('button', { name: 'Esegui comando', exact: true }).click();
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 2 ·');
  await page.getByText('Stato e storico del documento').click();
  const state = JSON.parse(await page.getByTestId('graphic-state').innerText());
  expect(state.objects[1]).toMatchObject({ id: 'text-1', xMm: 10, yMm: 8, text: 'Città & realtà' });
  const pendingSvg = page.waitForEvent('download'); await page.getByRole('button', { name: 'Esporta SVG' }).click();
  const svg = await readFile(await (await pendingSvg).path(), 'utf8');
  expect(svg).toContain('width="58mm"'); expect(svg).toContain('height="22mm"'); expect(svg).toContain('viewBox="0 0 464 176"');
  expect(svg).toContain('<text'); expect(svg).toContain('<rect'); expect(svg).not.toContain('<image'); expect(svg).toContain('&amp;');
  const pendingJson = page.waitForEvent('download'); await page.getByRole('button', { name: 'Esporta JSON' }).click();
  const path = await (await pendingJson).path(); expect(JSON.parse(await readFile(path, 'utf8'))).toEqual(state);
  await page.getByLabel('Riapri progetto JSON').setInputFiles(path);
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 3 ·');
  await page.getByRole('button', { name: '01 · Scegli il timbro' }).click();
  await page.getByRole('button', { name: '02 · Editor Fabric.js' }).click();
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 3 ·'); expect(errors).toEqual([]);
});

test('golden SVG storico preserva geometria e testo', async ({ page }) => {
  await openProductCanvas(page);
  await page.getByLabel('Riapri progetto JSON').setInputFiles('fixtures/illustrator/stamp.TEST.json');
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 1 ·');
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Esporta SVG' }).click();
  expect(await readFile(await (await pending).path(), 'utf8')).toEqual(await readFile('fixtures/illustrator/stamp.TEST.svg', 'utf8'));
});

test('trascinamento Fabric aggiorna lo stesso stato canonico', async ({ page }) => {
  await openProductCanvas(page);
  await page.locator('.upper-canvas').scrollIntoViewIfNeeded(); const box = await page.locator('.upper-canvas').boundingBox(); expect(box).not.toBeNull();
  await page.mouse.move(box!.x + 60, box!.y + 66); await page.mouse.down(); await page.mouse.move(box!.x + 76, box!.y + 74, { steps: 10 }); await page.mouse.up();
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 1 ·');
  await page.getByText('Stato e storico del documento').click();
  expect(JSON.parse(await page.getByTestId('graphic-state').innerText()).objects[1].xMm).toBeCloseTo(7, 1);
});

test('input ostile resta testo anche su mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await sendMessage(page, '<img src=x onerror=alert(1)> timbro');
  await expect(page.locator('img')).toHaveCount(0);
  await expect(page.getByRole('log')).toContainText('<img');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('cambio modello conserva testo multilinea e rifiuta riduzioni che non entrano', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await openProductCanvas(page, '4912'); await writeOnCanvas(page, 'Azienda\nMilano');
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 1 ·');
  await page.getByText('Stato e storico del documento').click();
  const original = JSON.parse(await page.getByTestId('graphic-state').innerText());
  expect(original.productId).toBe('gid://shopify/Product/15106099904892');
  const pendingSvg = page.waitForEvent('download'); await page.getByRole('button', { name: 'Esporta SVG' }).click();
  const svg = await readFile(await (await pendingSvg).path(), 'utf8');
  expect(svg).toContain('width="47mm"'); expect(svg).toContain('viewBox="0 0 376 144"'); expect(svg).toContain('Milano');
  await page.getByRole('button', { name: '01 · Scegli il timbro' }).click();
  await page.locator('.product-card').filter({ has: page.getByRole('heading', { name: /4913/ }) }).getByRole('button', { name: 'Prova nel canvas' }).click();
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 2 ·');
  const larger = JSON.parse(await page.getByTestId('graphic-state').innerText());
  expect(larger.documentId).toBe(original.documentId); expect(larger.objects).toEqual(original.objects);
  await page.getByText('Strumenti sviluppatore').click();
  await page.getByLabel('Comando AI simulato').fill(JSON.stringify({ schemaVersion: 1, tool: 'moveObject', expectedRevision: larger.revision, objectId: 'text-1', arguments: { xMm: 40, yMm: 7 } }));
  await page.getByRole('button', { name: 'Esegui comando', exact: true }).click();
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 3 ·');
  const beforeRejected = JSON.parse(await page.getByTestId('graphic-state').innerText());
  await page.getByRole('button', { name: '01 · Scegli il timbro' }).click();
  await page.locator('.product-card').filter({ has: page.getByRole('heading', { name: /4912/ }) }).getByRole('button', { name: 'Prova nel canvas' }).click();
  await expect(page.getByRole('alert')).toContainText('composizione non entra');
  expect(JSON.parse(await page.getByTestId('graphic-state').innerText())).toEqual(beforeRejected);
  await expect(page.locator('.canvas-scroll')).toHaveAttribute('inert', '');
  await expect(page.getByRole('button', { name: 'Esporta SVG' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Esporta JSON' })).toBeEnabled();
  await page.getByRole('button', { name: 'Torna al prodotto del progetto' }).click();
  await expect(page.getByRole('button', { name: 'Esporta SVG' })).toBeEnabled(); expect(errors).toEqual([]);
});

test('testo fuori area nel canvas ripristina la bozza precedente', async ({ page }) => {
  await openProductCanvas(page); await writeOnCanvas(page, 'X'.repeat(150));
  await expect(page.getByRole('alert')).toContainText('fuori dall’area');
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 0 ·');
  await page.getByText('Stato e storico del documento').click();
  expect(JSON.parse(await page.getByTestId('graphic-state').innerText()).objects[1].text).toBe('TEST · Città');
});

test('AI server pone domande, aggiorna riepilogo e rifiuta fallback silenzioso', async ({ page }) => {
  const runtime = demoRuntime(); runtime.ai = { ...runtime.ai, mode: 'openai', ready: true, reason: null };
  await page.route('**/api/bootstrap', route => route.fulfill({ json: runtime }));
  const requests: Record<string, unknown>[] = [];
  const replies = [{ family: 'stamp' }, { mechanism: 'automatic' }, { shape: 'rectangle' }, { minimumAreaMm: null, sizeUnknown: true }];
  await page.route('**/api/ai/interpret', async route => {
    const body = route.request().postDataJSON(); requests.push(body);
    if (requests.length > replies.length) { await route.fulfill({ status: 429, json: { error: 'Quota AI esaurita' } }); return; }
    await route.fulfill({ json: { schemaVersion: 1, expectedRevision: body.revision, expectedSessionId: body.sessionId, tool: 'collectRequirements', arguments: replies[requests.length - 1], clarification: null } });
  });
  await page.goto('/');
  await sendMessage(page, 'vorrei un timpro per le fattture');
  await expect(latest(page)).toContainText('autoinchiostrante');
  await sendMessage(page, 'quello che si inchiostra da solo');
  await expect(latest(page)).toContainText('rettangolare');
  await sendMessage(page, 'rettangolo');
  await expect(latest(page)).toContainText('Quali misure');
  await sendMessage(page, 'non ne ho idea');
  await expect(page.locator('.product-card')).toHaveCount(3);
  expect(requests[1]).toMatchObject({ requirements: { family: 'stamp' } }); expect(JSON.stringify(requests)).not.toContain('gid://shopify');
  for (const field of ['prodotto', 'montatura', 'forma', 'dimensioni']) await expect(page.getByTestId('field-' + field)).toHaveClass(/answered/);
  await sendMessage(page, 'ora manuale');
  await expect(latest(page)).toContainText('Quota AI esaurita');
  await expect(page.getByTestId('field-montatura')).toContainText('Autoinchiostrante');
});

test('una risposta ritirata torna rossa e riprende la domanda necessaria', async ({ page }) => {
  const runtime = demoRuntime(); runtime.ai = { ...runtime.ai, mode: 'openai', ready: true, reason: null };
  await page.route('**/api/bootstrap', route => route.fulfill({ json: runtime }));
  let count = 0;
  await page.route('**/api/ai/interpret', route => {
    const body = route.request().postDataJSON(); count++;
    return route.fulfill({ json: { schemaVersion: 1, expectedRevision: body.revision, tool: 'collectRequirements', arguments: count === 1 ? { family: 'stamp', mechanism: 'automatic', shape: 'rectangle', sizeUnknown: true } : {}, clearFields: count === 1 ? [] : ['mechanism'] } });
  });
  await page.goto('/'); await sendMessage(page, 'timbro come descritto'); await expect(page.getByTestId('field-montatura')).toHaveClass(/answered/);
  await sendMessage(page, 'togli la scelta sulla montatura');
  await expect(page.getByTestId('field-montatura')).toHaveClass(/missing/);
  await expect(page.getByTestId('field-forma')).toHaveClass(/answered/);
  await expect(latest(page)).toContainText('manuale, tascabile');
  await expect(page.locator('.product-card')).toHaveCount(0);
});

test('aggiornamento catalogo rivaluta candidati, preserva bozza e richiede nuova validazione SVG', async ({ page }) => {
  let runtime = demoRuntime(); runtime.sync.configured = true; runtime.catalog.checkedAt = new Date().toISOString();
  await page.route('**/api/bootstrap', route => route.fulfill({ json: runtime }));
  await page.route('**/api/catalog/refresh', async route => {
    runtime = { ...runtime, catalog: { ...runtime.catalog, version: 'SHOPIFY-updated-test', checkedAt: new Date().toISOString(), snapshot: { ...runtime.catalog.snapshot, fixture: false, products: runtime.catalog.snapshot.products.filter(p => p.handle !== 'trodat-4912') } } };
    await route.fulfill({ json: runtime });
  });
  await openProductCanvas(page, '4912'); await writeOnCanvas(page, 'Bozza');
  await page.getByText('Stato e storico del documento').click();
  const original = JSON.parse(await page.getByTestId('graphic-state').innerText());
  await page.getByText('Collegamenti AI e catalogo', { exact: true }).click();
  await page.getByRole('button', { name: 'Aggiorna da Shopify', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Esporta SVG' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Esporta JSON' })).toBeEnabled();
  expect(JSON.parse(await page.getByTestId('graphic-state').innerText())).toEqual(original);
  await page.getByRole('button', { name: '01 · Scegli il timbro' }).click();
  await expect(page.locator('.product-card')).toHaveCount(2);
  await page.locator('.product-card').first().getByRole('button', { name: 'Prova nel canvas' }).click();
  await expect(page.getByRole('button', { name: 'Esporta SVG' })).toBeEnabled();
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 2 ·');
  const updated = JSON.parse(await page.getByTestId('graphic-state').innerText());
  expect(updated.documentId).toBe(original.documentId); expect(updated.objects).toEqual(original.objects); expect(updated.catalogVersion).toBe('SHOPIFY-updated-test');
});

test('API HTTP locale protegge origine, token e dimensione del body senza chiamate AI', async ({ request }) => {
  const response = await request.get('/api/bootstrap'); expect(response.ok()).toBe(true);
  const runtime = await response.json(); expect(typeof runtime.csrfToken).toBe('string'); expect(runtime.OPENAI_API_KEY).toBeUndefined();
  expect((await request.post('/api/ai/interpret', { data: {} })).status()).toBe(403);
  expect((await request.get('/api/bootstrap', { headers: { Origin: 'https://evil.example' } })).status()).toBe(403);
  const oversized = await request.post('/api/ai/interpret', { headers: { 'X-Lab-Token': runtime.csrfToken }, data: { message: 'x'.repeat(17_000) } });
  expect(oversized.status()).toBe(400); expect(await oversized.json()).toMatchObject({ error: 'Richiesta oltre 16 KB' });
  expect((await request.get('/.env.local')).status()).toBe(403);
});

test('backend offline non attiva automaticamente il parser dimostrativo', async ({ page }) => {
  await page.route('**/api/bootstrap', route => route.abort());
  await page.goto('/');
  await expect(page.getByText('AI non attiva:', { exact: false }).first()).toBeVisible();
  await page.getByLabel('Scrivi un messaggio').fill('Timbro');
  await expect(page.getByRole('button', { name: 'Invia messaggio' })).toBeDisabled();
  await page.getByText('Collegamenti AI e catalogo', { exact: true }).click();
  await page.getByRole('button', { name: 'Demo a parole chiave', exact: true }).click();
  await page.getByRole('button', { name: 'Invia messaggio' }).click();
  await expect(page.getByTestId('field-prodotto')).toHaveClass(/answered/);
});

test('montature manuali: domande, variante esatta, testo nel canvas tondo e SVG fisico', async ({ page }) => {
  const runtime = demoRuntime(); runtime.catalog = { ...runtime.catalog, snapshot: structuredClone(mountSnapshot), version: mountFixtureCatalog.version };
  await page.route('**/api/bootstrap', route => route.fulfill({ json: runtime }));
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await sendMessage(page, 'Timbro manuale');
  await expect(latest(page)).toContainText('legno, plastica, metallo');
  await expect(page.getByTestId('field-materiale')).toHaveClass(/missing/);
  await sendMessage(page, 'In legno, rotondo, diametro 35 mm');
  await expect(page.getByTestId('field-materiale')).toHaveClass(/answered/);
  await expect(page.getByTestId('field-dimensioni')).toContainText('35 mm');
  const card = page.locator('.product-card').filter({ has: page.getByRole('heading', { name: 'Timbro in legno tondo', exact: true }) }).first();
  await expect(card.getByRole('link')).toHaveAttribute('href', /\?variant=55676402958716$/);
  await card.getByRole('button', { name: 'Prova nel canvas' }).click();
  await expect(page.getByTestId('editor-product')).toContainText('Ø 35 mm');
  const canvas = page.locator('.upper-canvas'); await canvas.scrollIntoViewIfNeeded();
  await canvas.dblclick({ position: { x: 120, y: 135 } });
  const input = page.getByLabel('Testo nel canvas', { exact: true }); await expect(input).toBeFocused();
  await input.fill('IS'); await input.press('Escape');
  await page.getByText('Stato e storico del documento').click();
  const original = JSON.parse(await page.getByTestId('graphic-state').innerText());
  expect(original.objects[1].text).toBe('IS'); expect(original.variantId).toBe('gid://shopify/ProductVariant/55676402958716');
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Esporta SVG' }).click();
  const svg = await readFile(await (await pending).path(), 'utf8');
  expect(svg).toContain('width="35mm"'); expect(svg).toContain('height="35mm"'); expect(svg).toContain('<clipPath'); expect(svg).toContain('<circle'); expect(svg).toContain('<text'); expect(svg).not.toContain('<image');
  await page.getByRole('button', { name: '01 · Scegli il timbro' }).click();
  const larger = page.locator('.product-card').filter({ has: page.getByRole('heading', { name: 'Timbro in legno tondo', exact: true }) }).filter({ hasText: 'Variante: 40' });
  await larger.getByRole('button', { name: 'Prova nel canvas' }).click();
  await expect(page.getByTestId('editor-product')).toContainText('Ø 40 mm');
  const updated = JSON.parse(await page.getByTestId('graphic-state').innerText());
  expect(updated.documentId).toBe(original.documentId); expect(updated.objects).toEqual(original.objects); expect(updated.variantId).toBe('gid://shopify/ProductVariant/55676402991484');
  expect(errors).toEqual([]);
});

test('tutte le montature censite aprono documenti validi con le metriche reali di Fabric', async ({ page }) => {
  await page.goto('/');
  const results = await page.evaluate(async products => {
    const modelPath = '/src/editor/model.ts', fabricPath = '/src/editor/fabric-adapter.ts';
    const { createDocument, DocumentStore } = await import(modelPath);
    const { measureFabric } = await import(fabricPath);
    return products.map(p => { try { const store = new DocumentStore(createDocument(p, 'TEST-mounts'), measureFabric); return { id: p.profileId, shape: store.document.shape, error: null }; } catch (e) { return { id: p.profileId, error: String(e) }; } });
  }, mountSnapshot.products);
  expect(results).toHaveLength(mountSnapshot.products.length);
  expect(results.filter(r => r.error)).toEqual([]);
});

test('tascabile quadrato e timbro a secco aprono formato e variante selezionati', async ({ page }) => {
  const runtime = demoRuntime(); runtime.catalog = { ...runtime.catalog, snapshot: structuredClone(mountSnapshot), version: mountFixtureCatalog.version };
  await page.route('**/api/bootstrap', route => route.fulfill({ json: runtime }));
  await page.goto('/'); await sendMessage(page, 'Timbro tascabile quadrato 12 x 12 mm');
  await page.locator('.product-card').filter({ hasText: 'Q12' }).getByRole('button', { name: 'Prova nel canvas' }).click();
  await expect(page.getByTestId('editor-product')).toContainText('12 × 12 mm');
  await expect(page.getByRole('button', { name: 'Esporta SVG' })).toBeEnabled();
  await page.getByRole('button', { name: '01 · Scegli il timbro' }).click();
  await sendMessage(page, 'Timbro a secco rotondo diametro 41 mm');
  const first = page.locator('.product-card').first();
  await expect(first.getByRole('link')).toHaveAttribute('href', /\?variant=55827724861820$/);
  await first.getByRole('button', { name: 'Prova nel canvas' }).click();
  // La composizione quadrata non entra automaticamente nel cerchio: il cliente può iniziare una nuova bozza.
  await expect(page.getByRole('alert')).toContainText('composizione non entra');
  await page.getByRole('button', { name: 'Crea nuova bozza per questo formato' }).click();
  await expect(page.getByTestId('editor-product')).toContainText('Ø 41 mm');
  await expect(page.getByRole('button', { name: 'Esporta SVG' })).toBeEnabled();
});

test('catalogo obsoleto sospende candidati e SVG mantenendo chat e progetto JSON', async ({ page }) => {
  let runtime = demoRuntime(); runtime.sync.configured = true; runtime.catalog.checkedAt = new Date().toISOString();
  await page.route('**/api/bootstrap', route => route.fulfill({ json: runtime }));
  await page.route('**/api/catalog/refresh', route => {
    runtime = { ...runtime, sync: { ...runtime.sync, stale: true, lastError: 'Shopify temporaneamente non raggiungibile' } };
    return route.fulfill({ json: runtime });
  });
  await openProductCanvas(page);
  await page.getByText('Collegamenti AI e catalogo', { exact: true }).click();
  await page.getByRole('button', { name: 'Aggiorna da Shopify', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Catalogo da aggiornare');
  await expect(page.getByRole('button', { name: 'Esporta SVG' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Esporta JSON' })).toBeEnabled();
  await page.getByRole('button', { name: '01 · Scegli il timbro' }).click();
  await expect(page.locator('.product-card')).toHaveCount(0);
  await expect(page.getByTestId('field-montatura')).toContainText('Autoinchiostrante');
});
