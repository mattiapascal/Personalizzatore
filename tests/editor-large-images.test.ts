import { ConfigurationStore } from '../scripts/configuration-store';
import { expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { createDocument, DocumentSchema } from '../src/editor/model';
import { rasterSourceFromBytes, validatePngData } from '../src/editor/raster-source';
import { checkedRasterCrop } from '../src/editor/raster-geometry';
import { prepareDraft } from '../src/editor-workflow/drafts';
import { EditorAdminStore } from '../scripts/editor-admin-store';
import { testPng } from './helpers/png';
it('originale oltre 8 MB: documento e archivio isolato oltre 10 MB conservano tutti i byte, senza riduzione',async()=>{
 const metadata=Buffer.alloc(8_100_000,65);metadata.write('TEST\0');const bytes=testPng(2,2,undefined,{kind:'tEXt',data:metadata}),source=rasterSourceFromBytes('large-original',bytes),doc=createDocument();doc.objects=[{id:'photo',type:'image',xMm:5,yMm:5,widthMm:20,heightMm:20,source,raster:{mode:'original',threshold:128,invert:false,whiteTransparent:false}}];doc.fontAssets=[];doc.colorMode='color';
 const draft=prepareDraft(doc,randomUUID(),0,[]);expect(draft.summary.bytes).toBeGreaterThan(10_000_000);expect(draft.document.objects).toEqual(doc.objects);const directory=await mkdtemp(join(tmpdir(),'large-photo-test-'));
 try{const store=new EditorAdminStore(directory);await store.dispatch({tool:'saveRecord',expectedRevision:0,arguments:{kind:'composition',title:'Foto grande TEST',tags:[],clientRef:'',document:doc}});expect((await readFile(join(directory,'state.json'))).length).toBeGreaterThan(10_000_000);const restored=(await new EditorAdminStore(directory).read()).records[0]!.document.objects[0]!;if(restored.type!=='image')throw Error('Tipo inatteso');expect(createHash('sha256').update(Buffer.from(restored.source.dataUrl.split(',')[1]!,'base64')).digest('hex')).toBe(createHash('sha256').update(bytes).digest('hex'));expect(restored).toEqual(doc.objects[0]);const configs=new ConfigurationStore(join(directory,'configurations')),svg=`<svg xmlns="http://www.w3.org/2000/svg"><image href="${source.dataUrl}"/></svg>`;await configs.dispatch({requestId:randomUUID(),tool:'add',arguments:{title:'Foto grande TEST',document:doc,svg,options:{inkColor:'black'},quantity:1}});expect((await configs.read()).configurations[0]!.svg).toBe(svg);}finally{await rm(directory,{recursive:true,force:true});}
},15000);
it('24 MP e lato 12000: PNG effettivo decodificabile e ritagli oltre la vecchia coordinata 4095',async()=>{
 const source=rasterSourceFromBytes('wide-original',testPng(12000,2000));await validatePngData(source.dataUrl);const crop=checkedRasterCrop(source,{leftPx:5000,topPx:0,widthPx:7000,heightPx:2000}),doc=createDocument();doc.objects=[{id:'photo',type:'image',xMm:5,yMm:5,widthMm:70,heightMm:20,source,crop,raster:{threshold:128,invert:false,whiteTransparent:false}}];expect(DocumentSchema.parse(doc).objects[0]).toMatchObject({source:{pixelWidth:12000,pixelHeight:2000},crop});expect(()=>checkedRasterCrop(source,{...crop,leftPx:5001})).toThrow('fuori');
},15000);
