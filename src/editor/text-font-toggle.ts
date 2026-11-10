import type{FontAsset}from'./font-assets';
import{fontFamilyKey}from'./font-family-key';
import{exactStyleVariant}from'./font-face-choice';
import{baseCharacterStyle,characterStyles,compressStyles,type TextObject}from'./text-style';
type EffectiveStyle=ReturnType<typeof baseCharacterStyle>;
type Range={start:number;end:number};
export interface TextFontToggle { pressed:boolean|'mixed'; object:TextObject|null; }
function scope(object:TextObject,range?:Range){
 const base=baseCharacterStyle(object),styles=characterStyles(object),start=range?.start??0,end=range?.end??styles.length;
 if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<start||end>styles.length)throw new Error('Selezione di testo non valida');
 return{base,styles,start,end,effective:styles.length?styles.slice(start,end).map(style=>({...base,...style})):[base]};
}
function mapFaces(object:TextObject,resolve:(style:EffectiveStyle)=>FontAsset|undefined,range?:Range):TextObject|null{
 const{base,styles,start,end,effective}=scope(object,range);if(range&&start===end)return null;
 const faces=effective.map(resolve);if(faces.some(face=>!face))return null;
 const next=structuredClone(object),nextStyles=styles.map(style=>({...style}));
 if(range){for(let index=start;index<end;index++)nextStyles[index]={...nextStyles[index],fontFamily:faces[index-start]!.id,fontWeight:'normal',fontStyle:'normal'};}
 else{
  const baseFace=resolve(base);if(!baseFace)return null;Object.assign(next,{fontFamily:baseFace.id,fontWeight:'normal',fontStyle:'normal'});
  for(let index=0;index<nextStyles.length;index++){const style=nextStyles[index]!;if(faces[index]!.id===baseFace.id)delete style.fontFamily;else style.fontFamily=faces[index]!.id;delete style.fontWeight;delete style.fontStyle;}
 }
 const runs=compressStyles(nextStyles);if(runs.length)next.characterStyles=runs;else delete next.characterStyles;return next;
}
function logicalStyle(style:EffectiveStyle,asset:FontAsset|undefined){return{weight:style.fontWeight==='bold'?700:asset?.weight??400,italic:style.fontStyle==='italic'||!!asset?.italic};}
/** Word-style toggles preserve the other attribute on every run, using actual files only. */
export function textFontToggle(object:TextObject,kind:'bold'|'italic',assets:readonly FontAsset[],range?:Range):TextFontToggle{
 const{base,styles,start,end,effective}=scope(object,range),catalog=new Map(assets.map(asset=>[asset.id,asset]));
 const state=(style:EffectiveStyle)=>{const actual=logicalStyle(style,catalog.get(style.fontFamily));return kind==='bold'?actual.weight>=600:actual.italic;};
 if(range&&start===end)return{pressed:state({...base,...styles[start]}),object:null};
 const values=effective.map(state),allOn=values.every(Boolean),mixed=values.some(value=>value!==values[0]),enable=!allOn,cache=new Map<string,FontAsset|undefined>();
 const resolve=(style:EffectiveStyle)=>{
  const asset=catalog.get(style.fontFamily);if(!asset)return;const key=JSON.stringify([style.fontFamily,style.fontWeight,style.fontStyle]);if(cache.has(key))return cache.get(key);
  const candidates=assets.filter(candidate=>fontFamilyKey(candidate.familyGroup??candidate.family)===fontFamilyKey(asset.familyGroup??asset.family)),actual=logicalStyle(style,asset);
  const face=exactStyleVariant(asset,candidates,kind==='bold'?(enable?700:400):actual.weight,kind==='italic'?enable:actual.italic);cache.set(key,face);return face;
 };
 return{pressed:mixed?'mixed':allOn,object:mapFaces(object,resolve,range)};
}
/** Preserve variants when possible. A direct UI choice can explicitly use the selected file with a notice. */
export function textFontFamily(object:TextObject,targetId:string,assets:readonly FontAsset[],range?:Range,allowSelectedFace=false):TextObject|null{
 const catalog=new Map(assets.map(asset=>[asset.id,asset])),target=catalog.get(targetId);if(!target)return null;
 const candidates=assets.filter(asset=>fontFamilyKey(asset.familyGroup??asset.family)===fontFamilyKey(target.familyGroup??target.family)),cache=new Map<string,FontAsset|undefined>();
 return mapFaces(object,style=>{const key=JSON.stringify([style.fontFamily,style.fontWeight,style.fontStyle]);if(cache.has(key))return cache.get(key);const actual=logicalStyle(style,catalog.get(style.fontFamily));const face=exactStyleVariant(target,candidates,actual.weight>=600?700:400,actual.italic)??(allowSelectedFace?target:undefined);cache.set(key,face);return face;},range);
}
export function commonTextFontFamily(object:TextObject,assets:readonly FontAsset[],range?:Range):string|undefined{
 const{base,styles,effective,start,end}=scope(object,range),catalog=new Map(assets.map(asset=>[asset.id,asset])),ids=range&&start===end?[styles[start]?.fontFamily??base.fontFamily]:effective.map(style=>style.fontFamily),keys=ids.map(id=>{const asset=catalog.get(id);return asset?fontFamilyKey(asset.familyGroup??asset.family):id;});
 return keys.some(key=>key!==keys[0])?undefined:ids[0];
}
