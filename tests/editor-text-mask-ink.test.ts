import { expect,it,vi } from 'vitest';
import { compareTextMaskAlpha,textMaskInkInput,TextMaskInkCache,type TextMaskInkResult } from '../src/editor/text-mask-ink';
import { rectangularTextMask } from '../src/editor/text-clip-masks';
import { createTestDocument,TEST_DEFAULT_FONT } from './helpers/editor-fonts';
import type { TextObject } from '../src/editor/text-style';
const ready:TextMaskInkResult={status:'clear',inkPixels:10,hiddenPixels:0,fullyHidden:false};
const clipped:TextMaskInkResult={status:'clipped',inkPixels:10,hiddenPixels:4,fullyHidden:false};
const tick=async()=>{for(let i=0;i<6;i++)await Promise.resolve();};
function input(){const object=createTestDocument().objects.find(o=>o.type==='text')! as TextObject;object.textClipMasks=[rectangularTextMask(20,8)];return textMaskInkInput(object,[TEST_DEFAULT_FONT]);}
const pixels=(alpha:number[],white=false)=>new Uint8ClampedArray(alpha.flatMap(a=>[white?255:0,white?255:0,white?255:0,a]));
it('la perdita alpha rileva testo scuro, bianco o parzialmente trasparente; il solo colore non conta',()=>{
 expect(compareTextMaskAlpha(pixels([255,100,13]),pixels([255,50,0],true))).toEqual({status:'clipped',inkPixels:3,hiddenPixels:2,fullyHidden:false});
 expect(compareTextMaskAlpha(pixels([255,100]),pixels([255,100],true))).toEqual({status:'clear',inkPixels:2,hiddenPixels:0,fullyHidden:false});
 expect(compareTextMaskAlpha(pixels([255,100]),pixels([0,0]))).toEqual({status:'clipped',inkPixels:2,hiddenPixels:2,fullyHidden:true});
 expect(compareTextMaskAlpha(pixels([1,7]),pixels([0,0])).inkPixels).toBe(0);expect(()=>compareTextMaskAlpha(pixels([255]),pixels([]))).toThrow();
});
it('posizione, rotazione, ID e label non invalidano l’inchiostro; font, testo e maschere lo distinguono',()=>{
 const a=input(),changed={...a.object,id:'another',xMm:50,yMm:-5,rotationDeg:23,editor:{label:'Altro nome'}};
 expect(textMaskInkInput(changed,a.fonts).key).toBe(a.key);expect(textMaskInkInput({...changed,text:'ALTRO'},a.fonts).key).not.toBe(a.key);
 expect(textMaskInkInput({...changed,fontSizePt:30},a.fonts).key).not.toBe(a.key);expect(textMaskInkInput({...changed,textClipMasks:[rectangularTextMask(21,8)]},a.fonts).key).not.toBe(a.key);
 expect(textMaskInkInput(a.object,[{...TEST_DEFAULT_FONT,id:'font-bbbbbbbb-0000-4000-8000-000000000001'},TEST_DEFAULT_FONT]).fonts).toEqual(a.fonts);
});
it('cache condivisa fra richieste equivalenti, snapshot immutabile e nessun nuovo lavoro dopo spostamento',async()=>{
 const source=input(),seen:any[]=[],inspect=vi.fn(async value=>{seen.push(value);return ready;}),cache=new TextMaskInkCache(inspect),first=cache.get(source),again=cache.get(source);
 expect(first).toBe(again);source.object.text='Mutato dopo la richiesta';expect(await first).toEqual(ready);expect(seen[0].object.text).not.toBe(source.object.text);
 const translated={...seen[0].object,xMm:100,rotationDeg:-30};await cache.get(textMaskInkInput(translated,source.fonts));expect(inspect).toHaveBeenCalledTimes(1);expect(cache.peek(textMaskInkInput(translated,source.fonts))).toEqual(ready);
});
it('file e metadati della variante cambiati con lo stesso ID non riusano una prova precedente',async()=>{
 const a=input(),inspect=vi.fn(async()=>ready),cache=new TextMaskInkCache(inspect);await cache.get(a);
 await cache.get({...a,fonts:[{...a.fonts[0]!,dataBase64:'DIFFERENT_TEST_BYTES'}]});await cache.get({...a,fonts:[{...a.fonts[0]!,format:'otf'}]});
 await cache.get({...a,fonts:[{...a.fonts[0]!,weight:700}]});await cache.get({...a,fonts:[{...a.fonts[0]!,italic:true}]});expect(inspect).toHaveBeenCalledTimes(5);
});
it('fallimento ritentabile e Undo riusa la prova originale',async()=>{
 const a=input(),inspect=vi.fn().mockRejectedValueOnce(Error('TEST offline')).mockResolvedValueOnce(ready).mockResolvedValueOnce(clipped),cache=new TextMaskInkCache(inspect);
 expect(await cache.get(a)).toEqual({status:'unavailable',message:'TEST offline'});expect(cache.peek(a)).toBeUndefined();await cache.get(a);
 const b=textMaskInkInput({...a.object,text:'ALTRI CARATTERI'},a.fonts);expect(await cache.get(b)).toEqual(clipped);expect(await cache.get(a)).toEqual(ready);expect(inspect).toHaveBeenCalledTimes(3);
});
it('un controllo limitato resta esplicito e non viene trasformato in esito positivo',async()=>{
 const a=input(),limited:TextMaskInkResult={status:'limited',message:'TEST: controllo visivo richiesto'},inspect=vi.fn(async()=>limited),cache=new TextMaskInkCache(inspect);
 expect(await cache.get(a)).toEqual(limited);expect(cache.peek(a)).toEqual(limited);expect(await cache.get(a)).toEqual(limited);expect(inspect).toHaveBeenCalledTimes(1);
});
it('LRU e budget dei byte limitano la cache, anche per un risultato singolo oltre budget',async()=>{
 const a=input(),inspect=vi.fn(async()=>ready),cache=new TextMaskInkCache(inspect,2),b=textMaskInkInput({...a.object,text:'B'},a.fonts),c=textMaskInkInput({...a.object,text:'C'},a.fonts);
 await cache.get(a);await cache.get(b);await cache.get(c);expect(cache.peek(a)).toBeUndefined();await cache.get(a);expect(inspect).toHaveBeenCalledTimes(4);
 const uncached=new TextMaskInkCache(inspect,2,1);await uncached.get(a);expect(uncached.peek(a)).toBeUndefined();await uncached.get(a);expect(inspect).toHaveBeenCalledTimes(6);
});
it('render seriale, richieste in coda superate non eseguite e chiusura senza nuove prove',async()=>{
 const a=input(),resolve:((value:TextMaskInkResult)=>void)[]=[],inspect=vi.fn(()=>new Promise<TextMaskInkResult>(done=>resolve.push(done))),cache=new TextMaskInkCache(inspect,1);
 const first=cache.get(a);await tick();expect(inspect).toHaveBeenCalledTimes(1);const second=cache.get(textMaskInkInput({...a.object,text:'B'},a.fonts)),thirdInput=textMaskInkInput({...a.object,text:'C'},a.fonts),third=cache.get(thirdInput);
 resolve[0]!(ready);await first;await second;await tick();expect(inspect).toHaveBeenCalledTimes(2);expect(cache.peek(thirdInput)).toBeUndefined();resolve[1]!(clipped);expect(await third).toEqual(clipped);cache.dispose();expect(cache.peek(thirdInput)).toBeUndefined();expect((await cache.get(a)).status).toBe('unavailable');expect(inspect).toHaveBeenCalledTimes(2);
});
