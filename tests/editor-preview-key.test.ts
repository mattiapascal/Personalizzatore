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
