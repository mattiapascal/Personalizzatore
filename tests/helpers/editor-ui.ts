import { expect, type Page } from '@playwright/test';
type ButtonOptions = Parameters<Page['getByRole']>[1];
type ClickOptions = Parameters<ReturnType<Page['getByRole']>['click']>[0];
/** Follow the real UI: contextual actions live in the optional Layers popover. */
export async function clickEditorButton(page: Page, options: ButtonOptions, clickOptions?: ClickOptions, keepLayersOpen = false): Promise<void> {
  const button = page.getByRole('button', options);
  if (!await button.isVisible().catch(() => false)) {
    const layerButton = page.locator('.workspace-layers-popover').getByRole('button', { ...options, includeHidden: true });
    if (await layerButton.count()) await page.getByRole('button', { name: 'Pannello livelli', exact: true }).click();
  }
  await button.click(clickOptions);
  // Return to the canvas through the actual close control; drag tests keep the panel open.
  if (!keepLayersOpen && await page.locator('.workspace-layers-popover').isVisible()) await page.getByRole('button', { name: 'Chiudi pannello livelli', exact: true }).click();
}

/** Replace content using the actual canvas editor after removal of the inspector textarea. */
export async function replaceSelectedText(page: Page, value: string): Promise<void> {
  const recovery=page.getByLabel('Testo da correggere',{exact:true});if(await recovery.isVisible()){await recovery.fill(value);await recovery.press('Tab');return;}
  const id = await page.locator('.inspector-selection .object-identity-id').innerText(), doc = JSON.parse((await page.getByTestId('graphic-state').textContent())!);
  const center = await page.evaluate(async object => { const a = '/src/editor/model.ts', b = '/src/editor/fabric-adapter.ts'; return (await import(a)).objectCenter(object, (await import(b)).measureFabric); }, doc.objects.find((object: { id: string }) => object.id === id));
  const canvas = page.locator('.upper-canvas'); await canvas.scrollIntoViewIfNeeded(); const box = (await canvas.boundingBox())!, zoom = box.width / (doc.areaMm.width * 8);
  await canvas.dblclick({ position: { x: center.xMm * 8 * zoom, y: center.yMm * 8 * zoom } }); const input = page.getByLabel('Testo nel canvas', { exact: true }); await expect(input).toBeFocused(); await input.fill(value); await input.press('Escape'); await expect(input).toHaveCount(0);
}

export async function chooseEditorFont(page: Page, family: string): Promise<void> {
  const label=family==='font-aaaaaaaa-0000-4000-8000-000000000001'?'Arimo':family==='font-aaaaaaaa-0000-4000-8000-000000000005'?'Tinos':family==='font-aaaaaaaa-0000-4000-8000-000000000007'?'Cousine':family;await page.getByRole('combobox', { name: 'Font', exact: true }).click(); await page.getByRole('option', { name: label, exact: true }).click();
}

/** Exercise the mm inspector while keeping older pixel-specific assertions explicit. */
export async function setRasterCropPixels(page: Page, side: 'Sinistra'|'Destra'|'Alto'|'Basso', pixels: number): Promise<void> {
 const id=await page.locator('.object-inspector .object-identity-id').innerText(),doc=JSON.parse((await page.getByTestId('graphic-state').textContent())!),image=doc.objects.find((o:{id:string})=>o.id===id),horizontal=side==='Sinistra'||side==='Destra',scale=horizontal?image.widthMm/(image.crop?.widthPx??image.source.pixelWidth):image.heightMm/(image.crop?.heightPx??image.source.pixelHeight);
 await page.getByLabel(`${side} ritaglio (mm)`,{exact:true}).fill(String(pixels*scale));
}
