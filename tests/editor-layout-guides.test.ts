import {expect,it} from 'vitest';
import {cloneGraphicDocument,DocumentSchema,DocumentStore,type Measure} from '../src/editor/model';
import {LayoutGuidesSchema,MAX_LAYOUT_GUIDES,rulerTicks,guidePosition,type LayoutGuides} from '../src/editor/layout-guides';
import {productionDocument} from '../src/editor/object-properties';
import {snapPoint,snapTranslation} from '../src/editor/guides';
import {archivePreviewContent} from '../src/editor-admin/preview-key';
import {graphicPages,selectGraphicPage} from '../src/editor/pages';
import {layerVisibilityFixture} from './helpers/layer-visibility';
const measure:Measure=object=>object.type==='text'?{widthMm:24,heightMm:5}:object.type==='circle'?{widthMm:object.radiusMm*2,heightMm:object.radiusMm*2}:'widthMm'in object?{widthMm:object.widthMm,heightMm:object.heightMm}:{widthMm:1,heightMm:1};
const guides=():LayoutGuides=>({items:[{id:'guide-x',axis:'x',positionMm:67.3},{id:'guide-y',axis:'y',positionMm:41.2}],visible:true,locked:false});
const command=(revision:number,value:LayoutGuides|null)=>({schemaVersion:1,tool:'setLayoutGuides',objectId:'canvas',expectedRevision:revision,arguments:{guides:value}});

it('guide opzionali: vecchio JSON invariato, comandi manuali e AI identici e Undo/Redo',()=>{
 const doc=layerVisibilityFixture(),before=structuredClone(doc);expect(DocumentSchema.parse(doc)).toEqual(doc);
 const manual=new DocumentStore(doc,measure),ai=new DocumentStore(doc,measure);
 manual.dispatch(command(doc.revision,guides()),'manual');ai.dispatch(command(doc.revision,guides()),'ai-simulation');
 expect(manual.document).toEqual(ai.document);expect(manual.document.objects).toEqual(doc.objects);expect(manual.document.fontAssets).toEqual(doc.fontAssets);expect(doc).toEqual(before);
 const next=structuredClone(manual.document);manual.undo();expect(manual.document.layoutGuides).toBeUndefined();manual.redo();expect(manual.document.layoutGuides).toEqual(next.layoutGuides);
});
it('guide: revisione, pagina, ID, coordinate e limiti rifiutati atomicamente',()=>{
 const doc=layerVisibilityFixture(),store=new DocumentStore(doc,measure);
 for(const raw of[command(doc.revision+1,guides()),{...command(doc.revision,guides()),pageId:'wrong-page'},command(doc.revision,{...guides(),items:[...guides().items,guides().items[0]!]}),command(doc.revision,{...guides(),items:[{id:'bad',axis:'x',positionMm:Infinity}]}),command(doc.revision,{...guides(),items:Array.from({length:MAX_LAYOUT_GUIDES+1},(_,i)=>({id:'guide-'+i,axis:'x' as const,positionMm:i}))})]){expect(()=>store.dispatch(raw,'ai-simulation')).toThrow();expect(store.document).toEqual(doc);}
 expect(LayoutGuidesSchema.safeParse({...guides(),items:[{id:'bad id',axis:'z',positionMm:0}]}).success).toBe(false);
});
it('il blocco richiede uno sblocco precedente a spostamento o cancellazione',()=>{
 const doc=layerVisibilityFixture(),store=new DocumentStore(doc,measure);store.dispatch(command(doc.revision,{...guides(),locked:true}),'manual');const locked=structuredClone(store.document);
 for(const value of[null,{...guides(),items:[]},{...guides(),items:[{...guides().items[0]!,positionMm:20}]}])expect(()=>store.dispatch(command(store.document.revision,value),'ai-simulation')).toThrow(/Sblocca/);
 expect(store.document).toEqual(locked);store.dispatch(command(store.document.revision,{...locked.layoutGuides!,visible:false}),'manual');store.dispatch(command(store.document.revision,{...guides(),visible:false,locked:false}),'manual');store.dispatch(command(store.document.revision,null),'manual');expect(store.document.layoutGuides).toBeUndefined();
});
it('cloni e storico non condividono array o singole guide con il chiamante',()=>{
 const doc=layerVisibilityFixture();doc.layoutGuides=guides();const clone=cloneGraphicDocument(doc);clone.layoutGuides!.items[0]!.positionMm=2;expect(doc.layoutGuides.items[0]!.positionMm).toBe(67.3);
 const store=new DocumentStore(doc,measure),value=guides();store.dispatch(command(doc.revision,value),'manual');value.items[0]!.positionMm=3;expect(store.document.layoutGuides!.items[0]!.positionMm).toBe(67.3);
});
it('guide visibili agganciano punti, bordi e centri; nascoste disattivano i bersagli',()=>{
 const doc=layerVisibilityFixture();doc.objects=[{id:'box',type:'rect',xMm:10,yMm:10,widthMm:8,heightMm:8,stroke:'none',strokeMm:.25,fill:'#000000'}];delete doc.groups;doc.layoutGuides=guides();
 expect(snapPoint(doc,{xMm:67.35,yMm:41.24},1,.08,measure)).toMatchObject({xMm:67.3,yMm:41.2,guideXmm:67.3,guideYmm:41.2});
 const snap=snapTranslation(doc,['box'],49.34,23.25,1,.08,measure);expect(snap.deltaXmm).toBeCloseTo(49.3,10);expect(snap.deltaYmm).toBeCloseTo(23.2,10);expect(snap).toMatchObject({guideXmm:67.3,guideYmm:41.2});
 doc.layoutGuides.visible=false;expect(snapPoint(doc,{xMm:67.35,yMm:41.24},1,.08,measure)).toEqual({xMm:67.35,yMm:41.24});
 doc.layoutGuides.visible=true;doc.layoutGuides.locked=true;expect(snapPoint(doc,{xMm:67.35,yMm:41.24},1,.08,measure).xMm).toBe(67.3);
});
it('guide non produttive: chiave miniature e proiezione restano identiche',()=>{
 const doc=layerVisibilityFixture(),output=productionDocument(doc),key=archivePreviewContent(doc),technical=archivePreviewContent(doc,'technical');doc.layoutGuides=guides();
 expect(productionDocument(doc)).toEqual(output);expect(archivePreviewContent(doc)).toBe(key);expect(archivePreviewContent(doc,'technical')).toBe(technical);expect(doc.layoutGuides.items).toHaveLength(2);
});
it('le scene esistenti mantengono guide indipendenti quando si sfogliano o duplicano',()=>{
 const doc=layerVisibilityFixture();doc.layoutGuides=guides();const store=new DocumentStore(doc,measure,undefined,'admin');store.dispatch({schemaVersion:1,tool:'duplicatePage',objectId:'canvas',expectedRevision:doc.revision,arguments:{pageId:'page-1',newPageId:'copy',name:'Copia TEST'}},'manual');
 store.dispatch(command(store.document.revision,{...guides(),items:[{id:'different',axis:'x',positionMm:5}]}),'manual');
 expect(selectGraphicPage(store.document,'page-1').layoutGuides).toEqual(guides());expect(graphicPages(store.document).find(page=>page.pageId==='copy')!.layoutGuides!.items[0]!.positionMm).toBe(5);
});
it('righelli e coordinate fisiche: origine/pan/zoom, numeri negativi e lavoro limitato',()=>{
 expect(guidePosition(320,120,8)).toBe(25);expect(guidePosition(121,120,.5)).toBe(2);expect(guidePosition(119.3,120,2)).toBe(-.35);
 for(const scale of[.08,.5,1,8,32])for(const origin of[-100000,0,123.25,99999]){const ticks=rulerTicks(origin,scale,1400);expect(ticks.length).toBeLessThan(512);expect(ticks.every(tick=>tick.pixel>=-1e-7&&tick.pixel<=1400+1e-7)).toBe(true);for(const tick of ticks)expect(tick.pixel).toBeCloseTo(origin+tick.valueMm*scale,4);const major=ticks.filter(tick=>tick.major);if(major.length>1)expect(major[1]!.pixel-major[0]!.pixel).toBeGreaterThanOrEqual(60-1e-7);}
 expect(rulerTicks(0,0,100)).toEqual([]);expect(rulerTicks(NaN,8,100)).toEqual([]);
});
