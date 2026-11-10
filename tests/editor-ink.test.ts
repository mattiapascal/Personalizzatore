import { expect,it } from 'vitest';
import { createDocument,DocumentStore } from '../src/editor/model';
import { tintImprintPixels } from '../src/editor/ink';
import { ConfigurationCommandSchema } from '../src/editor-workflow/schema';
import { randomUUID } from 'node:crypto';
it('anteprima tinta: nero colorato, bianco/alpha e pixel già a colori conservati',()=>{
 const pixels=new Uint8ClampedArray([0,0,0,255,255,255,255,255,0,0,0,64,128,128,128,128,12,34,56,200]);tintImprintPixels(pixels,'blue');expect([...pixels]).toEqual([0,0,204,255,255,255,255,255,0,0,204,64,128,128,230,128,12,34,56,200]);const before=[...pixels];tintImprintPixels(pixels,'black');expect([...pixels]).toEqual(before);
});
it('colore globale sul documento condiviso: nessuna modifica agli oggetti, undo/redo e comandi AI identici',()=>{
 const original=createDocument(),store=new DocumentStore(original,()=>({widthMm:10,heightMm:4})),command={schemaVersion:1,tool:'setInkColor',objectId:'project',expectedRevision:0,arguments:{color:'blue'}};store.dispatch(command,'manual');expect(store.document.inkColor).toBe('blue');expect(store.document.objects).toEqual(original.objects);store.undo();expect(store.document.inkColor).toBeUndefined();store.dispatch({...command,expectedRevision:store.document.revision,arguments:{color:'red'}},'ai-simulation');expect(store.document.inkColor).toBe('red');const before=structuredClone(store.document);expect(()=>store.dispatch({...command,expectedRevision:before.revision,arguments:{color:'orange'}},'manual')).toThrow();expect(store.document).toEqual(before);
});
it('la configurazione non può dichiarare un colore diverso da quello del documento',()=>{
 const document={...createDocument(),inkColor:'blue' as const},command={requestId:randomUUID(),tool:'add',arguments:{document,title:'Impronta TEST',svg:'<svg/>',options:{inkColor:'red'},quantity:1}};expect(()=>ConfigurationCommandSchema.parse(command)).toThrow('Colore');expect(()=>ConfigurationCommandSchema.parse({...command,arguments:{...command.arguments,options:{inkColor:'blue'}}})).not.toThrow();
});
