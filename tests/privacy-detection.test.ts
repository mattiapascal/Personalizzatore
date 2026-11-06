import { describe, expect, it } from 'vitest';
import fixture from '../fixtures/privacy/detection.TEST.json';
import { PrivacyVault, assertProtectedRequest } from '../src/privacy/redaction';
import { AiRequestSchema } from '../src/ai/request';
import { mountFixtureCatalog } from '../src/catalog/adapter';

const input = (message: string) => AiRequestSchema.parse({ message, sessionId: crypto.randomUUID(), revision: 0, requirements: {}, lastQuestion: null });
const titles = mountFixtureCatalog.list().map(p => p.title);
describe('Rilevazione locale: segnali identificativi, non parole sconosciute', () => {
  it.each(fixture.ordinary)('nessun blocco sulla frase ordinaria: %s', message => {
    const prepared = new PrivacyVault(titles).prepare(input(message));
    expect(prepared.needsReview).toBe(false); expect(prepared.request.message).toBe(message);
    expect(() => assertProtectedRequest(prepared.request, titles)).not.toThrow();
  });
  it.each(fixture.personal)('richiede controllo e oscura $hidden', ({ message, hidden }) => {
    const prepared = new PrivacyVault(titles).prepare(input(message));
    expect(prepared.needsReview).toBe(true); expect(prepared.request.message).not.toContain(hidden);
  });
});
