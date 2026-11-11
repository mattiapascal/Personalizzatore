import { chromium, expect } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { testPng } from '../tests/helpers/png';
const origin='http://127.0.0.1:5173',pixels=new Uint8Array(64*48*4);
for(let y=0;y<48;y++)for(let x=0;x<64;x++)pixels.set(x<32?(y<24?[220,40,20,255]:[20,180,80,255]):(y<24?[20,70,220,255]:[180,40,200,255]),(y*64+x)*4);
const original=`data:image/png;base64,${testPng(64,48,pixels).toString('base64')}`,preview=`data:image/png;base64,${testPng().toString('base64')}`;
const source={title:'TEST · immagini originali e ritagli PitchPrint',unit:'mm',pages:[{pageData:{fWidth:160,fHeight:100},canvas:{clipPath:{left:20,top:10,width:800,height:501},objects:[{type:'image',width:64,height:48,left:80,top:75,scaleX:3.3,scaleY:2.4,strokeWidth:2,src:preview,url:original,flipX:true},{type:'image',width:32,height:24,cropX:16,cropY:12,left:450,top:110,scaleX:4,scaleY:5,src:original,originX:'center',originY:'center',flipY:true}]}}]};
const browser=await chromium.launch();let writes=0;
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await page.addInitScript({content:'window.__name=value=>value;'});
 await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());await page.route('**/api/**',route=>route.abort());await page.route('**/__editor-local/admin/**',route=>{if(route.request().method()!=='GET'){writes++;return route.abort();}return route.fulfill({json:{schemaVersion:1,revision:0,settings:{editorName:'TEST',gridMm:1,gridVisible:false,snapEnabled:false},records:[],fonts:[]}});});
 await page.goto(`${origin}/editor?workspace=1&mode=test`);await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 0 ·');
 const result=await page.evaluate(async source=>{
  const a='/src/editor/pitchprint-import.ts',b='/src/editor/fabric-adapter.ts',c='/src/editor/model.ts',d='/tests/helpers/pitchprint-image-reference.browser.ts';
  const[{importPitchPrint},{exportDocumentSvg,measureFabric,prepareRasterSource},{DocumentStore},{pitchprintImageReference,compareColorPixels}]=await Promise.all([import(a),import(b),import(c),import(d)]),converted=await importPitchPrint(source,{monochrome:false,excludeBackground:false,font:async()=>{throw Error('Campione senza font');},image:async()=>{throw Error('Immagini incorporate');}}),doc=converted.document;
  doc.documentId='99999999-9999-4999-a999-999999999999';for(const[index,object]of doc.objects.entries()){if(object.type!=='image')throw Error('Tipo inatteso');object.source.id=`image-pitchprint-test-${index+1}`;await prepareRasterSource(object.source);}
  const store=new DocumentStore(doc,measureFabric),object=doc.objects[0];
  store.dispatch({schemaVersion:1,expectedRevision:0,tool:'moveObject',objectId:object.id,arguments:{xMm:object.xMm+2,yMm:object.yMm+1}},'manual');store.dispatch({schemaVersion:1,expectedRevision:1,tool:'moveObject',objectId:object.id,arguments:{xMm:object.xMm,yMm:object.yMm}},'ai-simulation');store.undo();store.redo();
  const svg=await exportDocumentSvg(store.document),reference=await pitchprintImageReference(source,{}),comparison=await compareColorPixels(reference,svg);
  return{doc:store.document,svg,comparison,warnings:converted.warnings,events:store.events.map((event:any)=>({source:event.source,revision:event.revision}))};
 },source);
 expect(result.comparison.ratio).toBeLessThan(.025);expect(result.comparison.meanChannelError).toBeLessThan(1.5);expect(result.doc.objects).toHaveLength(2);
 await page.getByLabel('Riapri progetto JSON').setInputFiles({name:'pitchprint-images.TEST.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(result.doc))});await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 1 ·');await page.getByRole('button',{name:'Adatta all’area',exact:true}).click();await expect(page.getByRole('alert')).toHaveCount(0);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Esporta SVG',exact:true}).click();expect(await readFile((await (await download).path())!,'utf8')).toContain('width="160mm"');
 await mkdir('.local/previews',{recursive:true});await page.screenshot({path:'.local/previews/editor-pitchprint-images.png'});
 await writeFile('fixtures/illustrator/pitchprint-images.source.TEST.json',JSON.stringify(source,null,2)+'\n');await writeFile('fixtures/illustrator/pitchprint-images.TEST.json',JSON.stringify(result.doc,null,2)+'\n');await writeFile('fixtures/illustrator/pitchprint-images.TEST.svg',result.svg);
 const{reference,...comparison}=result.comparison;await writeFile('.local/previews/pitchprint-images-reference.png',Buffer.from(reference.split(',')[1]!,'base64'));
 const report={areaMm:result.doc.areaMm,objects:result.doc.objects.length,comparison,warnings:result.warnings,events:result.events,adminWrites:writes,browserErrors:errors};expect(writes).toBe(0);expect(errors).toEqual([]);await writeFile('.local/pitchprint-images-capture.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
