import { readFile, writeFile } from 'node:fs/promises';
import { renderStoreKnowledge } from './lib/store-knowledge.ts';
const expected = renderStoreKnowledge(await readFile(new URL('../CONOSCENZE_ASSISTENTE.md', import.meta.url), 'utf8'));
const target = new URL('../server/store-knowledge.generated.ts', import.meta.url);
const actual = await readFile(target, 'utf8').catch(() => null);
if (process.argv.includes('--check')) { if (actual !== expected) throw new Error('Conoscenze non aggiornate: esegui npm run assistant:generate'); console.log('PASS conoscenze compilate coerenti.'); }
else { if (actual !== expected) await writeFile(target, expected); console.log('Conoscenze compilate, nessuna rete o pubblicazione.'); }
