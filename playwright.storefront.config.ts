import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', testMatch: 'storefront.spec.ts', workers: 1,
  use: { baseURL: 'http://127.0.0.1:5174', headless: true, trace: 'retain-on-failure' },
  webServer: { command: 'npx vite --config vite.storefront.config.ts', url: 'http://127.0.0.1:5174', reuseExistingServer: !process.env.CI },
});
