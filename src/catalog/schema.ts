import { z } from 'zod';

export const AreaSchema = z.strictObject({ width: z.number().positive().max(1000), height: z.number().positive().max(1000) });
export const MechanismSchema = z.enum(['automatic', 'manual', 'pocket', 'emboss']);
export const ShapeSchema = z.enum(['rectangle', 'square', 'round']);
export const MaterialSchema = z.enum(['wood', 'plastic', 'metal', 'any']);
export const ProductProfileSchema = z.strictObject({
  profileId: z.string().optional(), variantLabel: z.string().optional(),
  productId: z.string().regex(/^gid:\/\/shopify\/Product\/\d+$/),
  variantIds: z.array(z.string().regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/)).min(1),
  handle: z.string().regex(/^[a-z0-9-]+$/), title: z.string().min(1), status: z.enum(['ACTIVE', 'ARCHIVED', 'DRAFT']),
  url: z.url().refine(url => { const u = new URL(url); return u.origin === 'https://www.incisoriasacchetti.it' && /^\/products\/[a-z0-9-]+$/.test(u.pathname) && !u.search && !u.hash; }),
  tags: z.array(z.string()), profileVersion: z.literal(1), family: z.literal('stamp'),
  mechanism: MechanismSchema, shape: ShapeSchema, nominalAreaMm: AreaSchema,
  materials: z.array(z.enum(['wood', 'plastic', 'metal'])).optional(), mechanismSource: z.string().optional(),
  areaSource: z.string(), supportsLogo: z.boolean().nullable(), logoSource: z.string(),
  constraints: z.strictObject({ minFontSizePt: z.number().positive().nullable(), safeMarginMm: z.number().nonnegative().nullable(), allowedColors: z.array(z.string()).nullable() }),
  validatedForProduction: z.literal(false), price: z.null(), availability: z.null(),
});
export const CatalogSchema = z.strictObject({
  schemaVersion: z.literal(1), fixture: z.boolean(), source: z.string(), capturedOn: z.iso.date(),
  shopDomain: z.literal('www.incisoriasacchetti.it'), products: z.array(ProductProfileSchema),
});
export type ProductProfile = z.infer<typeof ProductProfileSchema>;
export type CatalogSnapshot = z.infer<typeof CatalogSchema>;
export const profileKey = (profile: ProductProfile): string => profile.profileId ?? profile.productId;
