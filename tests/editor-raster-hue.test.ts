import {expect,it} from 'vitest';
import {filters} from 'fabric';
import {rasterPixels,DEFAULT_RASTER,RasterParametersSchema} from '../src/editor/raster-processing';
import {hueRotationMatrix} from '../src/editor/raster-hue';
import {rasterColorFixture} from './helpers/raster-color';
import {DocumentStore,DocumentSchema} from '../src/editor/model';
import {serverBinaryRasterCheck} from '../scripts/editor-production-raster';
import type {RasterObject} from '../src/editor/production-check';
const params={...DEFAULT_RASTER,mode:'color' as const};
const rgba=new Uint8ClampedArray(257*4);for(let i=0;i<257;i++)rgba.set([i%256,(i*37)%256,(i*91)%256,i%4===0?0:i%3===0?128:255],i*4);
it('pixel identici al filtro Fabric 2D per 15 angoli, alpha originale e sorgente immutata',()=>{
 const original=rgba.slice();for(const hueDeg of[-180,-137.5,-120,-90,-45,-.1,0,.1,30,45,90,120,137.5,179.99,180]){const filter=new filters.HueRotation({rotation:hueDeg/180}),data=rgba.slice();filter.calculateMatrix();filter.applyTo2d({imageData:{data}} as Parameters<typeof filter.applyTo2d>[0]);expect(rasterPixels(rgba,{...params,hueDeg},257),`${hueDeg}°`).toEqual(data);}expect(rgba).toEqual(original);
});
it('rotazione dei colori primari a ±120°, neutri e grigi invariati anche con alpha zero/parziale',()=>{
 const pixels=new Uint8ClampedArray([255,0,0,255,0,255,0,128,0,0,255,0]);expect([...rasterPixels(pixels,{...params,hueDeg:120},3)]).toEqual([0,255,0,255,0,0,255,128,255,0,0,0]);expect([...rasterPixels(pixels,{...params,hueDeg:-120},3)]).toEqual([0,0,255,255,255,0,0,128,0,255,0,0]);
 const gray=new Uint8ClampedArray([0,0,0,255,127,127,127,128,255,255,255,0]);for(const hueDeg of[-180,-90,0,35.25,90,180])expect(rasterPixels(gray,{...params,hueDeg},3)).toEqual(gray);expect(rasterPixels(rgba,{...params,hueDeg:0},257)).toEqual(rasterPixels(rgba,params,257));
});
it('ordine del filtro: quantizzazione della tonalità prima di saturazione, contrasto e luminosità',()=>{
 const filter=new filters.HueRotation({rotation:65/180}),data=rgba.slice();filter.calculateMatrix();filter.applyTo2d({imageData:{data}} as Parameters<typeof filter.applyTo2d>[0]);const rest={...params,saturation:35,contrast:-10,brightness:12};expect(rasterPixels(rgba,{...rest,hueDeg:65},257)).toEqual(rasterPixels(data,rest,257));
});
it('schema e matrice rifiutano valori oltre limite, non finiti e modalità incompatibili',()=>{
 for(const hueDeg of[-181,181,NaN,Infinity]){expect(()=>hueRotationMatrix(hueDeg)).toThrow();expect(()=>RasterParametersSchema.parse({...params,hueDeg})).toThrow();}for(const mode of[undefined,'binary','original','grayscale'])expect(()=>RasterParametersSchema.parse({...params,mode,hueDeg:0})).toThrow();expect(RasterParametersSchema.parse(DEFAULT_RASTER)).toEqual(DEFAULT_RASTER);
});
it('manuale/AI, JSON, Undo/Redo e reset preservano originale, crop e trasformazioni',()=>{
 const doc=rasterColorFixture(),source=doc.objects[1] as RasterObject,object={...source,raster:{...source.raster,hueDeg:-65}},command={schemaVersion:1,tool:'updateObject',objectId:object.id,expectedRevision:0,arguments:{object}},manual=new DocumentStore(doc,()=>({widthMm:44,heightMm:30})),ai=new DocumentStore(doc,()=>({widthMm:44,heightMm:30}));manual.dispatch(command,'manual');ai.dispatch(command,'ai-simulation');expect(ai.document).toEqual(manual.document);expect(DocumentSchema.parse(JSON.parse(JSON.stringify(manual.document)))).toEqual(manual.document);expect({...object,raster:source.raster}).toEqual(source);manual.undo();expect(manual.document.objects).toEqual(doc.objects);expect(()=>manual.dispatch(command,'manual')).toThrow();manual.redo();expect(manual.document.objects[1]).toEqual(object);
});
it('il risultato colorato o con alpha parziale non ottiene un falso via libera produttivo',async()=>{
 const image=rasterColorFixture().objects[0] as RasterObject;await expect(serverBinaryRasterCheck({...image,raster:{...params,hueDeg:120}})).resolves.toBe(false);await expect(serverBinaryRasterCheck({...image,raster:{...params,hueDeg:120,brightness:100}})).resolves.toBe(false);
});
