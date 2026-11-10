import {expect,it} from 'vitest';
import {readFile} from 'node:fs/promises';
import {createDocument,DocumentStore,type SceneObject} from '../src/editor/model';
import {legacyFontRequests,replaceLegacyFonts} from '../src/editor/legacy-fonts';
import {assertFontAvailable,fontChoices,fontFamilyChoices,isFontAvailable,toggleFontFace} from '../src/editor/fonts';
import {assertDocumentFonts} from '../src/editor/font-preflight';
const asset=async()=>({id:'font-88888888-8888-4888-a888-888888888888',family:'ABeeZee',weight:400,italic:false,format:'woff2' as const,dataBase64:(await readFile('fixtures/fonts/ABeeZee-subset.TEST.woff2')).toString('base64')});
it('nessun font del computer è disponibile o selezionabile, anche se il nome è storico',()=>{
 for(const family of ['Arial','Times New Roman','Helvetica','sans-serif']){expect(isFontAvailable(family)).toBe(false);expect(()=>assertFontAvailable(family)).toThrow('font del computer');expect(fontChoices()).not.toContain(family);expect(fontFamilyChoices()).not.toContain(family);expect(toggleFontFace(family,'bold')).toBeNull();}
});
it('il controllo produttivo blocca font di sistema sul box e su intervalli Unicode',async()=>{
 const doc=createDocument();await expect(assertDocumentFonts(doc)).rejects.toThrow('font del computer');const font=await asset();doc.fontAssets=[font];doc.objects=[{id:'text',type:'text',text:'Aa',fontFamily:font.id,fontSizePt:9,xMm:1,yMm:1,fill:'#000000',characterStyles:[{start:1,end:2,style:{fontFamily:'Arial'}}]}];await expect(assertDocumentFonts(doc)).rejects.toThrow('Arial');
});
it('la sostituzione richiede scelte esplicite, conserva stili parziali e non riscrive il documento originale',async()=>{
 const doc=createDocument(),text=doc.objects[1] as Extract<SceneObject,{type:'text'}>;text.characterStyles=[{start:0,end:4,style:{fontWeight:'bold',underline:true}},{start:7,end:8,style:{fontFamily:'Georgia',fontStyle:'italic',kerningPt:.1}}];
 const original=structuredClone(doc),requests=legacyFontRequests(doc),font=await asset();expect(requests).toHaveLength(3);expect(()=>replaceLegacyFonts(doc,new Map())).toThrow('Scegli');
 const next=replaceLegacyFonts(doc,new Map(requests.map(item=>[item.key,font]))),converted=next.objects[1] as typeof text;
 expect(doc).toEqual(original);expect(next.documentId).toBe(doc.documentId);expect(next.revision).toBe(doc.revision);expect(next.fontAssets).toEqual([font]);expect(converted).toMatchObject({fontFamily:font.id,fontWeight:'normal',fontStyle:'normal',characterStyles:[{start:0,end:4,style:{fontFamily:font.id,fontWeight:'normal',underline:true}},{start:7,end:8,style:{fontFamily:font.id,fontStyle:'normal',kerningPt:.1}}]});expect(legacyFontRequests(next)).toEqual([]);
 const empty={...doc,objects:[]},store=new DocumentStore(empty,()=>({widthMm:20,heightMm:4}));store.import(next);expect(store.document.fontAssets).toEqual([font]);store.undo();expect(store.document.objects).toEqual([]);store.redo();expect(store.document.objects).toEqual(next.objects);
});
