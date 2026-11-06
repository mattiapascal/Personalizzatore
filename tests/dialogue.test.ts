import { describe, expect, it } from 'vitest';
import { fixtureCatalog } from '../src/catalog/adapter';
import { chooseProduct, newSession, updateRequirements } from '../src/selection/session';
import { initialInteraction, selectionInteraction } from '../src/selection/interaction';
import { executeTool } from '../src/ai/contract';
import { estimateTextArea } from '../src/selection/content';
import { nextSelectionQuestion } from '../src/selection/SelectionChat';
import { proposalFromArguments } from '../server/openai';
import { deriveMountProfiles } from '../server/mount-profiles';
import { RawProductSchema } from '../server/catalog';
import sourceData from '../fixtures/products/mount-sources.TEST.json';

const args = (patch: Record<string, unknown>) => ({ helpTopic: null, changeIntent: 'update', clearEvidence: null, dialogueAct: null, contentText: null, contentKind: null, purpose: null, graphicSubject: null, family: null, mechanism: null, material: null, diameterMm: null, shape: null, lines: null, hasLogo: null, widthMm: null, heightMm: null, targetWidthMm: null, targetHeightMm: null, sizeUnknown: null, clearFields: [], clarification: null, ...patch });
describe('Dialogo: recupero della conversazione e contenuti', () => {
  it.each(['off_topic', 'help', 'unclear'] as const)('%s preserva anche selezione, candidati e revisione', dialogueAct => {
    let session = updateRequirements(newSession(fixtureCatalog), { family: 'stamp', mechanism: 'automatic', shape: 'rectangle', sizeUnknown: true }, fixtureCatalog);
    session = chooseProduct(session, session.candidates[0]!.productId, fixtureCatalog);
    const call = proposalFromArguments(args({ dialogueAct, family: 'other', clearFields: ['mechanism'], clarification: 'Restiamo sul tuo timbro: quale forma preferisci?' }), session.revision);
    const next = selectionInteraction(initialInteraction(session), { type: 'tool', call }, fixtureCatalog);
    expect(next.session).toEqual(session);
    expect(next.clarification).not.toBe('Restiamo sul tuo timbro: quale forma preferisci?');
    if (dialogueAct === 'help') expect(next.clarification).toContain('catalogo');
    else expect(next.clarification).toBeNull();
    expect(next.clarificationBlocksSelection).toBe(false);
    expect(() => executeTool({ ...call, expectedRevision: session.revision - 1 }, session, fixtureCatalog)).toThrow('obsoleta');
  });
  it('non mostra risposte libere fuori contesto nemmeno se il modello le inserisce in un aiuto', () => {
    for (const dialogueAct of ['help', 'off_topic', 'unclear']) {
      const call = proposalFromArguments(args({ dialogueAct, helpTopic: dialogueAct === 'help' ? 'mechanism' : null, clarification: 'RISPOSTA_GENERALE_NON_PERTINENTE', contentText: 'DATI_ESTRANEI', shape: 'round' }), 0);
      expect(JSON.stringify(call)).not.toContain('RISPOSTA_GENERALE_NON_PERTINENTE');
      expect(JSON.stringify(call)).not.toContain('DATI_ESTRANEI');
      expect(call).toMatchObject({ arguments: {} });
      if (dialogueAct === 'help') expect(call).toMatchObject({ clarification: expect.stringContaining('tampone') });
    }
  });
  it('anche un turno classificato come risposta non può mostrare testo libero del modello', () => {
    const call = proposalFromArguments(args({ dialogueAct: 'answer', family: 'stamp', clarification: 'RISPOSTA_GENERALE_NON_PERTINENTE' }), 0);
    expect(call).toMatchObject({ arguments: { family: 'stamp' }, clarification: null });
    expect(JSON.stringify(call)).not.toContain('RISPOSTA_GENERALE_NON_PERTINENTE');
  });
  it('testo ed ex-libris hanno un brief distinto dai requisiti persistenti', () => {
    const state = initialInteraction(newSession(fixtureCatalog));
    const call = proposalFromArguments(args({ dialogueAct: 'answer', family: 'stamp', contentKind: 'mixed', purpose: 'exlibris', contentText: 'EX LIBRIS\nNome TEST', graphicSubject: 'Gufo con libri' }), 0);
    const next = selectionInteraction(state, { type: 'tool', call }, fixtureCatalog);
    expect(next.contentBrief).toEqual({ text: 'EX LIBRIS\nNome TEST', kind: 'mixed', purpose: 'exlibris', graphicSubject: 'Gufo con libri' });
    expect(JSON.stringify(next.session)).not.toContain('Nome TEST'); expect(JSON.stringify(next.session)).not.toContain('Gufo');
    expect(nextSelectionQuestion(next.session, next.contentBrief)).toContain('autoinchiostrante');
    const reset = selectionInteraction(next, { type: 'reset' }, fixtureCatalog); expect(reset.contentBrief).toBeUndefined();
  });
  it('chiede il contenuto prima della montatura quando manca; ex-libris chiede il soggetto', () => {
    const session = updateRequirements(newSession(fixtureCatalog), { family: 'stamp' }, fixtureCatalog);
    expect(nextSelectionQuestion(session)).toContain('Che cosa vuoi imprimere');
    expect(nextSelectionQuestion(session, { kind: 'graphic', purpose: 'exlibris' })).toContain('quale soggetto');
    expect(nextSelectionQuestion(session, { kind: 'text' })).toContain('Scrivimi il testo');
  });
  it('stima da lunghezza effettiva e righe, senza trasformare il solo conteggio in una larghezza', () => {
    const measure = (line: string, pt: number) => line.length * pt / 10;
    const short = estimateTextArea('TEST\nNome', measure)!, long = estimateTextArea('Testo molto più lungo\nNome', measure)!;
    expect(short.lines).toBe(2); expect(long.lines).toBe(2); expect(long.large.width).toBeGreaterThan(short.large.width);
    expect(short.large.height).toBeGreaterThan(short.small.height);
    expect(estimateTextArea('', measure)).toBeNull(); expect(estimateTextArea('TEST', () => NaN)).toBeNull();
  });
  it('una correzione del testo invalida la vecchia stima e conserva gli altri criteri', () => {
    const session = updateRequirements(newSession(fixtureCatalog), { family: 'stamp', mechanism: 'automatic', shape: 'rectangle', minimumAreaMm: { width: 40, height: 15 }, sizeIsEstimate: true }, fixtureCatalog);
    const call = proposalFromArguments(args({ contentText: 'TEST corretto', contentKind: 'text' }), session.revision);
    const next = executeTool(call, session, fixtureCatalog).session;
    expect(next.requirements).toMatchObject({ mechanism: 'automatic', shape: 'rectangle', minimumAreaMm: null, sizeIsEstimate: false });
  });
  it('immagine commerciale verificata o assenza esplicita, senza URL arbitrari', () => {
    const p = RawProductSchema.parse(sourceData.products.find(p => p.id.endsWith('/15104975208828')));
    p.featuredMedia = { preview: { image: { url: 'https://evil.example/tracker.png', altText: 'TEST' } } };
    expect(deriveMountProfiles(p).profiles[0]!.image).toBeNull();
    p.featuredMedia.preview!.image!.url = 'https://cdn.shopify.com/s/files/1/test/photo.jpg';
    expect(deriveMountProfiles(p).profiles[0]!.image?.url).toContain('cdn.shopify.com');
  });
});
