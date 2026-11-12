import {afterEach,expect,it,vi} from 'vitest';
import {readArchiveView,saveArchiveView,defaultArchiveView} from '../src/editor-admin/archive-view-state';
import {archivePreviewError} from '../src/editor-admin/preview-errors';
afterEach(()=>vi.unstubAllGlobals());
it('conserva due viste separate nella stessa scheda, senza salvare dati dei progetti',()=>{
 const rows=new Map<string,string>();vi.stubGlobal('sessionStorage',{getItem:(key:string)=>rows.get(key)??null,setItem:(key:string,value:string)=>rows.set(key,value)});
 const template={...defaultArchiveView(),query:'Cane',tags:['Cartello'],mode:'any' as const,sort:'title' as const,page:2,scrollY:1234,selectedId:'11111111-1111-4111-a111-111111111111'};saveArchiveView('template',template);saveArchiveView('composition',{...defaultArchiveView(),query:'Cliente',page:1});expect(readArchiveView('template')).toEqual(template);expect(readArchiveView('composition').query).toBe('Cliente');expect(readArchiveView('composition').selectedId).toBeUndefined();expect([...rows.values()].every(value=>!value.includes('document'))).toBe(true);
});
it('dati corrotti, viste fuori limite e storage disabilitato non impediscono di navigare',()=>{
 for(const raw of ['{',JSON.stringify({...defaultArchiveView(),page:-1}),JSON.stringify({...defaultArchiveView(),scrollY:Infinity}),'x'.repeat(256001)]){vi.stubGlobal('sessionStorage',{getItem:()=>raw});expect(readArchiveView('template')).toEqual(defaultArchiveView());}
 vi.stubGlobal('sessionStorage',{getItem:()=>{throw Error('Bloccato');},setItem:()=>{throw Error('Quota');}});expect(readArchiveView('template')).toEqual(defaultArchiveView());expect(()=>saveArchiveView('template',defaultArchiveView())).not.toThrow();
});
it('errore di moduli o contratto vecchi richiede ricaricamento; errore di font non viene nascosto',()=>{
 expect(archivePreviewError(new SyntaxError("The requested module '/test.ts' does not provide an export named 'newExport'"))).toEqual({message:'Ricarica l’amministrazione per aggiornare l’anteprima.',outdated:true});expect(archivePreviewError({issues:[{code:'unrecognized_keys',keys:['backgroundGroupId']}]}).outdated).toBe(true);expect(archivePreviewError(new Error('Correggi i font prima di esportare'))).toEqual({message:'Correggi i font prima di esportare',outdated:false});expect(archivePreviewError(new Error('Archivio non disponibile')).outdated).toBe(false);
});
