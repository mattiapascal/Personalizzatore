import {readFileSync} from 'node:fs';
import {FontAssetSchema} from '../../src/editor/font-assets';
import sources from '../../fixtures/fonts/editor-fonts.TEST.sources.json' with {type:'json'};
import {createDocument,type GraphicDocument,type SceneObject} from '../../src/editor/model';
export const TEST_FONT_ASSETS=sources.map(row=>FontAssetSchema.parse({id:row.id,family:row.actualFamily,familyGroup:row.family,styleName:row.styleName,label:`${row.family} ${row.styleName}`,weight:row.weight,italic:row.italic,format:'ttf',dataBase64:readFileSync(`fixtures/fonts/${row.file}`).toString('base64'),sourceUrl:row.sourceUrl,licenseText:readFileSync(`fixtures/fonts/${row.family}-LICENSE.txt`,'utf8')}));
export const TEST_DEFAULT_FONT=TEST_FONT_ASSETS.find(asset=>asset.id.endsWith('000001'))!;
/** Test data only: a newly authored fixture starts with a real, explicitly chosen file. */
export function createTestDocument(...args:Parameters<typeof createDocument>):GraphicDocument{
 const doc=createDocument(...args);doc.fontAssets=[TEST_DEFAULT_FONT];doc.objects=doc.objects.map(object=>object.type==='text'?{...object,fontFamily:TEST_DEFAULT_FONT.id}:object);return doc;
}
export function attachTestFonts(doc:GraphicDocument):GraphicDocument{
 const ids=new Set(doc.objects.flatMap(object=>object.type==='text'?[object.fontFamily,...object.characterStyles?.flatMap(run=>run.style.fontFamily?[run.style.fontFamily]:[])??[]]:[]));
 const added=TEST_FONT_ASSETS.filter(asset=>ids.has(asset.id)&&!doc.fontAssets?.some(old=>old.id===asset.id));return added.length?{...doc,fontAssets:[...doc.fontAssets??[],...added]}:doc;
}
/** Explicit migration of historical TEST samples, never used by application code. */
export function portableTestFixture(doc:GraphicDocument):GraphicDocument{
 const families:Record<string,string>={'Arial':'Arimo','Helvetica':'Arimo','Verdana':'Arimo','Trebuchet MS':'Arimo','Georgia':'Tinos','Times New Roman':'Tinos','Courier New':'Cousine'};
 const convert=(family:string,weight?:string,italic?:string)=>{const group=families[family];if(!group)return;const asset=TEST_FONT_ASSETS.find(asset=>asset.familyGroup===group&&asset.weight===(weight==='bold'?700:400)&&asset.italic===(italic==='italic'));if(!asset)throw new Error(`Variante TEST mancante: ${family} ${weight} ${italic}`);return{fontFamily:asset.id,fontWeight:'normal' as const,fontStyle:'normal' as const};};
 const objects=doc.objects.map((source):SceneObject=>{if(source.type!=='text')return source;const object=structuredClone(source);for(const run of object.characterStyles??[]){const next=convert(run.style.fontFamily??source.fontFamily,run.style.fontWeight??source.fontWeight,run.style.fontStyle??source.fontStyle);if(next)Object.assign(run.style,next);}const next=convert(source.fontFamily,source.fontWeight,source.fontStyle);if(next)Object.assign(object,next);return object;});return attachTestFonts({...doc,objects});
}
