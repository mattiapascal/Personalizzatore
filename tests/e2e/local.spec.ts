import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function openProductCanvas(page: Page, model = '4913') {
  await page.goto('/');
  await page.getByRole('button', { name: 'Autoinchiostrante', exact: true }).click();
  await page.getByRole('button', { name: 'Non so le misure' }).click();
  await page.locator('.product-card').filter({ has: page.getByRole('heading', { name: new RegExp(model) }) }).getByRole('button', { name: 'Prova nel canvas' }).click();
  await expect(page.locator('.canvas-container')).toBeVisible();
}

async function writeOnCanvas(page: Page, text: string) {
  const canvas = page.locator('.upper-canvas');
  await canvas.scrollIntoViewIfNeeded();
  await canvas.dblclick({ position: { x: 60, y: 66 } });
  const input = page.getByLabel('Testo nel canvas', { exact: true });
  await expect(input).toBeFocused();
  await input.fill(text);
  await expect(page.getByRole('button', { name: 'Esporta JSON', exact: true })).toBeDisabled();
  await input.press('Escape');
}

test('richiesta per fatture e non so le misure spiegano sempre il passo successivo', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByLabel('Descrivi il tuo timbro').fill('Voglio fare un timbro per le fatture');
  await page.getByRole('button', { name: 'Analizza richiesta' }).click();
  const feedback = page.getByTestId('selection-feedback');
  await expect(feedback).toContainText('Ho riconosciuto: un timbro');
  await expect(feedback.getByTestId('clarification')).toContainText('autoinchiostrante, manuale o tascabile');
  await expect(feedback).toBeFocused();
  await expect(feedback).toBeInViewport();
  await expect(page.locator('.product-card')).toHaveCount(0);

  // La misura può essere ignota prima che venga scelta la montatura.
  await page.getByRole('button', { name: 'Non so le misure' }).click();
  await expect(feedback).toContainText('proseguiamo senza misure');
  await expect(feedback.getByTestId('clarification')).toContainText('autoinchiostrante');
  await expect(feedback).toBeFocused();
  await expect(page.getByLabel('Larghezza minima in mm')).toHaveValue('');
  await expect(page.getByLabel('Altezza minima in mm')).toHaveValue('');

  await page.getByRole('button', { name: 'Autoinchiostrante', exact: true }).click();
  await expect(feedback).toContainText('Ho trovato 3 modelli da esplorare');
  await expect(feedback).toContainText('non abbiamo ancora definito le misure');
  await expect(page.locator('.product-card')).toHaveCount(3);
  await feedback.getByRole('button', { name: 'Mostra i 3 modelli' }).click();
  await expect(page.getByRole('heading', { name: 'Possibilità da verificare' })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Possibilità da verificare' })).toBeInViewport();
});

test('non so le misure dopo la montatura mostra risultati, richieste ignote e zero risultati hanno riscontro', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Autoinchiostrante', exact: true }).click();
  await page.getByRole('button', { name: 'Non so le misure' }).click();
  const feedback = page.getByTestId('selection-feedback');
  await expect(feedback).toContainText('proseguiamo senza misure');
  await expect(feedback).toContainText('Ho trovato 3 modelli');
  await page.getByLabel('Descrivi il tuo timbro').fill('abracadabra');
  await page.getByRole('button', { name: 'Analizza richiesta' }).click();
  await expect(feedback).toContainText('Non ho riconosciuto nuove informazioni');
  await page.getByRole('button', { name: 'Manuale', exact: true }).click();
  await expect(feedback).toContainText('Nessun candidato in questo campione');
  await expect(page.locator('.product-card')).toHaveCount(0);
});

test('richiesta, domande, candidato reale, link senza chiamate esterne e persistenza', async ({ page }) => {
  const external: string[] = [];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:5173') && !request.url().startsWith('data:')) external.push(request.url()); });
  await page.goto('/');
  await page.getByLabel('Descrivi il tuo timbro').fill('Timbro aziendale con logo e sei righe');
  await page.getByRole('button', { name: 'Analizza richiesta' }).click();
  await expect(page.getByTestId('clarification')).toContainText('autoinchiostrante');
  await page.getByRole('button', { name: 'Autoinchiostrante', exact: true }).click();
  await expect(page.getByTestId('clarification')).toContainText('ingombro');
  await page.getByRole('button', { name: 'Conferma ingombro' }).click();
  await expect(page.locator('.product-card')).toHaveCount(2);
  const first = page.locator('.product-card').first();
  await expect(first).toContainText('4913');
  await expect(first.getByRole('link')).toHaveAttribute('href', 'https://www.incisoriasacchetti.it/products/trodat-4913');
  await expect(first).toContainText('50 × 20');
  await page.reload(); await expect(page.locator('.product-card')).toHaveCount(2);
  await page.getByLabel('Larghezza minima in mm').fill('60'); await page.getByLabel('Altezza minima in mm').fill('23');
  await page.getByRole('button', { name: 'Conferma ingombro' }).click();
  await expect(page.locator('.product-card')).toHaveCount(1); await expect(page.locator('.product-card')).toContainText('4915');
  await expect(page.getByTestId('requirements')).toContainText('"hasLogo": true');
  expect(external).toEqual([]);
});

test('Fabric reale: modifica manuale, comando, SVG vettoriale e JSON riapribile', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await openProductCanvas(page);
  await writeOnCanvas(page, 'Città & realtà');
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 1 ·');
  await page.getByText('Strumenti sviluppatore').click();
  await page.getByRole('button', { name: 'Esegui comando', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('obsoleta');
  await page.getByRole('button', { name: 'Prepara comando aggiornato' }).click();
  await page.getByRole('button', { name: 'Esegui comando', exact: true }).click();
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 2 ·');
  await page.getByText('Stato e storico del documento').click();
  const state = JSON.parse(await page.getByTestId('graphic-state').innerText());
  expect(state.objects.find((o: { id: string }) => o.id === 'text-1')).toMatchObject({ xMm: 10, yMm: 8, text: 'Città & realtà' });
  const svgDownload = page.waitForEvent('download'); await page.getByRole('button', { name: 'Esporta SVG' }).click();
  const svg = await readFile(await (await svgDownload).path(), 'utf8');
  expect(svg).toMatch(/width="58mm"/); expect(svg).toMatch(/height="22mm"/); expect(svg).toContain('viewBox="0 0 464 176"');
  expect(svg).toContain('<text'); expect(svg).toContain('<rect'); expect(svg).not.toContain('<image'); expect(svg).toContain('&amp;');
  const jsonDownload = page.waitForEvent('download'); await page.getByRole('button', { name: 'Esporta JSON' }).click();
  const filePath = await (await jsonDownload).path(); const json = JSON.parse(await readFile(filePath, 'utf8')); expect(json).toEqual(state);
  await page.getByLabel('Riapri progetto JSON').setInputFiles(filePath);
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 3 ·');
  await page.getByRole('button', { name: '01 · Scegli il timbro' }).click();
  await page.getByRole('button', { name: '02 · Editor Fabric.js' }).click();
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 3 ·');
  expect(errors).toEqual([]);
});

test('golden SVG da JSON canonico mantiene geometria e testo', async ({ page }) => {
  await openProductCanvas(page);
  await page.getByLabel('Riapri progetto JSON').setInputFiles('fixtures/illustrator/stamp.TEST.json');
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 1 ·');
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Esporta SVG' }).click();
  const svg = await readFile(await (await pending).path(), 'utf8');
  expect(svg).toEqual(await readFile('fixtures/illustrator/stamp.TEST.svg', 'utf8'));
});

test('trascinamento Fabric passa dal comando manuale e resta nello stato', async ({ page }) => {
  await openProductCanvas(page);
  await page.locator('.upper-canvas').scrollIntoViewIfNeeded();
  const box = await page.locator('.upper-canvas').boundingBox(); expect(box).not.toBeNull();
  await page.mouse.move(box!.x + 60, box!.y + 66); await page.mouse.down(); await page.mouse.move(box!.x + 76, box!.y + 74, { steps: 10 }); await page.mouse.up();
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 1 ·');
  await page.getByText('Stato e storico del documento').click();
  const state = JSON.parse(await page.getByTestId('graphic-state').innerText());
  expect(state.objects.find((o: { id: string }) => o.id === 'text-1').xMm).toBeCloseTo(7, 1);
});

test('mobile, input ostile resta testo e nessun overflow della pagina', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await page.getByLabel('Descrivi il tuo timbro').fill('<img src=x onerror=alert(1)> timbro');
  await page.getByRole('button', { name: 'Analizza richiesta' }).click();
  await expect(page.getByTestId('clarification')).toContainText('autoinchiostrante');
  expect(await page.locator('img').count()).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Autoinchiostrante', exact: true }).click();
  await page.getByRole('button', { name: 'Non so le misure' }).click();
  await page.locator('.product-card').first().getByRole('button', { name: 'Prova nel canvas' }).click();
  await expect(page.locator('.canvas-container')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('prodotto scelto e testo multilinea nel canvas condividono il documento; cambio modello conserva o rifiuta', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await openProductCanvas(page, '4912');
  await expect(page.getByTestId('editor-product')).toContainText('47 × 18');
  await writeOnCanvas(page, 'Azienda\nMilano');
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 1 ·');
  await page.getByText('Stato e storico del documento').click();
  const original = JSON.parse(await page.getByTestId('graphic-state').innerText());
  expect(original.productId).toBe('gid://shopify/Product/15106099904892');
  expect(original.objects[1]).toMatchObject({ id: 'text-1', text: 'Azienda\nMilano' });
  const pendingSvg = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Esporta SVG', exact: true }).click();
  const smallSvg = await readFile(await (await pendingSvg).path(), 'utf8');
  expect(smallSvg).toContain('width="47mm"'); expect(smallSvg).toContain('height="18mm"');
  expect(smallSvg).toContain('viewBox="0 0 376 144"');
  expect(smallSvg).toContain('Azienda'); expect(smallSvg).toContain('Milano');
  await page.getByRole('button', { name: '01 · Scegli il timbro' }).click();
  await page.locator('.product-card').filter({ has: page.getByRole('heading', { name: /4913/ }) }).getByRole('button', { name: 'Prova nel canvas' }).click();
  await expect(page.getByTestId('editor-product')).toContainText('Area nominale del progetto: 58 × 22');
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 2 ·');
  const larger = JSON.parse(await page.getByTestId('graphic-state').innerText());
  expect(larger.documentId).toBe(original.documentId);
  expect(larger.objects).toEqual(original.objects);
  expect(larger.productId).toBe('gid://shopify/Product/15106096497020');
  // Il testo entra nel grande, ma non nel piccolo: nessuna riduzione automatica.
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
  await expect(page.getByRole('button', { name: 'Esporta SVG', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Torna al prodotto del progetto' }).click();
  await expect(page.getByRole('heading', { name: /4913/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Esporta SVG', exact: true })).toBeEnabled();
  await expect(page.locator('.canvas-scroll')).not.toHaveAttribute('inert');
  expect(errors).toEqual([]);
});

test('testo fuori area digitato nel canvas viene rifiutato senza perdere la bozza', async ({ page }) => {
  await openProductCanvas(page);
  await writeOnCanvas(page, 'X'.repeat(150));
  await expect(page.getByRole('alert')).toContainText('fuori dall’area');
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 0 ·');
  await page.getByText('Stato e storico del documento').click();
  expect(JSON.parse(await page.getByTestId('graphic-state').innerText()).objects[1].text).toBe('TEST · Città');
});
