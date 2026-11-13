import {expect,it} from 'vitest';
import {DocumentStore,DocumentSchema,createDocument,objectGeometry,type GraphicDocument,type Measure} from '../src/editor/model';
import {selectionBounds} from '../src/editor/selection';
import {UnverifiedTextGeometryError} from '../src/editor/unverified-text-geometry';
const measure:Measure=object=>object.type==='rect'?{widthMm:object.widthMm+(object.stroke==='none'?0:object.strokeMm),heightMm:object.heightMm+(object.stroke==='none'?0:object.strokeMm)}:object.type==='text'?{widthMm:20,heightMm:8}:{widthMm:10,heightMm:10};
const fixture=():GraphicDocument=>DocumentSchema.parse({...createDocument(),productId:null,variantId:null,catalogVersion:null,catalogProductProfileVersion:null,colorMode:'color',areaMm:{width:120,height:80},objects:[
 {id:'a',type:'rect',xMm:8,yMm:10,widthMm:20,heightMm:12,fill:'#0088cc',stroke:'#000000',strokeMm:.4,rotationDeg:28,skewXDeg:12,mirrorX:true},
 {id:'b',type:'rect',xMm:50,yMm:40,widthMm:30,heightMm:16,fill:'#000000',stroke:'none',strokeMm:.25},
 {id:'c',type:'rect',xMm:95,yMm:60,widthMm:8,heightMm:10,fill:'#000000',stroke:'none',strokeMm:.25},
]});
const command=(args:unknown,expectedRevision=0)=>({schemaVersion:1,tool:'spaceObjects',objectId:'a',expectedRevision,arguments:args});
for(const axis of ['horizontal','vertical'] as const)for(const master of [undefined,'b','c'])it(`${axis}, master ${master??'automatico'}: distanza esatta, contenuti e ordine preservati, UI=AI e Undo/Redo`,()=>{
 const doc=fixture(),args={objectIds:['c','a','b'],axis,gapMm:2.125,...(master?{referenceObjectId:master}:{})},store=new DocumentStore(doc,measure),ai=new DocumentStore(doc,measure);
 store.dispatch(command(args),'manual');ai.dispatch(command(args),'ai-simulation');expect(ai.document).toEqual(store.document);const after=store.document.objects,coordinate=axis==='horizontal'?'xMm':'yMm',other=axis==='horizontal'?'yMm':'xMm',dimension=axis==='horizontal'?'widthMm':'heightMm';
 expect(after.map(object=>object.id)).toEqual(['a','b','c']);expect(after.find(object=>object.id===(master??'a'))).toEqual(doc.objects.find(object=>object.id===(master??'a')));
 for(let i=0;i<after.length;i++){expect({...after[i],[coordinate]:doc.objects[i]![coordinate]}).toEqual(doc.objects[i]);expect(after[i]![other]).toBe(doc.objects[i]![other]);if(i)expect(after[i]![coordinate]-after[i-1]![coordinate]-objectGeometry(after[i-1]!,measure)[dimension]).toBeCloseTo(2.125,9);}
 expect(store.document.revision).toBe(1);expect(DocumentSchema.parse(JSON.parse(JSON.stringify(store.document)))).toEqual(store.document);store.undo();expect(store.document.objects).toEqual(doc.objects);store.redo();expect(store.document.objects).toEqual(after);
});
it('gruppo master: tutti i membri fermi e gli altri oggetti disposti sui due lati',()=>{
 const doc=fixture();const parent=doc.objects[1]!;if(parent.type!=='rect')throw Error('TEST');doc.objects.splice(2,0,{...parent,id:'b-child',xMm:55,yMm:42,widthMm:8,heightMm:4});doc.groups=[{id:'g',objectIds:['b','b-child']}];const store=new DocumentStore(doc,measure);store.dispatch(command({objectIds:doc.objects.map(o=>o.id),axis:'horizontal',gapMm:3,referenceObjectId:'b-child'}),'manual');const objects=store.document.objects,bounds=selectionBounds(doc.objects.filter(o=>o.id.startsWith('b')),measure);expect(objects.filter(o=>o.id.startsWith('b'))).toEqual(doc.objects.filter(o=>o.id.startsWith('b')));expect(bounds.xMm-objects[0]!.xMm-objectGeometry(objects[0]!,measure).widthMm).toBeCloseTo(3,9);expect(objects.find(o=>o.id==='c')!.xMm-bounds.xMm-bounds.widthMm).toBeCloseTo(3,9);expect(store.document.groups).toEqual(doc.groups);
});
it('zero gap e ordine stabile tra oggetti sovrapposti con la stessa posizione',()=>{
 const doc=fixture();doc.objects[1]!.xMm=8;const store=new DocumentStore(doc,measure);store.dispatch(command({objectIds:['b','a'],axis:'horizontal',gapMm:0}),'manual');expect(store.document.objects[0]).toEqual(doc.objects[0]);expect(store.document.objects[1]!.xMm).toBeCloseTo(8+objectGeometry(doc.objects[0]!,measure).widthMm,9);expect(store.document.objects[2]).toEqual(doc.objects[2]);
});
it('comandi errati e limiti geometrici non modificano documento né invalidano Redo',()=>{
 const store=new DocumentStore(fixture(),measure),args={objectIds:['a','b'],axis:'horizontal',gapMm:2};store.dispatch(command(args),'manual');const done=store.document.objects;store.undo();const before=store.document;
 for(const changes of [{gapMm:-1},{gapMm:Infinity},{gapMm:10001},{gapMm:10000},{referenceObjectId:'missing'},{objectIds:['a','missing']},{objectIds:['a','a']},{objectIds:['a']},{objectIds:['b','c']}]){expect(()=>store.dispatch(command({...args,...changes},before.revision),'ai-simulation')).toThrow();expect(store.document).toEqual(before);}
 expect(()=>store.dispatch(command(args,0),'manual')).toThrow();expect(store.document).toEqual(before);store.redo();expect(store.document.objects).toEqual(done);
});
it('gruppi parziali o un solo gruppo non sono due unità indipendenti',()=>{
 const doc=fixture();doc.groups=[{id:'g',objectIds:['a','b']}];const store=new DocumentStore(doc,measure);
 for(const ids of [['a','c'],['a','b']])expect(()=>store.dispatch(command({objectIds:ids,axis:'horizontal',gapMm:2}),'manual')).toThrow();expect(store.document).toEqual(doc);
});
it('blocchi cliente ereditati: nessuna trasformazione parziale; amministratore esplicito consentito',()=>{
 const doc=fixture();doc.groups=[{id:'g',objectIds:['b','c'],editor:{transformLocked:true}}];const args={objectIds:['a','b','c'],axis:'horizontal',gapMm:2},store=new DocumentStore(doc,measure);expect(()=>store.dispatch(command(args),'ai-simulation')).toThrow('bloccate');expect(store.document).toEqual(doc);const admin=new DocumentStore(doc,measure,undefined,'admin');admin.dispatch(command(args),'manual');expect(admin.document.revision).toBe(1);expect(admin.document.groups).toEqual(doc.groups);
});
it('testo non misurabile: errore recuperabile senza spostare neppure gli oggetti precedenti',()=>{
 const doc=fixture();doc.objects.push({id:'t',type:'text',text:'TEST',xMm:110,yMm:10,fontFamily:'Arial',fontSizePt:10,fill:'#000000'});let refuse=false;const guarded:Measure=object=>{if(refuse&&object.type==='text')throw new UnverifiedTextGeometryError('Controlla i font');return measure(object);},store=new DocumentStore(doc,guarded);refuse=true;expect(()=>store.dispatch(command({objectIds:doc.objects.map(o=>o.id),axis:'horizontal',gapMm:2}),'manual')).toThrow(UnverifiedTextGeometryError);expect(store.document).toEqual(doc);
});
