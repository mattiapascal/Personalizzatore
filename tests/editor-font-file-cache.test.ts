import {expect,it,vi} from 'vitest';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {EditorAdminStore} from '../scripts/editor-admin-store';
it('i download font condividono una lettura e rilevano upload/eliminazioni successive sul disco',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'font-cache-test-')),store=new EditorAdminStore(directory),bytes=await readFile('fixtures/fonts/ABeeZee-subset.TEST.woff2');
 try{
  expect(await store.readFont('11111111-1111-4111-8111-111111111111')).toBeUndefined();
  const snapshot=await store.dispatch({tool:'uploadFont',expectedRevision:0,arguments:{family:'ABeeZee TEST',format:'woff2',notes:'TEST',dataBase64:bytes.toString('base64')}}),id=snapshot.fonts[0]!.id,read=vi.spyOn(store,'readFonts');
  const results=await Promise.all([store.readFont(id),store.readFont(id),store.readFont(id)]);expect(read).toHaveBeenCalledTimes(1);expect(results.every(font=>font?.dataBase64===bytes.toString('base64'))).toBe(true);
  // A second store simulates the owner changing the library in another tab/process.
  await new EditorAdminStore(directory).dispatch({tool:'deleteFont',expectedRevision:1,arguments:{id}});expect(await store.readFont(id)).toBeUndefined();expect(read).toHaveBeenCalledTimes(2);
 }finally{await rm(directory,{recursive:true,force:true});}
});
