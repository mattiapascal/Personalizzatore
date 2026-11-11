import { chromium, expect } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createTestDocument } from '../tests/helpers/editor-fonts';
const origin = 'http://127.0.0.1:5173', initial = createTestDocument();
initial.documentId = '70707070-7070-4707-a070-707070707070'; initial.areaMm = {width:80,height:60}; initial.colorMode = 'color'; initial.fontAssets = [];
initial.objects = [
  {id:'bg',type:'rect',xMm:0,yMm:0,widthMm:80,heightMm:60,fill:'#0000ff',stroke:'none',strokeMm:.1},
  {id:'paint',type:'rect',xMm:10,yMm:10,widthMm:20,heightMm:10,fill:'#ff0000',stroke:'#00ff00',strokeMm:2},
];
const browser = await chromium.launch();
try {
  const page = await browser.newPage({viewport:{width:1440,height:1050}}), errors:string[] = [], writes:string[] = [];
  await page.addInitScript({content:'window.__name=value=>value;'});
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
  await page.route('**/api/**',route=>route.abort());
  await page.route('**/__editor-local/admin/**',route=>{
    if(route.request().method()!=='GET'){writes.push(route.request().url());return route.abort();}
    return route.fulfill({json:{schemaVersion:1,revision:0,settings:{editorName:'TEST',gridMm:1,gridVisible:false,snapEnabled:false},fonts:[],records:[]}});
  });
  await page.goto(origin+'/editor'); await expect(page.getByTestId('revision')).toBeVisible();
  await page.getByLabel('Riapri progetto JSON').setInputFiles({name:'paint-opacity.source.TEST.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(initial))});
  await page.getByRole('button',{name:'Pannello livelli',exact:true}).click();
  await page.getByRole('button',{name:'Rettangolo · paint',exact:true}).click();
  await page.getByRole('button',{name:'Chiudi pannello livelli',exact:true}).click();
  await page.getByRole('tab',{name:'Riempimento',exact:true}).click();
  const state = async()=>JSON.parse((await page.getByTestId('graphic-state').textContent())!);
  await page.getByLabel('Trasparenza riempimento (%)',{exact:true}).fill('50');
  await expect.poll(async()=>(await state()).revision).toBe(2);
  expect((await state()).objects[1]).toMatchObject({fillOpacity:.5,strokeOpacity:.5});
  await page.getByRole('button',{name:'Collega trasparenza riempimento e contorno',exact:true}).click();
  await page.getByLabel('Trasparenza contorno (%)',{exact:true}).fill('75');
  await expect.poll(async()=>(await state()).revision).toBe(3); const manual=await state();
  expect(manual.objects[1]).toMatchObject({fillOpacity:.5,strokeOpacity:.25});
  await page.getByText('Strumenti sviluppatore',{exact:false}).click();
  await page.getByLabel('Comando AI simulato').fill(JSON.stringify({schemaVersion:1,tool:'updateObject',objectId:'paint',expectedRevision:3,arguments:{object:{...manual.objects[1],fillOpacity:.3,strokeOpacity:.1}}}));
  await page.getByRole('button',{name:'Esegui comando',exact:true}).click();
  await expect.poll(async()=>(await state()).revision).toBe(4);
  await page.getByRole('button',{name:'Annulla',exact:true}).click(); expect((await state()).objects).toEqual(manual.objects);
  const pendingJson=page.waitForEvent('download');await page.getByRole('button',{name:'Esporta JSON',exact:true}).click();
  const saved=JSON.parse(await readFile(await(await pendingJson).path(),'utf8'));
  const pendingSvg=page.waitForEvent('download');await page.getByRole('button',{name:'Esporta SVG',exact:true}).click();
  const svg=await readFile(await(await pendingSvg).path(),'utf8');
  const comparison=await page.evaluate(async svg=>{
    const helper='/tests/helpers/pitchprint-image-reference.browser.ts',{compareColorPixels}=await import(helper);
    const canvas=document.createElement('canvas');canvas.width=960;canvas.height=720;const c=canvas.getContext('2d')!;
    c.fillStyle='#0000ff';c.fillRect(0,0,960,720);c.fillStyle='rgba(255,0,0,0.5)';c.fillRect(11*12,11*12,20*12,10*12);
    c.strokeStyle='rgba(0,255,0,0.25)';c.lineWidth=2*12;c.strokeRect(11*12,11*12,20*12,10*12);
    const result=await compareColorPixels(canvas,svg);delete result.reference;return result;
  },svg);
  expect(comparison.ratio).toBeLessThan(.001);expect(comparison.meanChannelError).toBeLessThan(.1);
  await page.getByText('Strumenti sviluppatore',{exact:false}).click();
  await page.getByRole('button',{name:'Apri area di disegno a tutto schermo',exact:true}).click();
  await expect(page.getByTestId('editor-workspace')).toHaveAttribute('data-view-ready','true');
  await mkdir('.local/previews',{recursive:true});await page.screenshot({path:'.local/previews/editor-paint-opacity-desktop.png'});
  await page.setViewportSize({width:390,height:844});const tools=page.getByRole('button',{name:'Strumenti',exact:true});if(await tools.getAttribute('aria-pressed')==='true')await tools.click();
  const inspector=page.getByRole('button',{name:'Ispettore',exact:true});if(await inspector.getAttribute('aria-pressed')==='false')await inspector.click();await page.getByLabel('Trasparenza riempimento (%)',{exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:'.local/previews/editor-paint-opacity-mobile.png'});
  expect(errors).toEqual([]);expect(writes).toEqual([]);
  await writeFile('fixtures/illustrator/paint-opacity.source.TEST.json',JSON.stringify(initial,null,2)+'\n');
  await writeFile('fixtures/illustrator/paint-opacity.TEST.json',JSON.stringify(saved,null,2)+'\n');
  await writeFile('fixtures/illustrator/paint-opacity.TEST.svg',svg);
  const report={comparison,revision:saved.revision,browserErrors:errors,adminWrites:writes};await writeFile('.local/paint-opacity-capture.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
} finally { await browser.close(); }
