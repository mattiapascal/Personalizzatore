import { CatalogSchema, profileKey, type ProductProfile, type CatalogSnapshot } from './schema.ts';

export interface CatalogAdapter {
  readonly version: string;
  list(): readonly ProductProfile[];
  get(productId: string): ProductProfile;
}
export function createCatalog(raw: CatalogSnapshot, version: string): CatalogAdapter {
  const data = CatalogSchema.parse(raw);
  if (new Set(data.products.map(profileKey)).size !== data.products.length) throw new Error('ID profilo catalogo duplicati');
  return {
    version,
    list: () => structuredClone(data.products),
    get: productId => {
      const product = data.products.find(p => profileKey(p) === productId);
      if (!product) throw new Error('Prodotto assente dal catalogo');
      return structuredClone(product);
    },
  };
}
// Adattatore finale attuale: solo navigazione, nessuna scrittura Shopify/BSS/PitchPrint.
export function productPage(catalog: CatalogAdapter, productId: string): string {
  const profile = catalog.get(productId);
  return profile.profileId ? `${profile.url}?variant=${profile.variantIds[0]!.split('/').at(-1)}` : profile.url;
}
