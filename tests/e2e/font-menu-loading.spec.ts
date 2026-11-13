import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { clickEditorButton } from '../helpers/editor-ui';
test('menu font progressivo: ottanta nomi subito, righe e rotella stabili con file sospesi, poi scelta reale senza revisione implicita', async ({ page }) => {
  const bytes = await readFile('fixtures/fonts/ABeeZee-subset.TEST.woff2'), fonts = Array.from({ length: 80 }, (_, index) => ({ id: `11111111-1111-4111-8111-${String(index).padStart(12, '0')}`, family: `ZZ Nome lungo TEST ${String(index).padStart(2, '0')}`, archived: false, format: 'woff2' }));
  let release = () => {}, delayed = 0; const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/__editor-local/admin/', route => route.fulfill({ json: { schemaVersion: 1, revision: 1, settings: { editorName: 'TEST', gridMm: 1, gridVisible: false, snapEnabled: false }, records: [], fonts } }));
  await page.route('**/__editor-local/admin/font/*', async route => { if (!route.request().url().endsWith(fonts[0]!.id)) { delayed++; await gate; } await route.fulfill({ body: bytes, contentType: 'font/woff2' }); });
  try {
    await page.goto('/editor?workspace=1'); await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 0 ·'); expect(delayed).toBe(0);
    await clickEditorButton(page, { name: 'Testo · text-1', exact: true }); await page.getByRole('tab', { name: 'Testo', exact: true }).click();
    await page.getByRole('combobox', { name: 'Font', exact: true }).click(); const list = page.getByRole('listbox', { name: 'Caratteri disponibili', exact: true }); await expect(list.getByRole('option')).toHaveCount(80); await expect.poll(() => delayed).toBeGreaterThan(0);
    const before = await page.getByTestId('graphic-state').textContent(), heights = await list.getByRole('option').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height)), box = (await list.boundingBox())!;
    expect(new Set(heights).size).toBe(1); const last = list.getByRole('option').last(); await expect(last).toBeDisabled();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); let previous = 0;
    for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, 220); await expect.poll(() => list.evaluate(node => node.scrollTop)).toBeGreaterThan(previous + 120); previous = await list.evaluate(node => node.scrollTop); await page.mouse.move(box.x + box.width / 2 + i, box.y + box.height / 2); }
    release(); await expect(last).toBeEnabled(); expect(await list.getByRole('option').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height))).toEqual(heights);
    expect(Math.abs(await list.evaluate(node => node.scrollTop) - previous)).toBeLessThan(2); expect(await page.getByTestId('graphic-state').textContent()).toBe(before);
  } finally { release(); }
});
