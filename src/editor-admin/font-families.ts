import {fontFamilyKey} from '../editor/font-family-key';import type {AdminSnapshot} from './schema';
type Font=AdminSnapshot['fonts'][number];
export function groupedLibraryFonts(fonts:readonly Font[]):{key:string;name:string;font:Font;members:Font[]}[]{
 const groups=new Map<string,Font[]>();for(const font of fonts){const key=fontFamilyKey(font.familyGroup??font.actualFamilyGroup??font.family);groups.set(key,[...groups.get(key)??[],font]);}
 const score=(font:Font)=>Math.abs((font.weight??font.actualWeight??400)-400)+((font.italic??font.actualItalic)?10000:0);
 return [...groups].map(([key,members])=>{const font=[...members].sort((a,b)=>score(a)-score(b)||a.family.localeCompare(b.family,'it'))[0]!;return{key,name:font.familyGroup??font.actualFamilyGroup??font.family,font,members};}).sort((a,b)=>a.name.localeCompare(b.name,'it',{sensitivity:'base',numeric:true}));
}
