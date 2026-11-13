import { expect,it } from 'vitest';
import { DocumentSchema,DocumentStore,objectCenter,type Measure } from '../src/editor/model';
import { rectangularTextMask,textClipCommands,TextClipMasksSchema,scaleTextClipMasks } from '../src/editor/text-clip-masks';
import { createTestDocument } from './helpers/editor-fonts';
import { captureSelection,clipboardInsertion } from '../src/editor/clipboard';
import { resizeObjectDimension } from '../src/editor/resize-object';
import { archivePreviewContent } from '../src/editor-admin/preview-key';
import type { TextObject } from '../src/editor/text-style';
import { joinGraphicPages } from '../src/editor/pages';
import { selectionBounds } from '../src/editor/selection';
const measure:Measure=o=>o.type==='text'?{widthMm:o.fontSizePt*2*(o.textScaleX??1),heightMm:o.fontSizePt*(o.textScaleY??1)}:{widthMm:10,heightMm:10};
function setup(){const doc=createTestDocument();doc.areaMm={width:200,height:100};const text=doc.objects.find(o=>o.type==='text')! as TextObject;doc.objects=[text];text.textClipMasks=[rectangularTextMask(20,8)];return{doc,text};}
it('frame fisico indipendente dal box e curve normalizzate chiuse; dati degeneri, aperti o eccessivi rifiutati',()=>{
 const mask=rectangularTextMask(20,8);expect(textClipCommands(mask)).toEqual([['M',-10,-4],['L',10,-4],['L',10,4],['L',-10,4],['Z']]);
 for(const extra of[{frameMm:{x:0,y:0,width:0,height:2}},{commands:[['M',0,0],['L',1,1]]},{commands:[['M',1,1],['L',2,1],['L',2,2],['Z']]},{frameMm:{x:NaN,y:0,width:1,height:2}}])expect(()=>TextClipMasksSchema.parse([{...mask,...extra}])).toThrow();
 expect(()=>TextClipMasksSchema.parse(Array.from({length:9},()=>mask))).toThrow();expect(scaleTextClipMasks([mask],2)[0]!.frameMm).toEqual({x:-20,y:-8,width:40,height:16});expect(mask.frameMm.width).toBe(20);
 const{doc,text}=setup();text.textScaleX=10;text.textClipMasks=[{...mask,frameMm:{x:2000,y:0,width:1,height:1}}];expect(()=>DocumentSchema.parse(doc)).toThrow('10 m');
});
it('digitazione e corpo tipografico conservano la maschera; trasformazione geometrica la scala con il font',()=>{
 for(const source of['manual','ai-simulation']as const){const{doc,text}=setup(),store=new DocumentStore(doc,measure),mask=structuredClone(text.textClipMasks),command=(tool:string,args:unknown)=>({schemaVersion:1,tool,expectedRevision:store.document.revision,objectId:text.id,arguments:args});
  store.dispatch(command('setText',{text:'CONTENUTO MOLTO PIU LUNGO'}),source);expect((store.document.objects[0] as TextObject).textClipMasks).toEqual(mask);
  store.dispatch(command('setObjectStyle',{fontSizePt:text.fontSizePt*2,fill:'#000000'}),source);expect((store.document.objects[0] as TextObject).textClipMasks).toEqual(mask);
  const before=structuredClone(store.document),old=before.objects[0] as TextObject;
  store.dispatch(command('transformObject',{xMm:old.xMm,yMm:old.yMm,rotationDeg:20,size:{type:'text',fontSizePt:old.fontSizePt*2,textScaleX:.5}}),source);expect((store.document.objects[0] as TextObject).textClipMasks).toEqual(scaleTextClipMasks(mask!,2));
  store.undo();expect(store.document.objects).toEqual(before.objects);store.redo();expect(DocumentSchema.parse(JSON.parse(JSON.stringify(store.document))).objects).toEqual(store.document.objects);
 }
});
it('dimensioni numeriche e appunti conservano centro, maschera e indipendenza dall’originale',()=>{
 const{doc,text}=setup(),center=objectCenter(text,measure),resized=resizeObjectDimension(text,'width',measure(text).widthMm*2,true,measure) as TextObject;
 expect(resized.textClipMasks).toEqual(scaleTextClipMasks(text.textClipMasks!,2));expect(objectCenter(resized,measure)).toEqual(center);
 const height=resizeObjectDimension(text,'height',measure(text).heightMm*2,false,measure) as TextObject;expect(height.textClipMasks).toEqual(scaleTextClipMasks(text.textClipMasks!,2));expect(height.textScaleX).toBe(.5);
 const copy=captureSelection(doc,[text.id]),target=structuredClone(doc);target.objects=[];const store=new DocumentStore(target,measure);store.dispatch(clipboardInsertion(copy,0,()=> 'pasted'),'manual');expect((store.document.objects[0] as TextObject).textClipMasks).toEqual(text.textClipMasks);(copy.objects[0] as TextObject).textClipMasks![0]!.frameMm.x=99;expect((store.document.objects[0] as TextObject).textClipMasks![0]!.frameMm.x).toBe(-10);
});
it('blocchi, errore atomico e conflitti impediscono la rimozione o alterazione indebita delle maschere',()=>{
 for(const source of['manual','ai-simulation']as const){const{doc,text}=setup();text.editor={transformLocked:true};const store=new DocumentStore(doc,measure);expect(()=>store.dispatch({schemaVersion:1,tool:'updateObject',objectId:text.id,expectedRevision:0,arguments:{object:{...text,textClipMasks:undefined}}},source)).toThrow('Trasformazioni');expect(store.document).toEqual(doc);}
 const{doc,text}=setup(),store=new DocumentStore(doc,measure);const invalid={...text,textClipMasks:[{...text.textClipMasks![0]!,frameMm:{x:0,y:0,width:-1,height:2}}]};expect(()=>store.dispatch({schemaVersion:1,tool:'updateObject',objectId:text.id,expectedRevision:0,arguments:{object:invalid}},'manual')).toThrow();expect(store.document).toEqual(doc);
});
it('cache distingue il frame fisico, JSON vecchi restano privi di maschere e testo su percorso non le perde',()=>{
 const{doc,text}=setup(),before=archivePreviewContent(doc);text.textClipMasks![0]!.frameMm.width+=1;expect(archivePreviewContent(doc)).not.toBe(before);delete text.textClipMasks;expect(DocumentSchema.parse(doc).objects[0]).not.toHaveProperty('textClipMasks');text.textClipMasks=[rectangularTextMask(20,8)];doc.objects.push({id:'guide',type:'line',xMm:5,yMm:30,lengthMm:30,stroke:'#000000',strokeMm:.2});const store=new DocumentStore(doc,measure);expect(()=>store.dispatch({schemaVersion:1,tool:'attachTextToPath',objectId:text.id,expectedRevision:0,arguments:{pathObjectId:'guide'}},'manual')).toThrow('maschera');expect(store.document).toEqual(doc);
});
it('budget complessivo conta anche le maschere dei testi sulle pagine non attive',()=>{
 const{doc,text}=setup(),mask=rectangularTextMask(20,8),commands=Array.from({length:6400},()=>mask.commands).flat();text.textClipMasks=[{...mask,commands}];doc.objects.push({...structuredClone(text),id:'second'});
 expect(DocumentSchema.parse(doc).objects).toHaveLength(2);const other=structuredClone(doc);other.objects=[{...structuredClone(text),id:'third'}];
 expect(()=>joinGraphicPages([doc,other])).toThrow('limiti complessivi');
});
it('i blocchi delle trasformazioni proteggono anche le maschere relative dei vettori già esistenti',()=>{
 const{doc}=setup(),mask=rectangularTextMask(10,10);doc.objects=[{id:'locked',type:'vector',xMm:5,yMm:5,widthMm:10,heightMm:10,commands:mask.commands,fillRule:'nonzero',fill:'#000000',stroke:'none',strokeMm:.1,strokeLineCap:'butt',strokeLineJoin:'miter',strokeMiterLimit:4,editor:{transformLocked:true},clipMasks:[{commands:mask.commands,fillRule:'nonzero',frame:{left:0,top:0,width:1,height:1}}]}];const store=new DocumentStore(doc,measure);for(const source of['manual','ai-simulation']as const)expect(()=>store.dispatch({schemaVersion:1,tool:'updateObject',objectId:'locked',expectedRevision:0,arguments:{object:{...doc.objects[0],clipMasks:undefined}}},source)).toThrow('Trasformazioni');expect(store.document).toEqual(doc);
});
it('la normalizzazione della scala verticale conserva maschere grandi valide anche se il frame locale cresce',()=>{
 const{doc,text}=setup();text.fontSizePt=.1;text.textScaleX=10;text.textClipMasks=[rectangularTextMask(1000,.1)];DocumentSchema.parse(doc);
 const resized=resizeObjectDimension(text,'height',measure(text).heightMm*100,false,measure) as TextObject;expect(resized.textScaleX).toBe(.1);expect(resized.textClipMasks![0]!.frameMm.width).toBeCloseTo(100000,6);expect(()=>DocumentSchema.parse({...doc,objects:[resized]})).not.toThrow();
});
it('un gruppo trasforma anche i punti fisici delle maschere, con un solo comando manuale o AI e Undo atomico',()=>{
 for(const source of['manual','ai-simulation']as const){
  const{doc,text}=setup();text.textScaleX=1.4;text.textSkewXDeg=22;text.rotationDeg=-12;doc.objects.push({...structuredClone(text),id:'second',xMm:90,yMm:30,textScaleX:.8,textSkewXDeg:-18,rotationDeg:9},{...structuredClone(text),id:'third',xMm:125,yMm:30});doc.groups=[{id:'group',objectIds:doc.objects.map(o=>o.id)}];
  const bounds=selectionBounds(doc.objects,measure),pivot={x:bounds.xMm+bounds.widthMm/2,y:bounds.yMm+bounds.heightMm/2},destination={xMm:100,yMm:50},scale=1.3,angle=30*Math.PI/180;
  const point=(o:TextObject)=>{const f=o.textClipMasks![0]!.frameMm,c=objectCenter(o,measure),a=(o.rotationDeg??0)*Math.PI/180,x=f.x*(o.textScaleX??1)+Math.tan((o.textSkewXDeg??0)*Math.PI/180)*f.y*(o.textScaleY??1),y=f.y*(o.textScaleY??1);return{x:c.xMm+x*Math.cos(a)-y*Math.sin(a),y:c.yMm+x*Math.sin(a)+y*Math.cos(a)};};
  const before=doc.objects.map(o=>point(o as TextObject)),store=new DocumentStore(doc,measure),command={schemaVersion:1,tool:'transformObjects',expectedRevision:0,objectId:text.id,arguments:{objectIds:doc.objects.map(o=>o.id),scale,rotationDeg:30,center:destination}};
  expect(()=>store.dispatch({...command,arguments:{...command.arguments,objectIds:[text.id,'second']}},source)).toThrow('intero gruppo');expect(store.document).toEqual(doc);store.dispatch(command,source);expect(store.document.revision).toBe(1);
  for(const[i,o]of store.document.objects.entries()){const p=point(o as TextObject),x=(before[i]!.x-pivot.x)*scale,y=(before[i]!.y-pivot.y)*scale;expect(p.x).toBeCloseTo(destination.xMm+x*Math.cos(angle)-y*Math.sin(angle),6);expect(p.y).toBeCloseTo(destination.yMm+x*Math.sin(angle)+y*Math.cos(angle),6);}
  store.undo();expect(store.document.objects).toEqual(doc.objects);expect(store.document.groups).toEqual(doc.groups);
 }
});
