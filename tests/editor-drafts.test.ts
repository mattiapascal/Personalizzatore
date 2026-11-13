import { expect,it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { prepareDraft,draftRotationTargets,draftsOlderThan,draftMatchesTemplate } from '../src/editor-workflow/drafts';
import { createDocument } from '../src/editor/model';
it('bozze: documento copiato e riepilogo senza font o immagini, versione indipendente dalla revisione grafica',()=>{
 const doc=createDocument(),id=randomUUID(),first=prepareDraft(doc,id,0,[]);expect(first.summary.version).toBe(1);expect(first.summary.documentRevision).toBe(doc.revision);expect(first.summary).not.toHaveProperty('document');doc.objects=[];expect(first.document.objects).not.toHaveLength(0);const second=prepareDraft(doc,id,1,[first.summary]);expect(second.summary.version).toBe(2);expect(second.document.objects).toEqual([]);expect(first.document.objects).not.toEqual(second.document.objects);
});
it('una scheda obsoleta non sovrascrive la bozza, mentre una copia riceve un ID indipendente',()=>{
 const doc=createDocument(),first=prepareDraft(doc,randomUUID(),0,[]);expect(()=>prepareDraft(doc,first.summary.id,0,[first.summary])).toThrow('altra scheda');const copy=prepareDraft(doc,randomUUID(),0,[first.summary]);expect(copy.summary.id).not.toBe(first.summary.id);expect(first.summary.version).toBe(1);
});
it('rotazione per template: elimina le più vecchie, preserva altri template e controlla la quota dopo la rotazione',()=>{
 const doc=createDocument(),templateId=randomUUID(),otherId=randomUUID(),context={templateId},records=Array.from({length:20},(_,index)=>({...prepareDraft(doc,randomUUID(),0,[],context).summary,savedAt:new Date(Date.UTC(2026,0,index+1)).toISOString()}));
 const other=prepareDraft(doc,randomUUID(),0,[],{templateId:otherId}).summary;
 expect(draftRotationTargets(doc,randomUUID(),[...records,other],context)).toEqual([records[0]]);
 expect(prepareDraft(doc,randomUUID(),0,records,context).summary.templateId).toBe(templateId);
 expect(draftRotationTargets(doc,records[0]!.id,records,context)).toEqual([]);
 expect(()=>prepareDraft(doc,randomUUID(),0,[{...other,bytes:256*1024*1024}],context)).toThrow('Spazio');
 expect(prepareDraft(doc,randomUUID(),0,[{...records[0]!,bytes:256*1024*1024}],context,1).summary.templateId).toBe(templateId);
 expect(draftRotationTargets(doc,randomUUID(),records,context,1)).toHaveLength(20);
 expect(()=>draftRotationTargets(doc,randomUUID(),records,context,0)).toThrow();
});
it('bozze storiche: riconosce documento originale o origine template, senza associare soltanto per prodotto',()=>{
 const doc=createDocument(),templateId=randomUUID(),summary=prepareDraft(doc,randomUUID(),0,[]).summary;
 expect(draftMatchesTemplate(summary,{templateId,templateDocumentId:doc.documentId})).toBe(true);
 expect(draftMatchesTemplate(summary,{templateId,templateDocumentId:randomUUID()})).toBe(false);
 expect(draftMatchesTemplate({...summary,templateId:randomUUID()},{templateId,templateDocumentId:doc.documentId})).toBe(false);
});
it('pulizia per giorni: soglia stretta e orario conservato, parametri limitati',()=>{
 const doc=createDocument(),summary=prepareDraft(doc,randomUUID(),0,[]).summary,now=Date.UTC(2026,10,13,12),cutoff=now-30*86400000;
 const before={...summary,savedAt:new Date(cutoff-1).toISOString()},at={...summary,id:randomUUID(),savedAt:new Date(cutoff).toISOString()};
 expect(draftsOlderThan([before,at],30,now)).toEqual([before]);expect(()=>draftsOlderThan([before],0,now)).toThrow();expect(()=>draftsOlderThan([before],1.5,now)).toThrow();
});
