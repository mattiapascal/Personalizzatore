import{expect,it}from'vitest';
import{mkdtemp,readFile,rm}from'node:fs/promises';import{join}from'node:path';import{tmpdir}from'node:os';
import{EditorAdminStore}from'../scripts/editor-admin-store';import{createTestDocument}from'./helpers/editor-fonts';import{DEFAULT_JUSTIFICATION}from'../src/editor/justification';
it('archivio: distribuzione originale e ultima riga persistono; un modo sconosciuto non modifica il salvataggio',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'editor-justification-'));
 try{const store=new EditorAdminStore(directory),document=createTestDocument(),text=document.objects.find(o=>o.type==='text')!;
 Object.assign(text,{text:'ALFA BETA\nC D',textAlign:'justify-left',textBox:{widthMm:35,heightMm:8,autoWidth:false,autoHeight:true},justification:{...DEFAULT_JUSTIFICATION,distribution:'word-space',justifyLastLine:true}});
 const command={tool:'saveRecord',expectedRevision:0,arguments:{kind:'template',title:'Giustificazione TEST',tags:['TEST'],clientRef:'',document}};
 await store.dispatch(command);expect((await new EditorAdminStore(directory).read()).records[0]!.document).toEqual(document);
 const before=await readFile(join(directory,'state.json')),bad=structuredClone(document);(bad.objects.find(o=>o.type==='text')!.justification as any).distribution='unknown';
 await expect(store.dispatch({...command,expectedRevision:1,arguments:{...command.arguments,document:bad}})).rejects.toThrow();expect(await readFile(join(directory,'state.json'))).toEqual(before);
 }finally{await rm(directory,{recursive:true,force:true});}
});
