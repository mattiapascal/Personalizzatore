import { z } from 'zod';

export const MODEL = 'gpt-5.4-mini-2026-03-17';
export function readConfig(env: Record<string, string | undefined>) {
  return z.object({
    AI_PROVIDER: z.enum(['demo', 'openai']).default('demo'),
    OPENAI_API_KEY: z.string().default(''),
    OPENAI_MODEL: z.literal(MODEL).default(MODEL),
    AI_BUDGET_USD: z.coerce.number().min(0).max(10).default(0),
    AI_MAX_REQUESTS: z.coerce.number().int().min(1).max(200).default(100),
    SHOPIFY_SHOP_DOMAIN: z.enum(['', 'zqu2eg-72.myshopify.com']).default(''),
    SHOPIFY_ADMIN_ACCESS_TOKEN: z.string().default(''),
    SHOPIFY_CATALOG_QUERY: z.string().min(1).max(300).default('title:timbr*'),
    CATALOG_POLL_SECONDS: z.coerce.number().int().min(60).max(3600).default(300),
  }).parse(env);
}
export type Config = ReturnType<typeof readConfig>;
