import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { legacyCmapFixture } from '../tests/helpers/legacy-cmap';

const origin = 'http://127.0.0.1:5173', browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } }), errors: string[] = [], writes: string[] = [], external: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.fallback() : (external.push(route.request().url()), route.abort()));
  await page.route('**/api/**', route => route.abort());
  await page.route('**/__editor-local/admin/**', route => {
    if (route.request().url().endsWith('/font-coverage')) return route.fallback();
    if (route.request().method() !== 'GET') writes.push(route.request().url());
    return route.fulfill({ json: { schemaVersion: 1, revision: 0, settings: { editorName: 'TEST', gridMm: 1, gridVisible: false, snapEnabled: false }, fonts: [], records: [], productionProfiles: [] } });
  });
  const source = legacyCmapFixture();
  await page.goto(`${origin}/editor?workspace=1&mode=test`);
  await page.getByLabel('Riapri progetto JSON').setInputFiles({ name: 'legacy-cmap.TEST.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(source)) });
  await expect(page.getByRole('region', { name: 'Controllo font del progetto' })).toContainText('I caratteri usati sono presenti');
  await expect(page.getByTestId('font-render-warning')).toHaveCount(0);
  const result = await page.evaluate(async () => {
    const a = '/src/editor/fabric-adapter.ts', b = '/src/editor/font-preflight.ts', document = JSON.parse(globalThis.document.querySelector('[data-testid="graphic-state"]')!.textContent!);
    return { document, svg: await (await import(a)).exportDocumentSvg(document), report: await (await import(b)).inspectDocumentFonts(document) };
  });
  expect(result.document.objects).toEqual(source.objects); expect(result.document.fontAssets).toEqual(source.fontAssets); expect(result.report.issues).toEqual([]);
  expect(result.svg).toContain('ABCéΩ'); expect(result.svg).toContain(source.fontAssets![0]!.dataBase64);
  await writeFile('fixtures/illustrator/legacy-cmap.TEST.json', JSON.stringify(result.document, null, 2) + '\n');
  await writeFile('fixtures/illustrator/legacy-cmap.TEST.svg', result.svg);
  await mkdir('.local/previews', { recursive: true });
  await page.getByRole('button', { name: 'Adatta all’area', exact: true }).click();
  await page.screenshot({ path: '.local/previews/editor-legacy-cmap-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 }); await page.getByRole('button', { name: 'Adatta all’area', exact: true }).click();
  await page.screenshot({ path: '.local/previews/editor-legacy-cmap-mobile.png' });
  expect(errors).toEqual([]); expect(writes).toEqual([]); expect(external).toEqual([]);
  const report = { fixture: 'legacy-cmap', sourceUnchanged: true, fontIssues: result.report.issues, browserErrors: errors, adminWrites: writes, externalRequests: external };
  await writeFile('.local/font-continuum/capture.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
} finally { await browser.close(); }
