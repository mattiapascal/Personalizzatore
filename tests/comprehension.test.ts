import { describe, expect, it } from 'vitest';
import { proposalFromArguments, makeOpenAiBody, AiRequestSchema } from '../server/openai';
import { readConfig } from '../server/config';
import { executeTool } from '../src/ai/contract';
import { fixtureCatalog, mountFixtureCatalog } from '../src/catalog/adapter';
import { newSession, updateRequirements } from '../src/selection/session';
import { nextSelectionPrompt } from '../src/selection/dialogue';
import { adviseProducts, advisoryFacts } from '../src/selection/advisor';
import { initialInteraction, selectionInteraction } from '../src/selection/interaction';
import { recommendProducts } from '../src/selection/rules';

const args = (patch: Record<string, unknown>) => ({ helpTopic: null, changeIntent: 'update', clearEvidence: null, dialogueAct: 'answer', contentText: null, contentKind: null, purpose: null, graphicSubject: null, family: null, mechanism: null, material: null, diameterMm: null, shape: null, lines: null, hasLogo: null, widthMm: null, heightMm: null, targetWidthMm: null, targetHeightMm: null, sizeUnknown: null, clearFields: [], clarification: null, ...patch });
const session = () => updateRequirements(newSession(fixtureCatalog), { family: 'stamp', mechanism: 'automatic', shape: 'square', hasLogo: true }, fixtureCatalog);
const context = (message = '10 mm') => AiRequestSchema.parse({ sessionId: crypto.randomUUID(), revision: 1, message, requirements: session().requirements, lastQuestion: 'Quanto deve misurare il lato del quadrato, in mm?', lastQuestionField: 'dimensions', contentBrief: { kind: 'graphic', purpose: 'loyalty', graphicSubject: 'piccolo logo' } });

describe('Regressione tessere abbonamento: memoria, delta e misure contestuali', () => {
  it.each([{ widthMm: 10 }, { heightMm: 10 }, { widthMm: 10, sizeUnknown: false }])('quadrato: una misura scalare completa entrambi i lati senza errore (%j)', patch => {
    const call = proposalFromArguments(args(patch), 1, context());
    expect(call).toMatchObject({ arguments: { minimumAreaMm: { width: 10, height: 10 }, sizeUnknown: false, sizeIsEstimate: false } });
    expect('clarification' in call && call.clarification).toBeNull();
  });
  it('rettangolo: una sola misura chiede il secondo lato e conserva montatura/logo', () => {
    const input = context(); input.requirements.shape = 'rectangle';
    const call = proposalFromArguments(args({ widthMm: 10 }), 1, input);
    expect(call).toMatchObject({ arguments: {}, clarification: expect.stringContaining('Quale altezza') });
  });
  it('tondo: il diametro è distinto da un ingombro parziale', () => {
    const input = context(); input.requirements.shape = 'round';
    expect(proposalFromArguments(args({ diameterMm: 10 }), 1, input)).toMatchObject({ arguments: { diameterMm: 10, shape: 'round', sizeUnknown: false } });
    expect(proposalFromArguments(args({ widthMm: 10 }), 1, input)).toMatchObject({ arguments: {}, clarification: 'Intendi un diametro di 10 mm?' });
  });
  it('quadrata non può cancellare la montatura attraverso clearFields di un normale aggiornamento', () => {
    const current = session(), input = context('quadrata'); input.requirements = current.requirements;
    const call = proposalFromArguments(args({ shape: 'square', clearFields: ['mechanism', 'hasLogo'], clearEvidence: 'quadrata' }), current.revision, input);
    expect(call).toMatchObject({ clearFields: [] });
    expect(executeTool(call, current, fixtureCatalog).session.requirements).toMatchObject({ mechanism: 'automatic', shape: 'square', hasLogo: true });
  });
  it('ritiro esplicito richiede evidenza nel messaggio corrente, non solo nello storico', () => {
    const current = session();
    const input = context('togli la scelta sulla montatura'); input.requirements = current.requirements;
    const raw = args({ changeIntent: 'withdraw', clearEvidence: 'togli la scelta sulla montatura', clearFields: ['mechanism'] });
    const call = proposalFromArguments(raw, current.revision, input);
    expect(call).toMatchObject({ clearFields: ['mechanism'] });
    expect(executeTool(call, current, fixtureCatalog).session.requirements.mechanism).toBeUndefined();
    expect(proposalFromArguments(raw, current.revision, { ...input, message: 'quadrata' })).toMatchObject({ clearFields: [] });
  });
  it('il provider riceve brief e campo della domanda insieme ai requisiti, senza ID di sessione/catalogo', () => {
    const input = context();
    const payload = makeOpenAiBody(input, readConfig({})).input[0]!.content;
    expect(JSON.parse(payload)).toMatchObject({ contentBrief: { purpose: 'loyalty', kind: 'graphic' }, lastQuestionField: 'dimensions', requirements: { mechanism: 'automatic', shape: 'square' } });
    expect(payload).not.toContain(input.sessionId); expect(payload).not.toContain('gid://shopify');
  });
  it('domande guidate dalla forma e dallo scopo, senza chiedere nuovamente dati già presenti', () => {
    const current = session();
    expect(nextSelectionPrompt(current, { kind: 'graphic', purpose: 'loyalty' })).toEqual({ field: 'dimensions', text: expect.stringContaining('lato del quadrato') });
    current.requirements.shape = 'round'; expect(nextSelectionPrompt(current).text).toContain('diametro');
    current.requirements.shape = 'rectangle'; expect(nextSelectionPrompt(current).text).toContain('larghezza × altezza');
    const initial = updateRequirements(newSession(fixtureCatalog), { family: 'stamp' }, fixtureCatalog);
    expect(nextSelectionPrompt(initial, { purpose: 'loyalty' }).text).toContain('tessere del tuo bar');
  });
  it('tessere bar: propone il Q12 reale prima del questionario senza confermare preferenze', () => {
    const current = updateRequirements(newSession(mountFixtureCatalog), { family: 'stamp' }, mountFixtureCatalog);
    const brief = { purpose: 'loyalty' as const };
    const before = structuredClone(current);
    const advice = adviseProducts(mountFixtureCatalog, current.requirements, brief);
    expect(advice[0]!.productId).toBe('gid://shopify/Product/15106215805308');
    expect(advice[0]!.reasons[0]!.explanation).toMatch(/tessere|abbonamenti/i);
    expect(advice[0]!.reasons[0]!.explanation).toMatch(/^La scheda prodotto indica:/);
    expect(advice[0]!.reasons.map(r => r.explanation).join(' ')).not.toMatch(/Shopify|assegnata al cliente|nessuna preferenza/i);
    const prompt = nextSelectionPrompt(current, brief, mountFixtureCatalog);
    expect(prompt.text).toContain('Colop Printer Q12'); expect(prompt.field).toBe('targetArea'); expect(prompt.question).toContain('caselline');
    expect(current).toEqual(before); expect(current.requirements.mechanism).toBeUndefined();
  });
  it('la scelta esplicita della proposta adotta il modello e apre una selezione valida', () => {
    const current = updateRequirements(newSession(mountFixtureCatalog), { family: 'stamp', hasLogo: true, maximumAreaMm: { width: 15, height: 15 } }, mountFixtureCatalog);
    const state = { ...initialInteraction(current), contentBrief: { purpose: 'loyalty' as const, kind: 'graphic' as const } };
    const id = adviseProducts(mountFixtureCatalog, current.requirements, state.contentBrief)[0]!.profileId!;
    const next = selectionInteraction(state, { type: 'acceptAdvice', productId: id }, mountFixtureCatalog);
    expect(next.session.selectedProfileId).toBe(id); expect(next.session.requirements.shape).toBe('square');
    expect(next.session.requirements.maximumAreaMm).toEqual({ width: 15, height: 15 });
  });
  it('casella 10×10 è un massimo: non conferma l’intera impronta nominale 12×12 come compatibile', () => {
    const input = context(); input.lastQuestionField = 'targetArea';
    const call = proposalFromArguments(args({ targetWidthMm: 10 }), 1, input);
    expect(call).toMatchObject({ arguments: { maximumAreaMm: { width: 10, height: 10 } } });
    if (call.tool !== 'collectRequirements') throw new Error('Tool errato');
    expect(call.arguments.minimumAreaMm).toBeUndefined();
    const r = { ...input.requirements, ...call.arguments };
    expect(adviseProducts(mountFixtureCatalog, r, { purpose: 'loyalty' })).toHaveLength(0);
    expect(recommendProducts(mountFixtureCatalog, r).some(c => c.productId.endsWith('/15106215805308'))).toBe(false);
  });
  it('stesso valore 15 può indicare lato minimo oppure spazio massimo secondo la domanda', () => {
    const input = context('15 mm');
    expect(proposalFromArguments(args({ widthMm: 15 }), 1, input)).toMatchObject({ arguments: { minimumAreaMm: { width: 15, height: 15 } } });
    input.lastQuestionField = 'targetArea';
    expect(proposalFromArguments(args({ widthMm: 15 }), 1, input)).toMatchObject({ arguments: { maximumAreaMm: { width: 15, height: 15 } } });
  });
  it('misure ritirate come non note eliminano anche lo spazio massimo precedente', () => {
    const input = context('non so le misure'); input.requirements.maximumAreaMm = { width: 15, height: 15 };
    expect(proposalFromArguments(args({ sizeUnknown: true }), 1, input)).toMatchObject({ arguments: { sizeUnknown: true, maximumAreaMm: null } });
  });
  it('i fatti commerciali sono limitati a prodotti reali, senza prezzi, immagini o URL emessi dal modello', () => {
    const facts = advisoryFacts(mountFixtureCatalog, { family: 'stamp' }, { purpose: 'loyalty' });
    expect(facts.length).toBeGreaterThan(0); expect(facts.length).toBeLessThanOrEqual(6);
    for (const fact of facts) expect(mountFixtureCatalog.get(fact.profileId).title).toBe(fact.title);
    const body = makeOpenAiBody(context(), readConfig({ AI_SHARE_CATALOG_CONTEXT: 'true' }), mountFixtureCatalog).input[0]!.content;
    expect(JSON.parse(body).catalogFacts).toBeDefined(); expect(body).not.toContain('"price"'); expect(body).not.toContain('cdn.shopify.com'); expect(body).not.toContain('gid://shopify');
    const privateBody = makeOpenAiBody(context(), readConfig({}), mountFixtureCatalog).input[0]!.content;
    expect(JSON.parse(privateBody).catalogFacts).toBeUndefined(); expect(privateBody).not.toContain('Colop Printer'); expect(privateBody).not.toContain('gid://shopify');
  });
});
