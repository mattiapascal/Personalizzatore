import { storeKnowledge } from '../store-knowledge.generated.ts';
import { passages, rankDocuments, KNOWLEDGE_STALE_MS, type CachedKnowledgePage, type KnowledgeDocument, type KnowledgeProvider } from './model.ts';
export function knowledgeProvider(documents: () => KnowledgeDocument[], page: (url: string, signal?: AbortSignal) => Promise<CachedKnowledgePage>): KnowledgeProvider {
  return { referenceTitles: urls => urls.length ? documents().filter(d => d.url && urls.includes(d.url) && d.kind === 'product').map(d => d.title) : [], async search(query, input, signal, scope = 'product', referencedOnly = false) {
    const manual: KnowledgeDocument[] = storeKnowledge.documents.map(d => ({ ...d }));
    const products = scope === 'store' ? [] : documents().filter(d => !referencedOnly || d.url && input.sourceUrls?.includes(d.url));
    const context = products.filter(d => d.url && input.sourceUrls?.includes(d.url));
    const relevant = referencedOnly ? context.filter(d => d.kind === 'product').slice(0, 3) : rankDocuments(products, query).filter(d => d.kind === 'product').slice(0, 2);
    const urls = [...new Set([...(referencedOnly ? [] : storeKnowledge.urls), ...relevant.flatMap(d => d.url ? [d.url] : [])])];
    const pages = await Promise.all(urls.map(async url => { try { return { url, cached: await page(url, signal) }; } catch { return null; } }));
    const missing = new Set(pages.filter(p => p?.cached.missing).map(p => p!.url));
    const fetched = pages.flatMap(p => p && !p.cached.missing && Date.now() - Date.parse(p.cached.checkedAt) <= KNOWLEDGE_STALE_MS && (!referencedOnly || input.sourceUrls?.includes(p.url)) ? p.cached.documents.filter(d => scope === 'store' || d.kind === 'faq') : []);
    return passages([...manual.filter(d => !referencedOnly || d.url && input.sourceUrls?.includes(d.url)), ...products.filter(p => !p.url || !missing.has(p.url)), ...fetched], query);
  } };
}
