import { expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { fontTable } from '../scripts/font-names';
import { FontAssetSchema, type FontAsset } from '../src/editor/font-assets';
import { assertDocumentFonts, inspectDocumentFonts, fontIssueMessage } from '../src/editor/font-preflight';
import { createDocument, type GraphicDocument, type SceneObject } from '../src/editor/model';

const id='font-11111111-1111-4111-8111-111111111111';
async function iconFont():Promise<FontAsset>{return FontAssetSchema.parse({id,family:'codicon',label:'Font simboli TEST',format:'ttf',dataBase64:(await readFile('node_modules/playwright-core/lib/vite/recorder/assets/codicon-DCmgc-ay.ttf')).toString('base64')});}
function documentWith(asset:FontAsset,text:string):GraphicDocument{const doc=createDocument();doc.fontAssets=[asset];doc.objects=[{id:'text-1',type:'text',fontFamily:asset.id,text,fontSizePt:12,xMm:5,yMm:5,fill:'#000000'}];return doc;}
function cmapFont(code:number|number[]):FontAsset{
 const codes=typeof code==='number'?[code]:[...code].sort((a,b)=>a-b),table=Buffer.alloc(28+12*codes.length);table.writeUInt16BE(1,2);table.writeUInt16BE(3,4);table.writeUInt16BE(10,6);table.writeUInt32BE(12,8);table.writeUInt16BE(12,12);table.writeUInt32BE(table.length-12,16);table.writeUInt32BE(codes.length,24);codes.forEach((value,index)=>{table.writeUInt32BE(value,28+12*index);table.writeUInt32BE(value,32+12*index);table.writeUInt32BE(index+1,36+12*index);});
 const header=Buffer.alloc(28);header.writeUInt32BE(0x10000);header.writeUInt16BE(1,4);header.write('cmap',12);header.writeUInt32BE(28,20);header.writeUInt32BE(table.length,24);
 return {...{id,family:'Unicode TEST',format:'ttf' as const},dataBase64:Buffer.concat([header,table]).toString('base64')};
}

it('legge il file reale, segnala i caratteri mancanti una volta sola e non cambia la grafica',async()=>{
 const doc=documentWith(await iconFont(),'\uea60A\nAA'),before=structuredClone(doc),report=await inspectDocumentFonts(doc);
 expect(report.checkedFonts).toBe(1);expect(report.issues).toMatchObject([{objectId:'text-1',kind:'missing-characters',characters:['A']}]);expect(fontIssueMessage(report.issues[0]!)).toContain('U+0041');await expect(assertDocumentFonts(doc)).rejects.toThrow('non contiene A');expect(doc).toEqual(before);
});
it('rispetta font sui soli caratteri selezionati e gli indici Unicode, senza controllare asset inutilizzati',async()=>{
 const doc=documentWith(await iconFont(),'A\uea60B'),text=doc.objects[0] as Extract<SceneObject,{type:'text'}>;text.fontFamily='Arial';text.characterStyles=[{start:1,end:2,style:{fontFamily:id}}];
 expect((await inspectDocumentFonts(doc)).issues).toMatchObject([{kind:'unembedded-font',fontId:'Arial'}]);text.characterStyles=[{start:2,end:3,style:{fontFamily:id}}];expect((await inspectDocumentFonts(doc)).issues.find(issue=>issue.kind==='missing-characters')?.characters).toEqual(['B']);delete text.characterStyles;expect(await inspectDocumentFonts(doc)).toMatchObject({checkedFonts:0,issues:[{kind:'unembedded-font'}]});
 const extended=documentWith(cmapFont(0x1f600),'😀A');(extended.objects[0] as Extract<SceneObject,{type:'text'}>).characterStyles=[{start:1,end:2,style:{fontFamily:'Arial'}}];expect((await inspectDocumentFonts(extended)).issues).toMatchObject([{kind:'unembedded-font'}]);
});
it('normalizza per controllo gli accenti equivalenti senza riscrivere testo o unire run di font diversi',async()=>{
 const doc=documentWith(cmapFont(0xe9),'e\u0301\ufe0f\u200d');expect((await inspectDocumentFonts(doc)).issues).toEqual([]);expect((doc.objects[0] as any).text).toBe('e\u0301\ufe0f\u200d');
 expect((await inspectDocumentFonts(documentWith(cmapFont([0x65,0x301]),'é'))).issues).toEqual([]);
 (doc.objects[0] as Extract<SceneObject,{type:'text'}>).characterStyles=[{start:1,end:2,style:{fontFamily:'Arial'}}];expect((await inspectDocumentFonts(doc)).issues.find(issue=>issue.kind==='missing-characters')?.characters).toEqual(['e']);
});
it('font non analizzabile è sconosciuto, mai verificato; nessun rifiuto arbitrario per il formato',async()=>{
 const bytes=Buffer.alloc(20);bytes.write('wOF2');const doc=documentWith({...await iconFont(),format:'woff2',dataBase64:bytes.toString('base64')},'ABC');
 const report=await assertDocumentFonts(doc);expect(report.checkedFonts).toBe(0);expect(report.issues).toMatchObject([{kind:'unknown-coverage'}]);expect(fontIssueMessage(report.issues[0]!)).toContain('non verificabile');
});
it('WOFF compresso usa la stessa cmap e limita l’espansione dichiarata',async()=>{
 const asset=await iconFont(),cmap=fontTable(Buffer.from(asset.dataBase64,'base64'),'ttf','cmap')!,packed=deflateSync(cmap),head=Buffer.alloc(64);head.write('wOFF');head.writeUInt16BE(1,12);head.write('cmap',44);head.writeUInt32BE(64,48);head.writeUInt32BE(packed.length,52);head.writeUInt32BE(cmap.length,56);
 const doc=documentWith({...asset,format:'woff',dataBase64:Buffer.concat([head,packed]).toString('base64')},'\uea60A');expect((await inspectDocumentFonts(doc)).issues[0]?.characters).toEqual(['A']);
 head.writeUInt32BE(2*1024*1024,56);doc.fontAssets=[{...doc.fontAssets![0]!,dataBase64:Buffer.concat([head,packed]).toString('base64')}];expect((await inspectDocumentFonts(doc)).issues).toMatchObject([{kind:'unknown-coverage'}]);
});
it('stile simulato su un font incorporato impedisce la conferma, anche in un solo run',async()=>{
 const doc=documentWith(await iconFont(),'\uea60'),text=doc.objects[0] as Extract<SceneObject,{type:'text'}>;
 text.characterStyles=[{start:0,end:1,style:{fontWeight:'bold'}}];await expect(assertDocumentFonts(doc)).rejects.toThrow('simulato');text.characterStyles=[{start:0,end:1,style:{fontWeight:'normal'}}];doc.fontAssets![0]!.weight=700;expect((await assertDocumentFonts(doc)).issues).toEqual([]);
 text.fontStyle='italic';await expect(assertDocumentFonts(doc)).rejects.toThrow('Variante font');text.characterStyles=[{start:0,end:1,style:{fontStyle:'normal'}}];expect((await assertDocumentFonts(doc)).issues).toEqual([]);
});

it('output rigoroso: copertura sconosciuta e caratteri assenti sono bloccanti, senza alterare il documento',async()=>{
 const {assertOutputFonts}=await import('../src/editor/font-preflight');const doc=documentWith(await iconFont(),'A'),before=structuredClone(doc);await expect(assertOutputFonts(doc)).rejects.toThrow('Correggi i font');expect(doc).toEqual(before);
 const bytes=Buffer.alloc(20);bytes.write('wOF2');const unknown=documentWith({...await iconFont(),format:'woff2',dataBase64:bytes.toString('base64')},'ABC');await expect(assertOutputFonts(unknown,{resolveWoff2:async()=>undefined})).rejects.toThrow('non verificabile');
});
it('analisi font temporaneamente indisponibile: una seconda richiesta può verificare lo stesso file',async()=>{
 const {assertOutputFonts}=await import('../src/editor/font-preflight');const bytes=Buffer.alloc(24);bytes.write('wOF2');const doc=documentWith({...await iconFont(),format:'woff2',dataBase64:bytes.toString('base64')},'ABC');let calls=0;const options={resolveWoff2:async()=>++calls===1?undefined:[[65,67] as const]};
 await expect(assertOutputFonts(doc,options)).rejects.toThrow('non verificabile');await expect(assertOutputFonts(doc,options)).resolves.toMatchObject({checkedFonts:1,issues:[]});expect(calls).toBe(2);
});
