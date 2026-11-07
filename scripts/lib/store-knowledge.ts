import { createHash } from 'node:crypto';
import { storeUrl, type KnowledgeDocument } from '../../server/knowledge/model.ts';
export function compileStoreKnowledge(document: string) {
  const start = '<!-- assistant-knowledge:start -->', end = '<!-- assistant-knowledge:end -->';
  if (document.split(start).length !== 2 || document.split(end).length !== 2 || document.indexOf(end) < document.indexOf(start)) throw new Error('Delimitatori CONOSCENZE_ASSISTENTE.md non validi');
  const active = document.slice(document.indexOf(start) + start.length, document.indexOf(end)).trim();
  if (!active || active.length > 50_000) throw new Error('Conoscenze vuote o oltre 50000 caratteri');
  if (/\b(?:sk-[A-Za-z0-9_-]{12,}|shpat_[A-Za-z0-9_-]{12,}|OPENAI_API_KEY\s*=|SHOPIFY_ADMIN_ACCESS_TOKEN\s*=)/.test(active)) throw new Error('Non inserire credenziali nelle conoscenze');
  const sourcePart = active.split('## Risposte del negozio')[0]!;
  const urls = [...sourcePart.matchAll(/^- (https:\/\/\S+)\s*$/gm)].map(match => storeUrl(match[1]!));
  if (urls.length > 12 || new Set(urls).size !== urls.length) throw new Error('Massimo dodici pagine distinte nelle conoscenze');
  const documents: KnowledgeDocument[] = active.split(/^### /m).slice(1).map((section, i) => {
    const [title, ...lines] = section.trim().split('\n');
    const body = lines.join('\n').trim(), source = /^Fonte:\s*(\S+)\s*$/m.exec(body);
    const text = body.replace(/^Fonte:.*$/gm, '').trim();
    if (!title || title.length > 200 || !text || text.length > 6000 || /\[Inserire|\[caso del negozio\]/.test(text)) throw new Error('Voce conoscenze incompleta o troppo grande');
    if (text.split(/\n{2,}/).some(part => part.length > 1800)) throw new Error('Dividere le risposte lunghe in paragrafi di massimo 1800 caratteri');
    return { id: 'manual:' + i, title, text, url: source ? storeUrl(source[1]!) : null, kind: 'manual' };
  });
  return { urls, documents, version: createHash('sha256').update(active).digest('hex') };
}
export function renderStoreKnowledge(document: string) { return '// Generato da CONOSCENZE_ASSISTENTE.md.\nexport const storeKnowledge = ' + JSON.stringify(compileStoreKnowledge(document), null, 2) + ' as const;\n'; }
