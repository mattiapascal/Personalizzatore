import { chromium, expect } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { TEST_FONT_ASSETS } from '../tests/helpers/editor-fonts';
const origin='http://127.0.0.1:5173',source=JSON.parse(await readFile('fixtures/illustrator/pitchprint-text-styles.source.TEST.json','utf8')),browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors:string[]=[],writes:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));await page.addInitScript({content:'window.__name=value=>value;'});
 await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());await page.route('**/api/**',route=>route.abort());
 await page.route('**/__editor-local/admin/**',route=>{if(route.request().method()!=='GET'){writes.push(route.request().url());return route.abort();}return route.fulfill({json:{schemaVersion:1,revision:0,settings:{editorName:'TEST',gridMm:1,gridVisible:false,snapEnabled:false},fonts:[],records:[]}});});
 await page.goto(`${origin}/editor?workspace=1&mode=test`);
 const result=await page.evaluate(async({source,assets})=>{
  const a='/src/editor/pitchprint-import.ts',b='/src/editor/fabric-adapter.ts',c='/tests/helpers/pitchprint-group-reference.browser.ts',d='/src/editor/model.ts';
  const [{importPitchPrint},{FabricAdapter,measureFabric},{pitchprintReferenceSvg,svgPixelDifference},{DocumentStore}]=await Promise.all([import(a),import(b),import(c),import(d)]),converted=await importPitchPrint(source,{monochrome:false,excludeBackground:false,font:async(family:string,weight:number,italic:boolean)=>{const font=assets.find((asset:any)=>asset.familyGroup===family&&asset.weight===weight&&asset.italic===italic);if(!font)throw Error('Variante TEST esatta mancante');return font;},image:async()=>{throw Error('Nessuna immagine nel campione');}});
  converted.document.documentId='77777777-7777-4777-a777-777777777777';
  const store=new DocumentStore(converted.document,measureFabric),id=store.document.objects[0].id;
  store.dispatch({schemaVersion:1,tool:'moveObject',objectId:id,expectedRevision:0,arguments:{xMm:store.document.objects[0].xMm+2,yMm:store.document.objects[0].yMm}},'manual');
  store.dispatch({schemaVersion:1,tool:'moveObject',objectId:id,expectedRevision:1,arguments:{xMm:converted.document.objects[0].xMm,yMm:converted.document.objects[0].yMm}},'ai-simulation');store.undo();store.redo();
  const adapter=new FabricAdapter(document.createElement('canvas'),()=>0,()=>{});
  try{const svg=adapter.exportSvg(store.document),reference=await pitchprintReferenceSvg(source,assets);return{document:store.document,svg,reference,pixels:await svgPixelDifference(reference,svg,1200,600),warnings:converted.warnings};}finally{adapter.dispose();}
 },{source,assets:TEST_FONT_ASSETS});
 expect(result.pixels.ratio).toBeLessThan(.03);expect(result.document.objects).toHaveLength(2);
 await page.getByLabel('Riapri progetto JSON').setInputFiles({name:'pitchprint-text-styles.TEST.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(result.document))});await expect(page.getByTestId('revision')).toContainText('200 × 100 mm');await expect(page.getByRole('alert')).toHaveCount(0);
 await mkdir('.local/previews',{recursive:true});await page.screenshot({path:'.local/previews/editor-pitchprint-text-styles-desktop.png'});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.local/previews/editor-pitchprint-text-styles-mobile.png'});
 await writeFile('fixtures/illustrator/pitchprint-text-styles.TEST.json',JSON.stringify(result.document,null,2)+'\n');await writeFile('fixtures/illustrator/pitchprint-text-styles.TEST.svg',result.svg);await writeFile('.local/pitchprint-text-styles-reference.TEST.svg',result.reference);
 expect(errors).toEqual([]);expect(writes).toEqual([]);const report={objects:2,areaMm:result.document.areaMm,fontFiles:result.document.fontAssets?.length,pixels:result.pixels,browserErrors:errors,adminWrites:writes,warnings:result.warnings};await writeFile('.local/editor-pitchprint-text-styles-capture.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
} finally {await browser.close();}
