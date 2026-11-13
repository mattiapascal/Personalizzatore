import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { legacyCmapFixture, legacyCmapFont } from '../helpers/legacy-cmap';
import { TEST_DEFAULT_FONT } from '../helpers/editor-fonts';
import { compressedTestWoff } from '../helpers/compressed-fonts';
import { clickEditorButton } from '../helpers/editor-ui';
import type { GraphicDocument } from '../../src/editor/model';

const state = async (page: Page): Promise<GraphicDocument> => JSON.parse((await page.getByTestId('graphic-state').textContent())!);
async function open(page: Page, document = legacyCmapFixture()) {
  const writes: string[] = [], errors: string[] = [], external: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:5173' ? route.fallback() : (external.push(route.request().url()), route.abort())); await page.route('**/api/**', route => route.abort());
  await page.route('**/__editor-local/admin/**', route => { if (route.request().url().endsWith('/font-coverage')) return route.fallback(); if (route.request().method() !== 'GET') writes.push(route.request().url()); return route.fulfill({ json: { schemaVersion: 1, revision: 0, settings: { editorName: 'TEST', gridMm: 1, gridVisible: false, snapEnabled: false }, fonts: [], records: [], productionProfiles: [] } }); });
  await page.goto('/editor?workspace=1&mode=test'); await page.getByLabel('Riapri progetto JSON').setInputFiles({ name: 'legacy-cmap.TEST.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(document)) });
  await expect.poll(async () => (await state(page)).documentId).toBe(document.documentId); return { writes, errors, external };
}
for (const format of ['ttf', 'woff'] as const) test(`cmap legacy ${format}: vera FontFace, metriche e pixel identici al controllo senza alcun font sostitutivo`, async ({ page }) => {
  const document = legacyCmapFixture();
  if (format === 'woff') { const packed = compressedTestWoff(document.fontAssets![0]!); expect(packed.compressedCmap).toBe(true); document.fontAssets![0] = { ...document.fontAssets![0]!, format, dataBase64: packed.bytes.toString('base64') }; }
  const checks = await open(page, document); await expect(page.getByTestId('font-render-warning')).toHaveCount(0); await expect(page.getByRole('region', { name: 'Controllo font del progetto' })).toContainText('I caratteri usati sono presenti');
  const before = await state(page), result = await page.evaluate(async ({ document: doc, control }) => {
    const a = '/src/editor/fonts.ts', b = '/src/editor/fabric-adapter.ts', c = '/src/editor/font-preflight.ts'; const { loadFontAssets } = await import(a), { FabricAdapter, measureFabric } = await import(b);
    await loadFontAssets([control]); const text = doc.objects.find((object: { type: string }) => object.type === 'text'), legacyText = structuredClone(text), controlText = { ...text, fontFamily: control.id };
    const raster = (object: unknown) => { const view = new FabricAdapter(globalThis.document.createElement('canvas'), () => 0, () => {}); try { view.render({ ...doc, objects: [object], fontAssets: object === controlText ? [control] : doc.fontAssets }); view.canvas.renderAll(); return view.canvas.getContext().getImageData(0, 0, view.canvas.width, view.canvas.height).data.slice(); } finally { view.dispose(); } };
    const legacy = raster(legacyText), reference = raster(controlText); let differences = 0, ink = 0;
    for (let i = 0; i < legacy.length; i++) if (legacy[i] !== reference[i]) differences++;
    for (let i = 0; i < legacy.length; i += 4) if (legacy[i]! < 150 && legacy[i + 3]! > 128) ink++;
    return { differences, ink, legacy: measureFabric(legacyText), control: measureFabric(controlText), issues: (await (await import(c)).inspectDocumentFonts(doc)).issues };
  }, { document: before, control: TEST_DEFAULT_FONT });
  expect(result.issues).toEqual([]); expect(result.differences).toBe(0); expect(result.ink).toBeGreaterThan(500); expect(result.legacy).toEqual(result.control); expect(await state(page)).toEqual(before); expect(checks).toEqual({ writes: [], errors: [], external: [] });
});
test('cmap legacy: geometria manuale, stesso updateObject AI, Undo e JSON/SVG conservano il file e il testo editabile', async ({ page }) => {
  const checks = await open(page), before = await state(page); await clickEditorButton(page, { name: 'Testo · legacy-text', exact: true }); await expect(page.getByRole('tab', { name: 'Geometria', exact: true })).toBeEnabled();
  const x = page.getByLabel('X (mm)', { exact: true }); await x.fill(String(Number(await x.inputValue()) + 2)); await x.press('Tab'); await expect.poll(async () => (await state(page)).revision).toBe(before.revision + 1);
  const after = await state(page), changed = after.objects.find(object => object.id === 'legacy-text')!;
  const simulated = await page.evaluate(async ({ source, object }) => { const a = '/src/editor/model.ts', b = '/src/editor/fabric-adapter.ts'; const { DocumentStore } = await import(a), { measureFabric } = await import(b), store = new DocumentStore(source, measureFabric); store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: object.id, expectedRevision: source.revision, arguments: { object } }, 'ai-simulation'); return store.document; }, { source: before, object: changed });
  expect(simulated).toEqual(after); expect(after.fontAssets).toEqual(before.fontAssets); expect(after.objects[0]).toEqual(before.objects[0]); await page.getByRole('button', { name: 'Annulla', exact: true }).click(); await expect.poll(async () => (await state(page)).objects).toEqual(before.objects);
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Esporta SVG', exact: true }).click()]), svg = await readFile((await download.path())!, 'utf8'); expect(svg).toContain('<text'); expect(svg).toContain('ABCéΩ'); expect(svg).toContain(before.fontAssets![0]!.dataBase64);
  const [json] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Esporta JSON', exact: true }).click()]), saved = JSON.parse(await readFile((await json.path())!, 'utf8')); expect(saved.fontAssets).toEqual(before.fontAssets);
  await page.getByLabel('Riapri progetto JSON').setInputFiles((await json.path())!); await expect.poll(async () => (await state(page)).objects).toEqual(before.objects); await expect(page.getByTestId('font-render-warning')).toHaveCount(0); expect(checks).toEqual({ writes: [], errors: [], external: [] });
});
test('cmap legacy: un carattere assente resta segnalato, nessuna misura con fallback e nessuno SVG errato', async ({ page }) => {
  const document = legacyCmapFixture(), text = document.objects.find(object => object.type === 'text')!; text.text = 'ABC 😀';
  await page.addInitScript(() => { const original = CanvasRenderingContext2D.prototype.measureText; (window as any).__legacyMetricCalls = []; CanvasRenderingContext2D.prototype.measureText = function (text) { if (this.font.includes('6666666622224222a222222222222222')) (window as any).__legacyMetricCalls.push(text); return original.call(this, text); }; });
  const checks = await open(page, document), before = await state(page); await expect(page.getByTestId('font-render-warning')).toBeVisible(); await clickEditorButton(page, { name: 'Testo · legacy-text', exact: true }); await expect(page.getByTestId('selected-text-font-issue').locator('mark')).toHaveText('😀'); await expect(page.getByRole('tab', { name: 'Geometria', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Esporta SVG', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('Correggi i font'); expect(await state(page)).toEqual(before); expect(await page.evaluate(() => (window as any).__legacyMetricCalls)).toEqual([]); expect(checks).toEqual({ writes: [], errors: [], external: [] });
});
test('cmap legacy: il file TEST è distinto dall’originale ma conserva la licenza incorporata', async () => { const font = legacyCmapFont(); expect(font.dataBase64).not.toBe(TEST_DEFAULT_FONT.dataBase64); expect(font.licenseText).toBe(TEST_DEFAULT_FONT.licenseText); });
