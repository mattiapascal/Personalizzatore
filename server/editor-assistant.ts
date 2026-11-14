import {z} from 'zod';
import {GraphicalArgumentsSchema,GraphicalRequestSchema,GraphicalResponseSchema,type GraphicalRequest} from '../src/editor-assistant/contract';
import {PrivacyVault} from '../src/privacy/redaction';
import type {Config} from './config';
import type {UsageMeter} from './usage-meter';
import {graphicalPolicy,GRAPHICAL_POLICY_SHA256} from './graphical-policy.generated';
export function assertGraphicalPrivacy(input:GraphicalRequest):void{
 const vault=new PrivacyVault(input.fonts.map(font=>font.name));
 if([input.message,...input.objects.map(object=>object.label)].some(value=>vault.protect(value)!==value))throw Error('Protezione dati richiesta: ripeti il messaggio dal pannello grafico.');
 const ids=[...input.objects.map(item=>item.id),...input.fonts.map(item=>item.id),...input.images.map(item=>item.id)];if(new Set(ids).size!==ids.length)throw Error('Riferimenti grafici duplicati.');
 if(input.objects.some(item=>!item.id.startsWith('o')||item.fontId&&!input.fonts.some(font=>font.id===item.fontId))||input.fonts.some(item=>!item.id.startsWith('f'))||input.images.some(item=>!item.id.startsWith('i')))throw Error('Riferimenti grafici non validi.');
}
export function graphicalBody(input:GraphicalRequest,config:Config){
 assertGraphicalPrivacy(input);return{model:config.OPENAI_MODEL,store:false,instructions:graphicalPolicy,input:[{role:'user',content:JSON.stringify({policyVersion:GRAPHICAL_POLICY_SHA256,message:input.message,canvas:input.canvas,objects:input.objects,fonts:input.fonts,images:input.images,exclusions:input.exclusions})}],tools:[{type:'function',name:'propose_graphic_changes',description:'Propone una bozza o modifiche grafiche da validare localmente prima della conferma.',strict:true,parameters:z.toJSONSchema(GraphicalArgumentsSchema)}],tool_choice:{type:'function',name:'propose_graphic_changes'},parallel_tool_calls:false,reasoning:{effort:'low'},max_output_tokens:2400};
}
export async function proposeGraphical(raw:unknown,config:Config,meter:UsageMeter,fetcher:typeof fetch=fetch,signal=AbortSignal.timeout(25000)){
 const input=GraphicalRequestSchema.parse(raw);if(config.AI_PROVIDER!=='openai'||!config.OPENAI_API_KEY||config.AI_ENFORCE_LOCAL_LIMITS&&config.AI_BUDGET_USD<=0)throw Error('L’AI del laboratorio non è configurata: puoi usare tutti gli strumenti manuali.');
 const body=graphicalBody(input,config),serialized=JSON.stringify(body);if(new TextEncoder().encode(serialized).length>120000)throw Error('Contesto grafico troppo grande per questa richiesta.');
 const reserved=((new TextEncoder().encode(serialized).length+2048)*.75+body.max_output_tokens*4.5)/1e6;
 await meter.reserve(reserved,config.AI_BUDGET_USD,config.AI_MAX_REQUESTS,config.AI_ENFORCE_LOCAL_LIMITS,{id:input.sessionId,budgetUsd:config.AI_SESSION_BUDGET_USD});
 const response=await fetcher('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${config.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:serialized,signal,redirect:'manual'});
 if(!response.ok)throw Error(response.status===429?'Limite del provider raggiunto: riprova più tardi.':'Il provider ha rifiutato la richiesta grafica.');
 const text=await response.text();if(text.length>100000)throw Error('Risposta grafica troppo grande.');
 const result=z.object({status:z.string(),output:z.array(z.object({type:z.string(),name:z.string().optional(),arguments:z.string().optional()})),usage:z.object({input_tokens:z.number().int().nonnegative(),output_tokens:z.number().int().nonnegative()})}).parse(JSON.parse(text));
 await meter.record(result.usage.input_tokens,result.usage.output_tokens,{id:input.sessionId,reservedUsd:reserved});
 const calls=result.output.filter(item=>item.type==='function_call');if(result.status!=='completed'||calls.length!==1||calls[0]!.name!==body.tool_choice.name||!calls[0]!.arguments)throw Error('Proposta grafica incompleta: la composizione è invariata.');
 const proposal=GraphicalArgumentsSchema.parse(JSON.parse(calls[0]!.arguments));if(proposal.clarification&&proposal.actions.length)throw Error('Proposta ambigua: la composizione è invariata.');
 return GraphicalResponseSchema.parse({schemaVersion:1,requestId:input.requestId,expectedRevision:input.revision,proposal,sessionUsage:meter.sessionUsage(input.sessionId,config.AI_SESSION_BUDGET_USD)});
}
