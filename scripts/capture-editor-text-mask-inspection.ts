import { chromium,expect } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
import { textMasksFixture } from '../tests/helpers/text-masks';

const origin='http://127.0.0.1:5173',directory='.local/text-mask-inspection-capture',browser=await chromium.launch();
await mkdir(directory,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors:string[]=[],external:string[]=[],writes:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.fallback():(external.push(route.request().url()),route.abort()));
 await page.route('**/api/**',route=>route.abort());
 await page.route('**/__editor-local/media/**',route=>route.fulfill({json:{schemaVersion:1,revision:0,categories:[],assets:[]}}));
 await page.route('**/__editor-local/admin/**',route=>{if(route.request().method()!=='GET')writes.push(route.request().url());return route.fulfill({json:{schemaVersion:1,revision:0,settings:{editorName:'TEST',gridMm:1,gridVisible:false,snapEnabled:false},records:[],fonts:[]}});});
 await page.goto(origin+'/editor?workspace=1&mode=admin');await expect(page.getByTestId('revision')).toBeVisible();
 const fixture=textMasksFixture();
 await page.getByLabel('Riapri progetto JSON').setInputFiles({name:'text-masks.TEST.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
 const state=async()=>JSON.parse((await page.getByTestId('graphic-state').textContent())!),panel=page.getByTestId('text-mask-check');
 await expect(panel.getByRole('button',{name:'Mostra masked-auto',exact:true})).toBeVisible();
 await expect(panel.getByRole('button',{name:'Mostra masked-fixed',exact:true})).toBeVisible();
 expect((await state()).objects).toEqual(fixture.objects);
 await panel.getByRole('button',{name:'Mostra masked-auto',exact:true}).click();
 await page.getByRole('tab',{name:'Testo',exact:true}).click();await page.locator('.text-mask-settings summary').click();
 await panel.scrollIntoViewIfNeeded();const canvasBefore=await page.locator('.upper-canvas').boundingBox();
 await page.screenshot({path:directory+'/warning.png'});
 const width=page.getByLabel('Larghezza maschera 1 (mm)',{exact:true});await width.fill('100');await width.press('Tab');
 await expect(panel.getByRole('button',{name:'Mostra masked-auto',exact:true})).toHaveCount(0);
 await expect(panel.getByRole('button',{name:'Mostra masked-fixed',exact:true})).toBeVisible();
 await expect(panel).not.toContainText('Controllo del testo ritagliato…');
 await panel.scrollIntoViewIfNeeded();expect(await page.locator('.upper-canvas').boundingBox()).toEqual(canvasBefore);
 await page.screenshot({path:directory+'/corrected.png'});
 expect(errors).toEqual([]);expect(external).toEqual([]);expect(writes).toEqual([]);
 await writeFile(directory+'/report.json',JSON.stringify({fixture:'fixtures/illustrator/text-masks.TEST.json',before:fixture.objects,after:(await state()).objects,errors,external,writes,illustratorVerified:false},null,2));
 console.log(JSON.stringify({objects:fixture.objects.length,errors,external,writes}));
}finally{await browser.close();}
