import { clickEditorButton } from '../tests/helpers/editor-ui';
import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { regularPolygonPoints, starPoints } from '../src/editor/polygon-geometry';
import { strokeGeometry } from '../src/editor/path-geometry';
const origin = 'http://127.0.0.1:5173';
const transformed = process.argv.includes('--transforms'), guideMode = process.argv.includes('--guides'), lineMode = process.argv.includes('--lines'), ellipseMode = process.argv.includes('--ellipses'), pathMode = process.argv.includes('--paths'), polygonMode = process.argv.includes('--polygons'), sample = polygonMode ? 'polygons' : pathMode ? 'paths' : ellipseMode ? 'ellipses' : lineMode ? 'lines' : transformed ? 'group-transforms' : 'selection', preview = guideMode ? 'guides' : sample;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.route('**/api/**', route => route.abort());
  await page.goto(`${origin}/editor`); await page.getByLabel('Riapri progetto JSON').setInputFiles('fixtures/illustrator/stamp.TEST.json');
  const doc = JSON.parse((await page.getByTestId('graphic-state').textContent())!);
  doc.objects = [
    { id: 'text-1', type: 'text', xMm: 10, yMm: 4, text: 'GRUPPI · TEST', fontSizePt: 9, fontFamily: 'Arial', textAlign: 'center', fill: '#000000', textBox: { widthMm: 38, heightMm: 4, autoWidth: false, autoHeight: true }, characterStyles: [{ start: 0, end: 6, style: { fontWeight: 'bold' } }] },
    { id: 'left-box', type: 'rect', xMm: 8, yMm: 12, widthMm: 12, heightMm: 5, strokeMm: 0.25, stroke: '#000000', cornerRadiusMm: 1 },
    { id: 'dot', type: 'circle', xMm: 24, yMm: 12, radiusMm: 2.5, strokeMm: 0.25, stroke: '#000000' },
    { id: 'right-box', type: 'rect', xMm: 39, yMm: 12, widthMm: 10, heightMm: 5, strokeMm: 0.25, stroke: '#000000' },
  ];
  if (lineMode) {
    doc.objects[0].text = 'LINEE · TEST';
    doc.objects.push(
      { id: 'rule-top', type: 'line', xMm: 10, yMm: 9.5, lengthMm: 38, strokeMm: 0.3, stroke: '#000000' },
      { id: 'rule-vertical', type: 'line', xMm: 35, yMm: 11, lengthMm: 6, rotationDeg: 90, strokeMm: 0.2, stroke: '#000000', strokeDash: 'dashed' },
    );
  }
  if (ellipseMode) {
    doc.objects[0].text = 'ELLISSI · TEST';
    doc.objects[3] = { id: 'right-box', type: 'ellipse', xMm: 38, yMm: 12, rxMm: 6, ryMm: 2, rotationDeg: 15, strokeMm: 0.3, stroke: '#000000' };
  }
  if (pathMode) {
    doc.objects[0].text = 'TRACCIATI · TEST';
    doc.objects[3] = { id: 'right-box', type: 'path', xMm: 38, yMm: 12, widthMm: 12, heightMm: 5, points: [{ x: 0, y: 1 }, { x: 0.2, y: 0.4 }, { x: 0.35, y: 0 }, { x: 0.5, y: 0.4 }, { x: 0.65, y: 0.8 }, { x: 0.8, y: 0.4 }, { x: 1, y: 0 }], closed: false, strokeMm: 0.3, stroke: '#000000' };
    doc.objects.push({ id: 'triangle', type: 'path', xMm: 16, yMm: 8, widthMm: 5, heightMm: 2, points: [{ x: 0, y: 1 }, { x: 0.5, y: 0 }, { x: 1, y: 1 }], closed: true, strokeMm: 0.25, stroke: '#000000', fill: '#000000' });
  }
  if (polygonMode) {
    doc.objects[0].text = 'FORME · TEST';
    for (const [index, points] of [[1, regularPolygonPoints(3, 4)], [2, regularPolygonPoints(5, 4)], [3, starPoints(5, 4, 0.45)]] as const) {
      const original = doc.objects[index]; doc.objects[index] = { id: original.id, type: 'path', ...strokeGeometry(points), xMm: original.xMm, yMm: 11, closed: true, strokeMm: 0.25, stroke: '#000000' };
    }
  }
  await page.getByLabel('Riapri progetto JSON').setInputFiles({ name: 'selection-seed.TEST.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(doc)) });
  await page.getByText('Strumenti sviluppatore').click();
  await page.getByLabel('Comando AI simulato').fill(JSON.stringify({ schemaVersion: 1, tool: 'groupObjects', objectId: 'left-box', expectedRevision: 2, arguments: { objectIds: ['left-box', 'dot'], groupId: 'body-group' } }));
  await page.getByRole('button', { name: 'Esegui comando', exact: true }).click();
  await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 3 ·'); await expect(page.getByRole('alert')).toHaveCount(0);
  if (transformed) {
    await page.getByLabel('Comando AI simulato').fill(JSON.stringify({ schemaVersion: 1, tool: 'transformObjects', objectId: 'text-1', expectedRevision: 3, arguments: { objectIds: doc.objects.map((object: { id: string }) => object.id), scale: 1.05, rotationDeg: 8, center: { xMm: 29, yMm: 11 } } }));
    await page.getByRole('button', { name: 'Esegui comando', exact: true }).click();
    await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 4 ·'); await expect(page.getByRole('alert')).toHaveCount(0);
  }
  await page.getByText('Strumenti sviluppatore').click();
  for (const [label, extension] of (guideMode ? [] : [['Esporta JSON', 'json'], ['Esporta SVG', 'svg']]) as [string, string][]) {
    const pending = page.waitForEvent('download'); await page.getByRole('button', { name: label, exact: true }).click(); await (await pending).saveAs(`fixtures/illustrator/${sample}.TEST.${extension}`);
  }
  if (guideMode) {
    await page.getByRole('button', { name: 'Mostra griglia', exact: true }).click();
    await page.getByRole('button', { name: 'Aggancia alla griglia e agli oggetti', exact: true }).click();
  }
  await clickEditorButton(page, { name: 'Seleziona tutto', exact: true });
  await page.getByRole('button', { name: 'Apri area di disegno a tutto schermo', exact: true }).click();
  // Fit e ridisegno Fabric occupano due frame distinti: attendere entrambi.
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  mkdirSync('.local/previews', { recursive: true }); await page.screenshot({ path: `.local/previews/editor-${preview}-desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Pannello livelli', exact: true }).click(); await clickEditorButton(page, { name: 'Deseleziona', exact: true });
  await clickEditorButton(page, { name: 'Selezione multipla', exact: true });
  const list = page.getByRole('group', { name: 'Oggetti del progetto' });
  await list.getByRole('button', { name: `${polygonMode ? 'Tracciato' : 'Rettangolo'} · left-box`, exact: true }).click();
  await expect(list.getByRole('button', { name: `${polygonMode ? 'Tracciato' : 'Cerchio'} · dot`, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await list.getByRole('button', { name: `${pathMode || polygonMode ? 'Tracciato' : ellipseMode ? 'Ellisse' : 'Rettangolo'} · right-box`, exact: true }).click();
  await page.getByRole('button', { name: 'Ispettore', exact: true }).click();
  await expect(page.getByRole('form', { name: 'Proprietà selezione' })).toBeVisible(); await expect(page.getByRole('button', { name: 'Allinea in alto', exact: true })).toBeEnabled();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await page.screenshot({ path: `.local/previews/editor-${preview}-mobile.png` }); expect(errors).toEqual([]);
  console.log(`${guideMode ? "Anteprime guide" : `${sample}.TEST.json/svg e anteprime`} desktop/mobile generate senza API esterne. Illustrator da collaudare.`);
} finally { await browser.close(); }
