import { describe, expect, it, vi } from 'vitest';
import { compileStoreKnowledge } from '../scripts/lib/store-knowledge.ts';
import { plainText, extractPage } from '../server/knowledge/html.ts';
import { fetchKnowledgePage, fetchKnowledgeProducts, productDocuments } from '../server/knowledge/source.ts';
import { passages, storeUrl, type KnowledgePassage } from '../server/knowledge/model.ts';
import { evidenceAnswer } from '../server/knowledge/answer.ts';
import { AiRequestSchema } from '../src/ai/request.ts';
import { executeTool } from '../src/ai/contract.ts';
import { initialInteraction, selectionInteraction } from '../src/selection/interaction.ts';
import { newSession, updateRequirements } from '../src/selection/session.ts';
import { mountFixtureCatalog } from '../src/catalog/adapter.ts';
import { readConfig } from '../server/config.ts';
import { knowledgeProvider } from '../server/knowledge/retrieval.ts';
const url = 'https://www.incisoriasacchetti.it/products/prodotto-test';
const input = () => AiRequestSchema.parse({ sessionId: crypto.randomUUID(), revision: 0, message: 'Informazioni sul prodotto', requirements: {}, lastQuestion: null });
const active = (value: string) => `Guida interna da escludere\n<!-- assistant-knowledge:start -->\n${value}\n<!-- assistant-knowledge:end -->\nEsempio non attivo`;
const source: KnowledgePassage = { passageId: 's1', id: 'TEST', title: 'Prodotto TEST', text: 'Fatto TEST con una condizione precisa.', url, kind: 'product' };
describe('Conoscenze modificabili e confini delle fonti', () => {
  it('compila solo risposte attive e pagine consentite, senza includere la guida', () => {
    const knowledge = compileStoreKnowledge(active('## Fonti del sito\n- https://www.incisoriasacchetti.it/\n## Risposte del negozio\n### Domanda TEST?\nRisposta TEST verificata.'));
    expect(knowledge.documents[0]).toMatchObject({ title: 'Domanda TEST?', text: 'Risposta TEST verificata.', url: null });
    expect(JSON.stringify(knowledge)).not.toContain('Guida interna');
    expect(knowledge.version).not.toBe(compileStoreKnowledge(active('### Domanda TEST?\nRisposta modificata.')).version);
  });
  it('rifiuta delimitatori mancanti e URL esterni/credenziali/parametri', () => {
    expect(() => compileStoreKnowledge('senza marcatori')).toThrow();
    for (const bad of ['https://evil.test/products/test', 'http://www.incisoriasacchetti.it/', 'https://user:password@www.incisoriasacchetti.it/', 'https://www.incisoriasacchetti.it/pages/x?token=segreto', 'https://www.incisoriasacchetti.it/admin', 'https://www.incisoriasacchetti.it:4430/']) expect(() => storeUrl(bad)).toThrow();
  });
  it('legge HTML come testo ed esclude script, menu, footer e markup attivo', () => {
    expect(plainText('<script>segreto()</script><p>TEST &amp; prova<br>seconda riga</p>')).toBe('TEST & prova\nseconda riga');
    const docs = extractPage('<nav>NON_INDICIZZARE</nav><main><h1>Prodotto TEST</h1><details class="cc-accordion-item"><summary>Domanda TEST?</summary><div class="cc-accordion-item__content"><p>Risposta &amp; condizione TEST.</p></div></details></main><footer>NON_INDICIZZARE</footer>', url);
    expect(docs).toHaveLength(1); expect(docs[0]).toMatchObject({ kind: 'faq', text: 'Domanda TEST?\nRisposta & condizione TEST.' });
    expect(JSON.stringify(docs)).not.toContain('NON_INDICIZZARE');
    expect(extractPage('<h1>Pagina di errore senza main</h1>', url)).toEqual([]);
    const footer = extractPage('<main><h1>Negozio TEST</h1></main><div class="shopify-section-group-footer-group"><p>Telefono TEST 555</p></div>', 'https://www.incisoriasacchetti.it/');
    expect(footer.some(d => d.text === 'Telefono TEST 555')).toBe(true);
  });
  it('non segue un redirect dal sito verso un host esterno', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { Location: 'https://evil.test/' } }));
    await expect(fetchKnowledgePage(url, fetcher)).rejects.toThrow('Fonte'); expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('segue solo redirect del negozio e dimentica una fonte rimossa', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(null, { status: 301, headers: { Location: 'https://incisoriasacchetti.it/products/prodotto-test' } })).mockResolvedValueOnce(new Response('', { status: 404 }));
    expect(await fetchKnowledgePage(url, fetcher)).toMatchObject({ documents: [], missing: true });
  });
  it('indicizza solo prodotti pubblicati e fallisce per import parziale', async () => {
    const product = { id: 'TEST-product', title: 'Prodotto TEST', onlineStoreUrl: url, descriptionHtml: '<p>Descrizione TEST</p>', updatedAt: '2026-11-07T00:00:00Z' };
    const config = readConfig({ SHOPIFY_SHOP_DOMAIN: 'zqu2eg-72.myshopify.com', SHOPIFY_ADMIN_ACCESS_TOKEN: 'TEST-not-a-key' });
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ data: { products: { nodes: [product, { ...product, id: 'TEST-draft', onlineStoreUrl: null }], pageInfo: { hasNextPage: false, endCursor: null } } } }));
    expect(await fetchKnowledgeProducts(config, fetcher)).toEqual([product]);
    const partial = vi.fn().mockResolvedValueOnce(Response.json({ data: { products: { nodes: [product], pageInfo: { hasNextPage: true, endCursor: 'TEST-next' } } } })).mockResolvedValueOnce(new Response('', { status: 503 }));
    await expect(fetchKnowledgeProducts(config, partial)).rejects.toThrow();
  });
  it('le misure dei timbri provengono dai profili variante, non dalla descrizione discordante', () => {
    const profile = mountFixtureCatalog.list()[0]!;
    const docs = productDocuments([{ id: profile.productId, title: profile.title, onlineStoreUrl: profile.url, descriptionHtml: '<p>Impronta 999 x 999 mm.</p><p>Uso TEST separato.</p>', updatedAt: '2026-11-07T00:00:00Z' }], mountFixtureCatalog);
    expect(docs.find(d => d.kind === 'measurement')!.text).toContain(`${profile.nominalAreaMm.width} × ${profile.nominalAreaMm.height}`);
    expect(docs.find(d => d.kind === 'product')!.text).not.toContain('999');
  });
});
describe('Risposte ancorate agli estratti', () => {
  it('accetta soltanto ID presenti e conserva esattamente testo e fonte', () => {
    const call = evidenceAnswer({ status: 'answered', passageIds: ['s1'] }, [source], input());
    expect(call).toMatchObject({ tool: 'answerStoreQuestion', arguments: { status: 'answered', blocks: [{ text: source.text, title: source.title, url }] } });
    expect(evidenceAnswer({ status: 'answered', passageIds: ['inventato'] }, [source], input())).toMatchObject({ arguments: { status: 'not_found', blocks: [] } });
    expect(evidenceAnswer({ status: 'not_found', passageIds: ['s1'] }, [source], input())).toMatchObject({ arguments: { blocks: [] } });
  });
  it('non permette al modello di introdurre prosa, HTML, URL o istruzioni arbitrari', () => {
    expect(() => evidenceAnswer({ status: 'answered', passageIds: ['s1'], answer: '<script>male()</script>' }, [source], input())).toThrow();
    expect(passages([source], 'condizione')[0]).toMatchObject({ text: source.text, passageId: 's1' });
  });
  it('la diversità delle fonti evita che molti prodotti nascondano una regola generale', () => {
    const products = Array.from({ length: 30 }, (_, i) => ({ ...source, id: 'TEST-' + i, title: 'Prodotto gratis TEST', url: url + '-' + i }));
    const page = { ...source, id: 'TEST-page', kind: 'page' as const, title: 'Negozio TEST', text: 'Spedizione gratuita TEST con condizioni.' };
    const hits = passages([...products, page], 'gratis spedizione gratuita');
    expect(hits.some(p => p.kind === 'page')).toBe(true); expect(hits.filter(p => p.kind === 'product').length).toBeLessThanOrEqual(3);
  });
  it('la ricerca generale non usa descrizioni di singoli prodotti come condizioni del negozio', async () => {
    const provider = knowledgeProvider(() => [{ ...source, text: 'Prodotto gratis TEST' }], async () => ({ documents: [{ ...source, id: 'TEST-page', kind: 'page', text: 'Spedizione TEST con condizioni del negozio.' }], checkedAt: new Date().toISOString() }));
    const hits = await provider.search('spedizione gratis', input(), undefined, 'store');
    expect(hits.length).toBeGreaterThan(0); expect(hits.some(p => p.kind === 'product')).toBe(false);
  });
  it('non ricava le misure dei timbri da FAQ o descrizioni e non accetta URL privati nel contesto', () => {
    expect(passages([{ ...source, kind: 'faq', stamp: true, text: 'Dimensione 999x999mm dichiarata nella FAQ.' }], 'dimensione')).toEqual([]);
    expect(AiRequestSchema.safeParse({ ...input(), sourceUrls: ['https://evil.test/'] }).success).toBe(false);
  });
  it('le domande di seguito non ereditano caratteristiche di homepage o altri prodotti', async () => {
    const other = { ...source, id: 'TEST-other', url: 'https://www.incisoriasacchetti.it/products/altro-test', text: 'Resistente per esterno TEST.' };
    const page = vi.fn(async (current: string) => ({ checkedAt: new Date().toISOString(), documents: [{ ...source, id: 'FAQ-TEST', url: current, kind: 'faq' as const, text: 'Prodotto TEST per uso interno.' }] }));
    const provider = knowledgeProvider(() => [source, other], page);
    const hits = await provider.search('uso interno esterno', { ...input(), sourceUrls: [url] }, undefined, 'product', true);
    expect(hits.length).toBeGreaterThan(0); expect(hits.every(p => p.url === url)).toBe(true);
    expect(page).toHaveBeenCalledTimes(1); expect(page).toHaveBeenCalledWith(url, undefined);
  });
  it('una risposta informativa non modifica requisiti, prodotto o revisione', () => {
    const session = updateRequirements(newSession(mountFixtureCatalog), { family: 'stamp', mechanism: 'automatic', shape: 'square' }, mountFixtureCatalog);
    const request = { ...input(), sessionId: session.sessionId, revision: session.revision };
    const call = evidenceAnswer({ status: 'answered', passageIds: ['s1'] }, [source], request);
    expect(executeTool(call, session, mountFixtureCatalog).session).toBe(session);
    const next = selectionInteraction(initialInteraction(session), { type: 'tool', call }, mountFixtureCatalog);
    expect(next.session).toBe(session); expect(next.informationAnswer?.blocks[0]?.text).toBe(source.text);
    const refreshed = selectionInteraction(next, { type: 'catalog' }, mountFixtureCatalog);
    expect(refreshed.informationAnswer).toEqual(next.informationAnswer); expect(refreshed.feedbackRevision).toBe(next.feedbackRevision);
  });
});
