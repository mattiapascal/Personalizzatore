import {expect,it} from 'vitest';
import {DocumentSchema,DocumentStore,type Measure} from '../src/editor/model';
import {DEFAULT_PLAQUE_MOUNTING} from '../src/editor/plaque';
import {pageGeometryRules,mountingGeometryRules,geometryRuleTiles,scanGeometryTile,type GeometryRule} from '../src/editor/production-geometry';
import {mountingGeometryFixture} from './helpers/mounting-geometry';
import {archivePreviewContent} from '../src/editor-admin/preview-key';
import {referenceLayers} from '../src/editor/reference-layers';
const measure:Measure=()=>({widthMm:18,heightMm:5});
const pixel=new Uint8ClampedArray([0,0,0,255]),tile=(x:number,y:number)=>({x:Math.round(x*40),y:Math.round(y*40),width:1,height:1,pixelsPerMm:40});
const command=(doc:ReturnType<typeof mountingGeometryFixture>,mounting=doc.plaque!,areaMm=doc.areaMm)=>({schemaVersion:1,tool:'configurePlaque',objectId:'project',expectedRevision:doc.revision,arguments:{areaMm,mounting}});

it('dati precedenti invariati: assenza del rispetto resta diversa da zero',()=>{
 const doc=mountingGeometryFixture();delete doc.plaque!.clearanceMm;expect(DocumentSchema.parse(doc)).toEqual(doc);
 const rules=mountingGeometryRules(doc);expect(rules).toHaveLength(8);expect(rules[0]!.region?.widthMm).toBe(4);expect(rules[1]!.unconfigured).toMatch(/non definita/);expect([...geometryRuleTiles(rules[1]!)]).toEqual([]);
 doc.plaque!.clearanceMm=0;expect(mountingGeometryRules(doc)[1]!.region).toEqual(mountingGeometryRules(doc)[0]!.region&&{...mountingGeometryRules(doc)[0]!.region!,id:'mounting-clearance-1',label:'Rispetto fissaggio 1'});
});
it('i soli punti selezionati generano cerchi: kit del profilo non selezionati ignorati, colla/staffe senza fori',()=>{
 const doc=mountingGeometryFixture();doc.productionProfile!.fixings=[{id:'74747474-7474-4474-a474-747474747474',label:'Kit disponibile TEST',kind:'kit',drilling:{diameterMm:8,offsetXMm:9,offsetYMm:9,clearanceMm:5,pattern:'four-corners'}}];
 expect(pageGeometryRules(doc).filter(rule=>rule.kind==='mounting-hole').map(rule=>[rule.region!.xMm,rule.region!.yMm])).toEqual([[13,13],[83,13],[13,43],[83,43]]);
 doc.plaque!.method='glue';expect(pageGeometryRules(doc)).toHaveLength(1);doc.plaque={...DEFAULT_PLAQUE_MOUNTING,family:'boxed-sign',method:'brackets'};expect(mountingGeometryRules(doc)).toEqual([]);
});
it('due fori fuoriporta e cambio formato mantengono diametro/rispetto fisici senza scalarli',()=>{
 const doc=mountingGeometryFixture();doc.plaque={...doc.plaque!,family:'doorplate',method:'screws',pattern:'horizontal-pair'};let rules=mountingGeometryRules(doc);expect(rules).toHaveLength(4);expect(rules[1]!.region).toMatchObject({xMm:10,yMm:25,widthMm:10,heightMm:10});
 const store=new DocumentStore(doc,measure,undefined,'admin');store.dispatch(command(doc,doc.plaque,{width:160,height:100}),'manual');rules=mountingGeometryRules(store.document);expect(rules[1]!.region).toMatchObject({xMm:10,yMm:45,widthMm:10,heightMm:10});expect(rules[3]!.region?.xMm).toBe(140);expect(store.document.plaque).toEqual(doc.plaque);
});
it('manuale/AI, copie, Undo/Redo e JSON conservano dati tecnici e posizione della grafica',()=>{
 const source=mountingGeometryFixture(),manual=new DocumentStore(source,measure,undefined,'admin'),ai=new DocumentStore(source,measure,undefined,'admin'),raw=command(source,{...source.plaque!,holeDiameterMm:6,clearanceMm:1.75});manual.dispatch(raw,'manual');ai.dispatch(raw,'ai-simulation');expect(manual.document).toEqual(ai.document);expect(manual.document.objects).toEqual(source.objects);const updated=structuredClone(manual.document);manual.undo();expect(manual.document.plaque).toEqual(source.plaque);manual.redo();expect(manual.document.plaque).toEqual(updated.plaque);expect(DocumentSchema.parse(JSON.parse(JSON.stringify(updated)))).toEqual(updated);expect(source.plaque!.holeDiameterMm).toBe(4);
});
it('misure tecniche riservate all’amministrazione, revisioni e valori errati atomici',()=>{
 const source=mountingGeometryFixture(),customer=new DocumentStore(source,measure);
 for(const mounting of[{...source.plaque!,holeDiameterMm:5},{...source.plaque!,clearanceMm:0}]){expect(()=>customer.dispatch(command(source,mounting),'ai-simulation')).toThrow(/amministrativa/);expect(customer.document).toEqual(source);}
 const admin=new DocumentStore(source,measure,undefined,'admin');for(const raw of[{...command(source),expectedRevision:100},command(source,{...source.plaque!,clearanceMm:-1}),command(source,{...source.plaque!,clearanceMm:101}),command(source,{...source.plaque!,holeDiameterMm:0})]){expect(()=>admin.dispatch(raw,'manual')).toThrow();expect(admin.document).toEqual(source);}
});
it('cambio metodo invalida le misure del precedente accessorio; disposizione/distanze conservano i dati',()=>{
 const doc=mountingGeometryFixture(),store=new DocumentStore(doc,measure);store.dispatch(command(doc,{...doc.plaque!,offsetXMm:20,pattern:'horizontal-pair'}),'manual');expect(store.document.plaque).toMatchObject({holeDiameterMm:4,clearanceMm:3,offsetXMm:20});
 store.dispatch(command(store.document,{...store.document.plaque!,method:'spacer-maxi'}),'ai-simulation');expect(store.document.plaque).toMatchObject({method:'spacer-maxi',holeDiameterMm:null,clearanceMm:null});expect(mountingGeometryRules(store.document).every(rule=>!!rule.unconfigured)).toBe(true);store.undo();expect(store.document.plaque!.holeDiameterMm).toBe(4);
 const legacy=mountingGeometryFixture();legacy.plaque={...legacy.plaque!,method:'glue',offsetXMm:1};const restored=new DocumentStore(legacy,measure);restored.dispatch(command(legacy,{...legacy.plaque!,method:'holes'}),'manual');expect(restored.document.plaque).toMatchObject({holeDiameterMm:null,clearanceMm:null,offsetXMm:1});
});
it('i punti senza diametro sono sconosciuti, senza cerchi di dimensioni inventate',()=>{
 const doc=mountingGeometryFixture();doc.plaque!.holeDiameterMm=null;const rules=mountingGeometryRules(doc);expect(rules.every(rule=>rule.region===undefined&&!!rule.unconfigured)).toBe(true);expect(rules.flatMap(rule=>[...geometryRuleTiles(rule)])).toEqual([]);
});
it('foro e rispetto: veri cerchi, non bbox; contatto incerto distinto dall’interno',()=>{
 const doc=mountingGeometryFixture(),hole=mountingGeometryRules(doc)[0]!,clearance=mountingGeometryRules(doc)[1]!;
 expect(scanGeometryTile(pixel,tile(13.1,13.1),hole,false)).toBeUndefined();expect(scanGeometryTile(pixel,tile(15,15),hole,false)?.status).toBe('overlap');expect(scanGeometryTile(pixel,tile(17,15),hole,false)?.status).toBe('boundary');expect(scanGeometryTile(pixel,tile(18,15),hole,false)).toBeUndefined();expect(scanGeometryTile(pixel,tile(18,15),clearance,false)?.status).toBe('overlap');
});
it('riquadri limitati al foglio anche se la zona di rispetto si estende oltre il bordo',()=>{
 const doc=mountingGeometryFixture();doc.plaque!.clearanceMm=40;const rule=mountingGeometryRules(doc)[1]!;const tiles=[...geometryRuleTiles(rule)];expect(tiles.length).toBeGreaterThan(0);expect(tiles.every(tile=>tile.x>=0&&tile.y>=0&&tile.x+tile.width<=4000&&tile.y+tile.height<=2400&&tile.width<=512&&tile.height<=512)).toBe(true);const huge:GeometryRule={...rule,area:{width:3000,height:3000}};expect([...geometryRuleTiles(huge)].every(tile=>tile.width<=512&&tile.height<=512)).toBe(true);
});
it('zone di rispetto escluse da miniature e riferimenti tecnici: restano i soli simboli dei fori',()=>{
 const doc=mountingGeometryFixture(),key=archivePreviewContent(doc),technical=archivePreviewContent(doc,'technical'),references=referenceLayers(doc);doc.plaque!.clearanceMm=12.5;expect(archivePreviewContent(doc)).toBe(key);expect(archivePreviewContent(doc,'technical')).toBe(technical);const next=referenceLayers(doc);expect(next.foreground?.objects).toEqual(references.foreground?.objects);expect(next.artwork.objects).toEqual(references.artwork.objects);expect(next.background?.objects).toEqual(references.background?.objects);
});
