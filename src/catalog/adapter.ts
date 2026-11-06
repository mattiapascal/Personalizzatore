import fixture from '../../fixtures/products/shopify-stamps.TEST.json' with { type: 'json' };
import mounts from '../../fixtures/products/shopify-mounts.TEST.json' with { type: 'json' };
import { CatalogSchema } from './schema.ts';
import { createCatalog } from './live-adapter.ts';
export { createCatalog, productPage, type CatalogAdapter } from './live-adapter.ts';
export const snapshot = CatalogSchema.parse(fixture);
export const fixtureCatalog = createCatalog(snapshot, `TEST-${snapshot.capturedOn}-v1`);
export const mountSnapshot = CatalogSchema.parse(mounts);
export const mountFixtureCatalog = createCatalog(mountSnapshot, `TEST-${mountSnapshot.capturedOn}-mounts-v2-metafields`);
