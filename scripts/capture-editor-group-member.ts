import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {groupMemberFixture} from '../tests/helpers/group-member';

const directory='.local/group-member-capture',origin='http://127.0.0.1:5173',fixture=groupMemberFixture(),browser=await chromium.launch();
await mkdir(directory,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors:string[]=[],external:string[]=[],writes:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.fallback():(external.push(route.request().url()),route.abort()));
 await page.route('**/api/**',route=>route.abort());
 await page.route('**/__editor-local/media/**',route=>route.fulfill({json:{schemaVersion:1,revision:0,categories:[],assets:[]}}));
 await page.route('**/__editor-local/admin/**',route=>{if(route.request().method()!=='GET')writes.push(route.request().url());return route.fulfill({json:{schemaVersion:1,revision:0,settings:{editorName:'TEST',gridMm:1,gridVisible:false,snapEnabled:false},records:[],fonts:[]}});});
 await page.goto(origin+'/editor?workspace=1&mode=test');await expect(page.getByTestId('revision')).toBeVisible();
 await page.getByLabel('Riapri progetto JSON').setInputFiles({name:'group-member.TEST.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
 await expect(page.getByTestId('editor-workspace')).toHaveAttribute('data-view-ready','true');
 const state=async()=>JSON.parse((await page.getByTestId('graphic-state').textContent())!);
 const svg=await page.evaluate(async doc=>{const h='/tests/helpers/browser-module.ts',{loadedEditorModule}=await import(h),{exportDocumentSvg}=await import(loadedEditorModule('/src/editor/fabric-adapter.ts'));return exportDocumentSvg(doc);},fixture);
 await writeFile('fixtures/illustrator/group-member.TEST.json',JSON.stringify(fixture,null,2)+'\n');
 await writeFile('fixtures/illustrator/group-member.TEST.svg',svg);
 await page.getByRole('button',{name:'Pannello livelli',exact:true}).click();
 await page.getByRole('button',{name:'Seleziona solo member-text',exact:true}).click();
 await expect(page.getByTestId('group-member-selection')).toBeVisible();
 await expect(page.locator('.layer-row[data-selected=true]')).toHaveCount(1);
 expect((await state()).objects).toEqual(fixture.objects);
 await page.screenshot({path:directory+'/selected-member.png'});
 const grip=page.getByRole('button',{name:'Sposta livello member-outline',exact:true});await grip.scrollIntoViewIfNeeded();
 const start=(await grip.boundingBox())!;await page.mouse.move(start.x+start.width/2,start.y+start.height/2);await page.mouse.down();
 const target=page.locator('[data-layer-root-drop="top"]');await target.scrollIntoViewIfNeeded();const bounds=(await target.boundingBox())!;
 await page.mouse.move(bounds.x+20,bounds.y+bounds.height/2,{steps:10});await expect(target).toHaveAttribute('data-drop','inside');await page.screenshot({path:directory+'/during-drag.png'});await page.mouse.up();
 await expect.poll(async()=>(await state()).groups[0].objectIds.includes('member-outline')).toBe(false);
 const after=await state();for(const object of fixture.objects)expect(after.objects.find((item:{id:string})=>item.id===object.id)).toEqual(object);
 await page.screenshot({path:directory+'/extracted-member.png'});
 expect(errors).toEqual([]);expect(external).toEqual([]);expect(writes).toEqual([]);
 await writeFile(directory+'/report.json',JSON.stringify({before:fixture.groups,after:after.groups,objectsPreserved:true,errors,external,writes,illustratorVerified:false},null,2));
 console.log(JSON.stringify({objects:fixture.objects.length,objectsPreserved:true,errors,external,writes}));
}finally{await browser.close();}
