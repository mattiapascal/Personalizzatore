import { describe, expect, it, vi } from 'vitest';
import { ArgumentsSchema, proposeOpenAi } from '../server/openai.ts';
import { readConfig } from '../server/config.ts';
import { WorkerMeter, emptyLedger } from '../cloudflare/ledger.ts';
import { AiRequestSchema } from '../src/ai/request.ts';
import type { KnowledgePassage, KnowledgeProvider } from '../server/knowledge/model.ts';
const config = readConfig({ AI_PROVIDER: 'openai', OPENAI_API_KEY: 'TEST-not-a-key', AI_BUDGET_USD: '1', AI_SHARE_CATALOG_CONTEXT: 'true' });
const makeInput = () => AiRequestSchema.parse({ sessionId: crypto.randomUUID(), revision: 0, supportsStoreAnswers: true, message: 'Quali materiali usate per le targhe?', requirements: {}, lastQuestion: null });
const rawArgs = { ...Object.fromEntries(Object.keys(ArgumentsSchema.shape).map(key => [key, key === 'clearFields' ? [] : null])), dialogueAct: 'information', storeQuery: 'targhe materiali plexiglass' };
const source: KnowledgePassage = { id: 'TEST', passageId: 's1', title: 'Targa TEST', text: 'Informazione TEST verificata: materiale di prova.', url: 'https://www.incisoriasacchetti.it/products/prodotto-test', kind: 'product' };
const response = (name: string, args: unknown) => Response.json({ status: 'completed', output: [{ type: 'function_call', name, arguments: JSON.stringify(args) }], usage: { input_tokens: 100, output_tokens: 20 } });
const meterFor = (id: string) => { let ledger = emptyLedger(); return { meter: new WorkerMeter(id, () => ledger, next => { ledger = next; }, 1), read: () => ledger }; };
describe('AI informativa con ricerca tipizzata ed estratti verificati', () => {
  it('interpreta la domanda, recupera le fonti, seleziona ID e contabilizza entrambe le chiamate', async () => {
    const input = makeInput(), { meter, read } = meterFor(input.sessionId);
    const provider: KnowledgeProvider = { search: vi.fn().mockResolvedValue([source]), referenceTitles: () => ['Targa TEST'] };
    const fetcher = vi.fn().mockResolvedValueOnce(response('collect_requirements', rawArgs)).mockResolvedValueOnce(response('select_store_evidence', { status: 'answered', passageIds: ['s1'] }));
    const call = await proposeOpenAi(input, config, meter, fetcher, undefined, undefined, provider);
    expect(call).toMatchObject({ tool: 'answerStoreQuestion', arguments: { blocks: [{ text: source.text, url: source.url }] } });
    expect(provider.search).toHaveBeenCalledWith('targhe materiali plexiglass', input, expect.any(AbortSignal), 'product', false);
    expect(read().requests).toBe(2); expect(read().held).toBe(0);
    expect(JSON.parse(fetcher.mock.calls[1]![1].body).input[0].content).toContain(source.text);
  });
  it('non chiama il secondo modello senza fonti e non inventa una risposta', async () => {
    const input = makeInput(), { meter } = meterFor(input.sessionId);
    const fetcher = vi.fn().mockResolvedValue(response('collect_requirements', rawArgs));
    const call = await proposeOpenAi(input, config, meter, fetcher, undefined, undefined, { search: async () => [] });
    expect(call).toMatchObject({ tool: 'answerStoreQuestion', arguments: { status: 'not_found', blocks: [] } }); expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('privacy prima della ricerca e di entrambe le chiamate', async () => {
    const input = { ...makeInput(), message: 'Quale prodotto per mario@example.test', privacyReviewed: true }, { meter } = meterFor(input.sessionId);
    const fetcher = vi.fn(), search = vi.fn();
    await expect(proposeOpenAi(input, config, meter, fetcher, undefined, undefined, { search })).rejects.toThrow('Protezione dati');
    expect(fetcher).not.toHaveBeenCalled(); expect(search).not.toHaveBeenCalled();
  });
  it('una chat già aperta riceve una risposta compatibile, senza inviare un tool sconosciuto', async () => {
    const input = { ...makeInput(), supportsStoreAnswers: undefined }, { meter } = meterFor(input.sessionId);
    const fetcher = vi.fn().mockResolvedValue(response('collect_requirements', rawArgs)), search = vi.fn();
    const call = await proposeOpenAi(input, config, meter, fetcher, undefined, undefined, { search });
    expect(call).toMatchObject({ tool: 'collectRequirements', dialogueAct: 'help', clarification: expect.stringContaining('ricarica questa pagina') });
    expect(search).not.toHaveBeenCalled(); expect(fetcher).toHaveBeenCalledTimes(1);
  });

});
