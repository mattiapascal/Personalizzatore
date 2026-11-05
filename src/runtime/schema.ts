import { z } from 'zod';
import { CatalogSchema } from '../catalog/schema.ts';

export const CatalogStateSchema = z.strictObject({
  version: z.string().min(1), snapshot: CatalogSchema,
  checkedAt: z.iso.datetime().nullable(),
  pending: z.array(z.strictObject({ productId: z.string(), title: z.string(), reason: z.string() })),
});
export type CatalogState = z.infer<typeof CatalogStateSchema>;
export const RuntimeSchema = z.strictObject({
  csrfToken: z.string().min(32),
  ai: z.strictObject({ mode: z.enum(['demo', 'openai']), ready: z.boolean(), reason: z.string().nullable(), model: z.string(), budgetUsd: z.number(), reservedUsd: z.number(), requests: z.number().int() }),
  catalog: CatalogStateSchema,
  sync: z.strictObject({ configured: z.boolean(), intervalSeconds: z.number(), lastError: z.string().nullable(), refreshing: z.boolean() }),
});
export type RuntimeState = z.infer<typeof RuntimeSchema>;
