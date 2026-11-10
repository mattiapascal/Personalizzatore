import{it,expect}from'vitest';
import{mkdtemp,readFile,rm}from'node:fs/promises';
import{tmpdir}from'node:os';import{join}from'node:path';
import{randomUUID}from'node:crypto';
import{EditorAdminStore}from'../scripts/editor-admin-store';
import{FontLibraryBackupSchema}from'../src/editor-admin/schema';
import{createFontLibraryBackup}from'../src/editor-admin/font-backup';
import{createDocument}from'../src/editor/model';
const file=()=>readFile('fixtures/fonts/ABeeZee-subset.TEST.woff2');
async function setup(){const directory=await mkdtemp(join(tmpdir(),'font-backup-unit-')),store=new EditorAdminStore(directory);return{store,cleanup:()=>rm(directory,{recursive:true,force:true})};}
const upload=async(store:EditorAdminStore,revision=0)=>store.dispatch({tool:'uploadFont',expectedRevision:revision,arguments:{family:'Backup TEST',format:'woff2',notes:'Note originali',sourceUrl:'https://example.test/font',licenseText:'Licenza TEST',dataBase64:(await file()).toString('base64')}});
it('backup e ripristino conservano esattamente file, ID, licenze, stile, date e archiviazione senza scritture nella preview',async()=>{
 const source=await setup(),target=await setup();try{const first=await upload(source.store);await source.store.dispatch({tool:'archiveFont',expectedRevision:1,arguments:{id:first.fonts[0]!.id,archived:true}});const original=(await source.store.read()).fonts,backup=createFontLibraryBackup(original),command={tool:'restoreFontLibrary',expectedRevision:0,arguments:{backup}};const plan=await target.store.previewFontRestore(command);expect(plan).toMatchObject({revision:0,existing:[],conflicts:[]});expect(plan.added).toEqual([{id:original[0]!.id,family:'Backup TEST',archived:true}]);expect((await target.store.read()).revision).toBe(0);expect(plan.added[0]).not.toHaveProperty('dataBase64');await target.store.dispatch(command);expect((await target.store.read()).fonts).toEqual(original);expect((await source.store.read()).fonts).toEqual(original);const repeated=await target.store.dispatch({...command,expectedRevision:1});expect(repeated.revision).toBe(1);expect((await target.store.read()).fonts).toEqual(original);
 }finally{await source.cleanup();await target.cleanup();}
});
it('font esistenti mantengono metadati e stato locali; nessuna modifica a progetti o impostazioni',async()=>{
 const local=await setup();try{await upload(local.store);const backup=createFontLibraryBackup((await local.store.read()).fonts),font=backup.fonts[0]!;await local.store.dispatch({tool:'updateFontMetadata',expectedRevision:1,arguments:{id:font.id,family:'Nome locale TEST',notes:'Modifiche locali',sourceUrl:'',licenseText:'Licenza aggiornata'}});await local.store.dispatch({tool:'saveRecord',expectedRevision:2,arguments:{kind:'composition',title:'Progetto TEST',clientRef:'',tags:[],document:createDocument()}});const before=await local.store.read(),command={tool:'restoreFontLibrary',expectedRevision:3,arguments:{backup}};expect((await local.store.previewFontRestore(command)).existing).toHaveLength(1);expect((await local.store.dispatch(command)).revision).toBe(3);expect(await local.store.read()).toEqual(before);
 }finally{await local.cleanup();}
});
it('collisione di ID annulla tutto, anche quando il backup contiene altri font nuovi validi',async()=>{
 const source=await setup(),target=await setup();try{await upload(source.store);const backup=createFontLibraryBackup((await source.store.read()).fonts),original=backup.fonts[0]!;const bytes=await readFile('node_modules/playwright-core/lib/vite/recorder/assets/codicon-DCmgc-ay.ttf');const collision={...original,format:'ttf',dataBase64:bytes.toString('base64')},extra={...original,id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'};await target.store.dispatch({tool:'restoreFontLibrary',expectedRevision:0,arguments:{backup}});const incoming={...backup,fonts:[extra,collision]},command={tool:'restoreFontLibrary',expectedRevision:1,arguments:{backup:incoming}},before=await target.store.read(),plan=await target.store.previewFontRestore(command);expect(plan.added).toHaveLength(1);expect(plan.conflicts).toHaveLength(1);await expect(target.store.dispatch(command)).rejects.toThrow('file differenti');expect(await target.store.read()).toEqual(before);
 }finally{await source.cleanup();await target.cleanup();}
});
it('rifiuta backup duplicati, file corrotti e revisioni obsolete, senza aggiunte parziali',async()=>{
 const source=await setup(),target=await setup();try{await upload(source.store);const backup=createFontLibraryBackup((await source.store.read()).fonts),font=backup.fonts[0]!;expect(FontLibraryBackupSchema.safeParse({...backup,fonts:[font,font]}).success).toBe(false);expect(FontLibraryBackupSchema.safeParse({...backup,kind:'unrelated-archive'}).success).toBe(false);const command={tool:'restoreFontLibrary',expectedRevision:0,arguments:{backup:{...backup,fonts:[font,{...font,id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',dataBase64:Buffer.from('invalid font').toString('base64')}]}}};await expect(target.store.previewFontRestore(command)).rejects.toThrow('non validi');await expect(target.store.dispatch(command)).rejects.toThrow('non validi');expect((await target.store.read()).revision).toBe(0);await target.store.dispatch({tool:'settings',expectedRevision:0,arguments:{editorName:'TEST',gridMm:1,gridVisible:false,snapEnabled:false}});await expect(target.store.dispatch({...command,arguments:{backup}})).rejects.toThrow('altra finestra');expect((await target.store.read()).fonts).toEqual([]);
 }finally{await source.cleanup();await target.cleanup();}
});
it('non supera il limite della libreria e non perde i font già installati',async()=>{
 const local=await setup();try{await upload(local.store);const before=await local.store.read(),backup=createFontLibraryBackup(Array.from({length:500},()=>({...before.fonts[0]!,id:randomUUID()})));const command={tool:'restoreFontLibrary',expectedRevision:1,arguments:{backup}};expect((await local.store.previewFontRestore(command)).added).toHaveLength(500);await expect(local.store.dispatch(command)).rejects.toThrow('500 font');expect(await local.store.read()).toEqual(before);
 }finally{await local.cleanup();}
});
