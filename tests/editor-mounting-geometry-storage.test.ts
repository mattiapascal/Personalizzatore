import {expect,it} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {EditorAdminStore} from '../scripts/editor-admin-store';
import {EditorAdminSqlite} from '../scripts/editor-admin-sqlite';
import {DEFAULT_ADMIN_SETTINGS} from '../src/editor-admin/schema';
import {productionDocument} from '../src/editor/object-properties';
import {mountingGeometryFixture} from './helpers/mounting-geometry';
for(const backend of['json','sqlite']as const)it(`misure fissaggi persistite su ${backend}: record e miniature coerenti, originale e dati indipendenti conservati`,async()=>{
 const directory=await mkdtemp(join(tmpdir(),'editor-mounting-test-'));let database:EditorAdminSqlite|undefined;
 try{
  if(backend==='sqlite')database=await EditorAdminSqlite.create(join(directory,'archive.sqlite'),{schemaVersion:1,revision:0,settings:DEFAULT_ADMIN_SETTINGS,records:[],fonts:[]});
  const store=new EditorAdminStore(directory,undefined,undefined,database),document=mountingGeometryFixture(),before=structuredClone(document);
  const first=await store.dispatch({tool:'saveRecord',expectedRevision:0,arguments:{kind:'template',title:'Fissaggi TEST',tags:['TEST'],clientRef:'',document}}),id=first.records[0]!.id,key=first.records[0]!.previewKey;
  document.plaque!.clearanceMm=2.5;
  const saved=await store.dispatch({tool:'replaceRecord',expectedRevision:1,arguments:{id,recordVersion:1,title:'Fissaggi TEST',tags:['TEST'],document}});expect(saved.records[0]!.previewKey).toBe(key);
  const record=await store.readRecord(id);expect(record?.document).toEqual(document);expect(record?.version).toBe(2);expect(productionDocument(record!.document).objects).toEqual(before.objects);expect(record!.document.plaque).toEqual(document.plaque);
  const copy=await store.dispatch({tool:'duplicateRecord',expectedRevision:2,arguments:{id}}),duplicate=await store.readRecord(copy.records.find(record=>record.id!==id)!.id);expect(duplicate!.document.objects).toEqual(document.objects);expect(duplicate!.document.groups).toEqual(document.groups);expect(duplicate!.document.plaque).toEqual(document.plaque);expect(duplicate!.document.documentId).not.toBe(document.documentId);
  expect((await store.readRecord(id))!.document).toEqual(document);expect(before.plaque!.clearanceMm).toBe(3);expect(document.fontAssets).toEqual(before.fontAssets);
  if(database){database.close();database=EditorAdminSqlite.open(join(directory,'archive.sqlite'),true);expect((await database.readRecord(id))!.document).toEqual(document);}else expect((await new EditorAdminStore(directory).readRecord(id))!.document).toEqual(document);
 }finally{database?.close();await rm(directory,{recursive:true,force:true});}
});
