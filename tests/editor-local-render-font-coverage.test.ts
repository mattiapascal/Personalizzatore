import {describe,it,expect} from 'vitest';
import {LocalRenderFontCoverage} from '../scripts/local-render-font-coverage';
import {fontCoverage} from '../scripts/font-coverage';
import {hasUnicode} from '../src/editor/font-cmap';
import {assertOutputFonts} from '../src/editor/font-preflight';
import {compressedTestFonts,compressedFontDocument} from './helpers/compressed-fonts';

describe('font compressi del renderer locale',()=>{
 it('WOFF reale con cmap compressa, byte e copertura originali conservati',async()=>{
  const {woff,compressedCmap}=compressedTestFonts();expect(compressedCmap).toBe(true);const ranges=fontCoverage(Buffer.from(woff.dataBase64,'base64'),'woff')!;
  expect(hasUnicode(ranges,0xe0)).toBe(true);const doc=compressedFontDocument();await expect(assertOutputFonts(doc,{resolveWoff2:new LocalRenderFontCoverage(doc.fontAssets).resolveWoff2})).resolves.toMatchObject({issues:[],checkedFonts:2});
 });
 it('risponde solo ai byte WOFF2 incorporati noti, senza fidarsi del nome o di coperture dichiarate',async()=>{
  const {woff2,woff}=compressedTestFonts(),inspection=new LocalRenderFontCoverage([woff2,woff]),bytes=Buffer.from(woff2.dataBase64,'base64'),ranges=fontCoverage(bytes,'woff2')!;
  expect(inspection.response(bytes)).toEqual({ranges});expect(await inspection.resolveWoff2({...woff2,family:'Nome diverso'})).toEqual(ranges);
  expect(inspection.response(null)).toBeNull();expect(inspection.response(bytes.subarray(0,-1))).toBeNull();expect(inspection.response(Buffer.from(woff.dataBase64,'base64'))).toBeNull();
  expect(await inspection.resolveWoff2({...woff2,dataBase64:Buffer.from('non autorizzato').toString('base64')})).toBeUndefined();expect(await inspection.resolveWoff2(woff)).toBeUndefined();
 });
 it('copia dei byte ammessi e dei risultati: modificare asset o risposta non amplia la copertura',async()=>{
  const {woff2}=compressedTestFonts(),bytes=Buffer.from(woff2.dataBase64,'base64'),inspection=new LocalRenderFontCoverage([woff2]),expected=fontCoverage(bytes,'woff2');
  woff2.dataBase64=Buffer.from('altro').toString('base64');expect(await inspection.resolveWoff2(woff2)).toBeUndefined();
  const response=inspection.response(bytes)!;expect(response.ranges).toEqual(expected);(response.ranges as unknown as number[][])[0]![1]=0x10ffff;
  expect(inspection.response(bytes)).toEqual({ranges:expected});
 });
 it('file noto ma corrotto: resta non verificabile, senza copertura universale',async()=>{
  const {woff2}=compressedTestFonts(),bytes=Buffer.from(woff2.dataBase64,'base64');bytes[48]=bytes[48]!^0xff;const invalid={...woff2,dataBase64:bytes.toString('base64')},inspection=new LocalRenderFontCoverage([invalid]);
  expect(inspection.response(bytes)).toEqual({ranges:null});expect(await inspection.resolveWoff2(invalid)).toBeUndefined();
 });
 it('mantiene il rifiuto di glifi mancanti e stili simulati, non cambia il documento',async()=>{
  const doc=compressedFontDocument(),{woff2}=compressedTestFonts(),inspection=new LocalRenderFontCoverage(doc.fontAssets);doc.objects=[{id:'invalid',type:'text',xMm:4,yMm:4,text:'Ω',fontSizePt:12,fontFamily:woff2.id,fill:'#000000'}];const before=structuredClone(doc);
  await expect(assertOutputFonts(doc,{resolveWoff2:inspection.resolveWoff2})).rejects.toThrow('non contiene Ω');expect(doc).toEqual(before);
  doc.objects[0]={...doc.objects[0]!,type:'text',text:'ABC',fontFamily:woff2.id,fontSizePt:12,fill:'#000000',fontWeight:'bold'};
  await expect(assertOutputFonts(doc,{resolveWoff2:inspection.resolveWoff2})).rejects.toThrow('simulato');
 });
});
