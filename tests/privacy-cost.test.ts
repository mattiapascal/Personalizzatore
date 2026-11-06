import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PrivacyVault, assertProtectedRequest } from '../src/privacy/redaction';
import { AiRequestSchema } from '../src/ai/request';
import { makeOpenAiBody, proposeOpenAi } from '../server/openai';
import { readConfig } from '../server/config';
import { Meter, tokenCost } from '../server/meter';
import { mountFixtureCatalog } from '../src/catalog/adapter';

const input = (message: string) => AiRequestSchema.parse({ message, sessionId: crypto.randomUUID(), revision: 0, requirements: {}, lastQuestion: null });
const config = readConfig({ AI_PROVIDER: 'openai', OPENAI_API_KEY: 'TEST-not-a-key', AI_ENFORCE_LOCAL_LIMITS: 'false', AI_SHARE_CATALOG_CONTEXT: 'true' });
const privateParts = ['Mario Rossi', 'Officina Aurora Srl', 'via Garibaldi 18', 'mario@example.test', '+39 333 1234567', '01234567890', 'RSSMRA80A01H501U', 'IT60X0542811101000000123456'];

describe('Privacy prima di qualsiasi rete', () => {
  it('maschera identità, ragione sociale, recapiti, indirizzo, codici e IBAN', () => {
    const vault = new PrivacyVault();
    const protectedText = vault.protect(privateParts.join('; '), false, true);
    for (const value of privateParts) expect(protectedText).not.toContain(value);
    expect(protectedText).toContain('[RISERVATO_');
    expect(vault.protect(protectedText, false, true)).toBe(protectedText);
    expect(vault.protect('un timbro per [DATO]', false, true)).toBe('un timbro per [DATO]');
  });
  it('oscura anche nomi minuscoli non riconosciuti e richiede revisione locale', () => {
    const prepared = new PrivacyVault().prepare(input('mi serve un timbro per mario rossi con logo'));
    expect(prepared.request.message).not.toMatch(/mario|rossi/); expect(prepared.needsReview).toBe(true);
    expect(() => assertProtectedRequest(prepared.request)).toThrow('Verifica privacy');
    expect(() => assertProtectedRequest({ ...prepared.request, privacyReviewed: true })).not.toThrow();
  });
  it('mantiene normale il dialogo tecnico, senza trasformare il filtro in parser requisiti', () => {
    for (const message of ['Voglio fare un timbro per le tessere abbonamento del mio bar', 'un piccolo logo', 'automatico', 'quadrata', '10 mm', '50 x 20 mm']) {
      const prepared = new PrivacyVault().prepare(input(message));
      expect(prepared.needsReview, message).toBe(false); expect(prepared.request.message).toBe(message);
      expect(() => assertProtectedRequest(prepared.request)).not.toThrow();
    }
  });
  it.each(["Vorrei fare un timbro per le tessere dell'abbonamento al caffè per il mio bar", 'Vorrei fare un timbro per le tessere dell’abbonamento al caffè per il mio bar', "Dell'abbonamento al caffè", 'Per l’impronta e un’illustrazione', "Nell'impronta con un'illustrazione", 'Ex-libris con un’illustrazione'])('non oscura elisioni tecniche: %s', message => {
    const prepared = new PrivacyVault().prepare(input(message));
    expect(prepared.request.message).toBe(message); expect(prepared.needsReview).toBe(false);
    expect(() => assertProtectedRequest(prepared.request)).not.toThrow();
  });
  it.each(["Un timbro per D'Angelo", 'Un timbro per D’Angelo', 'Un timbro dell’Officina Aurora', "Un timbro per l'azienda Mario Rossi"])('apostrofi e articoli non rendono pubblici i nomi: %s', message => {
    const prepared = new PrivacyVault().prepare(input(message));
    expect(prepared.needsReview).toBe(true);
    for (const name of ['Angelo', 'Officina', 'Aurora', 'Mario', 'Rossi']) expect(prepared.request.message).not.toContain(name);
    expect(() => assertProtectedRequest(prepared.request)).toThrow('Verifica privacy');
  });
  it('permette riferimenti a marchi già pubblici nel catalogo, senza aprire eccezioni ai dati cliente', () => {
    const titles = mountFixtureCatalog.list().map(p => p.title), vault = new PrivacyVault(titles);
    const prepared = vault.prepare(input('Colop Printer Q12 oppure Trodat Printy?'));
    expect(prepared.request.message).toBe('Colop Printer Q12 oppure Trodat Printy?');
    expect(prepared.needsReview).toBe(false);
    expect(() => makeOpenAiBody(prepared.request, config, mountFixtureCatalog)).not.toThrow();
    expect(vault.prepare(input('Mario Rossi')).request.message).not.toContain('Mario');
  });
  it('testo opaco, storico e brief protetti; nessuna mappa va nel payload', () => {
    const vault = new PrivacyVault(), original = 'Mario Rossi\nOfficina Aurora Srl\nvia Garibaldi 18';
    const raw = input('Testo: ' + original); raw.lastQuestionField = 'content';
    raw.contentBrief = { kind: 'text', text: original, graphicSubject: 'logo di Mario Rossi' };
    raw.recentMessages = [{ role: 'user', text: 'La mia email è mario@example.test' }];
    const prepared = vault.prepare(raw);
    const request = { ...prepared.request, privacyReviewed: true };
    const payload = makeOpenAiBody(request, config, mountFixtureCatalog).input[0]!.content;
    for (const value of ['Mario', 'Rossi', 'Aurora', 'Garibaldi', 'mario@example.test']) expect(payload).not.toContain(value);
    expect(JSON.parse(payload).catalogFacts.length).toBeLessThanOrEqual(6);
    expect(payload).not.toContain(raw.sessionId); expect(payload).not.toContain('gid://');
    expect(payload).not.toContain('privacyReviewed');
    const result = vault.restoreCall({ schemaVersion: 1, expectedRevision: 0, tool: 'collectRequirements', arguments: {}, contentBrief: { text: request.contentBrief!.text } }, prepared.localText);
    expect(result).toMatchObject({ contentBrief: { text: original } });
    vault.clear(); expect(() => vault.restoreCall({ schemaVersion: 1, expectedRevision: 0, tool: 'collectRequirements', arguments: {}, contentBrief: { text: '[RISERVATO_1]' } })).toThrow('Segnaposto');
  });
  it('il controllo server rifiuta chiamate dirette con dati noti anche se marcate verificate', async () => {
    const transport = vi.fn(); const meter = new Meter(join(await mkdtemp(join(tmpdir(), 'privacy-cost-')), 'meter.json'));
    const raw = input('Mario Rossi, mario@example.test'); raw.privacyReviewed = true;
    await expect(proposeOpenAi(raw, config, meter, transport)).rejects.toThrow('Protezione dati');
    expect(transport).not.toHaveBeenCalled(); expect(meter.state.requests).toBe(0);
    expect(() => makeOpenAiBody({ ...input('timbro'), privacyReviewed: true, contentBrief: { text: 'nome privato' } }, config)).toThrow('restare nel browser');
  });
});

describe('Tetto per cliente indipendente dai limiti cumulativi', () => {
  it('sostituisce riserve note con token effettivi e preserva contatori dopo riavvio', async () => {
    const path = join(await mkdtemp(join(tmpdir(), 'privacy-cost-')), 'meter.json'), meter = new Meter(path), id = crypto.randomUUID();
    await meter.reserve(0.02, 0, 1, false, { id, budgetUsd: 0.05 });
    await meter.record(1000, 200, { id, reservedUsd: 0.02 });
    expect(meter.sessionUsage(id, 0.05)).toMatchObject({ estimatedUsd: tokenCost(1000, 200), heldUsd: 0, requests: 1 });
    const restored = new Meter(path); await restored.load();
    expect(restored.state).toEqual(meter.state);
    await restored.reserve(0.02, 0, 1, false, { id, budgetUsd: 0.05 });
    expect(restored.state.requests).toBe(2);
    expect(await readFile(path, 'utf8')).not.toMatch(/Mario|email|message|contentBrief/);
  });
  it('errori senza usage mantengono riserva; il tetto blocca prima della rete', async () => {
    const meter = new Meter(join(await mkdtemp(join(tmpdir(), 'privacy-cost-')), 'meter.json')), current = input('timbro');
    await meter.reserve(0.049, 0, 1, false, { id: current.sessionId, budgetUsd: 0.05 });
    const transport = vi.fn();
    await expect(proposeOpenAi(current, config, meter, transport)).rejects.toThrow('Tetto AI della conversazione');
    expect(transport).not.toHaveBeenCalled(); expect(meter.sessionUsage(current.sessionId, 0.05).heldUsd).toBe(0.049);
  });
  it('due istanze non superano il tetto della stessa sessione', async () => {
    const path = join(await mkdtemp(join(tmpdir(), 'privacy-cost-')), 'meter.json'), id = crypto.randomUUID();
    const a = new Meter(path), b = new Meter(path);
    const results = await Promise.allSettled([a.reserve(0.03, 0, 1, false, { id, budgetUsd: 0.05 }), b.reserve(0.03, 0, 1, false, { id, budgetUsd: 0.05 })]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    await a.load(); expect(a.state.sessions[id]!.heldUsd).toBe(0.03);
  });
});
