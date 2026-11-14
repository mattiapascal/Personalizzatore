import {expect,it} from 'vitest';
import {captureSelection,clipboardDeletion,clipboardInsertion} from '../src/editor/clipboard';
import {DocumentStore,type Measure} from '../src/editor/model';
import {clipboardActionsFixture} from './helpers/clipboard-actions';
const measure:Measure=o=>o.type==='rect'?{widthMm:o.widthMm,heightMm:o.heightMm}:{widthMm:20,heightMm:5};
it('taglio del gruppo catturato: comando manuale/AI identico, una revisione e Undo/Redo',()=>{
 const doc=clipboardActionsFixture(),copied=captureSelection(doc,['first']),command=clipboardDeletion(doc,copied),manual=new DocumentStore(doc,measure),ai=new DocumentStore(doc,measure);
 expect(command).toMatchObject({tool:'deleteObjects',arguments:{objectIds:['first','second']},expectedRevision:doc.revision});manual.dispatch(command,'manual');ai.dispatch(command,'ai-simulation');expect(manual.document).toEqual(ai.document);expect(manual.document.objects.map(o=>o.id)).toEqual(['caption']);manual.undo();expect(manual.document.objects).toEqual(doc.objects);expect(manual.document.groups).toEqual(doc.groups);manual.redo();expect(manual.document.objects.map(o=>o.id)).toEqual(['caption']);
});
it('taglio del solo membro: ambito esplicito, fratello conservato, nuova identità all’incolla',()=>{
 const doc=clipboardActionsFixture(),copied=captureSelection(doc,['first'],true),command=clipboardDeletion(doc,copied,true),store=new DocumentStore(doc,measure);
 expect(command).toMatchObject({tool:'deleteObject',objectId:'first',targetScope:'object'});store.dispatch(command,'manual');expect(store.document.objects).toEqual(doc.objects.filter(o=>o.id!=='first'));store.dispatch(clipboardInsertion(copied,store.document.revision,()=> 'pasted-first'),'ai-simulation');expect(store.document.objects.at(-1)).toMatchObject({id:'pasted-first',type:'rect',xMm:doc.objects[0]!.xMm});store.undo();store.undo();expect(store.document.objects).toEqual(doc.objects);
});
it('un comando di taglio obsoleto non modifica scena o storico',()=>{
 const doc=clipboardActionsFixture(),command=clipboardDeletion(doc,captureSelection(doc,['first'])),store=new DocumentStore(doc,measure);store.dispatch({schemaVersion:1,tool:'moveObjects',objectId:'first',expectedRevision:doc.revision,arguments:{objectIds:['first','second'],deltaXmm:1,deltaYmm:0}},'manual');const before=structuredClone(store.document);expect(()=>store.dispatch(command,'manual')).toThrow();expect(store.document).toEqual(before);store.undo();expect(store.document.objects).toEqual(doc.objects);
});
it('cancellazione catturata: i blocchi del cliente restano validati',()=>{
 const doc=clipboardActionsFixture();doc.objects[0]!.editor={deleteLocked:true};const store=new DocumentStore(doc,measure,undefined,'customer'),command=clipboardDeletion(doc,captureSelection(doc,['first'],true),true);expect(()=>store.dispatch(command,'manual')).toThrow();expect(store.document).toEqual(doc);expect(store.events).toHaveLength(0);
});
it('selezioni vuote, duplicate, scomparse e membri multipli sono rifiutati',()=>{
 const doc=clipboardActionsFixture(),copied=captureSelection(doc,['first']);for(const objects of[[],[copied.objects[0]!,copied.objects[0]!],[{...copied.objects[0]!,id:'missing'}]])expect(()=>clipboardDeletion(doc,{...copied,objects})).toThrow('Selezione');expect(()=>clipboardDeletion(doc,copied,true)).toThrow('Selezione');
});
