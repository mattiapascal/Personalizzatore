import { describe, expect, it } from 'vitest';
import { PrivacyVault, assertProtectedRequest } from '../src/privacy/redaction';
import { AiRequestSchema } from '../src/ai/request';
import { makeOpenAiBody } from '../server/openai';
import { readConfig } from '../server/config';

const input = (message: string) => AiRequestSchema.parse({ message, sessionId: crypto.randomUUID(), revision: 0, requirements: {}, lastQuestion: null });
const config = readConfig({});

describe('Il cliente classifica; l’app instrada senza cambiare gli originali', () => {
  it('un nome composto si classifica una sola volta, senza spezzarlo in singole parole', () => {
    const prepared = new PrivacyVault().prepare(input('un timbro per Mario Rossi'));
    expect(prepared.parts).toHaveLength(1); expect(prepared.parts[0]!.original).toBe('Mario Rossi');
  });
  it('classificazioni miste: generico in chiaro e privato opaco, senza mappa privata al server/provider', () => {
    const vault = new PrivacyVault(), prepared = vault.prepare(input('un logo di Rosa per Mario'));
    const choices = Object.fromEntries(prepared.parts.map(part => [part.token, part.original === 'Rosa' ? 'generic' as const : 'private' as const]));
    const reviewed = vault.review(prepared, choices);
    expect(reviewed.request.message).toContain('Rosa'); expect(reviewed.request.message).not.toContain('Mario');
    expect(reviewed.request.publicFragments).toEqual(['Rosa']);
    expect(JSON.stringify(reviewed.request)).not.toContain('Mario');
    const payload = makeOpenAiBody(reviewed.request, config).input[0]!.content;
    expect(payload).not.toContain('publicFragments'); expect(payload).not.toContain('parts'); expect(payload).not.toContain('Mario');
    expect(() => assertProtectedRequest(reviewed.request)).not.toThrow();
    const next = vault.prepare({ ...input('Rosa quadrata'), recentMessages: [{ role: 'user', text: prepared.source.message }] });
    expect(next.needsReview).toBe(false); expect(next.request.message).toBe('Rosa quadrata');
    expect(JSON.stringify(next.request)).not.toContain('Mario');
  });
  it.each(['private', 'generic'] as const)('il testo originale rimane identico per la grafica dopo classificazione %s', nature => {
    const vault = new PrivacyVault(), original = 'Rosa';
    const prepared = vault.prepare({ ...input('Testo: ' + original), contentBrief: { text: original, kind: 'text' } });
    const reviewed = vault.review(prepared, Object.fromEntries(prepared.parts.map(part => [part.token, nature])));
    expect(reviewed.request.message.includes(original)).toBe(nature === 'generic');
    expect(reviewed.request.contentBrief!.text).toMatch(/^\[RISERVATO_\d+\]$/);
    expect(() => assertProtectedRequest(reviewed.request)).not.toThrow();
    const call = vault.restoreCall({ schemaVersion: 1, expectedRevision: 0, tool: 'collectRequirements', arguments: {}, contentBrief: { text: reviewed.request.contentBrief!.text } }, reviewed.localText);
    expect(call).toMatchObject({ contentBrief: { text: original } });
  });
  it('recapiti/codici restano locali anche con classificazione generica, senza impedire la composizione', () => {
    const vault = new PrivacyVault(), original = 'Mario Rossi\nmario@example.test\n01234567890';
    const prepared = vault.prepare(input('Testo: ' + original));
    expect(prepared.parts[0]!.canRelease).toBe(false);
    const reviewed = vault.review(prepared, Object.fromEntries(prepared.parts.map(part => [part.token, 'generic' as const])));
    expect(JSON.stringify(reviewed.request)).not.toContain('Mario'); expect(reviewed.request.publicFragments).toEqual([]);
    expect(() => assertProtectedRequest(reviewed.request)).not.toThrow();
    const call = vault.restoreCall({ schemaVersion: 1, expectedRevision: 0, tool: 'collectRequirements', arguments: {} }, reviewed.localText);
    expect(call).toMatchObject({ contentBrief: { text: original } });
  });
  it('una nuova indicazione di nome riapre la classificazione rispetto a una parola già generica', () => {
    const vault = new PrivacyVault(), prepared = vault.prepare(input('Mario'));
    vault.review(prepared, { [prepared.parts[0]!.token]: 'generic' });
    const next = vault.prepare(input('mi chiamo Mario'));
    expect(next.needsReview).toBe(true); expect(next.request.message).not.toContain('Mario');
    const reviewed = vault.review(next, { [next.parts[0]!.token]: 'private' });
    expect(JSON.stringify(reviewed.request)).not.toContain('Mario');
  });
  it('anche un testo prima generico viene protetto quando poi è presentato come nome personale', () => {
    const vault = new PrivacyVault(), prepared = vault.prepare(input('Testo: Rosa'));
    vault.review(prepared, { [prepared.parts[0]!.token]: 'generic' });
    const next = vault.prepare({ ...input('mi chiamo Rosa'), contentBrief: { text: 'Rosa', kind: 'text' } });
    expect(next.needsReview).toBe(true); expect(next.parts[0]!.kind).toBe('identifier');
    const reviewed = vault.review(next, Object.fromEntries(next.parts.map(part => [part.token, 'private' as const])));
    expect(JSON.stringify(reviewed.request)).not.toContain('Rosa');
  });
  it('eccezioni soltanto puntuali: niente sottostringhe o ri-oscuramento dei segnaposto', () => {
    const vault = new PrivacyVault(), prepared = vault.prepare(input('mario'));
    vault.review(prepared, { [prepared.parts[0]!.token]: 'private' });
    expect(vault.protect('primario')).toBe('primario');
    const name = vault.protect('nome: Mario Rossi', false, true);
    expect(vault.protect(name, false, true)).toBe(name);
    const generic = vault.prepare(input('Luna')); vault.review(generic, { [generic.parts[0]!.token]: 'generic' });
    expect(vault.prepare(input('LunaRossi Maria')).needsReview).toBe(true);
  });
  it('nessun invio con classificazioni mancanti e nessuna memoria dopo reset', () => {
    const vault = new PrivacyVault(), prepared = vault.prepare(input('Luna'));
    expect(() => vault.review(prepared, {})).toThrow('ogni parte');
    vault.review(prepared, { [prepared.parts[0]!.token]: 'generic' });
    expect(vault.prepare(input('Luna')).needsReview).toBe(false);
    vault.clear(); expect(vault.prepare(input('Luna')).needsReview).toBe(true);
  });
  it('lo storico viene protetto prima del taglio: un testo privato lungo non torna in chiaro come frammento', () => {
    const vault = new PrivacyVault(), original = 'bar caffè '.repeat(45).trim(), prepared = vault.prepare(input('Testo: ' + original));
    expect(prepared.needsReview).toBe(false); // testo opaco per minimizzazione, senza allarme immotivato
    const recentMessages = vault.protectHistory([{ role: 'user', text: 'Testo: ' + original }]);
    expect(recentMessages[0]!.text).not.toContain('bar caffè'); expect(recentMessages[0]!.text).toContain('[RISERVATO_');
    const next = vault.prepare({ ...input('automatico'), recentMessages });
    expect(next.needsReview).toBe(false); expect(JSON.stringify(next.request)).not.toContain('bar caffè');
    expect(() => assertProtectedRequest(next.request)).not.toThrow();
  });
  it('il server rifiuta eccezioni non verificate o contenenti recapiti', () => {
    expect(() => assertProtectedRequest({ ...input('tesserine'), publicFragments: ['tesserine'] })).toThrow('Verifica privacy');
    expect(() => makeOpenAiBody({ ...input('mario@example.test'), privacyReviewed: true, publicFragments: ['mario@example.test'] }, config)).toThrow('deve restare protetto');
  });
});
