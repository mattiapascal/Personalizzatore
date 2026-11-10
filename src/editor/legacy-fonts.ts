import { parseGraphicDocument, type GraphicDocument } from './model';
import type { FontAsset } from './font-assets';
export interface LegacyFontRequest { key:string; family:string; bold:boolean; italic:boolean; }
function request(family:string,bold=false,italic=false):LegacyFontRequest{return{key:JSON.stringify([family,bold,italic]),family,bold,italic};}
/** Names from old documents are retained for an explicit choice, never looked up on the OS. */
export function legacyFontRequests(doc:GraphicDocument):LegacyFontRequest[]{
 const result=new Map<string,LegacyFontRequest>();
 for(const object of doc.objects){if(object.type!=='text')continue;
  for(const style of [undefined,...object.characterStyles?.map(run=>run.style)??[]]){
   const family=style?.fontFamily??object.fontFamily;if(family.startsWith('font-'))continue;
   const item=request(family,(style?.fontWeight??object.fontWeight)==='bold',(style?.fontStyle??object.fontStyle)==='italic');result.set(item.key,item);
  }
 }return[...result.values()];
}
export function replaceLegacyFonts(doc:GraphicDocument,choices:ReadonlyMap<string,FontAsset>):GraphicDocument{
 const next=structuredClone(doc),assets=new Map(next.fontAssets?.map(asset=>[asset.id,asset])??[]);
 const replacement=(family:string,bold:boolean,italic:boolean)=>{
  const asset=choices.get(request(family,bold,italic).key);if(!asset)throw new Error(`Scegli un file dalla libreria per «${family}».`);
  const previous=assets.get(asset.id);if(previous&&(previous.dataBase64!==asset.dataBase64||previous.format!==asset.format||previous.family!==asset.family))throw new Error('Risorsa font immutabile');assets.set(asset.id,asset);return asset.id;
 };
 for(const object of next.objects){if(object.type!=='text')continue;const family=object.fontFamily,bold=object.fontWeight==='bold',italic=object.fontStyle==='italic';
  for(const run of object.characterStyles??[]){const inherited=run.style.fontFamily??family;if(!inherited.startsWith('font-'))run.style={...run.style,fontFamily:replacement(inherited,(run.style.fontWeight??object.fontWeight)==='bold',(run.style.fontStyle??object.fontStyle)==='italic'),fontWeight:'normal',fontStyle:'normal'};}
  if(!family.startsWith('font-')){object.fontFamily=replacement(family,bold,italic);object.fontWeight='normal';object.fontStyle='normal';}
 }
 if(assets.size)next.fontAssets=[...assets.values()];return parseGraphicDocument(next);
}
