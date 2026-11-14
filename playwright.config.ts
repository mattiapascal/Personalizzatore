import { defineConfig } from '@playwright/test';

export default defineConfig({
  outputDir: './test-results/local',
  testDir: './tests/e2e', fullyParallel: false, workers: 1,
  testMatch: ['local.spec.ts','pdf-fonts.spec.ts','production-geometry.spec.ts','geometry-focus.spec.ts','svg-physical-grid.spec.ts','font-target.spec.ts','font-highlight.spec.ts','font-support.spec.ts','font-menu-loading.spec.ts','legacy-cmap.spec.ts','font-search.spec.ts','layer-visibility.spec.ts','layout-guides.spec.ts','mounting-geometry.spec.ts','document-palette.spec.ts','draft-management.spec.ts','binary-crop.spec.ts','selection-view.spec.ts','object-spacing.spec.ts','raster-color.spec.ts','raster-hue.spec.ts','stroke-caps.spec.ts','text-path-properties.spec.ts','path-stroke.spec.ts','viewport.spec.ts','image-opacity.spec.ts','qr.spec.ts','inspector-commit.spec.ts','clipboard-actions.spec.ts','transform-commit.spec.ts'],
  use: { baseURL: 'http://127.0.0.1:5173', headless: true, trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
});
