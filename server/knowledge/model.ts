import { z } from 'zod';
import type { AiRequest } from '../../src/ai/request.ts';
export function storeUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !['www.incisoriasacchetti.it', 'incisoriasacchetti.it'].includes(url.hostname) || url.username || url.password || url.port || url.search || url.hash || !/^\/(?:$|(?:products|collections|pages)\/[a-z0-9-]+\/?$)/.test(url.pathname)) throw new Error('Fonte non consentita');
  url.hostname = 'www.incisoriasacchetti.it'; url.pathname = url.pathname.replace(/\/$/, '') || '/'; return url.href;
}
export const KnowledgeDocumentSchema = z.object({ id: z.string(), title: z.string().min(1).max(240), text: z.string().max(30_000), url: z.string().nullable(), kind: z.enum(['product', 'faq', 'page', 'manual', 'measurement']), stamp: z.boolean().optional() });
export type KnowledgeDocument = z.infer<typeof KnowledgeDocumentSchema>;
export type KnowledgePassage = KnowledgeDocument & { passageId: string };
export type CachedKnowledgePage = { documents: KnowledgeDocument[]; checkedAt: string; missing?: boolean };
export type KnowledgeIndex = { documents: KnowledgeDocument[]; checkedAt: string; version: string };
export interface KnowledgeProvider { referenceTitles?(urls: readonly string[]): string[]; search(query: string, input: AiRequest, signal?: AbortSignal, scope?: 'store' | 'product', referencedOnly?: boolean): Promise<KnowledgePassage[]> }
export const KNOWLEDGE_TTL_MS = 300_000, KNOWLEDGE_STALE_MS = 600_000;
const stop = new Set('a ad al alla alle ai anche che chi ci con come cosa da dal dei del della delle di e è gli ha ho i il in la le lo ma mi nel nella non o per posso quanto quale quali quando qui se si sono su sul un una uno vorrei voglio sapere informazioni prodotti prodotto sito negozio'.split(' '));
export function words(value: string): string[] { return [...new Set(value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().match(/[a-z0-9]+/g) ?? [])].filter(w => w.length > 1 && !stop.has(w)); }
export function rankDocuments(documents: readonly KnowledgeDocument[], query: string): KnowledgeDocument[] {
  const terms = words(query);
  return documents.map(d => {
    const title = words(d.title), body = words(d.text);
    const score = terms.reduce((sum, q) => sum + (title.some(w => w === q || q.length > 3 && w.startsWith(q.slice(0, -1))) ? 5 : body.some(w => w === q || q.length > 3 && w.startsWith(q.slice(0, -1))) ? 1 : 0), 0);
    return { d, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score || a.d.id.localeCompare(b.d.id)).map(x => x.d);
}
export function passages(documents: readonly KnowledgeDocument[], query: string): KnowledgePassage[] {
  const parts = documents.flatMap(d => d.text.split(/\n{2,}/).filter(p => p.trim() && p.length <= 1800 && !(d.stamp && d.kind !== 'measurement' && /\d[^\n]{0,30}(?:mm|cm)\b/i.test(p))).map((text, i) => ({ ...d, text, id: d.id + ':' + i })));
  const ranked = rankDocuments(parts, query), selected: KnowledgeDocument[] = [];
  for (const [kind, quota] of [['manual', 2], ['faq', 4], ['page', 3], ['measurement', 2], ['product', 3]] as const) {
    const perUrl = new Map<string, number>();
    for (const d of ranked.filter(d => d.kind === kind)) { const key = d.url ?? d.id; if ((perUrl.get(key) ?? 0) >= 2) continue; selected.push(d); perUrl.set(key, (perUrl.get(key) ?? 0) + 1); if (selected.filter(s => s.kind === kind).length >= quota) break; }
  }
  return selected.slice(0, 14).map((d, i) => ({ ...d, passageId: 's' + (i + 1) }));
}
