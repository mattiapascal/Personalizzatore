import {expect,it,vi} from 'vitest';
import {DocumentSchema,DocumentStore,type Measure} from '../src/editor/model';
import {assertDocumentProduction,guaranteesBinaryRaster} from '../src/editor/production-check';
import {serverBinaryRasterCheck} from '../scripts/editor-production-raster';
import {imageOpacityFixture} from './helpers/image-opacity';
import {linkedProfile} from './helpers/production-profile-link';
const measure:Measure=object=>('widthMm'in object?{widthMm:object.widthMm,heightMm:object.heightMm}:{widthMm:5,heightMm:5});
const fixture=()=>{const doc=imageOpacityFixture();doc.objects=doc.objects.filter(o=>o.type==='image');return doc;};

it('opacità facoltativa: il documento storico non aggiunge valori e la geometria resta identica',()=>{
 const doc=fixture();for(const o of doc.objects)if(o.type==='image')delete o.opacity;const legacy=JSON.stringify(doc);expect(JSON.stringify(DocumentSchema.parse(JSON.parse(legacy)))).toBe(legacy);for(const opacity of[0,.25,.65,1]){const next=DocumentSchema.parse({...doc,objects:doc.objects.map(o=>({...o,opacity}))});expect(next.objects.map(({opacity:_,...o}:any)=>o)).toEqual(doc.objects);}
});
it('manuale e AI: updateObject con stesso alpha, originali/filtri/crop invariati, Undo e Redo',()=>{
 const doc=fixture(),a=new DocumentStore(doc,measure),b=new DocumentStore(doc,measure),object={...doc.objects[0]!,opacity:.27},command={schemaVersion:1,tool:'updateObject',objectId:object.id,expectedRevision:doc.revision,arguments:{object}};
 a.dispatch(command,'manual');b.dispatch(command,'ai-simulation');expect(a.document).toEqual(b.document);expect(a.document.objects[0]).toEqual(object);expect(a.document.objects[1]).toEqual(doc.objects[1]);a.undo();expect(a.document.objects).toEqual(doc.objects);a.redo();expect(a.document.objects[0]).toEqual(object);
});
it('selezione di immagini: un comando atomico, gruppi e geometrie non cambiano',()=>{
 const doc=fixture();doc.groups=[{id:'images',objectIds:doc.objects.map(o=>o.id)}];const s=new DocumentStore(doc,measure);s.dispatch({schemaVersion:1,tool:'styleObjects',objectId:doc.objects[0]!.id,expectedRevision:doc.revision,arguments:{objectIds:doc.objects.map(o=>o.id),style:{opacity:.2}}},'manual');expect(s.document.objects).toEqual(doc.objects.map(o=>({...o,opacity:.2})));expect(s.document.groups).toEqual(doc.groups);s.undo();expect(s.document.objects).toEqual(doc.objects);
});
it('rifiuti atomici: valori errati, stile misto, selezione incompatibile e revisione superata',()=>{
 const doc=fixture(),s=new DocumentStore(doc,measure),before=structuredClone(s.document);for(const opacity of[-.1,1.1,NaN,Infinity,'0.5',null])expect(()=>s.dispatch({schemaVersion:1,tool:'updateObject',objectId:doc.objects[0]!.id,expectedRevision:doc.revision,arguments:{object:{...doc.objects[0],opacity}}},'ai-simulation')).toThrow();
 for(const style of[{opacity:.5,fill:'#000000'},{fillOpacity:.5},{opacity:.5,stroke:'none'}])expect(()=>s.dispatch({schemaVersion:1,tool:'styleObjects',objectId:doc.objects[0]!.id,expectedRevision:doc.revision,arguments:{objectIds:doc.objects.map(o=>o.id),style}},'manual')).toThrow();expect(s.document).toEqual(before);expect(s.events).toHaveLength(0);
 const mixed=imageOpacityFixture();mixed.objects=mixed.objects.filter(o=>o.type==='rect'||o.id==='original');const m=new DocumentStore(mixed,measure);expect(()=>m.dispatch({schemaVersion:1,tool:'styleObjects',objectId:mixed.objects[0]!.id,expectedRevision:mixed.revision,arguments:{objectIds:mixed.objects.map(o=>o.id),style:{opacity:.5}}},'manual')).toThrow();expect(m.document).toEqual(mixed);
 expect(()=>s.dispatch({schemaVersion:1,tool:'updateObject',objectId:doc.objects[0]!.id,expectedRevision:doc.revision-1,arguments:{object:{...doc.objects[0],opacity:.3}}},'manual')).toThrow();expect(s.document).toEqual(before);
});
it('blocchi del cliente: selezione protetta rifiutata; blocco geometria consente lo stile senza spostamenti',()=>{
 const doc=fixture();doc.objects[0]!.editor={selectionLocked:true};const s=new DocumentStore(doc,measure),object={...doc.objects[0]!,opacity:.3};expect(()=>s.dispatch({schemaVersion:1,tool:'updateObject',objectId:object.id,expectedRevision:doc.revision,arguments:{object}},'manual')).toThrow('Selezione');doc.objects[0]!.editor={transformLocked:true};const t=new DocumentStore(doc,measure);expect(()=>t.dispatch({schemaVersion:1,tool:'updateObject',objectId:object.id,expectedRevision:doc.revision,arguments:{object:{...doc.objects[0]!,opacity:.3}}},'manual')).not.toThrow();
});
it('controllo B/N server: opacità dell’oggetto distinta dai pixel, anche in soglia e con alpha originale',async()=>{
 const doc=fixture(),base=doc.objects[0]!;if(base.type!=='image')throw Error('Foto TEST');for(const opacity of[0,.25,1]){const image={...base,opacity,raster:{threshold:128,invert:false,whiteTransparent:false}};expect(guaranteesBinaryRaster(image)).toBe(opacity!==.25);expect(await serverBinaryRasterCheck(image)).toBe(opacity!==.25);}
 expect(await serverBinaryRasterCheck({...base,opacity:0})).toBe(true);expect(await serverBinaryRasterCheck({...base,opacity:.5})).toBe(false);
});
it('profili binari: il gate non può essere aggirato con un decoder permissivo; riferimenti esclusi',async()=>{
 const doc=fixture();doc.productionProfile=linkedProfile('engraved-plaque');doc.productionProfile.sizeMode='document';doc.productionProfile.rasterMode='binary';const check=vi.fn(async()=>true);await expect(assertDocumentProduction(doc,undefined,check)).rejects.toThrow('trasparenze parziali');expect(check).not.toHaveBeenCalled();for(const o of doc.objects)o.editor={reference:true};await expect(assertDocumentProduction(doc,undefined,check)).resolves.toBeUndefined();expect(check).not.toHaveBeenCalled();
});
