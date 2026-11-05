import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Solo laboratorio loopback; nessun caricamento o test sullo storefront.
const baseUrl = 'http://127.0.0.1:5173';
try { await fetch(baseUrl); } catch { throw new Error('Avvia prima npm run dev in un altro terminale'); }
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
  await page.route('**/*', route => new URL(route.request().url()).origin === baseUrl ? route.continue() : route.abort());
  await page.goto(baseUrl);
  await page.getByLabel('Descrivi il tuo timbro').fill('Timbro aziendale con logo e sei righe');
  await page.getByRole('button', { name: 'Analizza richiesta' }).click();
  await page.getByRole('button', { name: 'Autoinchiostrante', exact: true }).click();
  await page.getByRole('button', { name: 'Conferma ingombro' }).click();
  mkdirSync('.local/previews', { recursive: true });
  await page.screenshot({ path: '.local/previews/selection-desktop.png', fullPage: true });
  await page.getByRole('button', { name: '02 · Editor Fabric.js' }).click();
  await page.getByLabel('Riapri progetto JSON').setInputFiles(resolve('fixtures/illustrator/stamp.TEST.json'));
  await page.getByTestId('revision').filter({ hasText: 'Revisione grafica: 1 ·' }).waitFor();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Esporta SVG' }).click();
  await (await pending).saveAs('fixtures/illustrator/stamp.TEST.svg');
  await page.screenshot({ path: '.local/previews/editor-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '01 · Scegli il timbro' }).click();
  await page.screenshot({ path: '.local/previews/selection-mobile.png', fullPage: true });
  console.log('SVG Fabric generato; anteprime in .local/previews. Collaudo Illustrator non eseguito.');
} finally { await browser.close(); }
