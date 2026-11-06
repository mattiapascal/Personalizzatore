export interface Env {
  ASSISTANT: DurableObjectNamespace;
  ASSETS: Fetcher;
  OPENAI_API_KEY: string;
  SHOPIFY_ADMIN_ACCESS_TOKEN: string;
  SESSION_SECRET: string;
  TURNSTILE_SECRET: string;
  TURNSTILE_SITE_KEY: string;
  RELEASE_ADMIN_SECRET: string;
  AI_GLOBAL_BUDGET_USD: string;
}
