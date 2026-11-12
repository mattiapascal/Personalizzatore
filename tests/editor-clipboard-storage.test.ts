import{expect,it}from'vitest';import{captureSelection,fittedClipboard,clipboardInsertion}from'../src/editor/clipboard';import{validatedClipboard}from'../src/editor/clipboard-storage';import{createTestDocument,TEST_FONT_ASSETS}from'./helpers/editor-fonts';import{DocumentStore,type Measure}from'../src/editor/model';
const measure:Measure=object=>object.type==='rect'?{widthMm:object.widthMm,heightMm:object.heightMm}:{widthMm:10,heightMm:5};
it('appunti condivisi: soltanto i file usati dalla selezione e nessun collegamento al documento originale',()=>{
 const doc=createTestDocument();doc.fontAssets=TEST_FONT_ASSETS;doc.objects=[{...doc.objects.find(o=>o.type==='text')!,id:'text',text:'TEST',fontFamily:TEST_FONT_ASSETS[0]!.id},{id:'rect',type:'rect',xMm:1,yMm:1,widthMm:10,heightMm:5,stroke:'none',strokeMm:.25,fill:'#000000'}];
 const text=captureSelection(doc,['text']);expect(text.fontAssets?.map(f=>f.id)).toEqual([TEST_FONT_ASSETS[0]!.id]);const rectangle=captureSelection(doc,['rect']);expect(rectangle.fontAssets).toEqual([]);expect(validatedClipboard(text)).toEqual(text);expect(validatedClipboard(rectangle)).toEqual(rectangle);
 const original=structuredClone(doc);text.objects[0]!.xMm=99;expect(doc).toEqual(original);
});
it('appunti danneggiati o riferimenti estranei non diventano una copia parziale',()=>{
 const clipboard=captureSelection(createTestDocument(),['frame-1']);for(const raw of [{...clipboard,extra:true},{...clipboard,objects:[]},{...clipboard,objects:[clipboard.objects[0],clipboard.objects[0]]},{...clipboard,groups:[{id:'foreign',objectIds:['missing']}]}])expect(()=>validatedClipboard(raw)).toThrow();
});
it('adatta a formato piccolo senza cambiare il sorgente; stesso insertObjects manuale/AI e Undo/Redo',()=>{
 const original={objects:[{id:'rect',type:'rect'as const,xMm:80,yMm:20,widthMm:100,heightMm:60,fill:'#000000',stroke:'none'as const,strokeMm:.25}],groups:[]},before=structuredClone(original);
 const target=createTestDocument();target.objects=[];target.areaMm={width:20,height:10};const fitted=fittedClipboard(original,target,measure);expect(original).toEqual(before);const rectangle=fitted.objects[0]!;if(rectangle.type!=='rect')throw Error('tipo');expect(rectangle.widthMm/rectangle.heightMm).toBeCloseTo(100/60,10);expect(rectangle.xMm).toBeGreaterThan(0);expect(rectangle.yMm).toBeGreaterThan(0);expect(rectangle.widthMm).toBeLessThan(20);expect(rectangle.heightMm).toBeLessThan(10);
 for(const caller of ['manual','ai-simulation']as const){const store=new DocumentStore(target,measure);store.dispatch(clipboardInsertion(fitted,0),caller);expect(store.document.documentId).toBe(target.documentId);store.undo();expect(store.document.objects).toEqual([]);store.redo();expect(store.document.objects[0]).toMatchObject({widthMm:rectangle.widthMm,heightMm:rectangle.heightMm});}
});
