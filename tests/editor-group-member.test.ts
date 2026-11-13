import {expect,it} from 'vitest';
import {createDocument,DocumentStore,DocumentSchema,SceneObjectSchema,type Measure,type GraphicDocument} from '../src/editor/model';
import {selectableObjectIds} from '../src/editor/object-properties';
import {captureSelection,clipboardInsertion} from '../src/editor/clipboard';
import {canReorderGroupMember,withObjectTargetScope} from '../src/editor/group-member';
const measure:Measure=object=>'widthMm'in object?{widthMm:object.widthMm,heightMm:object.heightMm}:{widthMm:8,heightMm:4};
function fixture():GraphicDocument{return DocumentSchema.parse({...createDocument(),documentId:'11111111-1111-4111-8111-111111111111',areaMm:{width:100,height:60},objects:['a','b','c','d','outside'].map((id,index)=>({id,type:'rect',xMm:3+index*10,yMm:5,widthMm:5,heightMm:4,stroke:'none',strokeMm:.25,fill:'#000000'})),groups:[{id:'root',objectIds:['a','b','c','d']},{id:'inner',parentId:'root',objectIds:['a','b']} ]});}
const command=(revision:number,tool:string,args:unknown,id='a',direct=true)=>({schemaVersion:1,tool,expectedRevision:revision,objectId:id,arguments:args,...(direct?{targetScope:'object'}:{})});
it('ambito esplicito condiviso manuale/AI, gruppo e fratelli invariati, Undo/Redo e riapertura',()=>{
 const doc=fixture(),store=new DocumentStore(doc,measure);expect(()=>store.dispatch(command(0,'moveObject',{xMm:7,yMm:8},'a',false),'manual')).toThrow('Separa');
 store.dispatch(command(0,'moveObject',{xMm:7,yMm:8}),'manual');expect(store.document.objects.slice(1)).toEqual(doc.objects.slice(1));expect(store.document.groups).toEqual(doc.groups);
 store.dispatch(command(1,'transformObject',{xMm:7,yMm:8,rotationDeg:20,size:{type:'rect',widthMm:8,heightMm:6}}),'ai-simulation');expect(store.document.objects[0]).toMatchObject({widthMm:8,rotationDeg:20});expect(store.document.groups).toEqual(doc.groups);
 store.undo();store.undo();expect(store.document.objects).toEqual(doc.objects);store.redo();store.redo();const reopened=DocumentSchema.parse(JSON.parse(JSON.stringify(store.document)));expect(reopened.groups).toEqual(doc.groups);expect(store.events.map(event=>event.source).slice(0,2)).toEqual(['manual','ai-simulation']);
});
it('selezione normale completa e selezione diretta rispettano i blocchi ereditati e del singolo elemento',()=>{
 const doc=fixture();doc.objects[1]!.editor={selectionLocked:true};expect(selectableObjectIds(doc,['a'],'customer')).toEqual([]);expect(selectableObjectIds(doc,['a'],'customer',true)).toEqual(['a']);expect(selectableObjectIds(doc,['b'],'customer',true)).toEqual([]);
 doc.groups![0]!.editor={selectionLocked:true};expect(selectableObjectIds(doc,['a'],'customer',true)).toEqual([]);expect(selectableObjectIds(doc,['a'],'admin',true)).toEqual(['a']);
});
it('ambito diretto non aggira trasformazioni, selezione o eliminazione bloccate e non perde il redo',()=>{
 for(const lock of['transformLocked','selectionLocked','deleteLocked']as const){const doc=fixture();doc.groups![0]!.editor={[lock]:true};const store=new DocumentStore(doc,measure),tool=lock==='deleteLocked'?'deleteObject':'moveObject',args=tool==='deleteObject'?{}:{xMm:9,yMm:8};expect(()=>store.dispatch(command(0,tool,args),'ai-simulation')).toThrow('bloccat');expect(store.document).toEqual(doc);expect(store.events).toEqual([]);}
});
it('duplica il solo membro nello stesso ramo, con ID nuovi e contiguità di tutti gli antenati',()=>{
 const doc=fixture(),store=new DocumentStore(doc,measure);store.dispatch(command(0,'duplicateObject',{newObjectId:'copy-a',xMm:8,yMm:9}),'manual');expect(store.document.objects.map(object=>object.id)).toEqual(['a','copy-a','b','c','d','outside']);expect(store.document.groups?.map(group=>group.objectIds)).toEqual([['a','copy-a','b','c','d'],['a','copy-a','b']]);expect(store.document.objects.filter(object=>object.id!=='copy-a')).toEqual(doc.objects);store.undo();expect(store.document).toMatchObject({objects:doc.objects,groups:doc.groups});
});
it('elimina soltanto il membro, conserva gli altri e rimuove solo gruppi diventati vuoti',()=>{
 const doc=fixture(),store=new DocumentStore(doc,measure);store.dispatch(command(0,'deleteObject',{}),'manual');expect(store.document.groups?.map(group=>group.objectIds)).toEqual([['b','c','d'],['b']]);expect(store.document.objects).toEqual(doc.objects.slice(1));store.dispatch(command(1,'deleteObject',{},'b'),'ai-simulation');expect(store.document.groups).toEqual([{id:'root',objectIds:['c','d']}]);store.undo();store.undo();expect(store.document.objects).toEqual(doc.objects);expect(store.document.groups).toEqual(doc.groups);
});
it('ordine del membro limitato al contenitore più interno, senza spezzare altri sottogruppi',()=>{
 const store=new DocumentStore(fixture(),measure);expect(canReorderGroupMember(store.document,'a','back')).toBe(false);expect(canReorderGroupMember(store.document,'a','front')).toBe(true);store.dispatch(command(0,'reorderObject',{position:'front'}),'manual');expect(store.document.objects.map(object=>object.id)).toEqual(['b','a','c','d','outside']);store.dispatch(command(1,'reorderObject',{position:'back'},'c'),'manual');expect(store.document.objects.map(object=>object.id)).toEqual(['c','b','a','d','outside']);expect(store.document.groups).toEqual(fixture().groups);
});
it('copia il solo oggetto con font e proprietà ereditate, senza portare i fratelli o perdere reference',()=>{
 const doc=fixture();doc.groups![0]!.editor={reference:true,transformLocked:true};const copied=captureSelection(doc,['a'],true);expect(copied.objects).toHaveLength(1);expect(copied.groups).toEqual([]);expect(copied.objects[0]!.editor).toMatchObject({reference:true,transformLocked:true});expect(captureSelection(doc,['a']).objects).toHaveLength(4);const target=new DocumentStore({...createDocument(),objects:[]},measure);target.dispatch(clipboardInsertion(copied,0,()=> 'pasted'),'manual');expect(target.document.objects[0]!.editor?.reference).toBe(true);
});
it('ambito non applicabile, revisioni obsolete e ID sconosciuti rifiutati senza mutazioni',()=>{
 const store=new DocumentStore(fixture(),measure);for(const raw of[command(0,'moveObjects',{objectIds:['a'],deltaXmm:2,deltaYmm:0}),command(9,'moveObject',{xMm:8,yMm:9}),command(0,'deleteObject',{},'missing')])expect(()=>store.dispatch(raw,'manual')).toThrow();expect(store.document).toEqual(fixture());expect(store.events).toEqual([]);
});
it('l’adattatore UI rende esplicito solo il comando del membro selezionato, senza sanare un ambito invalido',()=>{
 const raw=command(0,'moveObject',{xMm:8,yMm:9},'a',false);expect(withObjectTargetScope(raw,'a')).toEqual({...raw,targetScope:'object'});expect(withObjectTargetScope(raw,'b')).toBe(raw);const invalid={...raw,targetScope:'invalid'};expect(withObjectTargetScope(invalid,'a')).toBe(invalid);
});
it('estrae un membro dal gruppo alla radice preservando geometrie, fratelli e Undo/Redo',()=>{
 const doc=fixture(),store=new DocumentStore(doc,measure);store.dispatch(command(0,'placeGroupMember',{parentGroupId:null,targetObjectId:'outside',side:'above'},'a',false),'manual');expect(store.document.objects.map(object=>object.id)).toEqual(['b','c','d','outside','a']);expect(store.document.objects.find(object=>object.id==='a')).toEqual(doc.objects[0]);expect(store.document.groups?.map(group=>group.objectIds)).toEqual([['b','c','d'],['b']]);store.undo();expect(store.document.groups).toEqual(doc.groups);expect(store.document.objects).toEqual(doc.objects);store.redo();expect(store.document.objects.at(-1)?.id).toBe('a');
});
it('sposta fra contenitori annidati e riordina senza interrompere altri sottogruppi',()=>{
 const doc=fixture(),store=new DocumentStore(doc,measure);store.dispatch(command(0,'placeGroupMember',{parentGroupId:'root',targetObjectId:'c',side:'above'},'a',false),'ai-simulation');expect(store.document.objects.map(object=>object.id)).toEqual(['b','c','a','d','outside']);expect(store.document.groups?.find(group=>group.id==='inner')?.objectIds).toEqual(['b']);store.dispatch(command(1,'placeGroupMember',{parentGroupId:'inner',targetObjectId:'b',side:'above'},'outside',false),'manual');expect(store.document.objects.map(object=>object.id)).toEqual(['b','outside','c','a','d']);expect(store.document.groups?.find(group=>group.id==='inner')?.objectIds).toEqual(['b','outside']);for(const original of doc.objects)expect(store.document.objects.find(object=>object.id===original.id)).toEqual(original);
});
it('estrazione amministrativa conserva i blocchi/reference ereditati; il cliente non può aggirarli',()=>{
 const doc=fixture();doc.groups![0]!.editor={reference:true,deleteLocked:true};const customer=new DocumentStore(doc,measure);expect(()=>customer.dispatch(command(0,'placeGroupMember',{parentGroupId:null,side:'above'},'a',false),'manual')).toThrow('bloccato');expect(customer.document).toEqual(doc);const admin=new DocumentStore(doc,measure,undefined,'admin');admin.dispatch(command(0,'placeGroupMember',{parentGroupId:null,side:'above'},'a',false),'manual');expect(admin.document.objects.find(object=>object.id==='a')!.editor).toMatchObject({reference:true,deleteLocked:true});
});
it('un contenitore o livello incompatibile è rifiutato atomicamente',()=>{
 const doc=fixture(),store=new DocumentStore(doc,measure);for(const args of[{parentGroupId:'unknown',side:'above'},{parentGroupId:'inner',targetObjectId:'outside',side:'above'},{parentGroupId:null,targetObjectId:'a',side:'below'}])expect(()=>store.dispatch(command(0,'placeGroupMember',args,'a',false),'manual')).toThrow();expect(store.document).toEqual(doc);expect(store.events).toEqual([]);
});
it('riordino nello stesso contenitore conserva i blocchi; ingresso in un gruppo protetto rifiutato',()=>{
 const doc=fixture();doc.groups![0]!.editor={deleteLocked:true};const store=new DocumentStore(doc,measure);store.dispatch(command(0,'placeGroupMember',{parentGroupId:'inner',targetObjectId:'b',side:'above'},'a',false),'manual');expect(store.document.objects.map(object=>object.id)).toEqual(['b','a','c','d','outside']);expect(store.document.groups).toEqual(doc.groups);const before=structuredClone(store.document);expect(()=>store.dispatch(command(1,'placeGroupMember',{parentGroupId:'inner',side:'above'},'outside',false),'manual')).toThrow('bloccato');expect(store.document).toEqual(before);
});
it('riempimento di un vettore con foro cambia soltanto il colore del membro',()=>{
 const doc=fixture();doc.colorMode='color';doc.objects[0]=SceneObjectSchema.parse({id:'a',type:'vector',xMm:3,yMm:5,widthMm:5,heightMm:4,commands:[['M',0,0],['L',1,0],['L',1,1],['L',0,1],['Z'],['M',.1,.1],['L',.9,.1],['L',.9,.9],['L',.1,.9],['Z']],fillRule:'evenodd',fill:'#000000',stroke:'none',strokeMm:.25,strokeLineCap:'butt',strokeLineJoin:'miter',strokeMiterLimit:4});const store=new DocumentStore(doc,measure);store.dispatch(command(0,'updateObject',{object:{...doc.objects[0],fill:'#08cc88'}}),'manual');expect(store.document.objects[0]).toEqual({...doc.objects[0],fill:'#08cc88'});expect(store.document.objects.slice(1)).toEqual(doc.objects.slice(1));expect(store.document.groups).toEqual(doc.groups);
});
it('estrae anche l’ultimo elemento di un gruppo etichettato senza blocchi, rimuovendo i contenitori vuoti',()=>{
 const doc=fixture();doc.groups!.forEach(group=>{group.objectIds=['a'];group.editor={label:'Solo nome, nessun blocco'};});doc.objects=doc.objects.filter(object=>object.id==='a'||object.id==='outside');const store=new DocumentStore(doc,measure);store.dispatch(command(0,'placeGroupMember',{parentGroupId:null,side:'above'},'a',false),'manual');expect(store.document.groups).toBeUndefined();expect(store.document.objects.find(object=>object.id==='a')).toEqual(doc.objects[0]);store.undo();expect(store.document.groups).toEqual(doc.groups);
});
it('colore e rotazione implicita zero non violano il blocco geometrico; una rotazione effettiva resta rifiutata',()=>{
 const doc=fixture();doc.colorMode='color';doc.groups![0]!.editor={transformLocked:true};const store=new DocumentStore(doc,measure);store.dispatch(command(0,'updateObject',{object:{...doc.objects[0],fill:'#08cc88',rotationDeg:0}}),'manual');expect(store.document.objects[0]).toMatchObject({fill:'#08cc88',rotationDeg:0});expect(store.document.groups).toEqual(doc.groups);const before=structuredClone(store.document);expect(()=>store.dispatch(command(1,'updateObject',{object:{...store.document.objects[0],rotationDeg:1}}),'ai-simulation')).toThrow('bloccate');expect(store.document).toEqual(before);
});
