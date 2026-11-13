import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {stampProductionFixture} from '../tests/helpers/stamp-production';
import {fixtureCatalog} from '../src/catalog/adapter';
const directory='.local/stamp-production/capture',origin='http://127.0.0.1:5173',fixture=stampProductionFixture(),browser=await chromium.launch();await mkdir(directory,{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors:string[]=[],external:string[]=[],writes:string[]=[];
 await page.addInitScript({content:'window.__name=value=>value;'});
 page.on('pageerror',error=>errors.push(error.message));await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.fallback():(external.push(route.request().url()),route.abort()));await page.route('**/api/**',route=>route.abort());await page.route('**/__editor-local/admin/**',route=>{if(route.request().method()!=='GET')writes.push(route.request().url());return route.fulfill({json:{schemaVersion:1,revision:0,settings:{editorName:'TEST',gridMm:1,gridVisible:false,snapEnabled:false},records:[],fonts:[]}});});
 await page.goto(origin+'/editor?workspace=1&mode=test');await expect(page.getByTestId('revision')).toBeVisible();await page.getByLabel('Riapri progetto JSON').setInputFiles({name:'stamp-production.TEST.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});await expect(page.getByTestId('editor-workspace')).toHaveAttribute('data-view-ready','true');
 const output=await page.evaluate(async({document,catalog})=>{
  const paths=['/src/editor/model.ts','/src/editor/fabric-adapter.ts','/src/editor/production-check.ts','/src/editor/production-check-browser.ts'],[{DocumentStore},{measureFabric,exportDocumentSvg},{assertDocumentProduction},{browserBinaryRasterCheck}]=await Promise.all(paths.map(path=>import(path))),store=new DocumentStore(document,measureFabric,catalog,'admin'),messages:string[]=[];
  const check=()=>assertDocumentProduction(store.document,catalog,browserBinaryRasterCheck,true);
  try{await check();throw Error('Contorno non rilevato');}catch(error){messages.push(String(error));}if(!messages[0]!.includes('outlined-text'))throw Error('Errore inatteso sul contorno');
  const text=store.document.objects.find((object:any)=>object.type==='text');store.dispatch({schemaVersion:1,tool:'updateObject',objectId:text.id,expectedRevision:store.document.revision,arguments:{object:{...text,characterStyles:[{start:1,end:2,style:{strokeOpacity:1}}]}}},'manual');
  try{await check();throw Error('Alpha non rilevato');}catch(error){messages.push(String(error));}if(!messages[1]!.includes('alpha-image'))throw Error('Errore inatteso sull’immagine');
  const image=store.document.objects[0];store.dispatch({schemaVersion:1,tool:'updateObject',objectId:image.id,expectedRevision:store.document.revision,arguments:{object:{...image,raster:{threshold:128,invert:false,whiteTransparent:true}}}},'ai-simulation');await check();
  return{document:store.document,svg:await exportDocumentSvg(store.document),messages};
 },{document:fixture,catalog:{version:fixtureCatalog.version,products:fixtureCatalog.list()}});
 for(let i=0;i<2;i++){const before=fixture.objects[i]!,after=output.document.objects[i]!;expect(after.source).toEqual(before.type==='image'?before.source:undefined);}
 await writeFile('fixtures/illustrator/stamp-production.TEST.json',JSON.stringify(output.document,null,2)+'\n');await writeFile('fixtures/illustrator/stamp-production.TEST.svg',output.svg);
 await page.getByLabel('Riapri progetto JSON').setInputFiles({name:'stamp-production-corrected.TEST.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(output.document))});await expect(page.getByTestId('editor-workspace')).toHaveAttribute('data-view-ready','true');await page.screenshot({path:directory+'/corrected.png'});
 expect(errors).toEqual([]);expect(external).toEqual([]);expect(writes).toEqual([]);await writeFile(directory+'/report.json',JSON.stringify({messages:output.messages,errors,external,writes,revision:output.document.revision,originalsPreserved:true,illustratorVerified:false},null,2));console.log(JSON.stringify({messages:output.messages,objects:output.document.objects.length,errors,external,writes}));
}finally{await browser.close();}
