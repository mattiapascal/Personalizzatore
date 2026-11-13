import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { textSkewFixture } from '../tests/helpers/text-skew';

const origin = 'http://127.0.0.1:5173', directory = '.local/text-skew-capture';
const browser = await chromium.launch();
await mkdir(directory, { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  const errors: string[] = [], external: string[] = [], writes: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.fallback() : (external.push(route.request().url()), route.abort()));
  await page.route('**/api/**', route => route.abort());
  await page.route('**/__editor-local/media/**', route => route.fulfill({ json: { schemaVersion: 1, revision: 0, categories: [], assets: [] } }));
  await page.route('**/__editor-local/admin/**', route => {
    if (route.request().method() !== 'GET') writes.push(route.request().url());
    return route.fulfill({ json: { schemaVersion: 1, revision: 0, settings: { editorName: 'TEST', gridMm: 1, gridVisible: false, snapEnabled: false }, records: [], fonts: [] } });
  });
  await page.goto(origin + '/editor?workspace=1&mode=admin');
  await expect(page.getByTestId('revision')).toBeVisible();
  const fixture = textSkewFixture();
  const result = await page.evaluate(async document => {
    const h = '/tests/helpers/browser-module.ts', { loadedEditorModule } = await import(h);
    const { exportDocumentSvg } = await import(loadedEditorModule('/src/editor/fabric-adapter.ts'));
    return { svg: await exportDocumentSvg(document) };
  }, fixture);
  await writeFile('fixtures/illustrator/text-skew.TEST.json', JSON.stringify(fixture, null, 2) + '\n');
  await writeFile('fixtures/illustrator/text-skew.TEST.svg', result.svg);
  await page.getByLabel('Riapri progetto JSON').setInputFiles({ name: 'text-skew.TEST.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture)) });
  await expect.poll(async () => JSON.parse((await page.getByTestId('graphic-state').textContent())!).documentId).toBe(fixture.documentId);
  await expect(page.getByTestId('editor-workspace')).toHaveAttribute('data-view-ready', 'true');
  await page.getByRole('button', { name: 'Pannello livelli', exact: true }).click();
  await page.getByRole('button', { name: 'Testo · skew-positive', exact: true }).click();
  await page.getByRole('button', { name: 'Chiudi pannello livelli', exact: true }).click();
  await page.getByRole('tab', { name: 'Testo', exact: true }).click();
  await page.getByText('Inclinazione del box', { exact: true }).click();
  await page.screenshot({ path: directory + '/text-skew.png' });
  expect(errors).toEqual([]); expect(external).toEqual([]); expect(writes).toEqual([]);
  await writeFile(directory + '/report.json', JSON.stringify({ objects: fixture.objects.length, errors, external, writes, illustratorVerified: false }, null, 2));
  console.log(JSON.stringify({ objects: fixture.objects.length, errors, external, writes }));
} finally { await browser.close(); }
