import {expect,it} from 'vitest';
import {inspectorStyleRevision} from '../src/editor/inspector-controller';
import {DocumentStore,type Measure} from '../src/editor/model';
import {inspectorCommitFixture} from './helpers/inspector-commit';
const document=()=>{const doc=inspectorCommitFixture();doc.objects=doc.objects.filter(o=>o.type==='rect');return doc;};
const measure:Measure=o=>{if(o.type!=='rect')throw Error('Fixture rettangoli');return{widthMm:o.widthMm+o.strokeMm,heightMm:o.heightMm+o.strokeMm};};
const move=(revision:number)=>({schemaVersion:1,tool:'moveObjects',objectId:'first',expectedRevision:revision,arguments:{objectIds:['first','second'],deltaXmm:5,deltaYmm:0}});
const style=(revision:number)=>({schemaVersion:1,tool:'styleObjects',objectId:'first',expectedRevision:revision,arguments:{objectIds:['first','second'],style:{strokeMm:.9}}});
it('geometria e stile sulla stessa selezione: due comandi manuali/AI uguali, Undo/Redo distinti',()=>{
 const doc=document(),manual=new DocumentStore(doc,measure),ai=new DocumentStore(doc,measure);for(const [store,source]of[[manual,'manual'],[ai,'ai-simulation']]as const){store.dispatch(move(doc.revision),source);store.dispatch(style(inspectorStyleRevision(doc.revision,{from:doc.revision,to:store.document.revision})),source);}expect(manual.document).toEqual(ai.document);expect(manual.events).toHaveLength(2);const final=structuredClone(manual.document);manual.undo();expect(manual.document.objects.map(o=>o.type==='rect'&&o.strokeMm)).toEqual([.4,.8]);manual.undo();expect(manual.document.objects).toEqual(doc.objects);manual.redo();manual.redo();expect(manual.document.objects).toEqual(final.objects);
});
for(const advance of[undefined,{from:-1,to:0},{from:0,to:2},{from:1,to:2}])it(`revisione concorrente non riapplicata tramite avanzamento non pertinente: ${JSON.stringify(advance)}`,()=>{
 const doc=document(),store=new DocumentStore(doc,measure);store.dispatch(move(doc.revision),'ai-simulation');const before=structuredClone(store.document);expect(()=>store.dispatch(style(inspectorStyleRevision(doc.revision,advance)),'manual')).toThrow();expect(store.document).toEqual(before);expect(store.events).toHaveLength(1);
});
