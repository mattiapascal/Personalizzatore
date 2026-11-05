import { z } from 'zod';

export const AreaSchema = z.strictObject({ width: z.number().positive().max(1000), height: z.number().positive().max(1000) });
export const ProductProfileSchema = z.strictObject({
  productId: z.string().regex(/^gid:\/\/shopify\/Product\/\d+$/),
  variantIds: z.array(z.string().regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/)).min(1),
  handle: z.string().regex(/^[a-z0-9-]+$/), title: z.string().min(1), status: z.enum(['ACTIVE', 'ARCHIVED', 'DRAFT']),
  url: z.url().refine(url => { const u = new URL(url); return u.origin === 'https://www.incisoriasacchetti.it' && /^\/products\/[a-z0-9-]+$/.test(u.pathname) && !u.search && !u.hash; }),
  tags: z.array(z.string()), profileVersion: z.literal(1), family: z.literal('stamp'),
  mechanism: z.literal('automatic'), shape: z.literal('rectangle'), nominalAreaMm: AreaSchema,
  areaSource: z.string(), supportsLogo: z.boolean(), logoSource: z.string(),
  constraints: z.strictObject({ minFontSizePt: z.number().positive().nullable(), safeMarginMm: z.number().nonnegative().nullable(), allowedColors: z.array(z.string()).nullable() }),
  validatedForProduction: z.literal(false), price: z.null(), availability: z.null(),
});
export const CatalogSchema = z.strictObject({
  schemaVersion: z.literal(1), fixture: z.literal(true), source: z.string(), capturedOn: z.iso.date(),
  shopDomain: z.literal('www.incisoriasacchetti.it'), products: z.array(ProductProfileSchema).min(1),
});
export type ProductProfile = z.infer<typeof ProductProfileSchema>;
