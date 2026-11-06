import { createHash } from 'node:crypto';
import { z } from 'zod';
import { mountSnapshot as fixture, mountFixtureCatalog as fixtureCatalog } from '../src/catalog/adapter.ts';
import { CatalogSchema } from '../src/catalog/schema.ts';
import { CatalogStateSchema, type CatalogState } from '../src/runtime/schema.ts';
import type { Config } from './config.ts';
import { readJson, writeJson, missingFile } from './files.ts';
import { deriveMountProfiles, PROFILE_RULES_VERSION } from './mount-profiles.ts';

import { fetchCatalog, type RawProduct } from './catalog-source.ts';
export { CATALOG_QUERY, RawProductSchema, fetchCatalog, type RawProduct } from './catalog-source.ts';

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
