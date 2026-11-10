import { expect,it } from 'vitest';
import { readFile,mkdtemp,rm } from 'node:fs/promises';
import { brotliCompressSync } from 'node:zlib';
import { randomUUID } from 'node:crypto';import { join } from 'node:path';import { tmpdir } from 'node:os';
import { fontCoverage } from '../scripts/font-coverage';
import { fontNames,fontTable } from '../scripts/font-names';
import { woff2AnalysisTable } from '../scripts/woff2-tables';
import { inspectDocumentFonts } from '../src/editor/font-preflight';
import { createDocument } from '../src/editor/model';
import { ConfigurationStore } from '../scripts/configuration-store';
const font=()=>readFile('fixtures/fonts/ABeeZee-subset.TEST.woff2');
it('WOFF2 reale: cmap, nome e peso dalle tabelle non trasformate, senza convertire o alterare il file',async()=>{
 const woff2=await font(),before=Buffer.from(woff2),ranges=fontCoverage(woff2,'woff2')!;expect(ranges.some(([a,b])=>a<=65&&b>=65)).toBe(true);expect(ranges.some(([a,b])=>a<=0x3a9&&b>=0x3a9)).toBe(false);expect(fontNames(woff2,'woff2')).toMatchObject({familyGroup:'ABeeZee',weight:400,italic:false});expect(woff2AnalysisTable(woff2,'cmap')).toBeDefined();expect(woff2).toEqual(before);
});
it('directory con glyf/loca trasformati: lunghezze del flusso rispettate senza ricostruire contorni',async()=>{
 const cmap=fontTable(await font(),'woff2','cmap')!,length=(value:number)=>{const parts=[value&127];while(value>=128){value=Math.floor(value/128);parts.unshift((value&127)|128);}return Buffer.from(parts);};
 const entries=Buffer.concat([Buffer.from([10]),length(100),length(3),Buffer.from([11]),length(20),length(0),Buffer.from([0]),length(cmap.length)]),stream=brotliCompressSync(Buffer.concat([Buffer.from([1,2,3]),cmap])),header=Buffer.alloc(48);header.write('wOF2');header.writeUInt32BE(0x10000,4);header.writeUInt32BE(48+entries.length+stream.length,8);header.writeUInt16BE(3,12);header.writeUInt32BE(500,16);header.writeUInt32BE(stream.length,20);expect(fontCoverage(Buffer.concat([header,entries,stream]),'woff2')).toEqual(fontCoverage(await font(),'woff2'));
});
it('dati troncati, overflow, collezioni e stream corrotti restano sconosciuti',async()=>{
 const valid=await font();for(const change of [(bytes:Buffer)=>bytes.writeUInt32BE(0x74746366,4),(bytes:Buffer)=>bytes.writeUInt32BE(0xffffffff,20),(bytes:Buffer)=>{bytes.writeUInt8(0,48);bytes.writeUInt8(0x80,49);},(bytes:Buffer)=>bytes.fill(0,bytes.length-bytes.readUInt32BE(20))]){const bytes=Buffer.from(valid);change(bytes);expect(woff2AnalysisTable(bytes,'cmap')).toBeUndefined();}expect(woff2AnalysisTable(valid.subarray(0,40),'cmap')).toBeUndefined();
});
it('configurazione locale rifiuta lettere mancanti anche in un font WOFF2 inviato direttamente',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'woff2-configuration-'));try{
  const bytes=await font(),id='font-11111111-1111-4111-8111-111111111111',document=createDocument();document.fontAssets=[{id,family:'ABeeZee-Regular',format:'woff2',dataBase64:bytes.toString('base64')}];document.objects=[{id:'text-1',type:'text',xMm:5,yMm:5,text:'Ω',fontFamily:id,fontSizePt:12,fill:'#000000'}];
  const report=await inspectDocumentFonts(document,{resolveWoff2:async asset=>fontCoverage(Buffer.from(asset.dataBase64,'base64'),'woff2')});expect(report.checkedFonts).toBe(1);expect(report.issues[0]?.characters).toEqual(['Ω']);const store=new ConfigurationStore(directory);await expect(store.dispatch({requestId:randomUUID(),tool:'add',arguments:{document,title:'TEST',options:{inkColor:'black'},svg:'<svg/>',quantity:1}})).rejects.toThrow('non contiene Ω');expect((await store.read()).lines).toEqual([]);
 }finally{await rm(directory,{recursive:true,force:true});}
});
