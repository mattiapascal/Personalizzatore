import { it, expect, vi } from 'vitest';
import { assertFontGeometry, withVerifiedFontGeometry } from '../src/editor/verified-font-geometry';
import { createTestDocument, TEST_DEFAULT_FONT } from './helpers/editor-fonts';
import type { SceneObject } from '../src/editor/model';
import { readFileSync } from 'node:fs';

it('la geometria parte soltanto dopo il controllo dei byte; font mancanti, sconosciuti e simulati non chiamano il motore',async()=>{
 const base=createTestDocument();base.objects=[{id:'text',type:'text',text:'ABC',fontFamily:TEST_DEFAULT_FONT.id,fontSizePt:12,fill:'#000000',xMm:5,yMm:5}];
 for(const kind of ['missing-file','unknown','synthetic','missing-glyph'] as const){const doc=structuredClone(base),text=doc.objects[0] as Extract<SceneObject,{type:'text'}>,operation=vi.fn();if(kind==='missing-file')doc.fontAssets=[];if(kind==='unknown'){const bytes=new Uint8Array(20);bytes[1]=1;doc.fontAssets![0]!.dataBase64=Buffer.from(bytes).toString('base64');}if(kind==='synthetic')text.fontWeight='bold';if(kind==='missing-glyph')doc.fontAssets![0]!.dataBase64=readFileSync('node_modules/playwright-core/lib/vite/recorder/assets/codicon-DCmgc-ay.ttf').toString('base64');await expect(withVerifiedFontGeometry(doc,operation)).rejects.toThrow('prima di misurare o adattare');expect(operation).not.toHaveBeenCalled();}
});
it('lo snapshot misurato è quello verificato anche se il documento chiamante cambia durante l’attesa',async()=>{
 const doc=createTestDocument(),before=structuredClone(doc),operation=vi.fn(snapshot=>{expect(snapshot).toEqual(before);snapshot.objects[0]!.xMm=99;return snapshot.areaMm.width;});const pending=withVerifiedFontGeometry(doc,operation);doc.objects[0]!.xMm=42;expect(await pending).toBe(before.areaMm.width);expect(operation).toHaveBeenCalledTimes(1);expect(doc.objects[0]!.xMm).toBe(42);
});
it('i riferimenti con testo partecipano agli ingombri e richiedono la stessa verifica',async()=>{
 const doc=createTestDocument(),text=doc.objects.find(object=>object.type==='text')!;text.editor={reference:true};if(text.type!=='text')throw Error('Fixture');text.fontFamily='Arial';await expect(assertFontGeometry(doc)).rejects.toThrow('font «Arial» non è incorporato');
});
it('un documento geometrico senza testo non dipende da font inutilizzati',async()=>{
 const doc=structuredClone(createTestDocument());doc.objects=doc.objects.filter(object=>object.type!=='text');const bytes=new Uint8Array(20);bytes[1]=1;doc.fontAssets![0]!.dataBase64=Buffer.from(bytes).toString('base64');const operation=vi.fn(snapshot=>snapshot.objects.length);await expect(withVerifiedFontGeometry(doc,operation)).resolves.toBe(doc.objects.length);expect(operation).toHaveBeenCalledTimes(1);
});
