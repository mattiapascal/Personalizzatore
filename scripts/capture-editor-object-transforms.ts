import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {objectTransformsFixture} from '../tests/helpers/object-transforms';
import {clickEditorButton} from '../tests/helpers/editor-ui';
const directory='.local/object-transforms-capture',origin='http://127.0.0.1:5173',fixture=objectTransformsFixture(),browser=await chromium.launch();await mkdir(directory,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors:string[]=[],external:string[]=[],writes:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.fallback():(external.push(route.request().url()),route.abort()));
 await page.route('**/api/**',route=>route.abort());await page.route('**/__editor-local/media/**',route=>route.fulfill({json:{schemaVersion:1,revision:0,categories:[],assets:[]}}));
 await page.route('**/__editor-local/admin/**',route=>{if(route.request().method()!=='GET')writes.push(route.request().url());return route.fulfill({json:{schemaVersion:1,revision:0,settings:{editorName:'TEST',gridMm:1,gridVisible:false,snapEnabled:false},records:[],fonts:[]}});});
 await page.goto(origin+'/editor?workspace=1&mode=test');await expect(page.getByTestId('revision')).toBeVisible();await page.getByLabel('Riapri progetto JSON').setInputFiles({name:'object-transforms.TEST.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
 await expect(page.getByTestId('editor-workspace')).toHaveAttribute('data-view-ready','true');
 const result=await page.evaluate(async doc=>{const p='/tests/helpers/transform.browser.ts';return(await import(p)).checkObjectTransforms(doc);},fixture);
 const output=await page.evaluate(async doc=>{const p='/src/editor/fabric-adapter.ts';return(await import(p)).exportDocumentSvg(doc);},fixture);
 await writeFile('fixtures/illustrator/object-transforms.TEST.json',JSON.stringify(fixture,null,2)+'\n');await writeFile('fixtures/illustrator/object-transforms.TEST.svg',output);
 await clickEditorButton(page,{name:'Seleziona tutto',exact:true});await page.getByRole('button',{name:'Trasforma',exact:true}).click();
 const point=await page.evaluate(async doc=>{const h='/tests/helpers/browser-module.ts',{loadedEditorModule}=await import(h),{objectCenter}=await import(loadedEditorModule('/src/editor/model.ts')),{measureFabric}=await import(loadedEditorModule('/src/editor/fabric-adapter.ts'));return objectCenter(doc.objects[0],measureFabric);},fixture);
 await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 const canvas=(await page.locator('.upper-canvas').boundingBox())!;await page.mouse.click(canvas.x+point.xMm/fixture.areaMm.width*canvas.width,canvas.y+point.yMm/fixture.areaMm.height*canvas.height);
 await expect(page.getByRole('complementary',{name:'Trasforma',exact:true}).getByRole('status')).toContainText('Oggetto master');
 const heading=page.getByRole('complementary',{name:'Trasforma',exact:true}).locator('[data-movable-heading]'),box=(await heading.boundingBox())!;await page.mouse.move(box.x+10,box.y+10);await page.mouse.down();await page.mouse.move(1080,180,{steps:8});await page.mouse.up();
 await page.screenshot({path:directory+'/transforms-master.png'});
 await page.getByRole('button',{name:'Pannello livelli',exact:true}).click();await expect.poll(async()=>(await page.locator('.workspace-layers-popover').boundingBox())!.width).toBeLessThanOrEqual(360);await expect.poll(async()=>(await page.locator('.workspace-layers-popover').boundingBox())!.height).toBeLessThanOrEqual(600);await page.screenshot({path:directory+'/layers-only.png'});
 expect(errors).toEqual([]);expect(external).toEqual([]);expect(writes).toEqual([]);await writeFile(directory+'/report.json',JSON.stringify({result,errors,external,writes,illustratorVerified:false},null,2));console.log(JSON.stringify({objects:result.length,errors,external,writes}));
}finally{await browser.close();}
