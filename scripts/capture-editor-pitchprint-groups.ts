import {chromium,expect} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {TEST_FONT_ASSETS} from '../tests/helpers/editor-fonts';
const source=JSON.parse(await readFile('fixtures/illustrator/pitchprint-groups.source.TEST.json','utf8')),asset=TEST_FONT_ASSETS.find(font=>font.id==='font-aaaaaaaa-0000-4000-8000-000000000001')!,origin='http://127.0.0.1:5173',browser=await chromium.launch();
let writes=0;
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await page.addInitScript({content:'window.__name=value=>value;'});
 await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());await page.route('**/api/**',route=>route.abort());
 await page.route('**/__editor-local/admin/**',route=>{if(route.request().method()!=='GET'){writes++;return route.abort();}return route.fulfill({json:{schemaVersion:1,revision:0,settings:{editorName:'TEST',gridMm:1,gridVisible:false,snapEnabled:false},records:[],fonts:[]}});});
 await page.goto(`${origin}/editor?workspace=1&mode=test`);await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 0 ·');
 const result=await page.evaluate(async({source,asset})=>{
  const a='/src/editor/pitchprint-import.ts',b='/src/editor/fabric-adapter.ts',c='/src/editor/model.ts',d='/tests/helpers/pitchprint-group-reference.browser.ts',e='/src/editor/font-preflight.ts';
  const[{importPitchPrint},{FabricAdapter,measureFabric},{DocumentStore},{pitchprintReferenceSvg,svgPixelDifference},{inspectDocumentFonts}]=await Promise.all([import(a),import(b),import(c),import(d),import(e)]),converted=await importPitchPrint(source,{monochrome:false,excludeBackground:false,font:async()=>asset,image:async()=>{throw new Error('Il campione non usa immagini');}});converted.document.documentId='88888888-8888-4888-a888-888888888888';
  const store=new DocumentStore(converted.document,measureFabric),ids=store.document.groups![0].objectIds;
  store.dispatch({schemaVersion:1,expectedRevision:0,tool:'moveObjects',objectId:ids[0],arguments:{objectIds:ids,deltaXmm:2,deltaYmm:1}},'manual');store.dispatch({schemaVersion:1,expectedRevision:1,tool:'moveObjects',objectId:ids[0],arguments:{objectIds:ids,deltaXmm:-2,deltaYmm:-1}},'ai-simulation');store.undo();store.redo();
  const doc=store.document,view=new FabricAdapter(document.createElement('canvas'),()=>0,()=>{});try{const svg=view.exportSvg(doc),reference=await pitchprintReferenceSvg(source,asset);return{doc,svg,reference,pixels:await svgPixelDifference(reference,svg),fontReport:await inspectDocumentFonts(doc),warnings:converted.warnings,events:store.events.map((event:any)=>({source:event.source,revision:event.revision}))};}finally{view.dispose();}
 },{source,asset});
 expect(result.doc.groups).toHaveLength(2);expect(result.doc.objects).toHaveLength(6);expect(result.fontReport.issues).toEqual([]);expect(result.pixels.ratio).toBeLessThan(.04);expect(result.events.map((event:{source:string})=>event.source)).toEqual(['manual','ai-simulation','undo','redo']);
 await page.getByLabel('Riapri progetto JSON').setInputFiles({name:'pitchprint-groups.TEST.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(result.doc))});await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 1 ·');await expect(page.getByRole('alert')).toHaveCount(0);await page.getByRole('button',{name:'Adatta all’area',exact:true}).click();
 await mkdir('.local/previews',{recursive:true});await writeFile('fixtures/illustrator/pitchprint-groups.TEST.json',JSON.stringify(result.doc,null,2)+'\n');await writeFile('fixtures/illustrator/pitchprint-groups.TEST.svg',result.svg);await writeFile('.local/pitchprint-groups-reference.TEST.svg',result.reference);await page.screenshot({path:'.local/previews/editor-pitchprint-groups.png'});
 const report={areaMm:result.doc.areaMm,objects:6,groups:2,fontFiles:1,fontReport:result.fontReport,pixels:result.pixels,warnings:result.warnings,events:result.events,adminWrites:writes,browserErrors:errors};expect(writes).toBe(0);expect(errors).toEqual([]);await writeFile('.local/pitchprint-groups-capture.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
