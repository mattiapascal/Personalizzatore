import { chromium, expect } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import type { GraphicDocument } from '../src/editor/model';
const origin = 'http://127.0.0.1:5173', browser = await chromium.launch();
try {
  const page = await browser.newPage(), errors: string[] = [], external: string[] = [], results: { fixture: string; objects: number; images: number; revision: number }[] = [];
  page.on('pageerror', error => { errors.push(error.message); console.error('Errore browser:', error.message); }); page.on('request', request => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== origin) external.push(request.url()); });
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort()); await page.route('**/api/**', route => route.abort()); await page.goto(`${origin}/editor`);
  for (const [index, name] of ['raster', 'raster-crop', 'clipboard', 'raster-filters', 'path-operations', 'selection-style', 'text-decoration', 'selection-area', 'bezier', 'jpeg', 'refinements', 'bezier-handles', 'text-lines', 'crop-handles', 'text-path', 'svg-import', 'pdf-import', 'text-import'].entries()) {
    if (index > 0 && index % 8 === 0) await new Promise(resolve => setTimeout(resolve, 1100)); // Avoid Chromium's burst-download throttle.
    const path = `fixtures/illustrator/${name}.TEST.json`, saved = JSON.parse(readFileSync(path, 'utf8')) as GraphicDocument;
    await page.getByLabel('Riapri progetto JSON').setInputFiles(path); await expect(page.getByTestId('revision')).toContainText(`Revisione grafica: ${index + 1} ·`); await expect(page.getByRole('alert')).toHaveCount(0);
    const current = JSON.parse((await page.getByTestId('graphic-state').textContent())!) as GraphicDocument; expect(current.objects).toEqual(saved.objects); expect(current.groups ?? []).toEqual(saved.groups ?? []);
    const pending = page.waitForEvent('download', { timeout: 8000 }).catch(async error => { console.error('Export non riuscito:', name, await page.getByRole('alert').allTextContents()); throw error; }); await page.getByRole('button', { name: 'Esporta SVG', exact: true }).click(); const source = readFileSync((await (await pending).path())!, 'utf8'); expect(source).toContain('width="58mm"'); expect(source).not.toMatch(/NaN|Infinity/); expect(source).not.toContain('#0088cc');
    if (name === 'jpeg') { expect(current.objects.filter(object => object.type === 'image').every(object => object.type === 'image' && object.source.mime === 'image/jpeg')).toBe(true); expect(source).not.toContain('image/jpeg'); expect(source).toContain('data:image/png;base64,'); }
    if (name === 'bezier') { expect(source).toMatch(/d="[^"]*C /); expect(source).not.toContain('#215444'); }
    results.push({ fixture: name, objects: current.objects.length, images: current.objects.filter(object => object.type === 'image').length, revision: current.revision });
  }
  expect(errors).toEqual([]); expect(external).toEqual([]); mkdirSync('.local', { recursive: true }); writeFileSync('.local/editor-artifact-smoke.json', JSON.stringify({ test: 'reopen-and-export-local-editor-artifacts', results, browserErrors: errors, externalRequests: external }, null, 2));
  console.log(JSON.stringify({ passed: results.length, fixtures: results.map(result => result.fixture), browserErrors: errors.length, externalRequests: external.length }));
} finally { await browser.close(); }
