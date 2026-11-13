import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { missingCharacterFontCommand } from '../src/editor/font-repair';
import { createTestDocument, TEST_DEFAULT_FONT, TEST_FONT_ASSETS } from './helpers/editor-fonts';
import { DocumentStore, type SceneObject, type Measure } from '../src/editor/model';
import { inspectDocumentFonts, type FontIssue } from '../src/editor/font-preflight';
import type { FontAsset } from '../src/editor/font-assets';
const symbols:FontAsset={id:'font-11111111-1111-4111-8111-111111111111',family:'codicon',format:'ttf',dataBase64:readFileSync('node_modules/playwright-core/lib/vite/recorder/assets/codicon-DCmgc-ay.ttf').toString('base64')};
const measure:Measure=object=>({widthMm:object.type==='text'?Array.from(object.text).length*(object.characterStyles?.length?3:2):10,heightMm:5});
function source(){const doc=createTestDocument();doc.objects=[{id:'text',type:'text',xMm:5,yMm:5,text:'A\uea60B A',fontFamily:symbols.id,fontSizePt:12,fill:'#000000',underline:true,characterStyles:[{start:3,end:5,style:{fontFamily:TEST_DEFAULT_FONT.id,fill:'#ffffff',kerningPt:.2}}]},{id:'other',type:'text',xMm:25,yMm:5,text:'A',fontFamily:TEST_DEFAULT_FONT.id,fontSizePt:12,fill:'#000000'}];doc.fontAssets=[symbols,TEST_DEFAULT_FONT];return doc;}
const issue:FontIssue={kind:'missing-characters',objectId:'text',fontId:symbols.id,fontLabel:'Simboli TEST',characters:['A','B']};
it('correzione esplicita: soltanto caratteri mancanti del font segnalato; stili, altri oggetti e coordinate conservate',async()=>{
 const doc=source(),original=structuredClone(doc),command=await missingCharacterFontCommand(doc,issue,TEST_DEFAULT_FONT);
 expect(doc).toEqual(original);expect(command.arguments.fontAssets).toBeUndefined();expect(command.arguments.object).toMatchObject({fontFamily:symbols.id,text:doc.objects[0]!.type==='text'?doc.objects[0]!.text:'',underline:true,characterStyles:[{start:0,end:1,style:{fontFamily:TEST_DEFAULT_FONT.id,fontWeight:'normal',fontStyle:'normal'}},{start:2,end:3,style:{fontFamily:TEST_DEFAULT_FONT.id}},{start:3,end:5,style:{fill:'#ffffff',kerningPt:.2}}]});
 const stores=['manual','ai-simulation'].map(kind=>{const store=new DocumentStore(doc,measure);store.dispatch(command,kind as 'manual'|'ai-simulation');expect(store.document.objects[0]).toMatchObject({xMm:doc.objects[0]!.xMm,yMm:doc.objects[0]!.yMm});expect(store.document.objects[1]).toEqual(doc.objects[1]);store.undo();expect(store.document.objects).toEqual(doc.objects);store.redo();return store;});expect(stores[0]!.document).toEqual(stores[1]!.document);expect((await inspectDocumentFonts(stores[0]!.document)).issues).toEqual([]);
});
it('file incapace o non verificabile, segnalazione falsa, revisione obsoleta e blocchi non producono riparazioni parziali',async()=>{
 const doc=source();await expect(missingCharacterFontCommand(doc,issue,symbols)).rejects.toThrow('non contiene');await expect(missingCharacterFontCommand(doc,{...issue,characters:['\uea60']},TEST_DEFAULT_FONT)).rejects.toThrow('non corrisponde');
 const invalid={...TEST_DEFAULT_FONT,id:'font-22222222-2222-4222-8222-222222222222',dataBase64:Buffer.alloc(20).toString('base64')};await expect(missingCharacterFontCommand(doc,issue,invalid)).rejects.toThrow('non è verificabile');
 const command=await missingCharacterFontCommand(doc,issue,TEST_DEFAULT_FONT),store=new DocumentStore(doc,measure);store.dispatch(command,'manual');const saved=structuredClone(store.document);expect(()=>store.dispatch(command,'ai-simulation')).toThrow('obsoleta');expect(store.document).toEqual(saved);
 const locked=source();locked.objects[0]!.editor={selectionLocked:true};const blocked=new DocumentStore(locked,measure),lockedCommand=await missingCharacterFontCommand(locked,issue,TEST_DEFAULT_FONT);expect(()=>blocked.dispatch(lockedCommand,'manual')).toThrow('Selezione bloccata');expect(blocked.document).toEqual(locked);
});
it('il file scelto viene incorporato senza sostituire gli originali e può essere una variante esatta',async()=>{
 const doc=source();doc.fontAssets=[symbols];const bold=TEST_FONT_ASSETS.find(font=>font.familyGroup==='Arimo'&&font.weight===700&&!font.italic)!;
 const object=doc.objects[0] as Extract<SceneObject,{type:'text'}>;delete object.characterStyles;doc.objects=[object];
 const command=await missingCharacterFontCommand(doc,issue,bold);expect(command.arguments.fontAssets).toEqual([bold]);const store=new DocumentStore(doc,measure);store.dispatch(command,'ai-simulation');expect(store.document.fontAssets).toEqual([symbols,bold]);expect((store.document.objects[0] as Extract<SceneObject,{type:'text'}>).characterStyles!.every(run=>run.style.fontFamily===bold.id&&run.style.fontWeight==='normal'&&run.style.fontStyle==='normal')).toBe(true);
});
it('accento decomposto: corregge il carattere completo evidenziato, preserva testo e stili e condivide manuale/AI e Undo',async()=>{
 const doc=source(),object=doc.objects[0];if(object?.type!=='text')throw Error('Fixture');object.text='e\u0301\uea60 é';object.characterStyles=[{start:3,end:5,style:{fontFamily:TEST_DEFAULT_FONT.id,underline:true}}];
 const before=structuredClone(doc),report=await inspectDocumentFonts(doc),missing=report.issues.find(issue=>issue.objectId==='text'&&issue.kind==='missing-characters')!;expect(missing.characters).toEqual(['é']);
 const command=await missingCharacterFontCommand(doc,missing,TEST_DEFAULT_FONT);expect(command.arguments.object).toMatchObject({text:object.text,xMm:5,yMm:5,characterStyles:[{start:0,end:2,style:{fontFamily:TEST_DEFAULT_FONT.id,fontWeight:'normal',fontStyle:'normal'}},{start:3,end:5,style:{fontFamily:TEST_DEFAULT_FONT.id,underline:true}}]});
 const stores=['manual','ai-simulation'].map(source=>{const store=new DocumentStore(doc,measure);store.dispatch(command,source as 'manual'|'ai-simulation');return store;});expect(stores[0]!.document).toEqual(stores[1]!.document);expect((await inspectDocumentFonts(stores[0]!.document)).issues).toEqual([]);stores[0]!.undo();expect(stores[0]!.document.objects).toEqual(before.objects);expect(doc).toEqual(before);
});
