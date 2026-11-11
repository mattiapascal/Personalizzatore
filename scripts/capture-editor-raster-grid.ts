import {chromium,expect} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import {testPng} from '../tests/helpers/png';
const origin='http://127.0.0.1:5173';
const source={id:'raster-grid-source-TEST',mime:'image/png',pixelWidth:64,pixelHeight:32,
 dataUrl:`data:image/png;base64,${testPng(64,32,new Uint8Array(Array.from({length:2048},()=>[128,128,128,255]).flat())).toString('base64')}`};
const browser=await chromium.launch();
try {
 const page=await browser.newPage(),errors:string[]=[],writes:string[]=[];
 await page.addInitScript({content:'window.__name=value=>value;'});
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 await page.route('**/api/**',route=>route.abort());
 await page.route('**/__editor-local/admin/**',route=>{
  if(route.request().method()!=='GET'){writes.push(route.request().url());return route.abort();}
  return route.fulfill({json:{schemaVersion:1,revision:0,settings:{editorName:'TEST',gridMm:1,gridVisible:false,snapEnabled:false},fonts:[],records:[]}});
 });
 await page.goto(origin+'/editor');await expect(page.getByTestId('revision')).toBeVisible();
 const result=await page.evaluate(async source=>{
  const model='/src/editor/model.ts',adapter='/src/editor/fabric-adapter.ts',crop='/src/editor/raster-crop-edit.ts',compare='/tests/helpers/pitchprint-image-reference.browser.ts';
  const{createDocument,DocumentStore}=await import(model),{prepareRasterSource,measureFabric,exportDocumentSvg}=await import(adapter),{cropRasterInPlace}=await import(crop),{compareColorPixels}=await import(compare);
  await prepareRasterSource(source);
  const initial=createDocument();initial.documentId='30303030-3030-4303-a030-303030303030';initial.fontAssets=[];initial.areaMm={width:60,height:40};
  initial.objects=[{id:'halftone',type:'image',xMm:10,yMm:10,widthMm:32,heightMm:16,source,raster:{threshold:128,invert:false,whiteTransparent:false,method:'ordered'}}];
  const store=new DocumentStore(initial,measureFabric),object=cropRasterInPlace(initial.objects[0],{leftPx:3.25,topPx:1.5,widthPx:54.5,heightPx:26.25},measureFabric);
  store.dispatch({schemaVersion:1,tool:'updateObject',objectId:'halftone',expectedRevision:0,arguments:{object}},'manual');
  store.dispatch({schemaVersion:1,tool:'updateObject',objectId:'halftone',expectedRevision:1,arguments:{object:cropRasterInPlace(object,{leftPx:6.75,topPx:2.125,widthPx:48,heightPx:23.5},measureFabric)}},'ai-simulation');
  store.undo();if(JSON.stringify(store.document.objects[0])!==JSON.stringify(object))throw Error('Undo non conserva il ritaglio manuale');
  const svg=await exportDocumentSvg(store.document),reference=document.createElement('canvas');reference.width=960;reference.height=640;
  const grid=document.createElement('canvas');grid.width=64;grid.height=32;const ctx=grid.getContext('2d')!,pixels=ctx.createImageData(64,32);
  for(let y=0;y<32;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4,v=(x+y)%2?0:255;pixels.data.set([v,v,v,255],i);}ctx.putImageData(pixels,0,0);
  const target=reference.getContext('2d')!;target.fillStyle='white';target.fillRect(0,0,960,640);
  target.drawImage(grid,3.25,1.5,54.5,26.25,object.xMm*16,object.yMm*16,object.widthMm*16,object.heightMm*16);
  const comparison=await compareColorPixels(reference,svg);delete comparison.reference;
  return{initial,document:store.document,svg,comparison,events:store.events};
 },source);
 expect(result.comparison.ratio).toBeLessThan(.03);expect(result.comparison.meanChannelError).toBeLessThan(2);expect(errors).toEqual([]);expect(writes).toEqual([]);
 await writeFile('fixtures/illustrator/raster-grid.source.TEST.json',JSON.stringify(result.initial,null,2)+'\n');
 await writeFile('fixtures/illustrator/raster-grid.TEST.json',JSON.stringify(result.document,null,2)+'\n');
 await writeFile('fixtures/illustrator/raster-grid.TEST.svg',result.svg);
 await mkdir('.local',{recursive:true});await writeFile('.local/raster-grid-capture.json',JSON.stringify({comparison:result.comparison,events:result.events,browserErrors:errors,adminWrites:writes},null,2));
 console.log(JSON.stringify({comparison:result.comparison,browserErrors:errors,adminWrites:writes}));
} finally {await browser.close();}
