import { z } from 'zod';
import type { Config } from '../config.ts';
import type { CatalogAdapter } from '../../src/catalog/adapter.ts';
import { plainText, extractPage } from './html.ts';
import { storeUrl, type KnowledgeDocument, type CachedKnowledgePage } from './model.ts';
export const KNOWLEDGE_PRODUCTS_QUERY = `query KnowledgeProducts($after: String) {
  products(first: 50, after: $after, query: "status:active") {
    nodes { id title onlineStoreUrl descriptionHtml updatedAt }
    pageInfo { hasNextPage endCursor }
  }
}`;
export const KnowledgeProductSchema = z.object({ id: z.string(), title: z.string(), onlineStoreUrl: z.string().nullable(), descriptionHtml: z.string(), updatedAt: z.string() });
export type KnowledgeProduct = z.infer<typeof KnowledgeProductSchema>;
export async function readLimited(response: Response, limit = 2_000_000): Promise<string> {
  const reader = response.body?.getReader(); if (!reader) return '';
  const decoder = new TextDecoder(); let size = 0, value = '';
  while (true) { const next = await reader.read(); if (next.done) break; size += next.value.byteLength; if (size > limit) { await reader.cancel(); throw new Error('Fonte troppo grande'); } value += decoder.decode(next.value, { stream: true }); }
  return value + decoder.decode();
}
export async function fetchKnowledgeProducts(config: Config, fetcher: typeof fetch = fetch): Promise<KnowledgeProduct[]> {
  if (!config.SHOPIFY_ADMIN_ACCESS_TOKEN || !config.SHOPIFY_SHOP_DOMAIN) throw new Error('Catalogo informativo non configurato');
  const products: KnowledgeProduct[] = [], seen = new Set<string>(); let after: string | null = null;
  const signal = AbortSignal.timeout(60_000);
  for (let i = 0; i < 100; i++) {
    const response = await fetcher(`https://${config.SHOPIFY_SHOP_DOMAIN}/admin/api/2026-10/graphql.json`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': config.SHOPIFY_ADMIN_ACCESS_TOKEN }, body: JSON.stringify({ query: KNOWLEDGE_PRODUCTS_QUERY, variables: { after } }), signal, redirect: 'manual' });
    if (!response.ok) throw new Error('Catalogo informativo non disponibile');
    const result = z.object({ data: z.object({ products: z.object({ nodes: z.array(KnowledgeProductSchema), pageInfo: z.object({ hasNextPage: z.boolean(), endCursor: z.string().nullable() }) }) }).optional(), errors: z.array(z.unknown()).optional() }).parse(JSON.parse(await readLimited(response)));
    if (result.errors?.length || !result.data) throw new Error('Import informativo incompleto');
    for (const p of result.data.products.nodes) if (p.onlineStoreUrl) { storeUrl(p.onlineStoreUrl); products.push(p); }
    const info = result.data.products.pageInfo; if (!info.hasNextPage) return products;
    if (!info.endCursor || seen.has(info.endCursor)) throw new Error('Paginazione informativa incoerente'); seen.add(info.endCursor); after = info.endCursor;
  }
  throw new Error('Catalogo informativo oltre 5000 prodotti');
}
export function productDocuments(products: readonly KnowledgeProduct[], catalog: CatalogAdapter): KnowledgeDocument[] {
  const result: KnowledgeDocument[] = [], seen = new Set<string>();
  for (const p of products) {
    if (!p.onlineStoreUrl) continue;
    if (seen.has(p.id)) throw new Error('Prodotto informativo duplicato'); seen.add(p.id);
    const url = storeUrl(p.onlineStoreUrl), profiles = catalog.list().filter(profile => profile.productId === p.id);
    const stamp = profiles.length > 0 || /^\s*(?:timbro|timbri|datario|numeratore)\b/i.test(p.title);
    let description = plainText(p.descriptionHtml);
    if (stamp) {
      // Per i timbri le misure della descrizione non sostituiscono i metafield variante.
      description = description.split(/\n{1,}/).filter(part => !/\d[^\n]{0,30}(?:mm|cm)\b/i.test(part)).join('\n\n');
      if (profiles.length) result.push({ id: p.id + ':dimensions', title: p.title.slice(0, 210) + ' · Misure delle varianti', text: profiles.map(profile => `${profile.variantLabel || profile.title}: impronta ${profile.nominalAreaMm.width} × ${profile.nominalAreaMm.height} mm (dati della variante).`).join('\n\n'), url, kind: 'measurement', stamp });
    }
    const complete = description.split(/\n{2,}/).filter(part => part.length <= 1800); let bounded = '';
    for (const part of complete) { if (bounded.length + part.length + 2 > 30_000) break; bounded += (bounded ? '\n\n' : '') + part; }
    result.push({ id: p.id, title: p.title.slice(0, 240), text: bounded || 'Prodotto presente nel catalogo. Per i dettagli consulta la scheda.', url, kind: 'product', stamp });
  }
  return result;
}
export async function fetchKnowledgePage(raw: string, fetcher: typeof fetch = fetch, signal?: AbortSignal): Promise<CachedKnowledgePage> {
  let url = storeUrl(raw);
  for (let redirect = 0; redirect < 4; redirect++) {
    const response = await fetcher(url, { headers: { Accept: 'text/html', 'User-Agent': 'IncisoriaAssistant/1.0 (+https://www.incisoriasacchetti.it/)' }, redirect: 'manual', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(6000)]) : AbortSignal.timeout(6000) });
    if ([301, 302, 303, 307, 308].includes(response.status)) { const next = new URL(response.headers.get('Location') ?? '', url); storeUrl(next.href); url = next.href; continue; }
    if ([404, 410].includes(response.status)) return { checkedAt: new Date().toISOString(), documents: [], missing: true };
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw new Error('Pagina informativa non disponibile: HTTP ' + response.status + ' (' + (response.headers.get('content-type') ?? 'senza Content-Type') + ')');
    return { documents: extractPage(await readLimited(response), storeUrl(raw)), checkedAt: new Date().toISOString() };
  }
  throw new Error('Redirect della fonte incoerente');
}
