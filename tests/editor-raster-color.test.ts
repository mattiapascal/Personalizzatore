import {expect,it} from 'vitest';
import {rasterPixels,RasterParametersSchema,DEFAULT_RASTER} from '../src/editor/raster-processing';
import {DocumentSchema,DocumentStore} from '../src/editor/model';
import {rasterColorFixture} from './helpers/raster-color';
import {rasterSourceFromBytes} from '../src/editor/raster-source';
import {testPng} from './helpers/png';
import {serverBinaryRasterCheck} from '../scripts/editor-production-raster';
import {guaranteesBinaryRaster,type RasterObject} from '../src/editor/production-check';
import {rasterDocumentUsage} from '../src/editor/raster-document-limits';
const color={...DEFAULT_RASTER,mode:'color' as const};
const input=new Uint8ClampedArray([200,100,50,123,255,0,0,255,0,255,0,128,0,0,255,0]);
it('regolazioni neutre e originale preservano esattamente RGB/alpha e non mutano i byte',()=>{
 for(const params of[{...DEFAULT_RASTER,mode:'original' as const},color,{...color,saturation:100,brightness:0,contrast:0}]){const result=rasterPixels(input,params,2);expect(result).toEqual(input);expect(result).not.toBe(input);}expect([...input]).toEqual([200,100,50,123,255,0,0,255,0,255,0,128,0,0,255,0]);
});
it('saturazione 0 e 200 con riferimenti numerici, nessuna composizione su bianco e alpha invariato',()=>{
 expect([...rasterPixels(input,{...color,saturation:0},2)]).toEqual([118,118,118,123,54,54,54,255,182,182,182,128,18,18,18,0]);
 expect([...rasterPixels(input.slice(0,4),{...color,saturation:200},1)]).toEqual([255,82,0,123]);
 for(const saturation of[0,15.5,100,200]){const output=rasterPixels(input,{...color,saturation},2);expect([output[3],output[7],output[11],output[15]]).toEqual([123,255,128,0]);}
});
it('luminosità e contrasto RGB dopo la saturazione: estremi finiti e grigi stabili',()=>{
 const gray=new Uint8ClampedArray([0,0,0,255,128,128,128,128,255,255,255,0]);expect([...rasterPixels(gray,{...color,saturation:200},3)]).toEqual([...gray]);
 expect([...rasterPixels(gray,{...color,brightness:10},3)]).toEqual([26,26,26,255,154,154,154,128,255,255,255,0]);expect([...rasterPixels(gray,{...color,contrast:-100},3)]).toEqual([128,128,128,255,128,128,128,128,128,128,128,0]);
 expect([...rasterPixels(input.slice(0,4),{...color,saturation:0,contrast:100},1)]).toEqual([0,0,0,123]);
});
it('schema: valori/colori incompatibili e dimensioni RGBA incoerenti rifiutati senza cambiare i vecchi parametri',()=>{
 for(const changes of[{saturation:-1},{saturation:201},{saturation:NaN},{saturation:Infinity},{invert:true},{whiteTransparent:true},{backgroundRemoval:'luminance'},{tintColor:'#0088cc'},{method:'ordered'},{brightness:101},{contrast:-101}])expect(()=>RasterParametersSchema.parse({...color,...changes})).toThrow();
 for(const mode of[undefined,'binary','original','grayscale'])expect(()=>RasterParametersSchema.parse({...DEFAULT_RASTER,mode,saturation:100})).toThrow();
 for(const width of[0,-1,NaN,Infinity,1.5,3])expect(()=>rasterPixels(input,color,width)).toThrow();expect(()=>rasterPixels(input.slice(1),color,1)).toThrow();expect(RasterParametersSchema.parse(DEFAULT_RASTER)).toEqual(DEFAULT_RASTER);
});
it('manuale/AI condividono documento, filtri, crop e sorgente; Undo/Redo, JSON e revisione obsoleta',()=>{
 const doc=rasterColorFixture(),measure=()=>({widthMm:44,heightMm:30}),manual=new DocumentStore(doc,measure),ai=new DocumentStore(doc,measure),image=doc.objects[0] as RasterObject,next={...image,raster:{...color,saturation:35,brightness:12,contrast:-8}},command={schemaVersion:1,tool:'updateObject',objectId:image.id,expectedRevision:0,arguments:{object:next}};
 manual.dispatch(command,'manual');ai.dispatch(command,'ai-simulation');expect(manual.document).toEqual(ai.document);expect(manual.document.objects[0]).toEqual(next);expect({...next,raster:image.raster}).toEqual(image);expect(DocumentSchema.parse(JSON.parse(JSON.stringify(manual.document)))).toEqual(manual.document);manual.undo();expect(manual.document.objects).toEqual(doc.objects);expect(()=>manual.dispatch(command,'manual')).toThrow();manual.redo();expect(manual.document.objects[0]).toEqual(next);
});
it('documenti B/N e blocchi cliente non vengono aggirati dai nuovi parametri',()=>{
 const doc=rasterColorFixture();expect(()=>DocumentSchema.parse({...doc,objects:[doc.objects[1]!],colorMode:'monochrome'})).toThrow('nero/bianco');doc.objects[0]!.editor={selectionLocked:true};const store=new DocumentStore(doc,()=>({widthMm:44,heightMm:30})),image=doc.objects[0] as RasterObject;expect(()=>store.dispatch({schemaVersion:1,tool:'updateObject',objectId:image.id,expectedRevision:0,arguments:{object:{...image,raster:{...color,saturation:0}}}},'ai-simulation')).toThrow('bloccata');expect(store.document).toEqual(doc);
});
it('le regolazioni sono conteggiate come bitmap derivate anche se neutre, nessuna esenzione dalle risorse',()=>{
 const doc=rasterColorFixture(),original=doc.objects[0] as RasterObject,adjusted=doc.objects[1] as RasterObject;expect(rasterDocumentUsage([original,adjusted])).toMatchObject({images:2,sourcePixels:64*40,filterPixels:64*40});expect(rasterDocumentUsage([{...original,raster:color}]).filterPixels).toBe(64*40);
});
it('controllo B/N server valuta realmente i colori elaborati, i grigi e la trasparenza',async()=>{
 const image=rasterColorFixture().objects[0] as RasterObject,source=rasterSourceFromBytes('production-color',testPng(2,1,new Uint8Array([200,100,50,255,30,80,200,255]))),base={...image,crop:undefined,source,raster:color};expect(guaranteesBinaryRaster(base)).toBe(false);await expect(serverBinaryRasterCheck(base)).resolves.toBe(false);await expect(serverBinaryRasterCheck({...base,raster:{...color,saturation:0}})).resolves.toBe(false);await expect(serverBinaryRasterCheck({...base,raster:{...color,brightness:100}})).resolves.toBe(true);await expect(serverBinaryRasterCheck({...base,source:rasterSourceFromBytes('partial',testPng(2,1,new Uint8Array([200,100,50,128,30,80,200,255]))),raster:{...color,brightness:100}})).resolves.toBe(false);
});
