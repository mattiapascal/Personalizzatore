import { readFontCoverage } from './font-coverage-cache';
import {exactStyleVariant} from './font-face-choice';
import {fontFamilyKey} from './font-family-key';
import { FontAssetSchema, fontAssetBytes, type FontAsset } from './font-assets';
import type { SceneObject } from './model';
/** Historical document names only. Never offered or resolved through the operating system. */
export const FONT_FAMILIES = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana', 'Trebuchet MS'] as const;
export type FontFamily = string;
const fallbacks = ['serif', 'sans-serif', 'monospace'];
const probes = ['mmmmmmWWWWWWiiiiii0123456789', 'Città ÀÈÉÌÒÙ accenti', 'The quick brown fox'];
/** Un font assente usa ciascun fallback e mantiene le sue metriche: check() non basta. */
export function fontHasOwnMetrics(family: string, measure: (font: string, text: string) => number): boolean {
  return fallbacks.some(fallback => probes.some(probe => Math.abs(measure(`72px ${JSON.stringify(family)}, ${fallback}`, probe) - measure(`72px ${fallback}`, probe)) > 0.01));
}
/** Only exact file-backed resources are available to the graphic engine. */
export function isFontAvailable(family: string): boolean {
  return family.startsWith('font-') && !!resources.get(family)?.loaded;
}
export function assertFontAvailable(family: FontFamily): void {
  if (!isFontAvailable(family)) throw new Error(`Font «${fontLabel(family)}» non incorporato nel progetto. I font del computer non sono utilizzabili: scegli il file dalla libreria.`);
}

interface RegisteredFont { asset: FontAsset; alias: string; loaded: boolean; visible: boolean; promise?: Promise<void>; }
let visibleFontIds:Set<string>|undefined;
const resources=new Map<string,RegisteredFont>(),aliases=new Map<string,string>(),listeners=new Set<()=>void>();let fontVersion=0;
interface FontMenuEntry {id:string;family:string;weight:number;italic:boolean;}
let menuEntries:readonly FontMenuEntry[]=[];
/** Names only, no binaries or FontFace. Keeps menu geometry stable while files load. */
export function setFontMenuEntries(entries:readonly FontMenuEntry[]):void{if(JSON.stringify(menuEntries)===JSON.stringify(entries))return;menuEntries=entries.map(entry=>({...entry}));notify();}
export function fontMenuLabel(id:string):string{return menuEntries.find(entry=>entry.id===id)?.family??fontFamilyLabel(id);}
export function fontMenuFamilyChoices():string[]{
 const groups=new Map<string,FontMenuEntry>(),score=(entry:FontMenuEntry)=>Math.abs(entry.weight-400)+(entry.italic?10000:0);
 for(const entry of [...menuEntries.filter(entry=>visibleFontIds?.has(entry.id)??true),...fontChoices().map(id=>{const asset=resources.get(id)!.asset;return{id,family:fontMenuLabel(id),weight:asset.weight??400,italic:asset.italic??false};})]){const key=fontFamilyKey(entry.family),previous=groups.get(key);if(!previous||score(entry)<score(previous))groups.set(key,entry);}
 return[...groups.values()].map(entry=>entry.id).sort((a,b)=>fontMenuLabel(a).localeCompare(fontMenuLabel(b),'it',{sensitivity:'base',numeric:true})||a.localeCompare(b));
}
const notify=()=>{fontVersion++;for(const listener of listeners)listener();};
export const subscribeFonts=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
export const fontCatalogVersion=()=>fontVersion;
export function fontChoices():string[]{return [...resources].filter(([,r])=>r.loaded&&r.visible).map(([id])=>id);}
export function fontLabel(family:string):string{return resources.get(family)?.asset.label??resources.get(family)?.asset.family??family;}
export function renderFontFamily(family:string):string{return resources.get(family)?.alias??family;}
export function canonicalFontFamily(family:string|undefined):string|undefined{return family?aliases.get(family)??family:undefined;}
export function setFontVisibility(ids:readonly string[]):void{const visible=new Set(ids);visibleFontIds=visible;let changed=false;for(const[id,resource]of resources){const next=visible.has(id);if(resource.visible!==next){resource.visible=next;changed=true;}}if(changed)notify();}
export function registeredFontAsset(id:string):FontAsset|undefined{return resources.get(id)?.asset;}
/** Resolve a source font explicitly. Missing fonts never silently become Arial. */
export function importedFontFamily(source:string,weight=400,italic=false):string {
  const name=source.replace(/^['"]|['"]$/g,'').trim(), key=name.toLowerCase().replace(/[\s_-]/g,'');
  const matches=[...resources].filter(([,r])=>r.loaded&&r.visible&&(r.asset.weight??400)===weight&&!!r.asset.italic===italic&&[r.asset.family,r.asset.familyGroup,r.asset.label,r.alias].some(f=>f?.toLowerCase().replace(/[\s_-]/g,'')===key));
  if(matches.some(([,r])=>r.asset.dataBase64!==matches[0]![1].asset.dataBase64||r.asset.format!==matches[0]![1].asset.format))throw new Error(`Font «${name}» ambiguo nella libreria: specifica il nome esatto della variante.`);
  const family=matches[0]?.[0];
  if(!family)throw new Error(`Font «${name}» non presente nella libreria. Caricalo nel backend oppure importa il testo come contorni.`);
  assertFontAvailable(family);return family;
}
export async function loadFontAssets(assets:readonly FontAsset[]=[]):Promise<void>{await Promise.all(assets.map(async raw=>{const asset=FontAssetSchema.parse(raw),existing=resources.get(asset.id);if(existing){if(existing.asset.dataBase64!==asset.dataBase64||existing.asset.format!==asset.format)throw new Error('Un ID font è associato a file differenti');await existing.promise;return;}const alias=`EditorFont_${asset.id.slice(5).replaceAll('-','')}`,resource:RegisteredFont={asset,alias,loaded:false,visible:visibleFontIds?.has(asset.id)??true};resources.set(asset.id,resource);aliases.set(alias,asset.id);resource.promise=(async()=>{try{const face=new FontFace(alias,fontAssetBytes(asset).buffer);await face.load();document.fonts.add(face);resource.loaded=true;notify();}catch{resources.delete(asset.id);aliases.delete(alias);throw new Error(`Impossibile caricare il font «${asset.label??asset.family}»`);}})();await resource.promise;}));void Promise.all(assets.map(asset=>readFontCoverage(asset)));}
export function fontAssetArguments(object:SceneObject,existing:readonly FontAsset[]=[]):{object:SceneObject;fontAssets?:FontAsset[]}{const ids=object.type==='text'?[object.fontFamily,...object.characterStyles?.map(r=>r.style.fontFamily).filter((f):f is string=>!!f)??[]]:[],known=new Set(existing.map(a=>a.id)),fontAssets=[...new Set(ids)].filter(id=>id.startsWith('font-')&&!known.has(id)).map(id=>{const asset=registeredFontAsset(id);if(!asset)throw new Error('Risorsa font non caricata');return asset;});return{object,...(fontAssets.length?{fontAssets}: {})};}
export function embedSvgFonts(svg:string,assets:readonly FontAsset[]=[]):string{if(!assets.length)return svg;const xml=new DOMParser().parseFromString(svg,'image/svg+xml'),ns='http://www.w3.org/2000/svg';let defs=xml.querySelector('defs');if(!defs){defs=xml.createElementNS(ns,'defs');xml.documentElement.prepend(defs);}const style=xml.createElementNS(ns,'style');style.textContent=assets.map(asset=>`@font-face{font-family:${JSON.stringify(renderFontFamily(asset.id))};src:url("data:font/${asset.format};base64,${asset.dataBase64}");font-style:normal;font-weight:normal;}`).join('\n');defs.append(style);const withExactFace=(value:string|null):string|undefined=>{if(!value)return;const alias=value.trim().replace(/^(['"])(.*)\1$/,'$2'),id=aliases.get(alias),asset=assets.find(item=>item.id===id);return asset?`${alias},${JSON.stringify(asset.family)}`:undefined;};
for(const element of xml.querySelectorAll('[font-family], [style]')){
 const attribute=withExactFace(element.getAttribute('font-family'));if(attribute)element.setAttribute('font-family',attribute);
 const style=(element as SVGElement).style,inline=style?withExactFace(style.getPropertyValue('font-family')):undefined;
 if(inline)style.setProperty('font-family',inline);
}const metadata=xml.createElementNS(ns,'metadata');metadata.textContent=JSON.stringify({fonts:assets.map(({id,family,label,licenseText,sourceUrl})=>({id,family,label,licenseText,sourceUrl}))});xml.documentElement.append(metadata);return new XMLSerializer().serializeToString(xml);}

export function fontFamilyLabel(id:string):string{const group=resources.get(id)?.asset.familyGroup;return group??fontLabel(id);}
export function fontVariantChoices(id:string):FontAsset[]{const asset=resources.get(id)?.asset;if(!asset)return[];return[...resources.values()].filter(r=>r.loaded&&r.visible&&fontFamilyKey(r.asset.familyGroup??r.asset.family)===fontFamilyKey(asset.familyGroup??asset.family)).map(r=>r.asset).sort((a,b)=>Number(a.italic??false)-Number(b.italic??false)||(a.weight??400)-(b.weight??400));}
export function fontFamilyChoices():string[]{const result:string[]=[],groups=new Map<string,FontAsset>();for(const id of fontChoices().filter(id=>id.startsWith('font-'))){const asset=resources.get(id)!.asset,key=fontFamilyKey(asset.familyGroup??asset.family),previous=groups.get(key),score=(a:FontAsset)=>Math.abs((a.weight??400)-400)+(a.italic?10000:0);if(!previous||score(asset)<score(previous))groups.set(key,asset);}return[...result,...[...groups.values()].map(a=>a.id)].sort((a,b)=>fontFamilyLabel(a).localeCompare(fontFamilyLabel(b),'it',{sensitivity:'base',numeric:true})||a.localeCompare(b));}
export function fontVariantLabel(id:string):string{const asset=resources.get(id)?.asset;const label=asset?.styleName||`${asset?.weight??400}${asset?.italic?' Corsivo':''}`;return asset?.label?.endsWith('· originale del template')?`${label} · originale del template`:label;}
export function fontIsBold(id:string,weight?:string):boolean{return weight==='bold'||(resources.get(id)?.asset.weight??400)>=600;}
export function fontIsItalic(id:string,style?:string):boolean{return style==='italic'||!!resources.get(id)?.asset.italic;}
export function chooseFontStyle(id:string):{fontFamily:string;fontWeight?:'normal';fontStyle?:'normal'}{return{fontFamily:id,...(resources.has(id)?{fontWeight:'normal',fontStyle:'normal'}:{})};}
export function toggleFontFace(id:string,kind:'bold'|'italic',weight?:string,style?:string):{fontFamily?:string;fontWeight?:'normal'|'bold';fontStyle?:'normal'|'italic'}|null{
 const asset=resources.get(id)?.asset;if(!asset)return null;
 const desiredWeight=kind==='bold'?(fontIsBold(id,weight)?400:700):(asset.weight??400),desiredItalic=kind==='italic'?!fontIsItalic(id,style):fontIsItalic(id,style);
 const face=exactStyleVariant(asset,fontVariantChoices(id),desiredWeight,desiredItalic);return face?chooseFontStyle(face.id):null;
}

/** A new text uses a named library file, never a machine font or a fallback. */
export function defaultLibraryFont():string|undefined{
 const choices=fontFamilyChoices();
 return choices.find(id=>fontFamilyKey(resources.get(id)!.asset.familyGroup??resources.get(id)!.asset.family)==='arial'&&(resources.get(id)!.asset.weight??400)===400&&!resources.get(id)!.asset.italic)??choices[0];
}
