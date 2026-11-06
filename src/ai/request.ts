import { z } from 'zod';
import { RequirementsSchema } from '../selection/schema.ts';
import { ContentBriefSchema } from '../selection/content.ts';
import { QuestionFieldSchema } from '../selection/dialogue.ts';

export const AiRequestSchema = z.strictObject({
  message: z.string().trim().min(1).max(1200), sessionId: z.string().uuid(), revision: z.number().int().nonnegative(),
  requirements: RequirementsSchema, lastQuestion: z.string().max(300).nullable(),
  recentMessages: z.array(z.strictObject({ role: z.enum(['user', 'assistant']), text: z.string().max(400) })).max(6).default([]),
  contentBrief: ContentBriefSchema.optional(), lastQuestionField: QuestionFieldSchema.optional(),
  privacyReviewed: z.boolean().default(false),
  publicFragments: z.array(z.string().trim().min(1).max(480)).max(24).default([]),
});
export type AiRequest = z.infer<typeof AiRequestSchema>;
