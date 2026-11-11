import { expect, it } from 'vitest';
import { DEFAULT_RASTER, rasterPixels, RasterParametersSchema } from '../src/editor/raster-processing';
import { DocumentSchema, DocumentStore, createDocument, type Measure } from '../src/editor/model';
import { rasterSourceFromBytes } from '../src/editor/raster-source';
import { testPng } from './helpers/png';
import { fixtureCatalog } from '../src/catalog/adapter';
import { assertDocumentTextProduction } from '../src/editor/text-production';
const source=new Uint8ClampedArray([0,0,0,255,255,255,255,255,128,128,128,255,255,0,0,128,12,36,219,0]);
const gray={...DEFAULT_RASTER,mode:'grayscale' as const};
it('RGB in grigi continui, alpha originale e byte sorgente conservati senza soglia',()=>{
 const before=source.slice(),output=rasterPixels(source,gray);expect([...output].slice(0,16)).toEqual([0,0,0,255,255,255,255,255,128,128,128,255,54,54,54,128]);expect(output[19]).toBe(0);expect(source).toEqual(before);
 expect(rasterPixels(source,{...gray,threshold:0})).toEqual(output);expect(rasterPixels(source,{...gray,threshold:255})).toEqual(output);
});
it('bianco in alpha da RGB solo con conversione esplicita; gli originali grigi mantengono la vecchia regola',()=>{
 const result=rasterPixels(source,{...gray,backgroundRemoval:'luminance'});expect([...result]).toEqual([0,0,0,255,0,0,0,0,0,0,0,127,0,0,0,101,0,0,0,0]);expect(()=>rasterPixels(source,{...DEFAULT_RASTER,backgroundRemoval:'luminance'})).toThrow('canali RGB');
 const grays=new Uint8ClampedArray([0,0,0,128,128,128,128,128,255,255,255,255]);expect(rasterPixels(grays,{...gray,backgroundRemoval:'luminance'})).toEqual(rasterPixels(grays,{...DEFAULT_RASTER,backgroundRemoval:'luminance'}));
});
it('tinta sul nero e sfumatura al bianco, oppure tinta costante con alpha proporzionale',()=>{
 expect([...rasterPixels(source,{...gray,tintColor:'#ff0000'})].slice(0,12)).toEqual([255,0,0,255,255,255,255,255,255,128,128,255]);
 expect([...rasterPixels(source,{...gray,tintColor:'#0088cc',backgroundRemoval:'luminance'})]).toEqual([0,136,204,255,0,136,204,0,0,136,204,127,0,136,204,101,0,136,204,0]);
});
it('luminosità, contrasto, inversione e tinta non rendono visibili pixel originalmente trasparenti',()=>{
 expect(rasterPixels(source,{...gray,backgroundRemoval:'luminance',brightness:100})[3]).toBe(0);expect(rasterPixels(source,{...gray,backgroundRemoval:'luminance',brightness:100,invert:true})[3]).toBe(255);
 const inverted=rasterPixels(source,{...gray,backgroundRemoval:'luminance',invert:true});expect(inverted[3]).toBe(0);expect(inverted[7]).toBe(255);expect(inverted[19]).toBe(0);
 const c=rasterPixels(new Uint8ClampedArray([80,80,80,200,180,180,180,100]),{...gray,contrast:100});expect([...c]).toEqual([0,0,0,200,255,255,255,100]);
});
it('parametri ambigui e non validi rifiutati senza cambiare la modalità originale/binaria',()=>{
 for(const params of[{...gray,whiteTransparent:true},{...gray,method:'diffusion'},{...DEFAULT_RASTER,tintColor:'#0088cc'},{...DEFAULT_RASTER,mode:'original',tintColor:'#000000'},{...gray,tintColor:'rgba(0,0,0,.5)'},{...gray,tintColor:'#12345'},{...gray,brightness:Infinity}])expect(()=>RasterParametersSchema.parse(params)).toThrow();
 expect(()=>rasterPixels(new Uint8ClampedArray(7),gray)).toThrow();expect(()=>rasterPixels(source,gray,2)).toThrow();expect(rasterPixels(source,{...DEFAULT_RASTER,mode:'original'})).toEqual(source);
});
it('documento e comandi manuali/AI conservano trattamento, sorgente, crop e storico, vincolo timbro separato',()=>{
 const asset=rasterSourceFromBytes('monochrome-source',testPng(5,1,new Uint8Array(source))),doc=createDocument();doc.fontAssets=[];doc.colorMode='color';doc.areaMm={width:100,height:60};doc.objects=[{id:'photo',type:'image',xMm:10,yMm:10,widthMm:40,heightMm:10,rotationDeg:30,flipX:true,source:asset,crop:{leftPx:.5,topPx:0,widthPx:4,heightPx:1},raster:{...DEFAULT_RASTER,mode:'original'}}];
 const measure:Measure=()=>({widthMm:40,heightMm:10}),store=new DocumentStore(doc,measure),object=doc.objects[0]!;if(object.type!=='image')throw Error();const manual={...object,raster:gray},ai={...manual,raster:{...gray,backgroundRemoval:'luminance' as const,tintColor:'#0088cc'}};
 store.dispatch({schemaVersion:1,tool:'updateObject',objectId:'photo',expectedRevision:0,arguments:{object:manual}},'manual');store.dispatch({schemaVersion:1,tool:'updateObject',objectId:'photo',expectedRevision:1,arguments:{object:ai}},'ai-simulation');expect(DocumentSchema.parse(JSON.parse(JSON.stringify(store.document))).objects).toEqual([ai]);store.undo();expect(store.document.objects).toEqual([manual]);store.redo();expect(store.document.objects).toEqual([ai]);expect(store.document.objects[0]).toMatchObject({source:asset,crop:object.crop,xMm:10,yMm:10,widthMm:40,heightMm:10});
 const product=fixtureCatalog.list()[0]!,catalog={version:fixtureCatalog.version,products:fixtureCatalog.list()},bound=createDocument(product,catalog.version);bound.objects=[manual];expect(()=>DocumentSchema.parse(bound)).not.toThrow();expect(()=>assertDocumentTextProduction(bound,catalog,true)).toThrow('sfumature');bound.objects=[ai];expect(()=>DocumentSchema.parse(bound)).toThrow('monocromatico');expect(()=>assertDocumentTextProduction(doc,undefined)).not.toThrow();
});
