import{expect,it}from'vitest';
import{DocumentSchema,DocumentStore,cloneGraphicDocument,objectCenter,type GraphicDocument,type Measure}from'../src/editor/model';
import{createTestDocument}from'./helpers/editor-fonts';
import{captureSelection,clipboardInsertion}from'../src/editor/clipboard';
import{effectiveObjectProperties,formEntries,formSelection,productionDocument,selectableObjectIds,validateObjectInputs}from'../src/editor/object-properties';
import{expandSelection,selectionUnits}from'../src/editor/selection';
const measure:Measure=object=>object.type==='text'?{widthMm:Array.from(object.text).length,heightMm:4}:object.type==='rect'?{widthMm:object.widthMm,heightMm:object.heightMm}:{widthMm:4,heightMm:4};
function fixture():GraphicDocument{const doc=createTestDocument();doc.areaMm={width:100,height:60};doc.objects=['a','b','c'].map((id,index)=>({id,type:'rect',xMm:5+index*8,yMm:5,widthMm:4,heightMm:4,stroke:'none',fill:'#000000',strokeMm:.25}));doc.groups=[{id:'root',objectIds:['a','b','c'],editor:{label:'Logo',order:5,includeInForm:true}},{id:'inside',parentId:'root',objectIds:['a','b'],editor:{label:'Simbolo',order:1,includeInForm:true}},{id:'single',parentId:'root',objectIds:['c'],editor:{label:'Punto'}}];return doc;}
const command=(store:DocumentStore,tool:string,arguments_:unknown,objectId='a')=>({schemaVersion:1,tool,objectId,arguments:arguments_,expectedRevision:store.document.revision});
it('gerarchia canonica: padri prima dei figli, appartenenza e contiguità validate; nessun ciclo o sovrapposizione fra fratelli',()=>{
 const doc=fixture();expect(DocumentSchema.parse(doc).groups).toEqual(doc.groups);for(const groups of [[doc.groups![1],doc.groups![0]],doc.groups!.map(group=>group.id==='root'?{...group,parentId:'inside'}:group),[doc.groups![0],{...doc.groups![1],objectIds:['a','missing']}],[doc.groups![0],doc.groups![1],{...doc.groups![2],objectIds:['b','c']}],[doc.groups![0],{...doc.groups![1],parentId:undefined}]])expect(DocumentSchema.safeParse({...doc,groups}).success).toBe(false);
 expect(expandSelection(doc,['b'])).toEqual(['a','b','c']);expect(selectionUnits(doc,['a','b','c'])).toHaveLength(1);expect(formEntries(doc).map(entry=>entry.editor?.label)).toEqual(['Simbolo','Logo']);expect(formSelection(doc,formEntries(doc)[0]!)).toMatchObject({id:'a',label:'Logo'});
});
it('clone, duplicazione e appunti rimappano tutta la gerarchia e non condividono le proprietà',()=>{
 const store=new DocumentStore(fixture(),measure,undefined,'admin'),saved=store.document;store.dispatch(command(store,'duplicateObjects',{copies:['a','b','c'].map(id=>({objectId:id,newObjectId:`copy-${id}`})),groups:['root','inside','single'].map(id=>({groupId:id,newGroupId:`copy-${id}`}))}),'ai-simulation');
 expect(store.document.groups!.slice(3).map(group=>({id:group.id,parentId:group.parentId,label:group.editor?.label}))).toEqual([{id:'copy-root',parentId:undefined,label:'Logo'},{id:'copy-inside',parentId:'copy-root',label:'Simbolo'},{id:'copy-single',parentId:'copy-root',label:'Punto'}]);
 const clipboard=captureSelection(saved,['b']);clipboard.groups[0]!.editor!.label='Copia modificata';expect(store.document.groups![0]!.editor!.label).toBe('Logo');let n=0;const insertion=clipboardInsertion(clipboard,store.document.revision,kind=>`${kind}-pasted-${++n}`);store.dispatch(insertion,'manual');const pasted=store.document.groups!.slice(6);expect(pasted[1]!.parentId).toBe(pasted[0]!.id);expect(pasted[0]!.editor!.label).toBe('Copia modificata');
 const clone=cloneGraphicDocument(store.document);clone.groups![0]!.editor!.label='Estraneo';expect(store.document.groups![0]!.editor!.label).toBe('Logo');store.undo();expect(store.document.groups).toHaveLength(6);store.redo();expect(store.document.groups).toHaveLength(9);
});
it('separazione amministrativa rimuove un solo contenitore e promuove i sottogruppi senza perderne label/ordine',()=>{
 const store=new DocumentStore(fixture(),measure,undefined,'admin');store.dispatch(command(store,'ungroupObjects',{groupIds:['root']}),'manual');expect(store.document.groups!.map(group=>group.id)).toEqual(['inside','single']);expect(store.document.groups!.every(group=>!group.parentId)).toBe(true);expect(store.document.groups![0]!.editor!.order).toBe(1);store.undo();expect(store.document.groups).toEqual(fixture().groups);
});
it('proprietà dei gruppi amministrative, revisionate e annullabili; cliente e AI non aggirano i blocchi o cancellano il contenitore',()=>{
 const admin=new DocumentStore(fixture(),measure,undefined,'admin');admin.dispatch(command(admin,'setGroupProperties',{label:'Logo bloccato',order:2,includeInForm:true,transformLocked:true,deleteLocked:true},'root'),'manual');admin.undo();expect(admin.document.groups![0]!.editor!.label).toBe('Logo');admin.redo();
 const store=new DocumentStore(admin.document,measure),before=store.document;
 for(const source of ['manual','ai-simulation']as const)for(const [tool,args,id]of [['moveObjects',{objectIds:['a','b','c'],deltaXmm:1,deltaYmm:0},'a'],['deleteObjects',{objectIds:['a','b','c']},'a'],['ungroupObjects',{groupIds:['root']},'a'],['setGroupProperties',{},'root']]as const){expect(()=>store.dispatch(command(store,tool,args,id),source)).toThrow();expect(store.document).toEqual(before);}
 const bypass=before.groups!.filter(group=>group.id!=='single').map(group=>group.id==='root'?{...group,objectIds:['a','b']}:group);expect(()=>store.dispatch(command(store,'applyTemplate',{templateId:crypto.randomUUID(),templateVersion:1,objects:before.objects,groups:bypass}),'ai-simulation')).toThrow('struttura');expect(store.document).toEqual(before);
 const inserted={...before.objects[0]!,id:'new'};expect(()=>admin.dispatch(command(admin,'insertObjects',{objects:[inserted],groups:[{id:'bad-group',parentId:'root',objectIds:['new']}]},'new'),'manual')).toThrow('gruppi inseriti');
});
it('riferimenti e blocchi ereditati derivano dai gruppi: escludono produzione/modulo e selezione senza riscrivere i figli',()=>{
 const doc=fixture();doc.groups![0]!.editor={label:'Guida',reference:true,selectionLocked:true};const frozen=structuredClone(doc);expect(effectiveObjectProperties(doc,'b')).toMatchObject({reference:true,selectionLocked:true});expect(doc.objects[1]!.editor).toBeUndefined();expect(productionDocument(doc).objects).toEqual([]);expect(productionDocument(doc).groups).toEqual([]);expect(formEntries(doc)).toEqual([]);expect(selectableObjectIds(doc,['c'],'customer')).toEqual([]);expect(selectableObjectIds(doc,['c'],'admin')).toEqual(['a','b','c']);expect(doc).toEqual(frozen);
});
it('testo del modulo dentro un gruppo: setText condiviso, centro conservato e convalida dei dati senza separare il gruppo',()=>{
 const doc=createTestDocument();doc.areaMm={width:100,height:60};doc.objects=doc.objects.filter(object=>object.type==='text');doc.objects[0]!.editor={label:'Email',order:1,includeInForm:true,textInputFormat:'email',maxCharacters:20};doc.groups=[{id:'fields',objectIds:[doc.objects[0]!.id],editor:{label:'Contatti',transformLocked:true,selectionLocked:true,includeInForm:true}}];const store=new DocumentStore(doc,measure),id=doc.objects[0]!.id,center=objectCenter(doc.objects[0]!,measure);
 for(const source of ['manual','ai-simulation']as const){store.dispatch(command(store,'setText',{text:'info@example.it'},id),source);expect(objectCenter(store.document.objects[0]!,measure)).toEqual(center);expect(store.document.groups).toEqual(doc.groups);validateObjectInputs(store.document);}
 const before=store.document;expect(()=>store.dispatch(command(store,'setText',{text:'a'.repeat(21)},id),'manual')).toThrow('20 caratteri');expect(store.document).toEqual(before);store.dispatch(command(store,'setText',{text:'non valido'},id),'manual');expect(()=>validateObjectInputs(store.document)).toThrow('formato');
});
it('selezione bloccata su un membro diverso dal principale: duplicazione e applicazione template controllano tutti gli ID',()=>{
 const doc=fixture();doc.groups![2]!.editor={selectionLocked:true};expect(selectableObjectIds(doc,['a'],'customer')).toEqual([]);
 for(const source of ['manual','ai-simulation']as const){const store=new DocumentStore(doc,measure),before=store.document;
  const actions=[command(store,'duplicateObjects',{copies:['a','b','c'].map(id=>({objectId:id,newObjectId:`copy-${id}`})),groups:['root','inside','single'].map(id=>({groupId:id,newGroupId:`copy-${id}`}))}),command(store,'applyTemplate',{templateId:crypto.randomUUID(),templateVersion:1,objects:doc.objects.map(object=>object.id==='c'?{...object,fill:'#ffffff'}:object),groups:doc.groups})];
  for(const action of actions){expect(()=>store.dispatch(action,source)).toThrow('Selezione bloccata');expect(store.document).toEqual(before);}
 }
});
