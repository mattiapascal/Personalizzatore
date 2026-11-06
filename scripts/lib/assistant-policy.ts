import { createHash } from 'node:crypto';

export const POLICY_START = '<!-- assistant-policy:start -->';
export const POLICY_END = '<!-- assistant-policy:end -->';
export const POLICY_MAX_CHARS = 12_000;

export function compileAssistantPolicy(document: string) {
  const normalized = document.replace(/\r\n?/g, '\n');
  if (normalized.split(POLICY_START).length !== 2 || normalized.split(POLICY_END).length !== 2) {
    throw new Error('REGOLE_ASSISTENTE.md: serve un solo delimitatore di inizio e uno di fine.');
  }
  const start = normalized.indexOf(POLICY_START) + POLICY_START.length;
  const end = normalized.indexOf(POLICY_END);
  if (end < start) throw new Error('REGOLE_ASSISTENTE.md: delimitatori invertiti.');
  const text = normalized.slice(start, end).trim();
  if (!text) throw new Error('REGOLE_ASSISTENTE.md: istruzioni attive vuote.');
  if (text.length > POLICY_MAX_CHARS) throw new Error(`REGOLE_ASSISTENTE.md: superato il limite di ${POLICY_MAX_CHARS} caratteri attivi.`);
  const sha256 = createHash('sha256').update(text).digest('hex');
  return { text, sha256 };
}

export function renderAssistantPolicy(document: string): string {
  const policy = compileAssistantPolicy(document);
  return '// Generato da REGOLE_ASSISTENTE.md. Modificare il documento, poi npm run assistant:generate.\n'
    + `export const ASSISTANT_POLICY_SHA256 = ${JSON.stringify(policy.sha256)};\n`
    + `export const assistantPolicy = ${JSON.stringify(policy.text)};\n`;
}
