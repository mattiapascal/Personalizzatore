import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { clickEditorButton } from '../tests/helpers/editor-ui';
const origin = 'http://127.0.0.1:5173', browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }), errors: string[] = [], external: string[] = [];
  page.on('pageerror', error => errors.push(error.message)); page.on('request', request => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== origin) external.push(request.url()); });
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort()); await page.route('**/api/**', route => route.abort()); await page.goto(`${origin}/editor?workspace=1`); await page.getByLabel('Riapri progetto JSON').setInputFiles('fixtures/illustrator/raster.TEST.json'); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 1 ·'); const doc = JSON.parse((await page.getByTestId('graphic-state').textContent())!), image = doc.objects.find((object: any) => object.type === 'image');
  await clickEditorButton(page, { name: `Immagine · ${image.id}`, exact: true }); await page.getByRole('tab', { name: 'Ritaglio', exact: true }).click();
  for (const [index, [label, value]] of [['Sinistra ritaglio (px)', '20'], ['Destra ritaglio (px)', '20'], ['Alto ritaglio (px)', '10'], ['Basso ritaglio (px)', '10']].entries()) { await page.getByLabel(label!, { exact: true }).fill(value!); await expect(page.getByTestId('revision')).toContainText(`Revisione grafica: ${index + 2} ·`); }
  for (const [label, extension] of [['Esporta JSON', 'json'], ['Esporta SVG', 'svg']] as const) { const pending = page.waitForEvent('download'); await page.getByRole('button', { name: label, exact: true }).click(); await (await pending).saveAs(`fixtures/illustrator/crop-handles.TEST.${extension}`); }
  await page.getByRole('complementary', { name: 'Strumenti', exact: true }).evaluate(element => { element.scrollTop = 0; }); mkdirSync('.local/previews', { recursive: true }); await page.screenshot({ path: '.local/previews/editor-crop-handles-desktop.png' }); expect(errors).toEqual([]); expect(external).toEqual([]); console.log('crop-handles.TEST.json/svg generati e anteprima locale. Nessun errore browser o rete esterna; Illustrator da collaudare.');
} finally { await browser.close(); }
