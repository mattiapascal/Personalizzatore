import { test, expect, type Page } from '@playwright/test';
import { fontIssueSelectionFixture } from '../helpers/font-issue-selection';
import type { GraphicDocument } from '../../src/editor/model';

const state = async (page: Page): Promise<GraphicDocument> => JSON.parse((await page.getByTestId('graphic-state').textContent())!);
async function open(page: Page,override?:GraphicDocument) {
  const document = override??fontIssueSelectionFixture(), text = document.objects.find(object => object.id === 'repair-text');
  if (text?.type !== 'text') throw Error('Fixture');
  if(!override){text.text = 'ABC Ω B Ω'; text.characterStyles = [{ start: 8, end: 9, style: { fontFamily: document.fontAssets![1]!.id } }];}
  const writes: string[] = [], errors: string[] = [], external: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === 'http://127.0.0.1:5173' ? route.fallback() : (external.push(route.request().url()), route.abort()));
  await page.route('**/api/**', route => route.abort());
  await page.route('**/__editor-local/admin/**', route => { if (route.request().url().endsWith('/font-coverage')) return route.fallback(); if (route.request().method() !== 'GET') writes.push(route.request().url()); return route.fulfill({ json: { schemaVersion: 1, revision: 0, settings: { editorName: 'TEST', gridMm: 1, gridVisible: false, snapEnabled: false }, fonts: [], records: [], productionProfiles: [] } }); });
  await page.goto('/editor?workspace=1&mode=test');
  await page.getByLabel('Riapri progetto JSON').setInputFiles({ name: 'font-highlight.TEST.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(document)) });
  await expect.poll(async () => (await state(page)).documentId).toBe(document.documentId);
  const tools = page.getByRole('button', { name: 'Strumenti', exact: true }); if (await tools.getAttribute('aria-pressed') === 'false') await tools.click();
  const panel = page.getByRole('region', { name: 'Controllo font del progetto', exact: true });
  await expect(panel.getByTestId('font-problem-source')).toHaveText(text.text);
  return { panel, tools, writes, errors, external };
}
for (const width of [1440, 390]) test(`caratteri problematici: solo il simbolo del file errato in rosso, correzione esplicita e Undo a ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 960 });
  const checks = await open(page), before = await state(page), source = checks.panel.getByTestId('font-problem-source');
  await expect(source.locator('mark')).toHaveCount(1); await expect(source.locator('mark')).toHaveText('Ω');
  await expect(source.locator('mark')).toHaveAttribute('data-start', '4'); await expect(source.locator('mark')).toHaveAttribute('data-end', '5');
  expect(await source.locator('mark').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgba(220, 38, 38, 0.24)');
  await checks.panel.getByRole('button', { name: 'Apri testo repair-text nell’ispettore', exact: true }).click();
  const notice = page.getByTestId('selected-text-font-issue'); await expect(notice.getByTestId('font-problem-source')).toHaveText('ABC Ω B Ω');
  await expect(notice.locator('mark')).toHaveText('Ω'); await expect(page.getByLabel('Testo da correggere')).toHaveValue('ABC Ω B Ω'); expect(await state(page)).toEqual(before);
  if (await checks.tools.getAttribute('aria-pressed') === 'false') await checks.tools.click();
  const repair = checks.panel.getByRole('group', { name: 'Correggi caratteri di repair-text', exact: true });
  await repair.getByRole('combobox', { name: 'Font per i caratteri mancanti', exact: true }).click(); await page.getByRole('option', { name: 'Arimo', exact: true }).click();
  await expect(repair.getByTestId('font-repair-candidate')).toHaveAttribute('data-state', 'ready'); expect(await state(page)).toEqual(before);
  await repair.getByRole('button', { name: 'Applica ai soli caratteri mancanti', exact: true }).click();
  await expect.poll(async () => (await state(page)).revision).toBe(before.revision + 1); await expect(page.getByTestId('font-problem-source')).toHaveCount(0);
  const after = await state(page); expect(after.objects.filter(object => object.id !== 'repair-text')).toEqual(before.objects.filter(object => object.id !== 'repair-text')); expect(after.groups).toEqual(before.groups); expect(after.fontAssets).toEqual(before.fontAssets);
  await page.getByRole('button', { name: 'Annulla', exact: true }).click(); await expect.poll(async () => (await state(page)).objects).toEqual(before.objects);
  await expect(source.locator('mark')).toHaveCount(1); await expect(source.locator('mark')).toHaveAttribute('data-start', '4');
  expect(checks.writes).toEqual([]); expect(checks.errors).toEqual([]); expect(checks.external).toEqual([]);
});

test('carattere accentato decomposto: evidenziazione, anteprima NFC e correzione dell’intero carattere senza riscrivere il testo',async({page})=>{
 const{fontCandidateFixture}=await import('../helpers/font-candidate'),fixture=fontCandidateFixture(),text=fixture.document.objects[0];if(text?.type!=='text')throw Error('Fixture');text.id='repair-text';text.text='e\u0301\uea60';
 const checks=await open(page,fixture.document),before=await state(page),mark=checks.panel.getByTestId('font-problem-source').locator('mark');await expect(mark).toHaveText('e\u0301');await expect(mark).toHaveAttribute('data-start','0');await expect(mark).toHaveAttribute('data-end','2');
 const row=checks.panel.getByRole('group',{name:'Correggi caratteri di repair-text',exact:true});await row.getByRole('combobox',{name:'Font per i caratteri mancanti',exact:true}).click();await page.getByRole('option',{name:'Arimo',exact:true}).click();await expect(row.getByTestId('font-repair-candidate')).toHaveAttribute('data-state','ready');await expect(row.getByRole('img',{name:'Anteprima dei caratteri con il font scelto',exact:true})).toHaveText('é');expect(await state(page)).toEqual(before);
 await row.getByRole('button',{name:'Applica ai soli caratteri mancanti',exact:true}).click();await expect.poll(async()=>(await state(page)).revision).toBe(before.revision+1);expect((await state(page)).objects[0]).toMatchObject({text:'e\u0301\uea60',characterStyles:[{start:0,end:2,style:{fontFamily:fixture.document.fontAssets![0]!.id,fontWeight:'normal',fontStyle:'normal'}}]});await expect(checks.panel.getByTestId('font-problem-source')).toHaveCount(0);await page.getByRole('button',{name:'Annulla',exact:true}).click();await expect.poll(async()=>(await state(page)).objects).toEqual(before.objects);await expect(mark).toHaveText('e\u0301');expect(checks.errors).toEqual([]);expect(checks.writes).toEqual([]);
});
