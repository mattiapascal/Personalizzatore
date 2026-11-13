import {expect,it,vi} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createTestDocument} from './helpers/editor-fonts';
import {testPng} from './helpers/png';
import {testJpeg,jpegWithExif} from './helpers/jpeg';
import {fixtureCatalog} from '../src/catalog/adapter';
import {DocumentSchema,DocumentStore,type SceneObject} from '../src/editor/model';
import {joinGraphicPages} from '../src/editor/pages';
import {assertDocumentTextProduction} from '../src/editor/text-production';
import {binaryInkPixels,assertDocumentProduction,guaranteesBinaryRaster,type RasterObject} from '../src/editor/production-check';
import {serverBinaryRasterCheck} from '../scripts/editor-production-raster';
import {rasterSourceFromBytes} from '../src/editor/raster-source';
import {DEFAULT_RASTER} from '../src/editor/raster-processing';
import {ConfigurationStore} from '../scripts/configuration-store';
const product=fixtureCatalog.list()[0]!,catalog={version:fixtureCatalog.version,products:fixtureCatalog.list()};
function image(rgba=[127,127,127,255],raster:RasterObject['raster']={...DEFAULT_RASTER,backgroundRemoval:'luminance'}):RasterObject{return{id:'image',type:'image',xMm:4,yMm:4,widthMm:8,heightMm:8,source:rasterSourceFromBytes('source',testPng(1,1,new Uint8Array(rgba))),raster};}
function document(objects:SceneObject[]=[image()]){return DocumentSchema.parse({...createTestDocument(product,catalog.version),objects});}
const check=(doc:ReturnType<typeof document>)=>assertDocumentProduction(doc,catalog,serverBinaryRasterCheck,true);
it('campioni binari reali: RGB nascosti ignorati, tutti i livelli intermedi visibili di RGB/alpha respinti',()=>{
 expect(binaryInkPixels(new Uint8Array([0,0,0,255,255,255,255,255,12,255,80,0]))).toBe(true);
 for(let value=1;value<255;value++){expect(binaryInkPixels(new Uint8Array([value,value,value,255]))).toBe(false);expect(binaryInkPixels(new Uint8Array([0,0,0,value]))).toBe(false);}
 expect(binaryInkPixels(new Uint8Array([255,0,0,255]))).toBe(false);expect(()=>binaryInkPixels(new Uint8Array(3))).toThrow('RGBA');
});
it('luminanza: documento valido e correggibile, pixel grigi danno alpha parziale e impediscono la conferma',async()=>{
 const doc=document(),before=structuredClone(doc);expect(()=>assertDocumentTextProduction(doc,catalog,true)).not.toThrow();await expect(check(doc)).rejects.toThrow('converti «image» in B/N');expect(doc).toEqual(before);
});
it.each([[0,0,0,255],[255,255,255,255],[99,99,99,0]])('rimozione bianco da B/N/trasparente ammessa senza conversioni implicite: %j',async(r,g,b,a)=>{await expect(check(document([image([r,g,b,a])]))).resolves.toBeUndefined();});
it('sorgente con alpha parziale e bianco invertito: controllo del risultato reale',async()=>{
 await expect(check(document([image([0,0,0,128])]))).rejects.toThrow('trasparenze parziali');
 await expect(check(document([image([127,127,127,255],{...DEFAULT_RASTER,invert:true,backgroundRemoval:'luminance'})]))).rejects.toThrow('B/N');
 await expect(check(document([image([255,255,255,255],{...DEFAULT_RASTER,invert:true,backgroundRemoval:'luminance'})]))).resolves.toBeUndefined();
});
it('soglia e mezzitoni generano campioni binari anche da fotografie a colori e alpha parziale',async()=>{
 for(const method of ['threshold','ordered','diffusion'] as const){const object=image([90,13,200,128],{...DEFAULT_RASTER,method});expect(guaranteesBinaryRaster(object)).toBe(true);await expect(check(document([object]))).resolves.toBeUndefined();}
 expect(guaranteesBinaryRaster(image())).toBe(false);
});
it('contorni del testo: base e run, eredità, larghezza zero e nessuna falsa violazione per stili non stampati',()=>{
 const doc=createTestDocument(product,catalog.version),fontFamily=doc.fontAssets![0]!.id;
 const text:Extract<SceneObject,{type:'text'}>={id:'title',type:'text',xMm:4,yMm:4,text:'AB\n ',fontSizePt:10,fontFamily,fill:'#000000',stroke:'#000000',strokeMm:.2,strokeOpacity:.5};doc.objects=[text];
 expect(()=>assertDocumentTextProduction(DocumentSchema.parse(doc),catalog,true)).toThrow('title');
 text.characterStyles=[{start:0,end:2,style:{strokeOpacity:1}}];expect(()=>assertDocumentTextProduction(doc,catalog,true)).not.toThrow();
 text.characterStyles=[{start:1,end:2,style:{strokeOpacity:.3}}];text.strokeOpacity=1;expect(()=>assertDocumentTextProduction(doc,catalog,true)).toThrow('title');
 text.strokeMm=0;expect(()=>assertDocumentTextProduction(doc,catalog,true)).not.toThrow();text.characterStyles[0]!.style.strokeMm=.25;expect(()=>assertDocumentTextProduction(doc,catalog,true)).toThrow('title');
 text.characterStyles[0]!.style.stroke='none';expect(()=>assertDocumentTextProduction(doc,catalog,true)).not.toThrow();
 text.strokeMm=.2;text.strokeOpacity=.5;text.text=' \n ';delete text.characterStyles;expect(()=>assertDocumentTextProduction(doc,catalog,true)).not.toThrow();
});
it('riferimenti e gruppi di riferimento esclusi, senza decodificare immagini che non saranno prodotte',async()=>{
 const doc=document(),decode=vi.fn(serverBinaryRasterCheck);doc.groups=[{id:'guides',objectIds:['image'],editor:{reference:true}}];await expect(assertDocumentProduction(doc,catalog,decode,true)).resolves.toBeUndefined();expect(decode).not.toHaveBeenCalled();
 delete doc.groups;doc.objects[0]!.editor={reference:true};await expect(check(doc)).resolves.toBeUndefined();
});
it('targhe libere e timbro a secco non ereditano il vincolo immagini B/N; binding obsoleto resta bloccante',async()=>{
 const free={...document(),productId:null,variantId:null,catalogVersion:null,catalogProductProfileVersion:null},decode=vi.fn(serverBinaryRasterCheck);await expect(assertDocumentProduction(free,catalog,decode,true)).resolves.toBeUndefined();expect(decode).not.toHaveBeenCalled();
 const emboss={...product,mechanism:'emboss' as const};await expect(assertDocumentProduction(document(),{...catalog,products:[emboss]},decode,true)).resolves.toBeUndefined();expect(decode).not.toHaveBeenCalled();
 await expect(assertDocumentProduction({...document(),catalogVersion:'old'},catalog,decode,true)).rejects.toThrow('profilo');
});
it('tutte le pagine controllate con binding proprio e nome della pagina errata; nessuna revisione aggiunta',async()=>{
 const first={...document([]),productId:null,variantId:null,catalogVersion:null,catalogProductProfileVersion:null},second=document(),book=joinGraphicPages([first,second],['Targa','Impronta']);const before=structuredClone(book);await expect(check(book)).rejects.toThrow('Impronta: Il timbro richiede immagini');expect(book).toEqual(before);
 second.objects[0]!.editor={reference:true};await expect(check(joinGraphicPages([first,second]))).resolves.toBeUndefined();
});
it('risultati riutilizzati per contenuto e parametri, non per ID o nome',async()=>{
 const first=image([0,0,0,255]),second={...first,id:'other',source:{...first.source,id:'alias'}},third={...second,id:'invert',raster:{...second.raster,invert:true}},doc=document([first,second,third]),decode=vi.fn(serverBinaryRasterCheck);
 await expect(assertDocumentProduction(doc,catalog,decode,true)).resolves.toBeUndefined();expect(decode).toHaveBeenCalledTimes(2);
});
it('controllo oltre la prima striscia: campioni rimossi ignorati, ritaglio ampliato ricontrollato',async()=>{
 const pixels=new Uint8Array(1*260*4);for(let i=0;i<pixels.length;i+=4)pixels.set([0,0,0,255],i);pixels.set([127,127,127,255],4*259);
 const object={...image(),source:rasterSourceFromBytes('tall',testPng(1,260,pixels)),crop:{leftPx:0,topPx:0,widthPx:1,heightPx:1}};await expect(check(document([object]))).resolves.toBeUndefined();object.crop={leftPx:0,topPx:0,widthPx:1,heightPx:260};object.widthMm=8/260;await expect(check(document([object]))).rejects.toThrow('pixel del ritaglio');
});
it('manuale/AI correggono lo stesso documento; Undo recupera anche il problema, Redo la confermabilità',async()=>{
 const doc=document(),store=new DocumentStore(doc,()=>({widthMm:8,heightMm:8}));await expect(check(store.document)).rejects.toThrow('B/N');
 store.dispatch({schemaVersion:1,tool:'updateObject',expectedRevision:0,objectId:'image',arguments:{object:{...doc.objects[0],raster:{...DEFAULT_RASTER}}}},'manual');await expect(check(store.document)).resolves.toBeUndefined();store.undo();await expect(check(store.document)).rejects.toThrow('B/N');store.redo();await expect(check(store.document)).resolves.toBeUndefined();
 const before=structuredClone(store.document),changed={...store.document.objects[0],raster:{...DEFAULT_RASTER,backgroundRemoval:'luminance'}};store.dispatch({schemaVersion:1,tool:'updateObject',expectedRevision:store.document.revision,objectId:'image',arguments:{object:changed}},'ai-simulation');await expect(check(store.document)).rejects.toThrow('B/N');expect((store.document.objects[0] as RasterObject).source).toEqual((doc.objects[0] as RasterObject).source);expect(before.objects[0]).not.toEqual(store.document.objects[0]);
});
it('API add/replace atomici: nessuna ricevuta, riga, configurazione o revisione per una grafica non binaria',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'ink-production-'));try{const store=new ConfigurationStore(dir),good=document([image([0,0,0,255])]),args={title:'TEST',document:good,options:{inkColor:'black'},svg:'<svg xmlns="http://www.w3.org/2000/svg"/>',quantity:1},saved=await store.dispatch({tool:'add',requestId:randomUUID(),arguments:args}),before=await store.read(),bad=document();
 const requestId=randomUUID();await expect(store.dispatch({tool:'add',requestId,arguments:{...args,document:bad}})).rejects.toThrow('converti «image»');expect(await store.read()).toEqual(before);
 const {quantity:_,...replacement}=args,line=saved.lines[0]!;await expect(store.dispatch({tool:'replace',requestId:randomUUID(),arguments:{...replacement,document:bad,lineId:line.id,expectedConfigurationId:line.configurationId,expectedVersion:line.version}})).rejects.toThrow('B/N');expect(await store.read()).toEqual(before);
 (bad.objects[0] as RasterObject).raster={...DEFAULT_RASTER};await store.dispatch({tool:'add',requestId,arguments:{...args,document:bad}});expect((await store.read()).lines).toHaveLength(2);
 }finally{await rm(dir,{recursive:true,force:true});}
});
it('API rifiuta ancora immagini originali nei timbri tramite lo schema; la bozza libera le conserva',async()=>{
 const object=image([255,0,0,255],{...DEFAULT_RASTER,mode:'original'}),doc=createTestDocument(product,catalog.version);doc.objects=[object];expect(()=>DocumentSchema.parse(doc)).toThrow('monocromatico');expect(()=>DocumentSchema.parse({...doc,colorMode:'color',productId:null,variantId:null,catalogVersion:null,catalogProductProfileVersion:null})).not.toThrow();
});

it('API decodifica JPEG reali baseline/progressivi/grigi e orientati, senza ammettere CMYK prima di accettare la conversione binaria',async()=>{
 for(const kind of ['baseline','progressive','grayscale'] as const){const source=rasterSourceFromBytes('jpeg-'+kind,jpegWithExif(testJpeg(kind),6)),object={...image(),source,widthMm:8*source.pixelWidth/source.pixelHeight,raster:{...DEFAULT_RASTER}};await expect(check(document([object]))).resolves.toBeUndefined();}
 expect(()=>rasterSourceFromBytes('cmyk',testJpeg('cmyk'))).toThrow('CMYK');
});
