import { z } from 'zod';

export const SessionUsageSchema = z.strictObject({
  estimatedUsd: z.number().nonnegative(), heldUsd: z.number().nonnegative(),
  budgetUsd: z.number().positive(), requests: z.number().int().nonnegative(),
});
export type SessionUsage = z.infer<typeof SessionUsageSchema>;
