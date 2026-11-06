import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compileAssistantPolicy, renderAssistantPolicy, POLICY_START, POLICY_END, POLICY_MAX_CHARS } from '../scripts/lib/assistant-policy';
import { assistantPolicy, ASSISTANT_POLICY_SHA256 } from '../server/assistant-policy.generated';
import { interpretationInstructions, PROMPT_VERSION } from '../server/interpretation-prompt';
import { makeOpenAiBody, AiRequestSchema } from '../server/openai';
import { readConfig } from '../server/config';

const document = readFileSync(new URL('../REGOLE_ASSISTENTE.md', import.meta.url), 'utf8');
const active = (text: string) => `Guida per umani\n${POLICY_START}\n${text}\n${POLICY_END}\nProposte non attive`;

describe('Regole modificabili e contratto AI', () => {
  it('invia realmente le istruzioni del documento al provider, senza guida o proposte', () => {
    const compiled = compileAssistantPolicy(document);
    expect(compiled).toEqual({ text: assistantPolicy, sha256: ASSISTANT_POLICY_SHA256 });
    const input = AiRequestSchema.parse({ sessionId: crypto.randomUUID(), revision: 0, message: 'un timbro', requirements: {}, lastQuestion: null });
    const body = makeOpenAiBody(input, readConfig({}));
    expect(body.instructions).toContain(assistantPolicy);
    expect(body.instructions).not.toContain('Come modificare e verificare');
    expect(body.instructions).not.toContain('Proposte di casi nuovi');
    expect(body.tool_choice).toEqual({ type: 'function', name: 'collect_requirements' });
  });
  it('riconosce modifiche di comportamento e ignora note esterne; normalizza CRLF', () => {
    const original = compileAssistantPolicy(active('Chiedi una sola cosa.'));
    expect(compileAssistantPolicy(active('Chiedi una sola cosa.').replace('Guida per umani', 'Altra guida'))).toEqual(original);
    expect(compileAssistantPolicy(active('Chiedi una sola cosa.').replaceAll('\n', '\r\n'))).toEqual(original);
    expect(compileAssistantPolicy(active('Chiedi prima il contenuto.')).sha256).not.toBe(original.sha256);
    expect(PROMPT_VERSION).toContain(ASSISTANT_POLICY_SHA256.slice(0, 12));
  });
  it.each([
    'nessun delimitatore',
    POLICY_START + 'testo',
    active(''),
    active('testo') + POLICY_START,
    active('testo') + POLICY_END,
    POLICY_END + 'testo' + POLICY_START,
    active('x'.repeat(POLICY_MAX_CHARS + 1)),
  ])('rifiuta documento malformato/eccessivo (caso %#)', input => {
    expect(() => compileAssistantPolicy(input)).toThrow('REGOLE_ASSISTENTE.md');
  });
  it('l’artefatto è aggiornato e non richiede filesystem nel runtime', () => {
    const source = readFileSync(new URL('../server/assistant-policy.generated.ts', import.meta.url), 'utf8');
    expect(source).toBe(renderAssistantPolicy(document));
    expect(source).not.toContain('node:fs');
    expect(interpretationInstructions).toContain('Contratto tecnico vincolante');
    const example = renderAssistantPolicy(active('Testo con ` e ${nessunCodice()} e "virgolette"'));
    expect(example).toContain('\\"virgolette\\"');
  });
});
