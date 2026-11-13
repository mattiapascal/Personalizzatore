import type { FontAsset } from './font-assets';
import type { TextObject } from './text-style';

export type TextMaskInkResult =
 | {status:'clear'|'clipped';inkPixels:number;hiddenPixels:number;fullyHidden:boolean}
 | {status:'limited'|'unavailable';message:string};
export interface TextMaskInkInput{key:string;object:TextObject;fonts:readonly FontAsset[];}
export function textMaskInkInput(object:TextObject,assets:readonly FontAsset[]):TextMaskInkInput{
 const ids=new Set([object.fontFamily,...object.characterStyles?.flatMap(run=>run.style.fontFamily?[run.style.fontFamily]:[])??[]]);
 const content=Object.fromEntries(Object.entries(object).filter(([key])=>!['id','xMm','yMm','rotationDeg','editor'].includes(key)).sort(([a],[b])=>a.localeCompare(b)));
 return{key:JSON.stringify(content),object,fonts:assets.filter(asset=>ids.has(asset.id)).sort((a,b)=>a.id.localeCompare(b.id))};
}
export function sameMaskFonts(a:readonly FontAsset[],b:readonly FontAsset[]):boolean{
 return a.length===b.length&&a.every((asset,index)=>asset.id===b[index]?.id&&asset.format===b[index]?.format&&asset.dataBase64===b[index]?.dataBase64&&(asset.weight??400)===(b[index]?.weight??400)&&!!asset.italic===!!b[index]?.italic);
}
/** Both buffers come from ONE glyph painting. Only mask coverage can remove
 * alpha; text hinting/caching differences cannot create a false cut here. */
export function compareTextMaskAlpha(plain:Uint8ClampedArray,masked:Uint8ClampedArray):Extract<TextMaskInkResult,{inkPixels:number}>{
 if(plain.length!==masked.length||plain.length%4)throw Error('Superfici del testo incompatibili');
 let inkPixels=0,hiddenPixels=0,remainingPixels=0;
 for(let i=3;i<plain.length;i+=4){const before=plain[i]!,after=masked[i]!;if(before<8)continue;inkPixels++;if(after>=8)remainingPixels++;if(before-after>=2&&(before-after)/before>=.25)hiddenPixels++;}
 return{status:hiddenPixels?'clipped':'clear',inkPixels,hiddenPixels,fullyHidden:inkPixels>0&&remainingPixels===0};
}

interface Entry{input:TextMaskInkInput|null;promise:Promise<TextMaskInkResult>;value?:TextMaskInkResult;bytes:number;cancelled:boolean;}
/** Bounded, local-only proof cache. Location, layer and labels are irrelevant;
 * font bytes, content, layout and masks must match. Failed checks are retryable. */
export class TextMaskInkCache{
 private entries:Entry[]=[];private queue:Promise<unknown>=Promise.resolve();private disposed=false;
 constructor(private readonly inspect:(input:TextMaskInkInput)=>Promise<TextMaskInkResult>,private readonly limit=24,private readonly byteLimit=16*1024*1024){}
 private find(input:TextMaskInkInput){return this.entries.find(entry=>entry.input?.key===input.key&&sameMaskFonts(entry.input.fonts,input.fonts));}
 peek(input:TextMaskInkInput):TextMaskInkResult|undefined{return this.find(input)?.value;}
 get(input:TextMaskInkInput):Promise<TextMaskInkResult>{
  if(this.disposed)return Promise.resolve({status:'unavailable',message:'Controllo chiuso'});
  const found=this.find(input);if(found){this.entries=this.entries.filter(entry=>entry!==found);this.entries.push(found);return found.promise;}
  const snapshot={key:input.key,object:structuredClone(input.object),fonts:input.fonts.map(asset=>({...asset}))};
  const entry:Entry={input:snapshot,bytes:input.key.length*2+input.fonts.reduce((n,font)=>n+font.dataBase64.length*2,0),cancelled:false,promise:Promise.resolve({status:'unavailable',message:'Controllo in attesa'})};
  const work=this.queue.then(async()=>entry.cancelled||this.disposed||!entry.input?{status:'unavailable' as const,message:'Controllo superato da una modifica successiva'}:this.inspect(entry.input));
  entry.promise=work.catch(error=>({status:'unavailable' as const,message:error instanceof Error?error.message:'Controllo del testo non disponibile'})).then(value=>{
   if(!this.disposed&&!entry.cancelled&&value.status!=='unavailable')entry.value=value;
   else{this.entries=this.entries.filter(item=>item!==entry);entry.input=null;}
   return value;
  });
  this.queue=entry.promise;this.entries.push(entry);
  while(this.entries.length>this.limit||this.entries.reduce((n,item)=>n+item.bytes,0)>this.byteLimit){const old=this.entries.shift()!;if(old===entry)break;old.cancelled=true;old.input=null;}
  return entry.promise;
 }
 dispose(){this.disposed=true;for(const entry of this.entries){entry.cancelled=true;entry.input=null;}this.entries=[];}
}
