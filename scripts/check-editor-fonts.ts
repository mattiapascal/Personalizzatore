import { chromium } from '@playwright/test';
const origin = 'http://127.0.0.1:5173', browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.route('**/api/**', route => route.abort());
  await page.goto(`${origin}/editor`);
  console.log(await page.evaluate(async () => {
    const path = '/src/editor/fonts.ts', { FONT_FAMILIES, isFontAvailable } = await import(path);
    return { families: FONT_FAMILIES.map((family: string) => ({ family, available: isFontAvailable(family) })), nonexistent: isFontAvailable('TEST-font-that-does-not-exist-987654321') };
  }));
} finally { await browser.close(); }
