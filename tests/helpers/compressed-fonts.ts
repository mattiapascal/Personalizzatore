import {readFileSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {FontAssetSchema} from '../../src/editor/font-assets';
import {fontNames} from '../../scripts/font-names';
import {DocumentSchema} from '../../src/editor/model';
import {TEST_DEFAULT_FONT,createTestDocument} from './editor-fonts';

/** Real TEST font bytes, compressed according to WOFF 1.0, not a renamed TTF.
 * Preserve the original tables/checksums and choose compression independently
 * for each table. No font conversion or substitution in application code. */
export function compressedTestWoff(){
 const ttf=Buffer.from(TEST_DEFAULT_FONT.dataBase64,'base64'),count=ttf.readUInt16BE(4),align=(n:number)=>(n+3)&~3,header=Buffer.alloc(44+count*20),chunks:Buffer[]=[];
 let offset=header.length,total=12+count*16,compressedCmap=false;
 header.write('wOFF');header.writeUInt32BE(ttf.readUInt32BE(0),4);header.writeUInt16BE(count,12);header.writeUInt16BE(1,20);
 for(let i=0;i<count;i++){
  const at=12+i*16,tag=ttf.toString('ascii',at,at+4),start=ttf.readUInt32BE(at+8),raw=ttf.subarray(start,start+ttf.readUInt32BE(at+12)),packed=deflateSync(raw),data=packed.length<raw.length?packed:raw,target=44+i*20;
  if(tag==='cmap')compressedCmap=data.length<raw.length;
  header.write(tag,target);header.writeUInt32BE(offset,target+4);header.writeUInt32BE(data.length,target+8);header.writeUInt32BE(raw.length,target+12);header.writeUInt32BE(ttf.readUInt32BE(at+4),target+16);
  chunks.push(data,Buffer.alloc(align(data.length)-data.length));offset+=align(data.length);total+=align(raw.length);
 }
 header.writeUInt32BE(offset,8);header.writeUInt32BE(total,16);
 return {bytes:Buffer.concat([header,...chunks]),compressedCmap};
}
export function compressedTestFonts(){
 const woff=compressedTestWoff(),woff2=readFileSync('fixtures/fonts/ABeeZee-subset.TEST.woff2');
 const assets=([['woff',woff.bytes,'font-21212121-2121-4121-8121-212121212121'],['woff2',woff2,'font-20202020-2020-4020-8020-202020202020']]as const).map(([format,bytes,id])=>FontAssetSchema.parse({id,format,family:fontNames(bytes,format).family!,weight:400,italic:false,label:`${format.toUpperCase()} TEST`,dataBase64:bytes.toString('base64'),licenseText:format==='woff'?TEST_DEFAULT_FONT.licenseText:readFileSync('fixtures/fonts/ABeeZee-OFL.txt','utf8'),sourceUrl:format==='woff'?TEST_DEFAULT_FONT.sourceUrl:'https://fonts.google.com/specimen/ABeeZee'}));
 return{woff:assets[0]!,woff2:assets[1]!,compressedCmap:woff.compressedCmap};
}
export function compressedFontDocument(){
 const {woff,woff2}=compressedTestFonts(),doc=createTestDocument();
 doc.documentId='31313131-3131-4131-8131-313131313131';doc.areaMm={width:100,height:60};doc.productId=doc.variantId=doc.catalogVersion=doc.catalogProductProfileVersion=null;doc.colorMode='color';doc.fontAssets=[woff,woff2];
 doc.objects=[
  {id:'frame',type:'rect',xMm:3,yMm:3,widthMm:94,heightMm:54,fill:'none',stroke:'#0088cc',strokeMm:.3},
  {id:'title',type:'text',xMm:8,yMm:8,text:'PDF - font incorporati',fontFamily:woff.id,fontSizePt:17,fill:'#0088cc'},
  {id:'woff',type:'text',xMm:8,yMm:23,text:'WOFF: Città 123',fontFamily:woff.id,fontSizePt:14,fill:'#000000'},
  {id:'woff2-label',type:'text',xMm:8,yMm:34,text:'WOFF2:',fontFamily:woff.id,fontSizePt:14,fill:'#000000'},
  {id:'woff2',type:'text',xMm:30,yMm:34,text:'ABC Città 123',fontFamily:woff2.id,fontSizePt:14,fill:'#000000'},
  {id:'mixed',type:'text',xMm:8,yMm:46,text:'Stili misti: ABC - xyz',fontFamily:woff.id,fontSizePt:12,fill:'#000000',characterStyles:[{start:13,end:16,style:{fontFamily:woff2.id,fill:'#0088cc'}}]},
 ];return DocumentSchema.parse(doc);
}
