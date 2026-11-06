import { readFile, writeFile } from 'node:fs/promises';
import { renderAssistantPolicy } from './lib/assistant-policy.ts';

const source = new URL('../REGOLE_ASSISTENTE.md', import.meta.url);
const target = new URL('../server/assistant-policy.generated.ts', import.meta.url);
const mode = process.argv.slice(2);
if (mode.some(arg => arg !== '--check') || mode.length > 1) throw new Error('Uso: compile-assistant-policy.ts [--check]');
const expected = renderAssistantPolicy(await readFile(source, 'utf8'));
const actual = await readFile(target, 'utf8').catch((error: NodeJS.ErrnoException) => {
  if (error.code !== 'ENOENT') throw error;
  return null;
});
if (mode.includes('--check')) {
  if (actual !== expected) throw new Error('Istruzioni AI non aggiornate. Esegui npm run assistant:generate e conserva entrambi i file in Git.');
  console.log('PASS regole assistente: documento e istruzioni compilate coerenti.');
} else {
  if (actual !== expected) await writeFile(target, expected, 'utf8');
  console.log('Regole assistente compilate, nessuna chiamata AI o pubblicazione.');
}
