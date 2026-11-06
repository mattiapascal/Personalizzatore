import { fetchCatalog, type RawProduct } from '../server/catalog-source.ts';
import { deriveMountProfiles, PROFILE_RULES_VERSION } from '../server/mount-profiles.ts';
import type { Config } from '../server/config.ts';
import { CatalogStateSchema, type CatalogState } from '../src/runtime/schema.ts';
import { sha256 } from './security.ts';

export async function workerCatalog(raw: readonly RawProduct[], now: Date): Promise<CatalogState> {
  const products: CatalogState['snapshot']['products'] = [], pending: CatalogState['pending'] = [], seen = new Set<string>();
  for (const p of raw) {
    if (seen.has(p.id)) throw new Error('Catalogo duplicato'); seen.add(p.id);
    if (p.status !== 'ACTIVE' || !p.onlineStoreUrl) continue;
    const derived = deriveMountProfiles(p); products.push(...derived.profiles);
    if (derived.reason) pending.push({ productId: p.id, title: p.title, reason: derived.reason });
  }
  products.sort((a, b) => (a.profileId ?? a.productId).localeCompare(b.profileId ?? b.productId));
  pending.sort((a, b) => a.productId.localeCompare(b.productId));
  return CatalogStateSchema.parse({ version: 'SHOPIFY-' + (await sha256(JSON.stringify({ rules: PROFILE_RULES_VERSION, products, pending }))).slice(0, 20),
    checkedAt: now.toISOString(), pending,
    snapshot: { schemaVersion: 1, fixture: false, source: 'Catalogo prodotti, ' + PROFILE_RULES_VERSION, capturedOn: now.toISOString().slice(0, 10), shopDomain: 'www.incisoriasacchetti.it', products } });
}
export async function refreshWorkerCatalog(config: Config, fetcher: typeof fetch = fetch): Promise<CatalogState> {
  return workerCatalog(await fetchCatalog(config, fetcher), new Date());
}
