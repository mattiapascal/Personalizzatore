import { expect,it } from 'vitest';
import { readPitchprintTextMasks,canonicalPitchprintTextMasks } from '../src/editor/pitchprint-text-masks';
import { textClipCommands } from '../src/editor/text-clip-masks';
import { pitchprintTree } from '../src/editor/pitchprint-tree';
import { pitchprintMaskCases } from './helpers/pitchprint-text-masks';

const rectangle={type:'rect',originX:'center',originY:'center',left:5,top:-3,width:20,height:8,strokeWidth:2};
it('maschera relativa: frame fisico nel piano del font e compensazione del centro, senza dipendere dal box',()=>{
 const raw={type:'i-text',clipPath:rectangle},before=structuredClone(raw),masks=readPitchprintTextMasks(raw,'TEST')!,canonical=canonicalPitchprintTextMasks(masks,.5,{x:1,y:-2})!;
 expect(textClipCommands(canonical[0]!)).toEqual([['M',-3.5,-1.5],['L',6.5,-1.5],['L',6.5,2.5],['L',-3.5,2.5],['L',-3.5,-1.5],['Z']]);expect(raw).toEqual(before);
 expect(readPitchprintTextMasks({type:'text'},'TEST')).toBeUndefined();expect(canonicalPitchprintTextMasks(undefined,1)).toBeUndefined();
});
it('percorsi legacy H/V e relativi normalizzati, cache dimensionali e pathOffset ignorati',()=>{
 const clip={type:'path',path:[['M',-5,-4],['h',10],['v',8],['H',-5],['Z']],strokeWidth:0};
 const first=canonicalPitchprintTextMasks(readPitchprintTextMasks({clipPath:clip},'TEST'),1);
 expect(first).toEqual(canonicalPitchprintTextMasks(readPitchprintTextMasks({clipPath:{...clip,width:999,height:777,pathOffset:{x:999,y:888},mtx:[0,0,0,0,999,999],clipBounds:{x:99}}},'TEST'),1));
 expect(first![0]!.frameMm).toEqual({x:-5,y:-4,width:10,height:8});
 expect(textClipCommands(first![0]!)).toEqual([['M',-5,-4],['L',5,-4],['L',5,4],['L',-5,4],['Z']]);
});
it('curve, archi, fori e intersezioni annidate ammesse, il preflight resta privo di font o effetti',()=>{
 for(const raw of pitchprintMaskCases()){const before=structuredClone(raw),masks=readPitchprintTextMasks(raw,String(raw.name))!;expect(masks.length).toBe(raw.name==='nested-intersection'?2:1);expect(canonicalPitchprintTextMasks(masks,.2)).toHaveLength(masks.length);expect(()=>pitchprintTree([{...raw,left:0,top:0,width:100,height:50}],()=>({}))).not.toThrow();expect(raw).toEqual(before);}
});
it('la chiusura implicita del riempimento diventa esplicita, mantenendo i contorni separati',()=>{
 const masks=readPitchprintTextMasks({clipPath:{type:'path',strokeWidth:0,fillRule:'evenodd',path:[['M',0,0],['L',10,0],['L',10,10],['M',2,2],['L',8,2],['L',8,8],['L',2,8]]}},'TEST')!;
 expect(masks[0]!.commands.filter(c=>c[0]==='Z')).toHaveLength(2);expect(canonicalPitchprintTextMasks(masks,1)![0]!.fillRule).toBe('evenodd');
});
it('maschere assolute/invertite, gruppi, effetti, valori invalidi e comandi ignoti non sono convertiti silenziosamente',()=>{
 for(const patch of[{absolutePositioned:true},{inverted:true},{type:'group',objects:[]},{shadow:{}},{clipTo:'alert(1)'},{transformMatrix:[1,0,0,1,0,0]},{opacity:.5},{visible:false},{globalCompositeOperation:'xor'},{fillRule:'bad'},{scaleX:0},{skewX:90},{strokeWidth:-1},{width:0},{rx:-2},{left:Infinity}])expect(()=>readPitchprintTextMasks({clipPath:{...rectangle,...patch}},'TEST')).toThrow();
 for(const path of[[['M',0,0],['X',1,1]], [['M',0,0],['L',NaN,1]], [['L',0,0],['L',1,1]], [['M',0,0],['A',1,1,0,2,0,5,5]], [['M',0,0],['L',1,0],['L',2,0]]])expect(()=>readPitchprintTextMasks({clipPath:{type:'path',path}},'TEST')).toThrow();
});
it('budget limitato per singolo percorso, somma dei clip e profondità prima del caricamento di risorse',()=>{
 const big={type:'path',strokeWidth:0,path:[['M',0,0],...Array.from({length:32768},()=>['L',1,1]),['Z']]};expect(()=>readPitchprintTextMasks({clipPath:big},'TEST')).toThrow('eccessivo');
 let chain:any={...rectangle};for(let i=0;i<8;i++)chain={...rectangle,clipPath:chain};expect(()=>readPitchprintTextMasks({clipPath:chain},'TEST')).toThrow('otto');
 const path=[['M',0,0],...Array.from({length:17000},(_,i)=>['L',i%2,Math.floor(i/2)%2]),['Z']];expect(()=>readPitchprintTextMasks({clipPath:{type:'path',path,clipPath:{type:'path',path}}},'TEST')).toThrow('budget');
});
it('anche i comandi senza area oltre il frame normalizzato sono rifiutati dal preflight, senza eliminazioni implicite',()=>{
 const clipPath={type:'path',strokeWidth:0,path:[['M',0,0],['L',1,0],['L',1,1],['L',0,1],['Z'],['M',10000000,10000000],['Z']]};
 expect(()=>pitchprintTree([{type:'i-text',left:0,top:0,width:100,height:50,clipPath}],()=>({}))).toThrow('maschera non normalizzabile');
});
