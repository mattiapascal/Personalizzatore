import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { readJson, writeJson } from '../files.ts';
import type { Config } from '../config.ts';
import type { CatalogAdapter } from '../../src/catalog/adapter.ts';
import { fetchKnowledgeProducts, productDocuments, fetchKnowledgePage } from './source.ts';
import { knowledgeProvider } from './retrieval.ts';
import { KNOWLEDGE_TTL_MS, KNOWLEDGE_STALE_MS, type KnowledgeIndex, type CachedKnowledgePage } from './model.ts';
import { storeKnowledge } from '../store-knowledge.generated.ts';
export class LocalKnowledge {
  private index: KnowledgeIndex | null = null;
  private pages: Record<string, CachedKnowledgePage> = {};
  private running: Promise<void> | null = null;
  constructor(private config: Config, private root: string, private catalog: () => CatalogAdapter, private fetcher: typeof fetch = fetch) {}
  get enabled() { return this.config.AI_SHARE_CATALOG_CONTEXT; }
  async load() {
    try { this.index = await readJson(resolve(this.root, '.local/store-knowledge-index.json')) as KnowledgeIndex; } catch { this.index = null; }
    try { this.pages = await readJson(resolve(this.root, '.local/store-knowledge-pages.json')) as Record<string, CachedKnowledgePage>; } catch { this.pages = {}; }
  }
  private async page(url: string, signal?: AbortSignal) {
    const cached = this.pages[url]; if (cached && Date.now() - Date.parse(cached.checkedAt) < KNOWLEDGE_TTL_MS) return cached;
    try { const next = await fetchKnowledgePage(url, this.fetcher, signal); this.pages[url] = next; await writeJson(resolve(this.root, '.local/store-knowledge-pages.json'), this.pages); return next; }
    catch (error) { if (cached && Date.now() - Date.parse(cached.checkedAt) < KNOWLEDGE_STALE_MS) return cached; throw error; }
  }
  get provider() { return this.enabled ? knowledgeProvider(() => this.index && Date.now() - Date.parse(this.index.checkedAt) < KNOWLEDGE_STALE_MS ? this.index.documents : [], (url, signal) => this.page(url, signal)) : undefined; }
  refresh(): Promise<void> {
    if (!this.enabled || !this.config.SHOPIFY_ADMIN_ACCESS_TOKEN) return Promise.resolve();
    if (this.running) return this.running;
    this.running = (async () => {
      const documents = productDocuments(await fetchKnowledgeProducts(this.config, this.fetcher), this.catalog());
      const next = { documents, checkedAt: new Date().toISOString(), version: createHash('sha256').update(JSON.stringify(documents)).digest('hex') };
      await writeJson(resolve(this.root, '.local/store-knowledge-index.json'), next); this.index = next;
      await Promise.allSettled(storeKnowledge.urls.map(url => this.page(url)));
    })().finally(() => { this.running = null; });
    return this.running;
  }
}
