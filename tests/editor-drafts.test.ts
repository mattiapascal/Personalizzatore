import { expect,it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { prepareDraft } from '../src/editor-workflow/drafts';
import { createDocument } from '../src/editor/model';
it('bozze: documento copiato e riepilogo senza font o immagini, versione indipendente dalla revisione grafica',()=>{
 const doc=createDocument(),id=randomUUID(),first=prepareDraft(doc,id,0,[]);expect(first.summary.version).toBe(1);expect(first.summary.documentRevision).toBe(doc.revision);expect(first.summary).not.toHaveProperty('document');doc.objects=[];expect(first.document.objects).not.toHaveLength(0);const second=prepareDraft(doc,id,1,[first.summary]);expect(second.summary.version).toBe(2);expect(second.document.objects).toEqual([]);expect(first.document.objects).not.toEqual(second.document.objects);
});
it('una scheda obsoleta non sovrascrive la bozza, mentre una copia riceve un ID indipendente',()=>{
 const doc=createDocument(),first=prepareDraft(doc,randomUUID(),0,[]);expect(()=>prepareDraft(doc,first.summary.id,0,[first.summary])).toThrow('altra scheda');const copy=prepareDraft(doc,randomUUID(),0,[first.summary]);expect(copy.summary.id).not.toBe(first.summary.id);expect(first.summary.version).toBe(1);
});
it('limiti espliciti non cancellano bozze vecchie e un aggiornamento non conta come un nuovo progetto',()=>{
 const doc=createDocument(),records=Array.from({length:20},()=>prepareDraft(doc,randomUUID(),0,[]).summary);expect(()=>prepareDraft(doc,randomUUID(),0,records)).toThrow('20 bozze');expect(prepareDraft(doc,records[0]!.id,1,records).summary.version).toBe(2);expect(()=>prepareDraft(doc,randomUUID(),0,[{...records[0]!,bytes:256*1024*1024}])).toThrow('Spazio');
});
