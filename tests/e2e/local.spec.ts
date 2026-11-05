import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

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
  await page.goto('/'); await page.getByRole('button', { name: '02 · Editor Fabric.js' }).click();
  await expect(page.locator('.canvas-container')).toBeVisible();
  await page.getByLabel('Testo di text-1').fill('Città & realtà');
  await page.getByRole('button', { name: 'Applica testo manuale' }).click();
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 1 ·');
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
  await page.goto('/'); await page.getByRole('button', { name: '02 · Editor Fabric.js' }).click();
  await page.getByLabel('Riapri progetto JSON').setInputFiles('fixtures/illustrator/stamp.TEST.json');
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 1 ·');
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'Esporta SVG' }).click();
  const svg = await readFile(await (await pending).path(), 'utf8');
  expect(svg).toEqual(await readFile('fixtures/illustrator/stamp.TEST.svg', 'utf8'));
});

test('trascinamento Fabric passa dal comando manuale e resta nello stato', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: '02 · Editor Fabric.js' }).click();
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
  await page.getByRole('button', { name: '02 · Editor Fabric.js' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
