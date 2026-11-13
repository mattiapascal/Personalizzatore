import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { TEST_FONT_ASSETS } from '../tests/helpers/editor-fonts';
import { fontSearchFixture } from '../tests/helpers/font-search';
import { clickEditorButton } from '../tests/helpers/editor-ui';
const origin = 'http://127.0.0.1:5173', browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } }), errors: string[] = [], writes: string[] = [], external: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.fallback() : (external.push(route.request().url()), route.abort())); await page.route('**/api/**', route => route.abort());
  await page.route('**/__editor-local/admin/**', route => {
    const path = new URL(route.request().url()).pathname.replace('/__editor-local/admin/', ''); if (path === 'font-coverage') return route.fallback();
    if (route.request().method() !== 'GET') { writes.push(path); return route.abort(); }
    if (path.startsWith('font/')) { const font = TEST_FONT_ASSETS.find(font => font.id === `font-${path.slice(5)}`); if (!font) throw Error('Font TEST assente'); return route.fulfill({ body: Buffer.from(font.dataBase64, 'base64'), contentType: `font/${font.format}` }); }
    return route.fulfill({ json: { schemaVersion: 1, revision: 0, settings: { editorName: 'TEST', gridMm: 1, gridVisible: false, snapEnabled: false }, records: [], fonts: TEST_FONT_ASSETS.map(({ dataBase64, ...font }) => ({ ...font, id: font.id.slice(5), actualFamily: font.family, actualWeight: font.weight, actualItalic: font.italic, archived: false })) } });
  });
  const source = fontSearchFixture();
  await page.goto(`${origin}/editor?workspace=1&mode=test`); await page.getByLabel('Riapri progetto JSON').setInputFiles({ name: 'font-search-source.TEST.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(source)) });
  await expect.poll(async () => JSON.parse((await page.getByTestId('graphic-state').textContent())!).documentId).toBe(source.documentId);
  await clickEditorButton(page, { name: 'Testo · search-text', exact: true }); await page.getByRole('tab', { name: 'Testo', exact: true }).click();
  const font = page.getByRole('combobox', { name: 'Font', exact: true }), search = page.getByRole('searchbox', { name: 'Cerca font', exact: true }), list = page.getByRole('listbox', { name: 'Caratteri disponibili', exact: true });
  const before = await page.getByTestId('graphic-state').textContent(); await font.click(); await search.fill('cou'); await expect(list.getByRole('option')).toHaveCount(1); await expect(list.getByRole('option')).toBeEnabled();
  await mkdir('.local/previews', { recursive: true }); await page.screenshot({ path: '.local/previews/editor-font-search-desktop.png' }); expect(await page.getByTestId('graphic-state').textContent()).toBe(before); await search.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 }); const inspector = page.getByRole('button', { name: 'Ispettore', exact: true });
  await expect(inspector).toHaveAttribute('aria-pressed', 'false'); await inspector.click(); await expect(font).toBeVisible();
  await font.click(); await expect(search).toHaveValue(''); await search.fill('cou'); await expect(list.getByRole('option')).toHaveText('Cousine'); await page.screenshot({ path: '.local/previews/editor-font-search-mobile.png' }); expect(await page.getByTestId('graphic-state').textContent()).toBe(before);
  await list.getByRole('option', { name: 'Cousine', exact: true }).click();
  const result = await page.evaluate(async () => { const a = '/src/editor/fabric-adapter.ts', b = '/src/editor/font-preflight.ts', document = JSON.parse(globalThis.document.querySelector('[data-testid="graphic-state"]')!.textContent!); return { document, svg: await (await import(a)).exportDocumentSvg(document), report: await (await import(b)).inspectDocumentFonts(document) }; });
  expect(result.document.objects[0]).toMatchObject({ id: 'search-text', text: 'TEST · Città', fontFamily: 'font-aaaaaaaa-0000-4000-8000-000000000007' }); expect(result.document.revision).toBe(JSON.parse(before!).revision + 1); expect(result.report.issues).toEqual([]); expect(result.svg).toContain('TEST · Città'); expect(result.svg).toContain('<text');
  await writeFile('fixtures/illustrator/font-search.TEST.json', JSON.stringify(result.document, null, 2) + '\n'); await writeFile('fixtures/illustrator/font-search.TEST.svg', result.svg);
  expect(errors).toEqual([]); expect(writes).toEqual([]); expect(external).toEqual([]);
  const report = { fixture: 'font-search', queryUnchangedDocument: true, chosenFile: result.document.objects[0].fontFamily, fontIssues: result.report.issues, browserErrors: errors, adminWrites: writes, externalRequests: external }; await writeFile('.local/font-search/capture.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
} finally { await browser.close(); }
