import{mediaRequest,mediaBytes}from'./media-api';
import type {PitchImportOptions,PitchprintConversionOptions} from '../editor/pitchprint-import';
export interface PitchprintSource {id:string;title:string;modifiedAt:string;pages:number;kind?:string;sourceId?:string;sourceHash?:string;categories?:string[];}
export async function pitchprintJson(path:string){const response=await fetch('/__editor-local/pitchprint/'+path,{headers:{'X-Editor-Local':'1'}}),value=await response.json();if(!response.ok)throw new Error(value.error??'Sorgente non disponibile');return value;}
export function pitchprintOptions(options:PitchprintConversionOptions):PitchImportOptions{
 const cache=new Map<string,Promise<Uint8Array>>();let library:ReturnType<typeof mediaRequest>|undefined;
 const image=async(url:string):Promise<Uint8Array>=>{let pending=cache.get(url);if(!pending){pending=(async()=>{
  library??=mediaRequest().catch(()=>({schemaVersion:1 as const,revision:0,categories:[],assets:[]}));const state=await library,local=state.assets.find(asset=>asset.origin?.url===url);
  if(local){const bytes=await mediaBytes(local.id),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(bytes))),v=>v.toString(16).padStart(2,'0')).join('');if(hash!==local.hash)throw Error('Originale locale PitchPrint non integro: nessuna sostituzione automatica.');return bytes;}
  const response=await fetch('/__editor-local/pitchprint/asset',{method:'POST',headers:{'X-Editor-Local':'1','Content-Type':'application/json'},body:JSON.stringify({url})});if(!response.ok){const data=await response.json();throw Error(data.error??'Immagine non disponibile');}return new Uint8Array(await response.arrayBuffer());
 })();cache.set(url,pending);}try{return await pending;}catch(e){if(cache.get(url)===pending)cache.delete(url);throw e;}};
 return{...options,font:async(family,weight,italic)=>pitchprintJson(`font?family=${encodeURIComponent(family)}&weight=${weight}&italic=${italic?'1':'0'}`),image};
}
export function downloadBatchReport(name:string,value:unknown){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
