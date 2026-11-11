import { testPng } from './helpers/png';
import { rasterSourceFromBytes } from '../src/editor/raster-source';
import { expect, it } from 'vitest';
import { DocumentSchema, DocumentStore, parseGraphicDocument, objectCenter, type SceneObject, type Measure } from '../src/editor/model';
import { paintWithOpacity, textPaintFromFabric } from '../src/editor/paint-opacity';
import { applyCharacterStyle, selectionStyle } from '../src/editor/text-style';
import { objectWithAppearance } from '../src/editor/object-appearance';
import { attachTextPath, detachTextPath } from '../src/editor/text-path-model';
import { assertDocumentTextProduction } from '../src/editor/text-production';
import { fixtureCatalog } from '../src/catalog/adapter';
import { createTestDocument } from './helpers/editor-fonts';
const rect = (): Extract<SceneObject,{type:'rect'}> => ({ id:'rect',type:'rect',xMm:5,yMm:5,widthMm:12,heightMm:8,rotationDeg:30,strokeMm:1,fill:'#0088cc',stroke:'#000000' });
const measure: Measure = object => ({widthMm:'widthMm' in object?object.widthMm:20,heightMm:'heightMm' in object?object.heightMm:8});
function source(){const doc=createTestDocument();doc.colorMode='color';doc.areaMm={width:100,height:60};doc.objects=[rect()];return doc;}
it('alpha separato dal colore, estremi e vecchi JSON sempre opachi senza campi aggiunti',()=>{
 const doc=source();expect(parseGraphicDocument(JSON.parse(JSON.stringify(doc)))).toEqual(doc);expect(paintWithOpacity('#0088cc')).toBe('#0088cc');expect(paintWithOpacity('#0088cc',.35)).toBe('rgba(0,136,204,0.35)');expect(paintWithOpacity('#0088cc',0)).toBe('rgba(0,136,204,0)');expect(paintWithOpacity('none',.5)).toBe('transparent');
 expect(textPaintFromFabric('rgba(0,136,204,0.35)')).toEqual({fill:'#0088cc',fillOpacity:.35});expect(textPaintFromFabric('#000000')).toEqual({fill:'#000000'});expect(textPaintFromFabric('#000000',.5)).toEqual({fill:'#000000',fillOpacity:1});expect(textPaintFromFabric('rgba(0,0,0,0)')).toEqual({fill:'#000000',fillOpacity:0});
});
it('updateObject manuale/AI e JSON conservano alpha indipendenti, ID, geometria, Undo/Redo e conflitti',()=>{
 const doc=source(),store=new DocumentStore(doc,measure),manual={...rect(),fillOpacity:.5,strokeOpacity:.5},ai={...manual,strokeOpacity:.2};
 const command=(object:SceneObject,revision:number)=>({schemaVersion:1,tool:'updateObject',objectId:object.id,expectedRevision:revision,arguments:{object}});
 store.dispatch(command(manual,0),'manual');store.dispatch(command(ai,1),'ai-simulation');expect(parseGraphicDocument(JSON.parse(JSON.stringify(store.document))).objects).toEqual([ai]);
 store.undo();const before=structuredClone(store.document);expect(()=>store.dispatch(command(ai,1),'manual')).toThrow('obsoleta');expect(store.document).toEqual(before);store.redo();expect(store.document.objects).toEqual([ai]);store.undo();store.undo();expect(store.document.objects).toEqual(doc.objects);
});
it('range validato anche per comandi AI: errori atomici non cancellano il Redo',()=>{
 const doc=source(),store=new DocumentStore(doc,measure);store.dispatch({schemaVersion:1,tool:'updateObject',objectId:'rect',expectedRevision:0,arguments:{object:{...rect(),fillOpacity:.5}}},'manual');store.undo();const before=structuredClone(store.document);
 for(const bad of [-.01,1.01,NaN,Infinity])for(const key of ['fillOpacity','strokeOpacity']){expect(()=>store.dispatch({schemaVersion:1,tool:'updateObject',objectId:'rect',expectedRevision:before.revision,arguments:{object:{...rect(),[key]:bad}}},'ai-simulation')).toThrow();expect(store.document).toEqual(before);}
 store.redo();expect(store.document.objects[0]).toMatchObject({fillOpacity:.5});
});
it('stile comune conserva centri e alpha attraverso cambi colore e blocchi delle trasformazioni',()=>{
 const doc=source();doc.objects=[{...rect(),editor:{transformLocked:true}},{...rect(),id:'second',xMm:25}];const store=new DocumentStore(doc,measure),centers=doc.objects.map(object=>objectCenter(object,measure));
 store.dispatch({schemaVersion:1,tool:'styleObjects',objectId:'rect',expectedRevision:0,arguments:{objectIds:['rect','second'],style:{fillOpacity:.4,strokeOpacity:.2}}},'manual');
 store.dispatch({schemaVersion:1,tool:'styleObjects',objectId:'rect',expectedRevision:1,arguments:{objectIds:['rect','second'],style:{fill:'#ff0000'}}},'ai-simulation');expect(store.document.objects.map(object=>objectCenter(object,measure))).toEqual(centers);for(const object of store.document.objects)expect(object).toMatchObject({fill:'#ff0000',fillOpacity:.4,strokeOpacity:.2});
});
it('trasparenza locale sui caratteri, valori misti e applicazione al box senza perdere gli altri stili',()=>{
 const doc=createTestDocument(),original=doc.objects.find(object=>object.type==='text')!;if(original.type!=='text')throw Error();const selected=applyCharacterStyle(original,{fillOpacity:.25},{start:0,end:2});expect(selected.fillOpacity).toBeUndefined();expect(selectionStyle(selected,0,2).style.fillOpacity).toBe(.25);expect(selectionStyle(selected,0,4).mixed).toContain('fillOpacity');
 const whole=applyCharacterStyle(selected,{fillOpacity:.5});expect(whole.fillOpacity).toBe(.5);expect(whole.characterStyles).toBeUndefined();expect(objectWithAppearance(whole,{fill:'#ff0000'},measure)).toMatchObject({fill:'#ff0000',fillOpacity:.5});expect(()=>objectWithAppearance(whole,{strokeOpacity:.5},measure)).toThrow('incompatibile');
});
it('guide del testo su tracciato conservano le due trasparenze dopo applicazione e separazione',()=>{
 const doc=createTestDocument();const text=doc.objects.find(o=>o.type==='text')!;doc.objects=[text,{id:'line',type:'line',xMm:5,yMm:5,lengthMm:40,stroke:'#000000',strokeMm:.5,strokeOpacity:.4,fillOpacity:.2}];
 doc.objects=attachTextPath(doc,text.id,'line',measure);expect(doc.objects[0]).toMatchObject({textPath:{guide:{strokeOpacity:.4,fillOpacity:.2}}});doc.objects=detachTextPath(doc,text.id,'line-restored',measure);expect(doc.objects[0]).toMatchObject({id:'line-restored',strokeOpacity:.4,fillOpacity:.2});DocumentSchema.parse(doc);
});
it('le immagini non acquisiscono campi di riempimento/contorno e i riferimenti colore restano canonici',()=>{
 const doc=source();expect(()=>DocumentSchema.parse({...doc,objects:[{id:'photo',type:'image',xMm:0,yMm:0,widthMm:1,heightMm:1,source:rasterSourceFromBytes('TEST-image',testPng()),raster:{mode:'original',threshold:128,invert:false,whiteTransparent:false},fillOpacity:.5}]})).toThrow();expect(()=>DocumentSchema.parse({...doc,objects:[{...rect(),fill:'rgba(0,0,0,0.5)'}]})).toThrow();expect(()=>DocumentSchema.parse({...doc,objects:[{...rect(),fillOpacity:'0.5'}]})).toThrow();
});
it('trasparenze ammesse nella bozza ma non nella conferma del timbro inchiostrato; riferimenti esclusi',()=>{
 const product=fixtureCatalog.list()[0]!,catalog={version:fixtureCatalog.version,products:fixtureCatalog.list()},doc=createTestDocument(product,catalog.version);doc.objects=[{...rect(),fill:'#000000',fillOpacity:.5}];expect(()=>DocumentSchema.parse(doc)).not.toThrow();expect(()=>assertDocumentTextProduction(doc,catalog,true)).toThrow('trasparenze parziali');
 doc.objects[0]!.editor={reference:true};expect(()=>assertDocumentTextProduction(doc,catalog,true)).not.toThrow();delete doc.objects[0]!.editor;(doc.objects[0]as any).fillOpacity=0;expect(()=>assertDocumentTextProduction(doc,catalog,true)).not.toThrow();
});
