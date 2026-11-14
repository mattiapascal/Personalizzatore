import {readFile,writeFile} from 'node:fs/promises';
import {compileAssistantPolicy} from './lib/assistant-policy';
const args=process.argv.slice(2);if(args.some(arg=>arg!=='--check')||args.length>1)throw Error('Uso: compile-graphical-policy.ts [--check]');
const source=await readFile(new URL('../REGOLE_ASSISTENTE_GRAFICO.md',import.meta.url),'utf8'),policy=compileAssistantPolicy(source),target=new URL('../server/graphical-policy.generated.ts',import.meta.url),expected='// Generato da REGOLE_ASSISTENTE_GRAFICO.md. Modificare il sorgente, poi npm run assistant:generate.\n'+`export const GRAPHICAL_POLICY_SHA256=${JSON.stringify(policy.sha256)};\nexport const graphicalPolicy=${JSON.stringify(policy.text)};\n`;
const actual=await readFile(target,'utf8').catch((error:NodeJS.ErrnoException)=>{if(error.code!=='ENOENT')throw error;return null;});
if(args.includes('--check')){if(actual!==expected)throw Error('Istruzioni grafiche non aggiornate: esegui npm run assistant:generate.');console.log('PASS regole assistente grafico coerenti.');}else{if(actual!==expected)await writeFile(target,expected);console.log('Regole grafiche compilate, nessuna chiamata AI o pubblicazione.');}
