import {expect,it} from 'vitest';
import {coverRasterReplacement} from '../src/editor/raster-replacement';
import {DocumentStore,createDocument,parseGraphicDocument,objectCenter,type Measure} from '../src/editor/model';
import {rasterSourceFromBytes} from '../src/editor/raster-source';
import type {ImageObject} from '../src/editor/raster-geometry';
import {testPng} from './helpers/png';
const source=(id:string,w:number,h:number)=>rasterSourceFromBytes(id,testPng(w,h));
const measure:Measure=o=>o.type==='image'||o.type==='rect'?{widthMm:o.widthMm,heightMm:o.heightMm}:{widthMm:1,heightMm:1};
const image=():ImageObject=>({id:'photo',type:'image',xMm:5,yMm:5,widthMm:20,heightMm:10,source:source('old',64,32),raster:{mode:'original',threshold:128,invert:false,whiteTransparent:false},rotationDeg:30,flipX:true,flipY:true,editor:{label:'Foto',order:2,includeInForm:true,transformLocked:true}});
const document=()=>{const doc=createDocument();doc.colorMode='color';doc.areaMm={width:100,height:60};doc.objects=[image()];return doc;};
it('riempie la cornice senza deformazione, tagliando il nuovo originale al centro su entrambi gli assi',()=>{
 const object=image(),portrait=coverRasterReplacement(object,source('portrait',32,64));
 expect(portrait.crop).toEqual({leftPx:0,topPx:24,widthPx:32,heightPx:16});
 expect(coverRasterReplacement({...object,widthMm:10,heightMm:20},source('wide',64,32)).crop).toEqual({leftPx:24,topPx:0,widthPx:16,heightPx:32});
 expect(coverRasterReplacement(object,source('same',64,32)).crop).toEqual({leftPx:0,topPx:0,widthPx:64,heightPx:32});
 expect(portrait).toMatchObject({xMm:5,yMm:5,widthMm:20,heightMm:10,rotationDeg:30,flipX:true,flipY:true,editor:object.editor,raster:object.raster});
 expect(portrait.widthMm/portrait.crop!.widthPx).toBe(portrait.heightMm/portrait.crop!.heightPx);
 expect(object.source.id).toBe('old');expect(object).not.toHaveProperty('crop');
});
it('sostituzioni ripetute manuali/AI conservano geometria, gruppo, proprietà, JSON e Undo/Redo',()=>{
 const doc=document();doc.groups=[{id:'photo-group',objectIds:['photo'],editor:{label:'Foto cliente',transformLocked:true}}];const store=new DocumentStore(doc,measure),original=structuredClone(store.document);
 for(const [index,newSource] of [source('portrait',32,64),source('wide',80,20),source('square',40,40)].entries()){
  store.dispatch({schemaVersion:1,tool:'replaceImageSource',objectId:'photo',expectedRevision:index,arguments:{source:newSource,fit:'cover'}},index===1?'ai-simulation':'manual');
  const object=store.document.objects[0] as ImageObject;expect(object).toMatchObject({xMm:5,yMm:5,widthMm:20,heightMm:10,rotationDeg:30,flipX:true,flipY:true,editor:doc.objects[0]!.editor,source:newSource});
  expect(store.document.groups).toEqual(doc.groups);expect(parseGraphicDocument(JSON.parse(JSON.stringify(store.document)))).toEqual(store.document);
 }
 const final=structuredClone(store.document);store.undo();expect(store.document.objects[0]).toMatchObject({source:{id:'wide'},widthMm:20,heightMm:10});store.redo();expect(store.document.objects).toEqual(final.objects);
 store.undo();store.undo();store.undo();expect(store.document.objects).toEqual(original.objects);expect(doc).toEqual(original);
});
it('sostituisce una mappa PitchPrint non uniforme con pixel nuovi proporzionati, senza alterare la cornice',()=>{
 const object={...image(),widthMm:25,heightMm:16.25,pixelAspectRatio:15/13,crop:{leftPx:2,topPx:1,widthPx:40,heightPx:30}},replacement=coverRasterReplacement(object,source('new',80,80));
 expect(replacement).not.toHaveProperty('pixelAspectRatio');expect(replacement.crop).toEqual({leftPx:0,topPx:14,widthPx:80,heightPx:52});
 // The cover command must remove the old stretch metadata from the cloned object too.
 const store=new DocumentStore({...document(),objects:[{...image(),widthMm:25,heightMm:10,pixelAspectRatio:1.25}]},measure);
 store.dispatch({schemaVersion:1,tool:'replaceImageSource',objectId:'photo',expectedRevision:0,arguments:{source:source('new',80,80),fit:'cover'}},'manual');expect(store.document.objects[0]).not.toHaveProperty('pixelAspectRatio');
});
it('modalità precedente e contain esplicito mostrano l’intera immagine nel vecchio ingombro, mantenendo il centro',()=>{
 for(const fit of [undefined,'contain'] as const){const store=new DocumentStore(document(),measure),before=store.document.objects[0]!,center=objectCenter(before,measure);
  store.dispatch({schemaVersion:1,tool:'replaceImageSource',objectId:'photo',expectedRevision:0,arguments:{source:source('new',32,64),...(fit?{fit}:{})}},'manual');const object=store.document.objects[0] as ImageObject;
  expect(object.widthMm).toBe(5);expect(object.heightMm).toBe(10);expect(objectCenter(object,measure).xMm).toBeCloseTo(center.xMm,12);expect(objectCenter(object,measure).yMm).toBeCloseTo(center.yMm,12);expect(object).not.toHaveProperty('crop');expect(object).not.toHaveProperty('flipX');expect(object).not.toHaveProperty('flipY');
 }
});
it('richieste obsolete, formato impossibile e fit sconosciuto falliscono senza revisioni parziali o perdita del redo',()=>{
 const store=new DocumentStore(document(),measure);store.dispatch({schemaVersion:1,tool:'replaceImageSource',objectId:'photo',expectedRevision:0,arguments:{source:source('valid',32,64),fit:'cover'}},'manual');const next=structuredClone(store.document.objects);store.undo();const before=structuredClone(store.document);
 for(const arguments_ of [{source:source('tiny',1,1),fit:'cover'},{source:source('valid',32,64),fit:'stretch'}]){expect(()=>store.dispatch({schemaVersion:1,tool:'replaceImageSource',objectId:'photo',expectedRevision:before.revision,arguments:arguments_},'ai-simulation')).toThrow();expect(store.document).toEqual(before);}
 expect(()=>store.dispatch({schemaVersion:1,tool:'replaceImageSource',objectId:'photo',expectedRevision:0,arguments:{source:source('valid',32,64),fit:'cover'}},'manual')).toThrow('obsoleta');expect(store.document).toEqual(before);store.redo();expect(store.document.objects).toEqual(next);
});
it('il cover ammette esattamente un pixel con misure fisiche decimali, ma non una finestra realmente più piccola',()=>{
 for(const scale of [.1,.3,.7,1.1]){const replacement=coverRasterReplacement({...image(),widthMm:scale,heightMm:3*scale},source('one-pixel',1,3));expect(replacement.crop!.widthPx).toBe(1);expect(replacement.crop!.heightPx).toBeCloseTo(3,9);}
 expect(()=>coverRasterReplacement(image(),source('too-small',1,1))).toThrow('meno di un pixel');
});

it('selezione bloccata richiede un campo del modulo anche per cover; non modifica le proprietà del template',()=>{
 const doc=document();doc.objects[0]!.editor={label:'Riservato',selectionLocked:true,includeInForm:false};const store=new DocumentStore(doc,measure);
 const command={schemaVersion:1,tool:'replaceImageSource',objectId:'photo',expectedRevision:0,arguments:{source:source('new',32,64),fit:'cover'}};
 expect(()=>store.dispatch(command,'ai-simulation')).toThrow('Selezione bloccata');expect(store.document).toEqual(doc);
 doc.objects[0]!.editor!.includeInForm=true;const permitted=new DocumentStore(doc,measure);permitted.dispatch(command,'manual');expect(permitted.document.objects[0]!.editor).toEqual(doc.objects[0]!.editor);expect(permitted.document.objects[0]).toMatchObject({widthMm:20,heightMm:10});
});
