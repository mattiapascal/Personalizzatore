import{expect,it}from'vitest';
import{createDocument,DocumentSchema,DocumentStore,type SceneObject,type Measure}from'../src/editor/model';
import{rasterDocumentUsage,rasterDocumentIssues,MAX_DOCUMENT_IMAGES,MAX_DOCUMENT_SOURCE_PIXELS,MAX_DOCUMENT_FILTER_PIXELS,MAX_DOCUMENT_IMAGE_BYTES}from'../src/editor/raster-document-limits';
import{rasterSourceFromBytes,type RasterSource}from'../src/editor/raster-source';
import{DEFAULT_RASTER}from'../src/editor/raster-processing';
import{testPng,pngChunk}from'./helpers/png';
import{mkdtemp,readFile,rm}from'node:fs/promises';
import{tmpdir}from'node:os';
import{join}from'node:path';
import{EditorAdminStore}from'../scripts/editor-admin-store';
import{multiImageScene}from'./helpers/multi-image-scene';
const bytes=testPng(),source=rasterSourceFromBytes('source',bytes),measure:Measure=o=>o.type==='image'?{widthMm:o.widthMm,heightMm:o.heightMm}:{widthMm:1,heightMm:1};
const image=(i:number,asset=source,original=false):Extract<SceneObject,{type:'image'}>=>({id:`image-${i}`,type:'image',xMm:5+(i%8)*10,yMm:5+Math.floor(i/8)*10,widthMm:6,heightMm:6*asset.pixelHeight/asset.pixelWidth,source:asset,raster:{...DEFAULT_RASTER,...(original?{mode:'original' as const}:{})}});
const document=(objects:SceneObject[])=>({...createDocument(),colorMode:'color' as const,areaMm:{width:100,height:100},objects});
it('32 immagini passano dagli stessi comandi manuali/AI; la trentatreesima non cambia documento o redo',()=>{
 expect(MAX_DOCUMENT_IMAGES).toBe(32);for(const caller of ['manual','ai-simulation']as const){const doc=document([]),store=new DocumentStore(doc,measure),objects=Array.from({length:32},(_,i)=>image(i));store.dispatch({schemaVersion:1,tool:'insertObjects',objectId:objects[0]!.id,expectedRevision:0,arguments:{objects,groups:[]}},caller);expect(DocumentSchema.parse(JSON.parse(JSON.stringify(store.document))).objects).toHaveLength(32);const before=structuredClone(store.document);expect(()=>store.dispatch({schemaVersion:1,tool:'addObject',objectId:'image-32',expectedRevision:1,arguments:{object:image(32)}},caller)).toThrow('32 immagini');expect(store.document).toEqual(before);store.undo();expect(store.document.objects).toEqual([]);store.redo();expect(store.document.objects).toEqual(objects);}
});
it('contenuti identici con ID diversi condividono i pixel originali ma ogni elaborazione e copia incorporata conta',()=>{
 const objects=Array.from({length:8},(_,i)=>image(i,{...source,id:`alias-${i}`}));expect(rasterDocumentUsage(objects)).toEqual({images:8,sourcePixels:4,filterPixels:32,embeddedBytes:8*bytes.length});expect(rasterDocumentUsage(objects.map(o=>({...o,raster:{...o.raster,mode:'original' as const}}))).filterPixels).toBe(0);
 const collision=document([image(0),image(1,rasterSourceFromBytes('source',testPng(1,1,new Uint8Array([0,0,0,255]))))]);expect(()=>DocumentSchema.parse(collision)).toThrow('ID sorgente');
});
it('i tre budget complessivi hanno confini indipendenti, senza abbassare 20 MB / 24 MP per file',()=>{
 const at={images:32,sourcePixels:MAX_DOCUMENT_SOURCE_PIXELS,filterPixels:MAX_DOCUMENT_FILTER_PIXELS,embeddedBytes:MAX_DOCUMENT_IMAGE_BYTES};expect(at).toEqual({images:32,sourcePixels:96000000,filterPixels:96000000,embeddedBytes:80000000});expect(rasterDocumentIssues(at)).toEqual([]);for(const key of ['images','sourcePixels','filterPixels','embeddedBytes']as const){expect(rasterDocumentIssues({...at,[key]:at[key]+1})).toHaveLength(1);}
});
let large:Uint8Array|undefined;
const largeSource=(i:number):RasterSource=>{large??=testPng(6000,4000,new Uint8Array());const bytes=Buffer.concat([large.subarray(0,33),pngChunk('tEXt',Buffer.from(`Comment\0TEST ${i}`)),large.subarray(33)]);return rasterSourceFromBytes(`large-${i}`,bytes);};
it('il modello accetta quattro originali reali da 24 MP e rifiuta il quinto diverso; le copie originali condividono la risorsa',()=>{
 const objects=Array.from({length:4},(_,i)=>image(i,largeSource(i),true));expect(()=>DocumentSchema.parse(document(objects))).not.toThrow();expect(()=>DocumentSchema.parse(document([...objects,image(4,largeSource(4),true)]))).toThrow('originali del progetto');expect(()=>DocumentSchema.parse(document(Array.from({length:32},(_,i)=>image(i,{...objects[0]!.source,id:`copy-${i}`},true))))).not.toThrow();
});
it('cinque elaborazioni da 24 MP restano oltre il budget anche sullo stesso originale condiviso',()=>{
 const asset=largeSource(0),objects=Array.from({length:4},(_,i)=>image(i,asset));expect(()=>DocumentSchema.parse(document(objects))).not.toThrow();expect(()=>DocumentSchema.parse(document([...objects,image(4,asset)]))).toThrow('immagini elaborate');
});
it('l’archivio riapre 32 immagini complete e rifiuta la trentatreesima senza cambiare il file salvato',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'editor-32-images-'));
 try{
  const store=new EditorAdminStore(directory),input=multiImageScene(),command={tool:'saveRecord',expectedRevision:0,arguments:{kind:'template',title:'32 immagini TEST',tags:['TEST'],clientRef:'',document:input}};
  const saved=await store.dispatch(command),id=saved.records[0]!.id;
  expect((await new EditorAdminStore(directory).read()).records[0]!.document).toEqual(input);
  const before=await readFile(join(directory,'state.json')),invalid={...input,objects:[...input.objects,{...input.objects[0]!,id:'extra-image'}]};
  await expect(store.dispatch({...command,expectedRevision:1,arguments:{...command.arguments,document:invalid}})).rejects.toThrow('32 immagini');
  expect(await readFile(join(directory,'state.json'))).toEqual(before);
  const reopened=await store.read();expect(reopened.revision).toBe(1);expect(reopened.records).toHaveLength(1);expect(reopened.records[0]).toMatchObject({id,document:input});
 }finally{await rm(directory,{recursive:true,force:true});}
});
