import { defineConfig } from '@playwright/test';

export default defineConfig({
  outputDir: './test-results/local',
  testDir: './tests/e2e', fullyParallel: false, workers: 1,
  testMatch: 'local.spec.ts',
  use: { baseURL: 'http://127.0.0.1:5173', headless: true, trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
});
