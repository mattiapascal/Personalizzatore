import {expect,it} from 'vitest';
import {DocumentSchema,DocumentStore,objectCenter,type Measure,type SceneObject} from '../src/editor/model';
import {createTestDocument} from './helpers/editor-fonts';
import {applyCharacterStyle,selectionStyle} from '../src/editor/text-style';
import {objectWithAppearance} from '../src/editor/object-appearance';
import {transformSelection} from '../src/editor/selection';
import {textStrokeFromFabric} from '../src/editor/paint-opacity';
import {pitchprintTextStroke} from '../src/editor/pitchprint-text-stroke';
import {pitchprintTextStyles} from '../src/editor/pitchprint-text-styles';
import {textStrokeEnvelope} from '../src/editor/text-stroke';
import {resizeTextHeight} from '../src/editor/text-sizing';
const text=():Extract<SceneObject,{type:'text'}>=>({...createTestDocument().objects.find(o=>o.type==='text')!,text:'ABC DEF'} as Extract<SceneObject,{type:'text'}>);
const measure:Measure=o=>({widthMm:20+(o.type==='text'&&o.stroke&&o.stroke!=='none'?(o.strokeMm??.25)*4:0),heightMm:10+(o.type==='text'&&o.stroke&&o.stroke!=='none'?(o.strokeMm??.25)*4:0),...(o.type==='text'?{textLayoutWidthMm:20,textLayoutHeightMm:10}:{})});
it('contorno di soli caratteri selezionati, rimozione locale e applicazione al box conservano gli altri stili',()=>{
 const original={...text(),underline:true},selected=applyCharacterStyle(original,{stroke:'#0088cc',strokeMm:.35,strokeOpacity:.4},{start:1,end:3});expect(selected.stroke).toBeUndefined();expect(selectionStyle(selected,1,3).style).toMatchObject({stroke:'#0088cc',strokeMm:.35,strokeOpacity:.4});expect(selectionStyle(selected,0,3).mixed).toContain('stroke');
 const whole=applyCharacterStyle(selected,{stroke:'#000000',strokeMm:.5});expect(whole.characterStyles).toEqual([{start:1,end:3,style:{strokeOpacity:.4}}]);expect(whole.underline).toBe(true);expect(applyCharacterStyle(whole,{stroke:'none'},{start:0,end:1}).characterStyles?.[0]?.style.stroke).toBe('none');expect(original).not.toHaveProperty('stroke');
});
it('manuale e AI usano lo stesso documento, JSON/Undo e rifiuto atomico del colore nei timbri',()=>{
 const doc=createTestDocument();doc.objects=[text()];const store=new DocumentStore(doc,measure);for(const source of ['manual','ai-simulation'] as const){const before=structuredClone(store.document),next=applyCharacterStyle(before.objects[0] as ReturnType<typeof text>,{stroke:'#000000',strokeMm:.4});store.dispatch({schemaVersion:1,tool:'updateObject',objectId:next.id,expectedRevision:before.revision,arguments:{object:next}},source);expect(DocumentSchema.parse(JSON.parse(JSON.stringify(store.document))).objects[0]).toMatchObject({stroke:'#000000',strokeMm:.4});store.undo();expect(store.document.objects).toEqual(before.objects);const snapshot=structuredClone(store.document);const bad=applyCharacterStyle(text(),{stroke:'#0088cc'},{start:1,end:3});expect(()=>store.dispatch({schemaVersion:1,tool:'updateObject',objectId:bad.id,expectedRevision:snapshot.revision,arguments:{object:bad}},source)).toThrow('monocromatico');expect(store.document).toEqual(snapshot);store.redo();expect(store.document.objects[0]).toMatchObject({strokeMm:.4});store.undo();}
});
it('centro conservato per lo stile comune; scala di gruppo e altezza del testo trasformano gli spessori locali',()=>{
 const original=text(),outlined=objectWithAppearance(original,{stroke:'#000000',strokeMm:.5},measure) as ReturnType<typeof text>;expect(objectCenter(outlined,measure)).toEqual(objectCenter(original,measure));outlined.characterStyles=[{start:0,end:1,style:{strokeMm:1}}];const scaled=transformSelection([outlined],{scale:2,rotationDeg:30,center:{xMm:40,yMm:30}},measure)[0]!;expect(scaled).toMatchObject({strokeMm:1,characterStyles:[{style:{strokeMm:2}}]});const high=resizeTextHeight(outlined,20,measure);expect(high.fontSizePt).toBe(outlined.fontSizePt*2);expect(high.strokeMm).toBe(1);expect(high.characterStyles?.[0]?.style.strokeMm).toBe(2);expect(high.textScaleX).toBe(.5);
});
it('alpha nativo del contorno si separa dal colore e un override trasparente conserva il colore sottostante',()=>{
 expect(textStrokeFromFabric('rgba(0,136,204,0.3)')).toEqual({stroke:'#0088cc',strokeOpacity:.3});expect(textStrokeFromFabric('transparent')).toEqual({stroke:'none'});expect(textStrokeFromFabric('black',.5)).toEqual({stroke:'#000000',strokeOpacity:1});expect(textStrokeFromFabric(undefined)).toEqual({});
});
it('importazione: piano fisico verticale, alpha, cap/join/ordine e rifiuto di effetti non rappresentabili',()=>{
 const outlined=pitchprintTextStroke({stroke:'rgba(0,136,204,.3)',strokeWidth:1.2,strokeLineCap:'round',strokeLineJoin:'bevel',paintFirst:'stroke'},.4,false);expect(outlined.canonical).toMatchObject({stroke:'#0088cc',strokeMm:.48,strokeOpacity:.3,strokeLineCap:'round',strokeLineJoin:'bevel',paintFirst:'stroke'});expect(outlined.native).toMatchObject({strokeWidth:1.2,paintFirst:'stroke'});expect(pitchprintTextStroke({stroke:null,strokeWidth:1},.4,false).native.strokeWidth).toBe(1);
 for(const extra of[{strokeWidth:-1},{strokeUniform:true},{strokeLineJoin:'bad'},{strokeMiterLimit:101},{paintFirst:'bad'}])expect(()=>pitchprintTextStroke({stroke:'black',strokeWidth:1,...extra},.4,false)).toThrow();
});
it('override importati ereditano il contorno e possono azzerarlo senza cambiare caratteri o font',async()=>{
 const result=await pitchprintTextStyles({text:'ABC',fontFamily:'Arimo',stroke:'rgba(0,0,0,.5)',strokeWidth:2,styles:{0:{0:{strokeWidth:0},1:{stroke:'#08c',strokeWidth:1},2:{strokeWidth:3}}}},.25,false,async()=>{throw Error('Non risolvere font');});expect(result.characterStyles).toMatchObject([{start:0,end:1,style:{strokeMm:0}},{start:1,end:2,style:{stroke:'#0088cc',strokeMm:.25,strokeOpacity:1}},{start:2,end:3,style:{strokeMm:.75}}]);expect(result.nativeStyles[0]?.[0]).toMatchObject({strokeWidth:0});const fixed=applyCharacterStyle({...text(),stroke:'#000000',strokeMm:.5,characterStyles:result.characterStyles},{stroke:'#ffffff'});expect(fixed.characterStyles?.[0]?.style.strokeMm).toBe(0);
});
it('limiti e involucro conservativo restano distinti dal corpo font e dalla larghezza di impaginazione',()=>{
 expect(textStrokeEnvelope('#000000',2,'miter',4)).toBe(8);expect(textStrokeEnvelope('#000000',2,'round',4)).toBe(2);expect(textStrokeEnvelope('rgba(0,0,0,0)',2,'miter',4)).toBe(0);const doc=createTestDocument();for(const field of ['strokeMm','strokeOpacity'])for(const value of[-1,101,NaN,Infinity])expect(()=>DocumentSchema.parse({...doc,objects:[{...text(),[field]:value}]})).toThrow();
});
