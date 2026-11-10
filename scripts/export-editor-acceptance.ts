import {writeFile} from 'node:fs/promises';
import {ACCEPTANCE_VERSION,acceptanceCases,acceptanceGroups} from '../src/editor-admin/acceptance';
const lines=[
 '# Collaudo editor locale — 10 novembre 2026','',
 `Checklist ${ACCEPTANCE_VERSION}. Generata da src/editor-admin/acceptance.ts con npm run editor:collaudo. Gli esiti manuali non sono precompilati.`,
 '',
 'Pagina interattiva: <http://127.0.0.1:5173/editor/admin?section=acceptance>. Consente filtri, note persistenti ed esportazione del resoconto. Questo documento è la copia consultabile anche senza il server.',
 '',
 'Usare copie con nome TEST. I profili e le zone amministrative sono preparatori e non governano ancora il canvas. Nessuna modifica al negozio pubblicato. Illustrator e produzione fisica richiedono verifica umana.',
 '',
];
let index=0;for(const group of acceptanceGroups){lines.push(`## ${group}`,'');for(const item of acceptanceCases.filter(item=>item.group===group)){lines.push(`### ${++index}. ${item.title}`,'',`Ambiente: <http://127.0.0.1:5173${item.href}>`,'',...item.steps.map((step,i)=>`${i+1}. ${step}`),'',`**Risultato atteso:** ${item.expected}`,'','Esito: ☐ Da eseguire · ☐ Superata · ☐ Problema · ☐ Da verificare','','Note:','');}}
await writeFile('docs/editor-collaudo-2026-11-10.md',`${lines.join('\n')}\n`);console.log(`Checklist generata: ${acceptanceCases.length} prove, nessun esito certificato.`);
