import{expect,it}from'vitest';
import{createDocument,DocumentSchema,DocumentStore,type SceneObject,type Measure}from'../src/editor/model';
const vector:Extract<SceneObject,{type:'vector'}>={id:'transparent',type:'vector',xMm:5,yMm:5,widthMm:20,heightMm:10,commands:[['M',0,0],['L',1,0],['L',1,1],['L',0,1],['Z']],fillRule:'evenodd',fill:'none',stroke:'none',strokeMm:.25,strokeLineCap:'butt',strokeLineJoin:'miter',strokeMiterLimit:4,editor:{label:'Logo',includeInForm:false}};
const measure:Measure=object=>({widthMm:object.type==='vector'?object.widthMm:1,heightMm:object.type==='vector'?object.heightMm:1});
it('vettore trasparente modificabile con comandi manuali/AI e Undo, senza perdere geometria o proprietà',()=>{
 const doc=createDocument();doc.objects=[structuredClone(vector)];doc.colorMode='color';const store=new DocumentStore(doc,measure);
 store.dispatch({schemaVersion:1,tool:'updateObject',objectId:vector.id,expectedRevision:0,arguments:{object:{...vector,fill:'#0088cc'}}},'manual');
 store.dispatch({schemaVersion:1,tool:'updateObject',objectId:vector.id,expectedRevision:1,arguments:{object:vector}},'ai-simulation');
 expect(store.document.objects).toEqual([vector]);store.undo();expect(store.document.objects[0]).toEqual({...vector,fill:'#0088cc'});store.redo();expect(DocumentSchema.parse(JSON.parse(JSON.stringify(store.document))).objects).toEqual([vector]);
});
it('assenza di pittura non autorizza vettori degeneri o non normalizzati; errori atomici',()=>{
 const doc=createDocument();doc.objects=[structuredClone(vector)];const store=new DocumentStore(doc,measure),before=structuredClone(store.document);
 for(const change of [{widthMm:0,heightMm:0},{commands:[['M',0,0],['L',2,0],['L',2,1],['Z']]},{commands:[['M',0,0],['Z']]}]){
  expect(()=>store.dispatch({schemaVersion:1,tool:'updateObject',objectId:vector.id,expectedRevision:0,arguments:{object:{...vector,...change}}},'ai-simulation')).toThrow();expect(store.document).toEqual(before);
 }
});
