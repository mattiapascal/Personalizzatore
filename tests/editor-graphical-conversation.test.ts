import {it,expect} from 'vitest';
import {captureAssistant} from '../src/editor-assistant/proposal';
import {assistantQuestion,assistantHistory,rememberAssistantTurn,type AssistantTurn} from '../src/editor-assistant/conversation';
import {GraphicalRequestSchema} from '../src/editor-assistant/contract';
import {assertGraphicalPrivacy,graphicalBody} from '../server/editor-assistant';
import {readConfig} from '../server/config';
import {shopProductChangeFixture,shopChangeMeasure} from './helpers/shop-product-change';
const turn=(id:number):AssistantTurn=>({id,request:`Inserisci «Cliente ${id}»`,reply:`Modifica applicata alla revisione ${id}.`,status:'applied',revision:id});
it('memoria locale limitata a venti turni, soltanto gli ultimi tre nel contesto del modello',()=>{
 let turns:AssistantTurn[]=[];for(let id=1;id<=25;id++)turns=rememberAssistantTurn(turns,turn(id));expect(turns).toHaveLength(20);expect(turns[0]!.id).toBe(6);const history=assistantHistory(turns);expect(history).toHaveLength(6);expect(history[0]!.text).toContain('23');expect(history.at(-1)!.text).toContain('25');expect(assistantQuestion('Quale testo?')).toBe('Quale testo?');expect(assistantQuestion('Cambia [RISERVATO_1]?')).not.toContain('[RISERVATO_');
});
it('cronologia protetta dalla stessa tabella locale: nomi, email e testo della composizione non passano al provider',()=>{
 const f=shopProductChangeFixture(),request='Inserisci «Mario Rossi info@example.test»',capture=captureAssistant(f.source,'Spostalo più in alto',[],[{asset:f.source.fontAssets![0]!}],[],shopChangeMeasure,f.context,crypto.randomUUID(),{turns:[{...turn(1),request}],focusIds:['change-text']});
 expect(capture.request.history).toHaveLength(2);expect(JSON.stringify(capture.request)).not.toContain('Mario Rossi');expect(JSON.stringify(capture.request)).not.toContain('info@example.test');const token=capture.request.history[0]!.text.match(/«([^»]+)»/)![1]!;expect(capture.restore(token)).toBe('Mario Rossi info@example.test');expect(()=>assertGraphicalPrivacy(capture.request)).not.toThrow();const body=JSON.stringify(graphicalBody(capture.request,readConfig({})));expect(body).toContain('history');expect(body).not.toContain('change-text');expect(body).not.toContain(capture.request.sessionId);
});
it('riferimenti di seguito rimappati sugli ID stabili, eliminati se nascosti o assenti e preceduti dalla selezione corrente',()=>{
 const f=shopProductChangeFixture(),capture=(selected:string[]=[])=>captureAssistant(f.source,'Spostalo',selected,[{asset:f.source.fontAssets![0]!}],[],shopChangeMeasure,f.context,crypto.randomUUID(),{turns:[turn(1)],focusIds:['change-text','missing']});expect(capture().request.focusObjectIds).toEqual(['o2']);f.source.objects.reverse();expect(capture().request.focusObjectIds).toEqual(['o1']);expect(capture([f.source.objects[1]!.id]).request.focusObjectIds).toEqual([]);f.source.objects[0]!.visible=false;expect(capture().request.focusObjectIds).toEqual([]);f.source.objects.shift();expect(capture().request.focusObjectIds).toEqual([]);
});
it('vecchie richieste senza memoria restano valide; cronologia non protetta e riferimenti inventati respinti dal server',()=>{
 const f=shopProductChangeFixture(),input=captureAssistant(f.source,'Centra il testo',[],[{asset:f.source.fontAssets![0]!}],[],shopChangeMeasure,f.context).request,{history,focusObjectIds,...old}=input;expect(GraphicalRequestSchema.parse(old)).toMatchObject({history:[],focusObjectIds:[]});expect(()=>assertGraphicalPrivacy({...input,history:[{role:'user',text:'info@example.test'}]})).toThrow(/Protezione/);expect(()=>assertGraphicalPrivacy({...input,focusObjectIds:['o999']})).toThrow(/conversazione/);expect(()=>assertGraphicalPrivacy({...input,focusObjectIds:['o2','o2']})).toThrow(/conversazione/);
});
it('cronologia molto lunga resa opaca, mai troncata dentro un segnaposto',()=>{
 const f=shopProductChangeFixture(),capture=captureAssistant(f.source,'Centra il testo',[],[{asset:f.source.fontAssets![0]!}],[],shopChangeMeasure,f.context,crypto.randomUUID(),{turns:[{...turn(1),request:'«nome cliente» '.repeat(2000)}],focusIds:[]});expect(capture.request.history[0]!.text.length).toBeLessThanOrEqual(6000);expect(()=>assertGraphicalPrivacy(capture.request)).not.toThrow();
});
