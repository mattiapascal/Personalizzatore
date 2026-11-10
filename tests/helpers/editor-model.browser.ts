/** Explicit file-backed document factory for browser TEST fixtures. No production fallback. */
export * from '../../src/editor/model';
import {createDocument as createLegacyDocument} from '../../src/editor/model';
import {loadFontAssets} from '../../src/editor/fonts';
import {FontAssetSchema} from '../../src/editor/font-assets';
import sources from '../../fixtures/fonts/editor-fonts.TEST.sources.json' with {type:'json'};
export const testFontAssets=await Promise.all(sources.map(async row=>{
 const bytes=new Uint8Array(await(await fetch(`/fixtures/fonts/${row.file}`)).arrayBuffer());let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
 return FontAssetSchema.parse({id:row.id,family:row.actualFamily,familyGroup:row.family,styleName:row.styleName,label:`${row.family} ${row.styleName}`,weight:row.weight,italic:row.italic,format:'ttf',dataBase64:btoa(binary),sourceUrl:row.sourceUrl});
}));await loadFontAssets(testFontAssets);
export function createDocument(...args:Parameters<typeof createLegacyDocument>){const doc=createLegacyDocument(...args);doc.fontAssets=testFontAssets.filter(asset=>Number(asset.id.slice(-12))<=7);doc.objects=doc.objects.map(object=>object.type==='text'?{...object,fontFamily:'font-aaaaaaaa-0000-4000-8000-000000000001'}:object);return doc;}
