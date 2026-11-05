import fixture from '../../fixtures/products/shopify-stamps.TEST.json';
import { CatalogSchema, type ProductProfile } from './schema';

export interface CatalogAdapter {
  readonly version: string;
  list(): readonly ProductProfile[];
  get(productId: string): ProductProfile;
}
export const snapshot = CatalogSchema.parse(fixture);
if (new Set(snapshot.products.map(p => p.productId)).size !== snapshot.products.length) throw new Error('ID catalogo duplicati');
export const fixtureCatalog: CatalogAdapter = {
  version: `TEST-${snapshot.capturedOn}-v1`,
  list: () => structuredClone(snapshot.products),
  get: productId => {
    const product = snapshot.products.find(p => p.productId === productId);
    if (!product) throw new Error('Prodotto assente dal catalogo');
    return structuredClone(product);
  },
};

// Adattatore finale attuale: solo navigazione, nessuna scrittura Shopify/BSS/PitchPrint.
export function productPage(catalog: CatalogAdapter, productId: string): string {
  return catalog.get(productId).url;
}
