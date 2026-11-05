import { createHash } from 'node:crypto';
import { z } from 'zod';
import { mountSnapshot as fixture, mountFixtureCatalog as fixtureCatalog } from '../src/catalog/adapter.ts';
import { CatalogSchema } from '../src/catalog/schema.ts';
import { CatalogStateSchema, type CatalogState } from '../src/runtime/schema.ts';
import type { Config } from './config.ts';
import { readJson, writeJson, missingFile } from './files.ts';
import { deriveMountProfiles, PROFILE_RULES_VERSION } from './mount-profiles.ts';

export const CATALOG_QUERY = `query StampCatalog($query: String!, $after: String) {
  products(first: 50, after: $after, query: $query) {
    nodes {
      id title handle status onlineStoreUrl updatedAt tags descriptionHtml vendor
      technicalSummary: metafield(namespace: "custom", key: "short_description") { jsonValue }
      variants(first: 50) { nodes { id title selectedOptions { name value } } pageInfo { hasNextPage endCursor } }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;
const pageInfo = z.object({ hasNextPage: z.boolean(), endCursor: z.string().nullable() });
export const RawProductSchema = z.object({
  id: z.string().regex(/^gid:\/\/shopify\/Product\/\d+$/), title: z.string(), handle: z.string(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DRAFT', 'UNLISTED']), onlineStoreUrl: z.url().nullable(), updatedAt: z.iso.datetime(), tags: z.array(z.string()),
  descriptionHtml: z.string().default(''), vendor: z.string().default(''), technicalSummary: z.object({ jsonValue: z.unknown() }).nullable().optional(),
  variants: z.object({ nodes: z.array(z.object({ id: z.string().regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/), title: z.string().default(''), selectedOptions: z.array(z.object({ name: z.string(), value: z.string() })).default([]) })), pageInfo }),
});
export type RawProduct = z.infer<typeof RawProductSchema>;

export function normalizeCatalog(raw: readonly RawProduct[], now: Date): CatalogState {
  const products: CatalogState['snapshot']['products'] = [], pending: CatalogState['pending'] = [];
  const seen = new Set<string>();
  for (const p of raw) {
    if (seen.has(p.id)) throw new Error('Import catalogo duplicato o instabile');
    seen.add(p.id);
    if (p.status !== 'ACTIVE' || !p.onlineStoreUrl) continue;
    const derived = deriveMountProfiles(p); products.push(...derived.profiles);
    if (derived.reason) pending.push({ productId: p.id, title: p.title, reason: derived.reason });
  }
  products.sort((a, b) => (a.profileId ?? a.productId).localeCompare(b.profileId ?? b.productId));
  pending.sort((a, b) => a.productId.localeCompare(b.productId));
  const version = `SHOPIFY-${createHash('sha256').update(JSON.stringify({ rules: PROFILE_RULES_VERSION, products, pending })).digest('hex').slice(0, 20)}`;
  return CatalogStateSchema.parse({ version, snapshot: { ...fixture, fixture: false, source: 'Shopify Admin GraphQL 2026-10, lettura; profili TEST da fonti esplicite, ' + PROFILE_RULES_VERSION, capturedOn: now.toISOString().slice(0, 10), products }, checkedAt: now.toISOString(), pending });
}

export async function fetchCatalog(config: Config, fetcher: typeof fetch = fetch): Promise<RawProduct[]> {
  if (!config.SHOPIFY_SHOP_DOMAIN || !config.SHOPIFY_ADMIN_ACCESS_TOKEN) throw new Error('Credenziali Shopify in sola lettura non configurate');
  const products: RawProduct[] = [];
  let after: string | null = null;
  const cursors = new Set<string>();
  const signal = AbortSignal.timeout(30_000);
  for (let page = 0; page < 100; page++) {
    const response = await fetcher(`https://${config.SHOPIFY_SHOP_DOMAIN}/admin/api/2026-10/graphql.json`, {
      method: 'POST', headers: { 'X-Shopify-Access-Token': config.SHOPIFY_ADMIN_ACCESS_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: CATALOG_QUERY, variables: { query: config.SHOPIFY_CATALOG_QUERY, after } }), signal, redirect: 'error',
    });
    if (!response.ok) throw new Error('Lettura Shopify non riuscita: verificare accesso read_products e limiti API');
    const text = await response.text();
    if (text.length > 2_000_000) throw new Error('Pagina catalogo troppo grande');
    const result = z.object({ errors: z.array(z.unknown()).optional(), data: z.object({ products: z.object({ nodes: z.array(RawProductSchema), pageInfo }) }).optional() }).parse(JSON.parse(text));
    if (result.errors?.length || !result.data) throw new Error('Shopify ha restituito un errore: catalogo precedente conservato');
    products.push(...result.data.products.nodes);
    const info = result.data.products.pageInfo;
    if (!info.hasNextPage) return products;
    if (!info.endCursor || cursors.has(info.endCursor)) throw new Error('Paginazione Shopify incoerente');
    cursors.add(info.endCursor); after = info.endCursor;
  }
  throw new Error('Catalogo oltre il limite di 5000 prodotti: restringere la query');
}

export class CatalogService {
  state: CatalogState = { version: fixtureCatalog.version, snapshot: fixture, checkedAt: null, pending: [] };
  lastError: string | null = null;
  private running: Promise<CatalogState> | null = null;
  get configured() { return !!this.config.SHOPIFY_SHOP_DOMAIN && !!this.config.SHOPIFY_ADMIN_ACCESS_TOKEN; }
  get refreshing() { return !!this.running; }
  constructor(private config: Config, private cachePath: string, private fetcher: typeof fetch = fetch) {}
  async load() {
    try {
      const saved = z.object({ scopeQuery: z.string(), profileRulesVersion: z.string(), catalog: CatalogStateSchema }).parse(await readJson(this.cachePath));
      if (saved.scopeQuery !== this.config.SHOPIFY_CATALOG_QUERY || saved.profileRulesVersion !== PROFILE_RULES_VERSION) throw new Error('Ambito o regole catalogo diversi dalla cache');
      const cached = saved.catalog;
      CatalogSchema.parse(cached.snapshot); this.state = cached;
    } catch (error) { if (!missingFile(error)) this.lastError = 'Cache catalogo illeggibile: ripartito dal campione TEST'; }
  }
  refresh(): Promise<CatalogState> {
    if (this.running) return this.running;
    this.running = (async () => {
      try {
        const raw = await fetchCatalog(this.config, this.fetcher);
        const next = normalizeCatalog(raw, new Date());
        await writeJson(this.cachePath, { scopeQuery: this.config.SHOPIFY_CATALOG_QUERY, profileRulesVersion: PROFILE_RULES_VERSION, catalog: next });
        this.state = next; this.lastError = null; return next;
      } catch (error) { this.lastError = error instanceof Error ? error.message : 'Aggiornamento non riuscito'; throw new Error(this.lastError); }
      finally { this.running = null; }
    })();
    return this.running;
  }
}
