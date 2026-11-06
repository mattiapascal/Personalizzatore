import { z } from 'zod';
import type { Config } from './config.ts';
export const CATALOG_QUERY = `query StampCatalog($query: String!, $after: String) {
  products(first: 50, after: $after, query: $query) {
    nodes {
      id title handle status onlineStoreUrl updatedAt tags descriptionHtml vendor
      featuredMedia { preview { image { url altText } } }
      technicalSummary: metafield(namespace: "custom", key: "short_description") { jsonValue }
      variants(first: 50) {
        nodes {
          id title selectedOptions { name value }
          imprintWidth: metafield(namespace: "custom", key: "larghezza") { type jsonValue }
          imprintHeight: metafield(namespace: "custom", key: "altezza") { type jsonValue }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;
const pageInfo = z.object({ hasNextPage: z.boolean(), endCursor: z.string().nullable() });
const dimensionMetafield = z.object({ type: z.string(), jsonValue: z.unknown() }).nullable().optional();
export const RawProductSchema = z.object({
  id: z.string().regex(/^gid:\/\/shopify\/Product\/\d+$/), title: z.string(), handle: z.string(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'DRAFT', 'UNLISTED']), onlineStoreUrl: z.url().nullable(), updatedAt: z.iso.datetime(), tags: z.array(z.string()),
  descriptionHtml: z.string().default(''), vendor: z.string().default(''), technicalSummary: z.object({ jsonValue: z.unknown() }).nullable().optional(),
  featuredMedia: z.object({ preview: z.object({ image: z.object({ url: z.string(), altText: z.string().nullable() }).nullable() }).nullable() }).nullable().optional(),
  variants: z.object({ nodes: z.array(z.object({ id: z.string().regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/), title: z.string().default(''), selectedOptions: z.array(z.object({ name: z.string(), value: z.string() })).default([]), imprintWidth: dimensionMetafield, imprintHeight: dimensionMetafield })), pageInfo }),
});
export type RawProduct = z.infer<typeof RawProductSchema>;

export async function fetchCatalog(config: Config, fetcher: typeof fetch = fetch): Promise<RawProduct[]> {
  if (!config.SHOPIFY_SHOP_DOMAIN || !config.SHOPIFY_ADMIN_ACCESS_TOKEN) throw new Error('Credenziali Shopify in sola lettura non configurate');
  const products: RawProduct[] = [];
  let after: string | null = null;
  const cursors = new Set<string>();
  const signal = AbortSignal.timeout(30_000);
  for (let page = 0; page < 100; page++) {
    const response = await fetcher(`https://${config.SHOPIFY_SHOP_DOMAIN}/admin/api/2026-10/graphql.json`, {
      method: 'POST', headers: { 'X-Shopify-Access-Token': config.SHOPIFY_ADMIN_ACCESS_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: CATALOG_QUERY, variables: { query: config.SHOPIFY_CATALOG_QUERY, after } }), signal, redirect: 'manual',
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

