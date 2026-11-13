import { test, expect, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { fontIssueSelectionFixture } from '../helpers/font-issue-selection';
import { TEST_DEFAULT_FONT, TEST_FONT_ASSETS } from '../helpers/editor-fonts';
import { FontSupportSearch } from '../../scripts/editor-font-support';
import type { FontSupportRequest } from '../../src/editor/font-support';
import type { GraphicDocument } from '../../src/editor/model';

const state = async (page: Page): Promise<GraphicDocument> => JSON.parse((await page.getByTestId('graphic-state').textContent())!);
async function open(page: Page, options: { delay?: boolean; error?: boolean; wrongBytes?: boolean; delayFile?:boolean } = {}) {
  const document = fontIssueSelectionFixture(); document.objects = document.objects.filter(object => object.id === 'repair-text'); delete document.groups; document.fontAssets = document.fontAssets!.slice(0, 1);
  const files = [TEST_DEFAULT_FONT, TEST_FONT_ASSETS.find(font => font.familyGroup === 'Tinos' && font.weight === 400 && !font.italic)!];
  const date = '2026-11-13T00:00:00.000Z', fonts = files.map(({ dataBase64, label, ...asset }) => ({ ...asset, id: asset.id.slice(5), title: asset.family, notes: '', source: 'manual', actualFamily: asset.family, actualFamilyGroup: asset.familyGroup, actualStyleName: asset.styleName, archived: false, createdAt: date, updatedAt: date, fileHash: createHash('sha256').update(Buffer.from(dataBase64, 'base64')).digest('hex') }));
  let revision = 4, release = () => {}, completed = false,fileCompleted=false;
  let indexes=0;const gate = new Promise<void>(resolve => { release = resolve; }), requests: FontSupportRequest[] = [], downloads: string[] = [], writes: string[] = [], errors: string[] = [], external: string[] = [], search = new FontSupportSearch();
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:5173' ? route.fallback() : (external.push(route.request().url()), route.abort())); await page.route('**/api/**', route => route.abort());
  const id = '99999999-9999-4999-a999-999999999999';
  await page.route('**/__editor-local/admin/**', async route => {
    const path = new URL(route.request().url()).pathname.replace('/__editor-local/admin/', '');
    if (path === 'font-coverage') return route.fallback();
    if (path === 'record/' + id) return route.fulfill({ json: { id, kind: 'composition', title: 'Font support TEST', tags: [], clientRef: '', archived: false, version: 1, createdAt: date, updatedAt: date, document } });
    if (path === 'font-support') {
      const request = route.request().postDataJSON() as FontSupportRequest; requests.push(request);
      const delayed = options.delay && requests.length === 1;
      if (delayed) await gate;
      try {
        if (options.error) return await route.fulfill({ status: 503, json: { error: 'Ricerca TEST temporaneamente non disponibile' } });
        const result = await search.batch({ readFontSearchIndex: async () => ({ revision, fonts }), readFont: async id => files.find(font => font.id === `font-${id}`) }, request);
        await route.fulfill({ json: result });
      } catch (cause) { if (!delayed) throw cause; } finally { if (delayed) completed = true; }
      return;
    }
    if (path.startsWith('font/')) { const id = path.slice(5), file = files.find(font => font.id === `font-${id}`); downloads.push(id);if(options.delayFile)await gate;try{return file ? await route.fulfill({ body: Buffer.from((options.wrongBytes ? files[1]! : file).dataBase64, 'base64'), contentType: `font/${file.format}` }) : await route.fulfill({ status: 404, json: { error: 'Font TEST assente' } });}catch(cause){if(!options.delayFile)throw cause;}finally{fileCompleted=true;}return; }
    if(path==='')indexes++;if (route.request().method() !== 'GET') writes.push(path);
    return route.fulfill({ json: { schemaVersion: 1, revision, settings: { editorName: 'TEST', gridMm: 1, gridVisible: false, snapEnabled: false }, fonts, records: [], productionProfiles: [] } });
  });
  await page.goto(`/editor?workspace=1&mode=test&archive=${id}`);
  await expect.poll(async () => (await state(page)).documentId).toBe(document.documentId);
  const tools = page.getByRole('button', { name: 'Strumenti', exact: true }); if (await tools.getAttribute('aria-pressed') === 'false') await tools.click();
  const row = page.getByRole('group', { name: 'Correggi caratteri di repair-text', exact: true }), finder = row.getByRole('region', { name: 'Ricerca font per i caratteri mancanti', exact: true }); await expect(finder).toBeVisible();
  return { row, finder, requests, downloads, writes, errors, external, release, completed: () => completed,fileCompleted:()=>fileCompleted, changeRevision: () => revision++, recover: () => { options.error = false; }, indexes:()=>indexes };
}
for (const width of [1440, 390]) test(`ricerca font: nessuna scansione iniziale, byte verificati e un solo file preparato prima di Applica a ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 960 }); const checks = await open(page), before = await state(page);
  expect(checks.requests).toEqual([]); expect(checks.downloads).toEqual([]);const indexes=checks.indexes();await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect.poll(checks.indexes).toBeGreaterThan(indexes);expect(checks.downloads).toEqual([]);
  await checks.finder.getByRole('button', { name: 'Trova font compatibili', exact: true }).click(); await expect(checks.finder).toContainText('Ricerca completata'); await expect(checks.finder).toContainText('3 di 3 file · 2 compatibili');
  expect(checks.requests).toHaveLength(1); expect(checks.requests[0]!.characters).toEqual(['Ω']); expect(checks.downloads).toEqual([]); expect(await state(page)).toEqual(before);
  await checks.finder.getByRole('searchbox', { name: 'Filtra risultati', exact: true }).fill('Arimo'); await expect(checks.finder.getByRole('listitem')).toHaveCount(1);
  await checks.finder.getByRole('button', { name: /Scegli font compatibile Arimo/ }).click(); await expect(checks.row.getByTestId('font-repair-candidate')).toHaveAttribute('data-state', 'ready'); await expect(checks.row.getByRole('img', { name: 'Anteprima dei caratteri con il font scelto', exact: true })).toHaveText('Ω');
  expect(checks.downloads).toEqual([TEST_DEFAULT_FONT.id.slice(5)]); expect(await state(page)).toEqual(before);
  await checks.row.getByRole('button', { name: 'Applica ai soli caratteri mancanti', exact: true }).click(); await expect.poll(async () => (await state(page)).revision).toBe(before.revision + 1);
  const after = await state(page); expect(after.fontAssets).toHaveLength(2); expect(after.objects[0]).toMatchObject({ text: 'ABC Ω', xMm: 10, yMm: 10, characterStyles: [{ start: 4, end: 5, style: { fontFamily: TEST_DEFAULT_FONT.id, fontWeight: 'normal', fontStyle: 'normal' } }] });
  await page.getByRole('button', { name: 'Annulla', exact: true }).click(); await expect.poll(async () => (await state(page)).objects).toEqual(before.objects); expect((await state(page)).fontAssets).toEqual(before.fontAssets);
  expect(checks.writes).toEqual([]); expect(checks.errors).toEqual([]); expect(checks.external).toEqual([]);
});
test('ricerca font: interruzione e nuova richiesta non accettano una risposta precedente tardiva', async ({ page }) => {
  const checks = await open(page, { delay: true }), before = await state(page);
  try {
    await checks.finder.getByRole('button', { name: 'Trova font compatibili', exact: true }).click(); await expect.poll(() => checks.requests.length).toBe(1); await checks.finder.getByRole('button', { name: 'Interrompi ricerca', exact: true }).click(); await expect(checks.finder).toContainText('Ricerca incompleta');
    await checks.finder.getByRole('button', { name: 'Ripeti ricerca font compatibili', exact: true }).click(); await expect(checks.finder).toContainText('Ricerca completata'); await expect(checks.finder.getByRole('listitem')).toHaveCount(2);
    checks.release(); await expect.poll(checks.completed).toBe(true); await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(checks.finder).toContainText('Ricerca completata'); await expect(checks.finder.getByRole('listitem')).toHaveCount(2); expect(await state(page)).toEqual(before); expect(checks.downloads).toEqual([]); expect(checks.writes).toEqual([]); expect(checks.errors).toEqual([]);
  } finally { checks.release(); }
});
test('ricerca font: errore con Riprova, nessuna scelta automatica o copertura inventata', async ({ page }) => {
  const checks = await open(page, { error: true }), before = await state(page); await checks.finder.getByRole('button', { name: 'Trova font compatibili', exact: true }).click(); await expect(checks.finder).toContainText('Ricerca TEST temporaneamente non disponibile'); await expect(checks.finder.getByRole('listitem')).toHaveCount(0); expect(await state(page)).toEqual(before);
  checks.recover(); await checks.finder.getByRole('button', { name: 'Ripeti ricerca font compatibili', exact: true }).click(); await expect(checks.finder).toContainText('Ricerca completata'); await expect(checks.row.getByRole('button', { name: 'Applica ai soli caratteri mancanti', exact: true })).toBeDisabled(); expect(checks.downloads).toEqual([]); expect(await state(page)).toEqual(before);
});
test('ricerca font: libreria cambiata dopo il risultato, nessun download o scelta obsoleta', async ({ page }) => {
  const checks = await open(page), before = await state(page); await checks.finder.getByRole('button', { name: 'Trova font compatibili', exact: true }).click(); await expect(checks.finder).toContainText('Ricerca completata'); checks.changeRevision();
  await checks.finder.getByRole('button', { name: /Scegli font compatibile Arimo/ }).click(); await expect(checks.finder).toContainText('La libreria è cambiata'); expect(checks.downloads).toEqual([]); expect(await state(page)).toEqual(before); await expect(checks.row.getByRole('button', { name: 'Applica ai soli caratteri mancanti', exact: true })).toBeDisabled();
});
test('ricerca font: byte diversi da quelli analizzati rifiutati prima della registrazione, senza avvelenare il font originale', async ({ page }) => {
  const checks = await open(page, { wrongBytes: true }), before = await state(page); await checks.finder.getByRole('button', { name: 'Trova font compatibili', exact: true }).click(); await expect(checks.finder).toContainText('Ricerca completata');
  await checks.finder.getByRole('button', { name: /Scegli font compatibile Arimo/ }).click(); await expect(checks.finder).toContainText('Il file non corrisponde a quello verificato');
  expect(await page.evaluate(async id => { const path = '/src/editor/fonts.ts'; return !!(await import(path)).registeredFontAsset(id); }, TEST_DEFAULT_FONT.id)).toBe(false);
  expect(await state(page)).toEqual(before); await expect(checks.row.getByRole('button', { name: 'Applica ai soli caratteri mancanti', exact: true })).toBeDisabled(); expect(checks.writes).toEqual([]); expect(checks.errors).toEqual([]);
});

test('elenco Font tradizionale: caricamento completo soltanto all’apertura esplicita del menu, documento invariato',async({page})=>{
 const checks=await open(page),before=await state(page);expect(checks.downloads).toEqual([]);
 await checks.row.getByRole('combobox',{name:'Font per i caratteri mancanti',exact:true}).click();await expect(page.getByRole('option',{name:'Arimo',exact:true})).toBeVisible();await expect(page.getByRole('option',{name:'Tinos',exact:true})).toBeVisible();
 expect([...checks.downloads].sort()).toEqual([TEST_DEFAULT_FONT.id.slice(5),TEST_FONT_ASSETS.find(font=>font.familyGroup==='Tinos'&&font.weight===400&&!font.italic)!.id.slice(5)].sort());await page.getByRole('option',{name:'Arimo',exact:true}).click();await expect(checks.row.getByTestId('font-repair-candidate')).toHaveAttribute('data-state','ready');expect(await state(page)).toEqual(before);expect(checks.requests).toEqual([]);expect(checks.errors).toEqual([]);
});

test('preparazione font: controlli coerenti durante il download, annullamento e risposta tardiva senza scelta o registrazione',async({page})=>{
 const checks=await open(page,{delayFile:true}),before=await state(page);try{
 await checks.finder.getByRole('button',{name:'Trova font compatibili',exact:true}).click();await expect(checks.finder).toContainText('Ricerca completata');await checks.finder.getByRole('button',{name:/Scegli font compatibile Arimo/}).click();await expect.poll(()=>checks.downloads.length).toBe(1);
 const picker=checks.row.getByRole('combobox',{name:'Font per i caratteri mancanti',exact:true});await expect(picker).toBeDisabled();await expect(checks.row.getByRole('button',{name:'Applica ai soli caratteri mancanti',exact:true})).toBeDisabled();
 await checks.finder.getByRole('button',{name:'Annulla preparazione font',exact:true}).click();await expect(picker).toBeEnabled();checks.release();await expect.poll(checks.fileCompleted).toBe(true);await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 await expect(picker).toContainText('Scegli il font dei caratteri mancanti');await expect(checks.row.getByTestId('font-repair-candidate')).toHaveCount(0);expect(await state(page)).toEqual(before);expect(await page.evaluate(async id=>{const path='/src/editor/fonts.ts';return!!(await import(path)).registeredFontAsset(id);},TEST_DEFAULT_FONT.id)).toBe(false);expect(checks.errors).toEqual([]);expect(checks.writes).toEqual([]);
 }finally{checks.release();}
});
