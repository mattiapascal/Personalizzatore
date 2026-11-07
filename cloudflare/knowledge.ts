import type { Config } from '../server/config.ts';
import type { CatalogAdapter } from '../src/catalog/adapter.ts';
import { fetchKnowledgeProducts, productDocuments, fetchKnowledgePage } from '../server/knowledge/source.ts';
import { knowledgeProvider } from '../server/knowledge/retrieval.ts';
import { KNOWLEDGE_TTL_MS, KNOWLEDGE_STALE_MS, type KnowledgeDocument, type CachedKnowledgePage } from '../server/knowledge/model.ts';
import { storeKnowledge } from '../server/store-knowledge.generated.ts';
import { sha256 } from './security.ts';
export class WorkerKnowledge {
  constructor(private sql: SqlStorage) {
    sql.exec('CREATE TABLE IF NOT EXISTS knowledge (id TEXT PRIMARY KEY, value TEXT NOT NULL)');
    sql.exec('CREATE TABLE IF NOT EXISTS knowledge_pages (url TEXT PRIMARY KEY, value TEXT NOT NULL)');
  }
  private pageRead(url: string): CachedKnowledgePage | undefined { const row = this.sql.exec<{ value: string }>('SELECT value FROM knowledge_pages WHERE url = ?', url).toArray()[0]; return row ? JSON.parse(row.value) as CachedKnowledgePage : undefined; }
  async page(url: string, signal?: AbortSignal): Promise<CachedKnowledgePage> {
    const old = this.pageRead(url); if (old && Date.now() - Date.parse(old.checkedAt) < KNOWLEDGE_TTL_MS) return old;
    try { const next = await fetchKnowledgePage(url, fetch, signal); this.sql.exec('INSERT INTO knowledge_pages (url,value) VALUES (?,?) ON CONFLICT(url) DO UPDATE SET value=excluded.value', url, JSON.stringify(next)); return next; }
    catch (error) { if (old && Date.now() - Date.parse(old.checkedAt) < KNOWLEDGE_STALE_MS) return old; throw error; }
  }
  documents(): KnowledgeDocument[] { return this.sql.exec<{ value: string }>('SELECT value FROM knowledge').toArray().map(row => JSON.parse(row.value) as KnowledgeDocument); }
  provider(checkedAt: string | null) { let snapshot: KnowledgeDocument[] | null = null; return knowledgeProvider(() => checkedAt && Date.now() - Date.parse(checkedAt) < KNOWLEDGE_STALE_MS ? snapshot ??= this.documents() : [], (url, signal) => this.page(url, signal)); }
  async prepare(config: Config, catalog: CatalogAdapter) {
    const documents = productDocuments(await fetchKnowledgeProducts(config), catalog);
    return { documents, checkedAt: new Date().toISOString(), version: await sha256(JSON.stringify(documents)), products: documents.filter(d => d.kind === 'product').length };
  }
  commit(documents: KnowledgeDocument[]) {
    const previous = new Map(this.sql.exec<{ id: string; value: string }>('SELECT id,value FROM knowledge').toArray().map(row => [row.id, row.value]));
    let changed = 0;
    for (const doc of documents) { const value = JSON.stringify(doc); if (previous.get(doc.id) !== value) { this.sql.exec('INSERT INTO knowledge(id,value) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value', doc.id, value); changed++; } previous.delete(doc.id); }
    for (const id of previous.keys()) this.sql.exec('DELETE FROM knowledge WHERE id=?', id);
    return changed + previous.size;
  }
  health() { const pages = this.sql.exec<{ value: string }>('SELECT value FROM knowledge_pages').toArray().map(row => JSON.parse(row.value) as CachedKnowledgePage); return { configuredVersion: storeKnowledge.version, manualEntries: storeKnowledge.documents.length, pagesCached: pages.length, faqEntries: pages.filter(p => !p.missing && Date.now() - Date.parse(p.checkedAt) < KNOWLEDGE_STALE_MS).reduce((sum, page) => sum + page.documents.filter(d => d.kind === 'faq').length, 0) }; }
  async refreshPages() {
    this.sql.exec('DELETE FROM knowledge_pages WHERE json_extract(value,\'$.checkedAt\') < ?', new Date(Date.now() - 86_400_000).toISOString());
    await Promise.allSettled(storeKnowledge.urls.map(url => this.page(url)));
  }
}
