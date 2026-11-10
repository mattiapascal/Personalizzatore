import { expect,it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { fixtureCatalog } from '../src/catalog/adapter';
import { profileKey, type ProductProfile } from '../src/catalog/schema';
import { cloneGraphicDocument, createDocument, DocumentStore, type Measure, type SceneObject } from '../src/editor/model';
import { fitTemplate, smallestTemplateMount, templateCommand } from '../src/editor-workflow/template-fit';
const products=fixtureCatalog.list(),small=products.find(p=>p.handle==='trodat-4912')!,large=products.find(p=>p.handle==='trodat-4915')!;
const measure:Measure=object=>object.type==='text'?{widthMm:object.fontSizePt*2,heightMm:object.fontSizePt/2}:{widthMm:'widthMm'in object?object.widthMm:10,heightMm:'heightMm'in object?object.heightMm:10};
function source(fontSizePt=12){const doc=createDocument();doc.objects=[{id:'text-1',type:'text',text:'TEST',xMm:5,yMm:5,fontFamily:'Arial',fontSizePt,fill:'#000000'}];return doc;}
it('sceglie il modello associato più piccolo che entra senza ridurre, indipendentemente dall’ordine',()=>{
 const doc=source(),before=structuredClone(doc),result=smallestTemplateMount(doc,[...products].reverse(),products.map(profileKey),fixtureCatalog.version,measure);expect(result.product.productId).toBe(small.productId);expect(result.fit.scale).toBe(1);expect(result.fit.document.areaMm).toEqual(small.nominalAreaMm);expect(doc).toEqual(before);
 const onlyLarge=smallestTemplateMount(doc,products,[profileKey(large)],fixtureCatalog.version,measure);expect(onlyLarge.product.productId).toBe(large.productId);
});
it('se il template non entra non sceglie un modello piccolo riducendolo silenziosamente',()=>{
 const doc=source(24);const result=smallestTemplateMount(doc,products,products.map(profileKey),fixtureCatalog.version,measure);expect(result.product.productId).not.toBe(small.productId);expect(result.fit.scale).toBe(1);expect(()=>smallestTemplateMount(doc,products,[profileKey(small)],fixtureCatalog.version,measure)).toThrow('Nessun modello');
});
it('riduzione proporzionale proposta esplicitamente; corpo e proporzioni coerenti, originale conservato',()=>{
 const doc=source(24),before=structuredClone(doc),fit=fitTemplate(doc,small,fixtureCatalog.version,measure,true);expect(fit.scale).toBeLessThan(1);expect(fit.scale).toBeGreaterThan(.9);expect(fit.document.objects[0]).toMatchObject({fontSizePt:expect.closeTo(24*fit.scale,7)});expect(doc).toEqual(before);
});
it('rifiuta riduzioni sotto 7 pt anche in un run, senza deformare testi per farli entrare',()=>{
 const doc=source(24);(doc.objects[0] as Extract<SceneObject,{type:'text'}>).characterStyles=[{start:0,end:1,style:{fontSizePt:7}}];expect(()=>fitTemplate(doc,small,fixtureCatalog.version,measure,true)).toThrow('sotto 7 pt');expect((doc.objects[0] as any).characterStyles[0].style.fontSizePt).toBe(7);
});
it('gruppi e font passano dallo stesso comando tipizzato, annullabile e protetto da revisione',()=>{
 const doc=source(),fit=fitTemplate(doc,small,fixtureCatalog.version,measure),store=new DocumentStore(createDocument(small,fixtureCatalog.version),measure),before=structuredClone(store.document),id=randomUUID(),command=templateCommand(fit,id,3,0);
 store.dispatch(command,'manual');expect(store.document.templateOrigin).toEqual({id,version:3});expect(store.document.objects).toEqual(fit.document.objects);expect(()=>store.dispatch(command,'ai-simulation')).toThrow('obsoleta');store.undo();expect(store.document.objects).toEqual(before.objects);expect(store.document.templateOrigin).toBeUndefined();store.redo();expect(store.document.templateOrigin?.version).toBe(3);
});
it('geometria circolare usa il contenimento reale previsto dal validatore TEST',()=>{
 const round:ProductProfile={...small,shape:'round',nominalAreaMm:{width:30,height:30}},doc=source(12);expect(()=>fitTemplate(doc,round,fixtureCatalog.version,measure)).not.toThrow();const wide=source(18);expect(()=>fitTemplate(wide,round,fixtureCatalog.version,measure)).toThrow();expect(fitTemplate(wide,round,fixtureCatalog.version,measure,true).scale).toBeLessThan(1);
});
it('cambio formato atomico: contesto catalogo autorevole, stessa operazione manuale/AI e undo della montatura',()=>{
 const doc={...source(24),productId:large.productId,variantId:large.variantIds[0]!,catalogVersion:fixtureCatalog.version,catalogProductProfileVersion:large.profileVersion,areaMm:{...large.nominalAreaMm}},context={version:fixtureCatalog.version,products};
 const store=new DocumentStore(doc,measure,context),command={schemaVersion:1,tool:'changeFormat',objectId:'project',expectedRevision:0,arguments:{profileKey:profileKey(small),catalogVersion:context.version,allowShrink:true}};
 store.dispatch(command,'manual');expect(store.document.productId).toBe(small.productId);expect((store.document.objects[0] as any).fontSizePt).toBeLessThan(24);store.undo();expect(store.document.productId).toBe(large.productId);expect(store.document.objects).toEqual(doc.objects);store.dispatch({...command,expectedRevision:store.document.revision},'ai-simulation');expect(store.document.productId).toBe(small.productId);
 const before=structuredClone(store.document);expect(()=>store.dispatch({...command,expectedRevision:before.revision,arguments:{...command.arguments,profileKey:'invented'}},'manual')).toThrow('catalogo grafico');expect(store.document).toEqual(before);
 expect(()=>new DocumentStore(doc,measure).dispatch(command,'ai-simulation')).toThrow('Catalogo grafico');
});
it('cambio formato rifiutato preserva scena e redo; metadati di origine copiati senza riferimenti mutabili',()=>{
 const doc={...source(24),productId:large.productId,variantId:large.variantIds[0]!,catalogVersion:fixtureCatalog.version,catalogProductProfileVersion:large.profileVersion,areaMm:{...large.nominalAreaMm},templateOrigin:{id:randomUUID(),version:2}},store=new DocumentStore(doc,measure,{version:fixtureCatalog.version,products});
 const cloned=cloneGraphicDocument(store.document);cloned.templateOrigin!.version=99;expect(store.document.templateOrigin?.version).toBe(2);
 const before=structuredClone(store.document);expect(()=>store.dispatch({schemaVersion:1,tool:'changeFormat',objectId:'project',expectedRevision:0,arguments:{profileKey:profileKey(small),catalogVersion:fixtureCatalog.version,allowShrink:false}},'manual')).toThrow();expect(store.document).toEqual(before);
});
