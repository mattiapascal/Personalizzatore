import { z } from 'zod';
import { AreaSchema } from '../catalog/schema';

export const RequirementsSchema = z.strictObject({
  family: z.enum(['stamp', 'other']).optional(),
  mechanism: z.enum(['automatic', 'manual', 'pocket']).optional(),
  shape: z.enum(['rectangle', 'round']).optional(),
  lines: z.number().int().min(1).max(30).optional(),
  hasLogo: z.boolean().optional(),
  minimumAreaMm: AreaSchema.nullable().optional(),
  sizeUnknown: z.boolean().optional(),
});
export type Requirements = z.infer<typeof RequirementsSchema>;
export const MissingFieldSchema = z.enum(['family', 'mechanism', 'minimumAreaMm']);
export type MissingField = z.infer<typeof MissingFieldSchema>;
export const ReasonSchema = z.strictObject({ ruleId: z.string(), explanation: z.string() });
export const RecommendationSchema = z.strictObject({
  productId: z.string(), profileVersion: z.literal(1), catalogVersion: z.string(),
  reasons: z.array(ReasonSchema).min(1), pending: z.array(z.string()).min(1),
});
export type Recommendation = z.infer<typeof RecommendationSchema>;
export const SelectionSessionSchema = z.strictObject({
  schemaVersion: z.literal(1), sessionId: z.string().uuid(), revision: z.number().int().nonnegative(),
  requirements: RequirementsSchema, candidates: z.array(RecommendationSchema),
  selectedProductId: z.string().nullable(), catalogVersion: z.string(), updatedAt: z.number(),
});
export type SelectionSession = z.infer<typeof SelectionSessionSchema>;
