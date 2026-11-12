import {expect,it} from 'vitest';
import {createTestDocument,TEST_DEFAULT_FONT} from './helpers/editor-fonts';
import {archivePreviewKey} from '../src/editor-admin/preview-key';
import {adminSnapshot} from '../scripts/editor-admin-store';
import {DEFAULT_ADMIN_SETTINGS} from '../src/editor-admin/schema';
it('chiave grafica stabile per titolo/tag, revisioni, proprietà e licenze; cambia con geometria, font, riferimenti e tinta',async()=>{
 const doc=createTestDocument(),key=await archivePreviewKey(doc),metadata=structuredClone(doc);metadata.documentId=crypto.randomUUID();metadata.revision=9;metadata.fontAssets![0]!.licenseText='Nota TEST';metadata.objects[1]!.editor={label:'Nome TEST',order:5,selectionLocked:true};expect(await archivePreviewKey(metadata)).toBe(key);
 for(const change of [(d:typeof doc)=>{d.objects[1]!.xMm+=1;},(d:typeof doc)=>{d.inkColor='blue';},(d:typeof doc)=>{d.fontAssets![0]!.dataBase64+='AAAA';},(d:typeof doc)=>{d.objects[1]!.editor={reference:true};}]){const next=structuredClone(doc);change(next);expect(await archivePreviewKey(next)).not.toBe(key);}
 const unused=structuredClone(doc);unused.fontAssets!.push({...TEST_DEFAULT_FONT,id:'font-11111111-1111-4111-a111-111111111111'});expect(await archivePreviewKey(unused)).toBe(key);
 const color={...doc,colorMode:'color' as const};expect(await archivePreviewKey({...color,inkColor:'blue'})).toBe(await archivePreviewKey({...color,inkColor:'red'}));
});
it('snapshot amministrativo invia la stessa chiave SHA del browser senza trasmettere il documento',async()=>{
 const document=createTestDocument(),record={id:crypto.randomUUID(),title:'TEST',kind:'template' as const,tags:[],clientRef:'',document,version:1,archived:false,createdAt:'2026-11-11T00:00:00Z',updatedAt:'2026-11-11T00:00:00Z'},state={schemaVersion:1 as const,revision:0,settings:DEFAULT_ADMIN_SETTINGS,fonts:[],records:[record]};
 const snapshot=adminSnapshot(state);expect(snapshot.records[0]!.previewKey).toBe(await archivePreviewKey(document));expect(snapshot.records[0]).not.toHaveProperty('document');
 expect(adminSnapshot({...state,records:[{...record,title:'Nuovo titolo',tags:['Tag TEST'],version:2}]}).records[0]!.previewKey).toBe(snapshot.records[0]!.previewKey);
});
it('politica font invalida le immagini con testo precedenti al controllo rigoroso, senza cambiare le miniature di sole forme',async()=>{
 const{archivePreviewContent,ARCHIVE_PREVIEW_FONT_POLICY}=await import('../src/editor-admin/preview-key'),doc=createTestDocument();expect(JSON.parse(archivePreviewContent(doc)).fontPolicy).toBe(ARCHIVE_PREVIEW_FONT_POLICY);
 doc.objects=doc.objects.filter(object=>object.type!=='text');expect(JSON.parse(archivePreviewContent(doc))).not.toHaveProperty('fontPolicy');
});
it('invalida una volta soltanto le miniature con raster originale quando cambia il campionamento, conservando quelle senza foto',async()=>{const{archivePreviewContent,ARCHIVE_PREVIEW_ORIGINAL_RASTER_POLICY}=await import('../src/editor-admin/preview-key'),{rasterSourceFromBytes}=await import('../src/editor/raster-source'),{testPng}=await import('./helpers/png'),doc=createTestDocument();expect(JSON.parse(archivePreviewContent(doc))).not.toHaveProperty('rasterPolicy');doc.colorMode='color';doc.objects=[{id:'photo',type:'image',xMm:5,yMm:5,widthMm:2,heightMm:2,source:rasterSourceFromBytes('photo-cache',testPng()),raster:{mode:'original',threshold:128,invert:false,whiteTransparent:false}}];expect(JSON.parse(archivePreviewContent(doc)).rasterPolicy).toBe(ARCHIVE_PREVIEW_ORIGINAL_RASTER_POLICY);const binary=structuredClone(doc);if(binary.objects[0]?.type!=='image')throw Error('Fixture');delete binary.objects[0].raster.mode;expect(JSON.parse(archivePreviewContent(binary))).not.toHaveProperty('rasterPolicy');});

it('la griglia filtri originale invalida soltanto le miniature con immagini elaborate produttive',async()=>{
 const{archivePreviewContent,ARCHIVE_PREVIEW_PROCESSED_RASTER_POLICY}=await import('../src/editor-admin/preview-key'),{rasterSourceFromBytes}=await import('../src/editor/raster-source'),{testPng}=await import('./helpers/png'),doc=createTestDocument();
 expect(JSON.parse(archivePreviewContent(doc))).not.toHaveProperty('processedRasterPolicy');
 doc.objects=[{id:'binary',type:'image',xMm:5,yMm:5,widthMm:2,heightMm:2,source:rasterSourceFromBytes('binary-cache',testPng()),raster:{threshold:128,invert:false,whiteTransparent:false}}];
 expect(JSON.parse(archivePreviewContent(doc)).processedRasterPolicy).toBe(ARCHIVE_PREVIEW_PROCESSED_RASTER_POLICY);
 doc.objects[0]!.editor={reference:true};expect(JSON.parse(archivePreviewContent(doc))).not.toHaveProperty('processedRasterPolicy');
});

it('miniatura multipagina: usa la prima pagina logica, indipendente da pagina attiva e modifiche del retro',async()=>{
 const{multipageTestDocument}=await import('./helpers/multipage'),{graphicPages,selectGraphicPage}=await import('../src/editor/pages'),doc=multipageTestDocument(),key=await archivePreviewKey(doc);expect(key).toBe(await archivePreviewKey(graphicPages(doc)[0]!));const back=selectGraphicPage(doc,'page-2');expect(await archivePreviewKey(back)).toBe(key);back.objects[0]!.xMm+=1;expect(await archivePreviewKey(back)).toBe(key);back.otherPages![0]!.objects[0]!.xMm+=1;expect(await archivePreviewKey(back)).not.toBe(key);
});

it('miniature tecniche: riferimenti e fissaggi invalidano la propria cache, chiavi produttive e metadati restano stabili',async()=>{
 const doc=createTestDocument(),original=await archivePreviewKey(doc);expect(await archivePreviewKey(doc,'technical')).toBe(original);
 doc.colorMode='color';doc.objects.unshift({id:'material',type:'rect',xMm:0,yMm:0,widthMm:50,heightMm:20,fill:'#cccccc',stroke:'none',strokeMm:.1,editor:{reference:true}});doc.groups=[{id:'material-layer',objectIds:['material'],editor:{reference:true}}];doc.backgroundGroupId='material-layer';
 const technical=await archivePreviewKey(doc,'technical'),productive=await archivePreviewKey(doc),changed=structuredClone(doc);changed.objects[0]!.xMm+=1;
 expect(technical).not.toBe(productive);expect(await archivePreviewKey(changed,'technical')).not.toBe(technical);expect(await archivePreviewKey(changed)).toBe(productive);
 const metadata=structuredClone(doc);metadata.pageName='Nuovo nome';metadata.revision=20;metadata.objects[0]!.editor!.label='Supporto';expect(await archivePreviewKey(metadata,'technical')).toBe(technical);
 const{DEFAULT_PLAQUE_MOUNTING}=await import('../src/editor/plaque');const withMounting={...doc,plaque:{...DEFAULT_PLAQUE_MOUNTING,method:'holes' as const,pattern:'four-corners' as const,offsetXMm:5,offsetYMm:5,holeDiameterMm:2}};
 expect(await archivePreviewKey(withMounting)).toBe(productive);expect(await archivePreviewKey(withMounting,'technical')).not.toBe(technical);
});
