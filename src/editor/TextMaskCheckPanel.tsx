import {objectIsVisible} from './scene-visibility';
import { useEffect,useRef,useState,useSyncExternalStore } from 'react';
import type { GraphicDocument } from './model';
import { graphicPages,activeGraphicPageId } from './pages';
import { effectiveObjectProperties } from './object-properties';
import { subscribeFontCoverage,fontCoverageVersion } from './font-coverage-cache';
import { inspectTextMaskInk } from './text-mask-inspection';
import { TextMaskInkCache,textMaskInkInput,sameMaskFonts,type TextMaskInkInput,type TextMaskInkResult } from './text-mask-ink';
interface Row{identity:string;pageId:string;label:string;objectId:string;input:TextMaskInkInput;}
interface Answer{identity:string;input:TextMaskInkInput;result:TextMaskInkResult;}
const resultMessage=(result:TextMaskInkResult)=>'message'in result?result.message:result.status==='clipped'?'una parte del testo è nascosta dalla maschera.':'';
export function TextMaskCheckPanel({document:doc,busy,onLocate}:{document:GraphicDocument;busy:boolean;onLocate:(pageId:string,objectId:string)=>void}){
 const coverage=useSyncExternalStore(subscribeFontCoverage,fontCoverageVersion),cache=useRef<TextMaskInkCache|null>(null),[retry,setRetry]=useState(0),[answers,setAnswers]=useState<Answer[]>([]);
 const rows:Row[]=graphicPages(doc).flatMap(page=>page.objects.flatMap(object=>objectIsVisible(page,object)&&object.type==='text'&&object.textClipMasks?.length&&!effectiveObjectProperties(page,object.id).reference?[{identity:JSON.stringify([activeGraphicPageId(page),object.id]),pageId:activeGraphicPageId(page),objectId:object.id,label:`${doc.otherPages?(page.pageName??'Pagina 1')+' · ':''}${object.editor?.label||object.id}`,input:textMaskInkInput(object,doc.fontAssets??[])}]:[]));
 useEffect(()=>{const instance=new TextMaskInkCache(input=>inspectTextMaskInk(input));cache.current=instance;return()=>{instance.dispose();if(cache.current===instance)cache.current=null;};},[]);
 useEffect(()=>{
  if(busy||!rows.length)return;let active=true;const instance=cache.current!;
  const timer=window.setTimeout(()=>{void(async()=>{
   for(const row of rows){if(!active)return;const result=await instance.get(row.input);if(!active)return;setAnswers(previous=>[...previous.filter(answer=>answer.identity!==row.identity),{identity:row.identity,input:row.input,result}].filter(answer=>rows.some(row=>row.identity===answer.identity)));}
  })();},220);
  return()=>{active=false;window.clearTimeout(timer);};
 },[doc,busy,retry,coverage]);
 if(!rows.length)return null;
 const reports=rows.map(row=>{const previous=answers.find(answer=>answer.identity===row.identity&&answer.input.key===row.input.key&&sameMaskFonts(answer.input.fonts,row.input.fonts));return{...row,result:cache.current?.peek(row.input)??previous?.result};});
 const pending=reports.some(row=>!row.result),issues=reports.filter(row=>row.result&&row.result.status!=='clear');
 return <section className="font-check-panel text-mask-check" aria-label="Controllo testo ritagliato" data-testid="text-mask-check">
  <strong>Testo e maschere</strong>
  {busy?<p className="caption">Termina la modifica per controllare il testo ritagliato.</p>:<>
   {pending&&<p className="caption" role="status">Controllo del testo ritagliato…</p>}
   {!pending&&!issues.length&&<p className="caption" role="status">Nessun taglio del testo rilevato nelle maschere controllate.</p>}
   {!!issues.length&&<ul>{issues.map(row=><li key={row.identity}>
    <p className="caption" role="status"><strong>{row.label}</strong>: {resultMessage(row.result!)}</p>
    {row.result!.status==='clipped'&&<p className="caption">Modifica il testo o la maschera se il taglio non è voluto.</p>}
    <button type="button" onClick={()=>onLocate(row.pageId,row.objectId)}>Mostra {row.label}</button>
   </li>)}</ul>}
   {issues.some(row=>row.result?.status==='unavailable')&&<button type="button" onClick={()=>{setAnswers([]);setRetry(value=>value+1);}}>Ricontrolla testo ritagliato</button>}
  </>}
 </section>;
}
