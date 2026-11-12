import { chromium, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { imageClipTestSource } from '../tests/helpers/pitchprint-image-clip';
import { clickEditorButton, setRasterCropPixels } from '../tests/helpers/editor-ui';

const origin = 'http://127.0.0.1:5173', source = imageClipTestSource(), browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } }), errors: string[] = [], writes: string[] = [];
  await page.addInitScript({ content: 'window.__name=value=>value;' });
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.route('**/api/**', route => route.abort());
  await page.route('**/__editor-local/admin/**', route => {
    if (route.request().method() !== 'GET') { writes.push(route.request().url()); return route.abort(); }
    return route.fulfill({ json: { schemaVersion: 1, revision: 0, settings: { editorName: 'TEST', gridMm: 1, gridVisible: false, snapEnabled: false }, fonts: [], records: [] } });
  });
  await page.route('**/__editor-local/pitchprint/sources', route => route.fulfill({ json: { sources: [] } }));
  await page.goto(`${origin}/editor/import-pitchprint?workspace=1&mode=admin`);
  await page.getByLabel('File sorgente PitchPrint JSON', { exact: true }).setInputFiles({ name: 'image-clip.source.TEST.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(source)) });
  await page.getByRole('button', { name: 'Converti e mostra anteprima', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Anteprima template PitchPrint convertito', exact: true })).toBeVisible();
  await page.getByLabel('Ho verificato l’anteprima e le differenze indicate', { exact: true }).check();
  await page.getByRole('button', { name: 'Apri copia nell’editor', exact: true }).click();
  const state = async () => JSON.parse((await page.getByTestId('graphic-state').textContent())!);
  await expect.poll(async () => (await state()).objects.length).toBe(2);
  const initial = await state();
  await clickEditorButton(page, { name: 'Immagine · pp-1', exact: true });
  await page.getByRole('tab', { name: 'Ritaglio', exact: true }).click();
  await setRasterCropPixels(page, 'Sinistra', initial.objects[0].crop.leftPx + 1);
  await expect.poll(async () => (await state()).objects[0].crop.leftPx).toBeCloseTo(initial.objects[0].crop.leftPx + 1, 8);
  await clickEditorButton(page, { name: 'Annulla', exact: true });
  expect((await state()).objects).toEqual(initial.objects);
  const restored = await state();
  await page.goto(`${origin}/editor?workspace=1`);
  await page.getByLabel('Riapri progetto JSON').setInputFiles({ name: 'image-clip.TEST.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(restored)) });
  await expect.poll(async () => (await state()).objects.length).toBe(2);
  await page.getByText('Strumenti sviluppatore', { exact: false }).click();
  const current = await state();
  await page.getByLabel('Comando AI simulato').fill(JSON.stringify({ schemaVersion: 1, tool: 'moveObject', objectId: 'pp-1', expectedRevision: current.revision, arguments: { xMm: initial.objects[0].xMm + 1, yMm: initial.objects[0].yMm } }));
  await page.getByRole('button', { name: 'Esegui comando', exact: true }).click();
  await expect.poll(async () => (await state()).objects[0].xMm).toBeCloseTo(initial.objects[0].xMm + 1, 8);
  await clickEditorButton(page, { name: 'Annulla', exact: true });
  expect((await state()).objects).toEqual(initial.objects);
  await page.getByText('Strumenti sviluppatore', { exact: false }).click();
  let pending = page.waitForEvent('download');
  await clickEditorButton(page, { name: 'Esporta JSON', exact: true });
  const document = JSON.parse(await readFile(await (await pending).path(), 'utf8'));
  pending = page.waitForEvent('download');
  await clickEditorButton(page, { name: 'Esporta SVG', exact: true });
  const svg = await readFile(await (await pending).path(), 'utf8');
  const pixels = await page.evaluate(async ({ source, svg }) => {
    const a = '/tests/helpers/pitchprint-page-reference.browser.ts', b = '/tests/helpers/svg-color-reference.browser.ts';
    const { pitchprintPageReferenceSvg } = await import(a), { compareSupersampledSvg } = await import(b);
    return compareSupersampledSvg(await pitchprintPageReferenceSvg(source, [], {}), svg, 1000, 643);
  }, { source, svg });
  expect(pixels.ratio).toBeLessThan(.01); expect(pixels.meanChannelError).toBeLessThan(.25);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await mkdir('.local/image-clip-capture', { recursive: true });
  await page.screenshot({ path: '.local/image-clip-capture/editor.png' });
  expect(errors).toEqual([]); expect(writes).toEqual([]);
  await writeFile('fixtures/illustrator/image-clip.source.TEST.json', JSON.stringify(source, null, 2) + '\n');
  await writeFile('fixtures/illustrator/image-clip.TEST.json', JSON.stringify(document, null, 2) + '\n');
  await writeFile('fixtures/illustrator/image-clip.TEST.svg', svg);
  console.log(JSON.stringify({ objects: document.objects.length, groups: document.groups.length, revision: document.revision, pixels, errors, writes }));
} finally { await browser.close(); }
