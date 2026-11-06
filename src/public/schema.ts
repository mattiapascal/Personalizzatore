import { z } from 'zod';
import { AreaSchema, MechanismSchema, ShapeSchema, MaterialSchema, ProductImageSchema, type CatalogSnapshot, type ProductProfile } from '../catalog/schema.ts';

const Product = z.strictObject({
  profileId: z.string(), productId: z.string(), variantIds: z.array(z.string()).min(1), handle: z.string(), title: z.string(),
  variantLabel: z.string().optional(), image: ProductImageSchema.nullable().optional(), url: z.string(), mechanism: MechanismSchema,
  shape: ShapeSchema, nominalAreaMm: AreaSchema, materials: z.array(MaterialSchema.exclude(['any'])).optional(), supportsLogo: z.boolean().nullable(),
  useCases: z.array(z.strictObject({ purpose: z.enum(['loyalty', 'exlibris']), evidence: z.string() })).optional(),
});
export const PublicBootstrapSchema = z.strictObject({
  apiVersion: z.literal(1), catalogVersion: z.string(), checkedAt: z.string().nullable(), stale: z.boolean(),
  products: z.array(Product), aiReady: z.boolean(), siteKey: z.string(),
});
export type PublicBootstrap = z.infer<typeof PublicBootstrapSchema>;
export function publicProduct(p: ProductProfile): z.infer<typeof Product> {
  return Product.parse({ profileId: p.profileId ?? p.productId, productId: p.productId, variantIds: p.variantIds, handle: p.handle,
    title: p.title, variantLabel: p.variantLabel, image: p.image, url: p.url, mechanism: p.mechanism, shape: p.shape,
    nominalAreaMm: p.nominalAreaMm, materials: p.materials, supportsLogo: p.supportsLogo, useCases: p.useCases });
}
export function publicSnapshot(data: PublicBootstrap): CatalogSnapshot {
  return { schemaVersion: 1, fixture: false, source: 'Catalogo prodotti', capturedOn: data.checkedAt?.slice(0, 10) ?? '2026-01-01', shopDomain: 'www.incisoriasacchetti.it',
    products: data.products.map(p => ({ ...p, status: 'ACTIVE', family: 'stamp', tags: [], profileVersion: 1, areaSource: 'Scheda prodotto',
      logoSource: 'Scheda prodotto', validatedForProduction: false, price: null, availability: null,
      constraints: { minFontSizePt: null, safeMarginMm: null, allowedColors: null } })) };
}
