import {chromium,expect} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {multiImageScene} from '../tests/helpers/multi-image-scene';
import {clickEditorButton} from '../tests/helpers/editor-ui';
import type {GraphicDocument} from '../src/editor/model';

const origin='http://127.0.0.1:5173',input=multiImageScene(),browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors:string[]=[],writes:string[]=[],external:string[]=[];
 await page.addInitScript({content:'window.__name=value=>value;'});
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{if(new URL(r.request().url()).origin===origin)return r.continue();external.push(r.request().url());return r.abort();});
 await page.route('**/api/**',r=>r.abort());
 await page.route('**/__editor-local/admin/**',r=>{if(r.request().method()!=='GET'){writes.push(r.request().url());return r.abort();}return r.fulfill({json:{schemaVersion:1,revision:0,settings:{editorName:'TEST',gridMm:1,gridVisible:false,snapEnabled:false},fonts:[],records:[]}});});
 await page.goto(origin+'/editor?workspace=1');
 await page.getByLabel('Riapri progetto JSON').setInputFiles({name:'multi-image.source.TEST.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(input))});
 const state=async()=>JSON.parse((await page.getByTestId('graphic-state').textContent())!) as GraphicDocument;
 await expect.poll(async()=>(await state()).objects.length).toBe(32);
 expect((await state()).objects).toEqual(input.objects);
 await clickEditorButton(page,{name:'Immagine · photo-1',exact:true});
 await page.getByRole('tab',{name:'Geometria',exact:true}).click();
 await page.getByLabel('X (mm)',{exact:true}).fill('18');
 await expect.poll(async()=>(await state()).revision).toBe(2);
 const manual=await state();await clickEditorButton(page,{name:'Annulla',exact:true});expect((await state()).objects).toEqual(input.objects);
 await clickEditorButton(page,{name:'Ripristina',exact:true});expect((await state()).objects).toEqual(manual.objects);
 await page.getByText('Strumenti sviluppatore',{exact:false}).click();
 const revision=(await state()).revision;
 await page.getByLabel('Comando AI simulato').fill(JSON.stringify({schemaVersion:1,tool:'moveObjects',objectId:'photo-1',expectedRevision:revision,arguments:{objectIds:['photo-1','photo-2'],deltaXmm:1,deltaYmm:0}}));
 await page.getByRole('button',{name:'Esegui comando',exact:true}).click();
 await expect.poll(async()=>(await state()).revision).toBe(revision+1);
 await clickEditorButton(page,{name:'Annulla',exact:true});expect((await state()).objects).toEqual(manual.objects);
 await page.getByText('Strumenti sviluppatore',{exact:false}).click();
 let pending=page.waitForEvent('download');await clickEditorButton(page,{name:'Esporta JSON',exact:true});
 const saved=JSON.parse(await readFile(await(await pending).path(),'utf8')) as GraphicDocument;
 pending=page.waitForEvent('download');await clickEditorButton(page,{name:'Esporta SVG',exact:true});
 const svg=await readFile(await(await pending).path(),'utf8');expect(svg.match(/<image\s/g)).toHaveLength(32);
 // Independent Canvas2D placement/crop/rotation reference. The processed
 // bitmaps deliberately use the existing separately tested filter engine.
 const comparison=await page.evaluate(async({doc,svg})=>{
  const helper='/tests/helpers/browser-module.ts',cache=(await import(helper)).loadedEditorModule('/src/editor/raster-cache.ts');
  const {originalRasterImage,rasterCanvas}=await import(cache),reference=document.createElement('canvas');
  reference.width=1920;reference.height=1200;const c=reference.getContext('2d')!;c.fillStyle='white';c.fillRect(0,0,1920,1200);c.scale(12,12);
  const originals=doc.objects.map(o=>{if(o.type!=='image')throw Error('Solo immagini TEST');return originalRasterImage(o.source);});
  for(const o of doc.objects){if(o.type!=='image')throw Error('Solo immagini TEST');
   const crop=o.crop??{leftPx:0,topPx:0,widthPx:o.source.pixelWidth,heightPx:o.source.pixelHeight},angle=(o.rotationDeg??0)*Math.PI/180,w=o.widthMm,h=o.heightMm;
   c.save();c.translate(o.xMm+(Math.abs(Math.cos(angle))*w+Math.abs(Math.sin(angle))*h)/2,o.yMm+(Math.abs(Math.sin(angle))*w+Math.abs(Math.cos(angle))*h)/2);c.rotate(angle);c.scale(o.flipX?-1:1,o.flipY?-1:1);
   c.beginPath();c.rect(-w/2,-h/2,w,h);c.clip();
   c.drawImage(o.raster.mode==='original'?originalRasterImage(o.source):rasterCanvas(o.source,o.raster),-w/2-crop.leftPx*w/crop.widthPx,-h/2-crop.topPx*h/crop.heightPx,o.source.pixelWidth*w/crop.widthPx,o.source.pixelHeight*h/crop.heightPx);c.restore();
  }
  const path='/tests/helpers/pitchprint-image-reference.browser.ts',{compareColorPixels}=await import(path),result=await compareColorPixels(reference,svg);
  return{different:result.different,ink:result.ink,ratio:result.ratio,meanChannelError:result.meanChannelError,uniquePreparedOriginals:new Set(originals).size,placements:originals.length};
 },{doc:saved,svg});
 expect(comparison.uniquePreparedOriginals).toBe(8);expect(comparison.placements).toBe(32);
 expect(comparison.ratio).toBeLessThan(.03);expect(comparison.meanChannelError).toBeLessThan(2);
 await expect(page.getByRole('alert')).toHaveCount(0);await mkdir('.local/multi-image-capture',{recursive:true});
 await page.getByRole('button',{name:'Deseleziona tutto',exact:true}).isVisible().then(async visible=>{if(visible)await clickEditorButton(page,{name:'Deseleziona tutto',exact:true});});
 await page.getByRole('button',{name:'Adatta all’area',exact:true}).click();await page.screenshot({path:'.local/multi-image-capture/desktop.png'});
 await page.setViewportSize({width:390,height:844});
 // Wait for the breakpoint effect: clicking while it closes the panels can
 // otherwise reopen a panel and invalidate the mobile screenshot.
 for(const name of ['Strumenti','Ispettore'])await expect(page.getByRole('button',{name,exact:true})).toHaveAttribute('aria-pressed','false');
 await page.getByRole('button',{name:'Adatta all’area',exact:true}).click();await page.screenshot({path:'.local/multi-image-capture/mobile.png'});
 expect(errors).toEqual([]);expect(writes).toEqual([]);expect(external).toEqual([]);
 await writeFile('fixtures/illustrator/multi-image.source.TEST.json',JSON.stringify(input,null,2)+'\n');
 await writeFile('fixtures/illustrator/multi-image.TEST.json',JSON.stringify(saved,null,2)+'\n');await writeFile('fixtures/illustrator/multi-image.TEST.svg',svg);
 const report={comparison,browserErrors:errors,adminWrites:writes,externalRequests:external};
 await writeFile('.local/multi-image-capture/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
