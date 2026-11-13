import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { TEST_FONT_ASSETS } from '../helpers/editor-fonts';
import { fontSearchFixture } from '../helpers/font-search';
import { clickEditorButton } from '../helpers/editor-ui';
import type { GraphicDocument } from '../../src/editor/model';
test.use({ hasTouch: true });
const state = async (page: Page): Promise<GraphicDocument> => JSON.parse((await page.getByTestId('graphic-state').textContent())!);
async function open(page: Page, delayed = false) {
  const source = fontSearchFixture(), errors: string[] = [], writes: string[] = [], external: string[] = [], downloads: string[] = []; let indexes = 0, release = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:5173' ? route.fallback() : (external.push(route.request().url()), route.abort())); await page.route('**/api/**', route => route.abort());
  await page.route('**/__editor-local/admin/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/__editor-local/admin/', '');
    if (path === 'font-coverage') return route.fallback();
    if (route.request().method() !== 'GET') { writes.push(path); return route.abort(); }
    if (path.startsWith('font/')) {
      const id = path.slice(5), font = TEST_FONT_ASSETS.find(font => font.id === `font-${id}`); if (!font) throw Error('Font TEST assente'); downloads.push(id);
      if (delayed && font.familyGroup === 'Cousine') await gate;
      return route.fulfill({ body: Buffer.from(font.dataBase64, 'base64'), contentType: `font/${font.format}` });
    }
    if (!path) indexes++;
    return route.fulfill({ json: { schemaVersion: 1, revision: 0, settings: { editorName: 'TEST', gridMm: 1, gridVisible: false, snapEnabled: false }, records: [], fonts: TEST_FONT_ASSETS.map(({ dataBase64, ...font }) => ({ ...font, id: font.id.slice(5), actualFamily: font.family, actualWeight: font.weight, actualItalic: font.italic, archived: false })) } });
  });
  await page.goto('/editor?workspace=1&mode=test'); await page.getByLabel('Riapri progetto JSON').setInputFiles({ name: 'font-search-source.TEST.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(source)) });
  await expect.poll(async () => (await state(page)).documentId).toBe(source.documentId); await clickEditorButton(page, { name: 'Testo · search-text', exact: true }); const inspector=page.getByRole('button',{name:'Ispettore',exact:true}); if(await inspector.getAttribute('aria-pressed')==='false')await inspector.click(); await page.getByRole('tab', { name: 'Testo', exact: true }).click();
  return { errors, writes, external, downloads, indexes: () => indexes, release };
}
for (const width of [1440, 390]) test(`ricerca nomi font ${width}px: filtro, nessun risultato, tastiera/IME, scelta manuale uguale ad AI e Undo/JSON/SVG`, async ({ page }) => {
  await page.setViewportSize({ width, height: 960 }); const checks = await open(page), before = await state(page), font = page.getByRole('combobox', { name: 'Font', exact: true });
  if (width === 390) await font.tap(); else await font.click();
  const search = page.getByRole('searchbox', { name: 'Cerca font', exact: true }), list = page.getByRole('listbox', { name: 'Caratteri disponibili', exact: true });
  await expect(search).toBeFocused(); await expect(list.getByRole('option')).toHaveCount(3); await expect(list.getByRole('option', { name: 'Cousine', exact: true })).toBeEnabled(); const indexReads = checks.indexes(), downloadCount = checks.downloads.length;
  await search.fill('ti'); await expect(list.getByRole('option')).toHaveCount(1); await expect(list.getByRole('option')).toHaveText('Tinos'); await search.press('Home'); await search.press('ArrowRight'); expect(await search.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(1); await search.press('End'); await search.press('Space'); await expect(search).toHaveValue('ti '); await expect(page.getByRole('button', { name: 'Strumento Mano', exact: true, includeHidden: true })).toHaveAttribute('aria-pressed', 'false');
  await search.fill('nessun carattere così'); await expect(list.getByRole('option')).toHaveCount(0); await expect(page.locator('.font-picker-results')).toHaveText('Nessun font corrisponde alla ricerca.'); await expect(font).toBeEnabled(); await search.press('Enter'); expect(await state(page)).toEqual(before);
  await page.getByRole('button', { name: 'Svuota ricerca font', exact: true }).click(); await expect(search).toHaveValue(''); await expect(search).toBeFocused(); await expect(list.getByRole('option')).toHaveCount(3);
  expect(checks.indexes()).toBe(indexReads); expect(checks.downloads.length).toBe(downloadCount); await search.fill('roman'); await search.press('Escape'); await expect(list).toHaveCount(0); await expect(font).toBeFocused(); expect(await state(page)).toEqual(before);
  await font.click(); await expect.poll(checks.indexes).toBe(indexReads+1); await expect(search).toHaveValue(''); await search.fill('cou'); await expect(list.getByRole('option')).toHaveCount(1); await expect(list.getByRole('option')).toHaveText('Cousine'); expect(await list.getByRole('option').evaluate(node => getComputedStyle(node).fontFamily)).toContain('EditorFont_');
  const popup = await page.locator('.font-picker-popup').boundingBox(), trigger = (await font.boundingBox())!; expect(popup!.x).toBeGreaterThanOrEqual(7); expect(popup!.x + popup!.width).toBeLessThanOrEqual(width - 7); expect(popup!.y).toBeGreaterThanOrEqual(7); expect(popup!.y + popup!.height).toBeLessThanOrEqual(953);
  expect(Math.min(Math.abs(popup!.y - trigger.y - trigger.height), Math.abs(popup!.y + popup!.height - trigger.y))).toBeLessThanOrEqual(5);
  await search.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', isComposing: true, keyCode: 229 }); await expect(list).toBeVisible(); expect(await state(page)).toEqual(before); expect(checks.indexes()).toBe(indexReads+1); expect(checks.downloads.length).toBe(downloadCount);
  await search.press('Enter'); await expect(list).toHaveCount(0); await expect(font).toBeFocused(); await expect.poll(async () => (await state(page)).revision).toBe(before.revision + 1); const after = await state(page), object = after.objects[0]!; if(object.type!=='text')throw Error('Fixture testo'); expect(object).toMatchObject({ id: 'search-text', fontFamily: 'font-aaaaaaaa-0000-4000-8000-000000000007', text: 'TEST · Città' });
  const simulated = await page.evaluate(async ({ before, object, assets }) => { const a = '/src/editor/model.ts', b = '/src/editor/fabric-adapter.ts', { DocumentStore } = await import(a), { measureFabric } = await import(b), store = new DocumentStore(before, measureFabric); store.dispatch({ schemaVersion: 1, tool: 'updateObject', objectId: object.id, expectedRevision: before.revision, arguments: { object, fontAssets: assets } }, 'ai-simulation'); return store.document; }, { before, object, assets: after.fontAssets!.filter(asset => !before.fontAssets!.some(old => old.id === asset.id)) }); expect(simulated).toEqual(after);
  const tools=page.getByRole('button',{name:'Strumenti',exact:true});if(await tools.getAttribute('aria-pressed')==='false')await tools.click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Esporta SVG', exact: true }).click()]), svg = await readFile((await download.path())!, 'utf8'); expect(svg).toContain('<text'); expect(svg).toContain('TEST · Città'); expect(svg).toContain(after.fontAssets!.find(asset => asset.id === object.fontFamily)!.dataBase64);
  const [json] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Esporta JSON', exact: true }).click()]), saved = JSON.parse(await readFile((await json.path())!, 'utf8')); expect(saved).toEqual(after);
  await page.getByRole('button', { name: 'Annulla', exact: true }).click(); await expect.poll(async () => (await state(page)).objects).toEqual(before.objects); await page.getByRole('button', { name: 'Ripristina', exact: true }).click(); await expect.poll(async () => (await state(page)).objects).toEqual(after.objects);
  await page.getByLabel('Riapri progetto JSON').setInputFiles((await json.path())!); await expect.poll(async () => (await state(page)).objects).toEqual(after.objects); expect((await state(page)).fontAssets).toEqual(after.fontAssets); expect(checks.errors).toEqual([]); expect(checks.writes).toEqual([]); expect(checks.external).toEqual([]);
});
test('ricerca font: il file filtrato resta disabilitato finché si carica, digitare non avvia altre letture e Tab non sceglie', async ({ page }) => {
  const checks = await open(page, true);
  try {
    const before = await state(page), font = page.getByRole('combobox', { name: 'Font', exact: true }); await font.click(); const search = page.getByRole('searchbox', { name: 'Cerca font', exact: true }), list = page.getByRole('listbox', { name: 'Caratteri disponibili', exact: true }); await search.fill('cou'); await expect(list.getByRole('option')).toHaveCount(1); await expect(list.getByRole('option')).toBeDisabled(); const reads = checks.indexes(), downloads = checks.downloads.length;
    await search.press('Enter'); await expect(list).toBeVisible(); expect(await state(page)).toEqual(before); await search.fill('inesistente'); await expect(list.getByRole('option')).toHaveCount(0); await search.fill('co'); expect(checks.indexes()).toBe(reads); expect(checks.downloads.length).toBe(downloads);
    checks.release(); await expect(list.getByRole('option')).toBeEnabled(); await expect(search).toHaveValue('co'); expect(await state(page)).toEqual(before); await search.press('Tab'); await expect(page.getByRole('button', { name: 'Svuota ricerca font', exact: true })).toBeFocused(); await page.keyboard.press('Tab'); await expect(list).toHaveCount(0); expect(await state(page)).toEqual(before); expect(checks.errors).toEqual([]); expect(checks.writes).toEqual([]); expect(checks.external).toEqual([]);
  } finally { checks.release(); }
});
