import { chromium,expect } from '@playwright/test';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { TEST_DEFAULT_FONT } from '../tests/helpers/editor-fonts';
import { canvasDecorationReference } from '../tests/helpers/canvas-decoration-reference.browser';
import { pitchprintMaskCases,maskedPitchprintSource } from '../tests/helpers/pitchprint-text-masks';
import { nativeMaskGeometry,nativeMaskedSceneSvg } from '../tests/helpers/pitchprint-mask-native-reference';

const argument=process.argv.indexOf('--legacy-file');
if(argument<0||!process.argv[argument+1])throw Error('Indicare --legacy-file con Fabric 3.4.0 già disponibile localmente. Nessun download automatico.');
const runtime=await readFile(process.argv[argument+1]!,'utf8'),source=maskedPitchprintSource(),font=TEST_DEFAULT_FONT,cases=pitchprintMaskCases();
const origin='http://127.0.0.1:5173',directory='.local/pitchprint-text-mask-reference',browser=await chromium.launch();
const requests:string[]=[],errors:string[]=[],writes:string[]=[];
await mkdir(directory,{recursive:true});
try{
 const native=await browser.newPage();
 native.on('pageerror',error=>errors.push(error.message));
 await native.route('**/*',route=>{requests.push(route.request().url());return route.abort();});
 await native.goto('about:blank');
 await native.evaluate('window.__name=value=>value');
 await native.addScriptTag({content:runtime});
 await native.addScriptTag({content:'window.nativeMaskGeometry='+nativeMaskGeometry.toString()+';'});
 const references=await native.evaluate(rows=>{
  const L=(window as any).fabric;
  if(L.version!=='3.4.0')throw Error('Runtime originale non corretto');
  return rows.map(raw=>({name:raw.name,masks:(window as any).nativeMaskGeometry(L,raw.clipPath)}));
 },cases);
 await native.addScriptTag({content:'window.canvasDecorationReference='+canvasDecorationReference.toString()+';window.nativeMaskedSceneSvg='+nativeMaskedSceneSvg.toString()+';'});
 const nativeSvg=await native.evaluate(async({source,font})=>{
  const alias='ArimoNativeMaskTEST',face=await new FontFace(alias,Uint8Array.from(atob(font.dataBase64),c=>c.charCodeAt(0)),{weight:'400',style:'normal'}).load();
  document.fonts.add(face);
  const svg=(window as any).nativeMaskedSceneSvg((window as any).fabric,source,alias),xml=new DOMParser().parseFromString(svg,'image/svg+xml');
  const style=xml.createElementNS(xml.documentElement.namespaceURI,'style');
  style.textContent=`@font-face{font-family:"${alias}";src:url(data:font/ttf;base64,${font.dataBase64});font-weight:400;font-style:normal;}`;
  xml.documentElement.prepend(style);
  return new XMLSerializer().serializeToString(xml);
 },{source,font});
 await native.close();

 const page=await browser.newPage({viewport:{width:1500,height:1000}});
 await page.addInitScript({content:'window.__name=value=>value;'});
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.fallback():(requests.push(route.request().url()),route.abort()));
 await page.route('**/api/**',route=>route.abort());
 await page.route('**/__editor-local/admin/**',route=>{
  if(route.request().method()!=='GET')writes.push(route.request().url());
  return route.fulfill({json:{schemaVersion:1,revision:0,settings:{editorName:'TEST',gridMm:1,gridVisible:false,snapEnabled:false},records:[],fonts:[]}});
 });
 await page.route('**/__editor-local/media/**',route=>route.fulfill({json:{schemaVersion:1,revision:0,categories:[],assets:[]}}));
 await page.goto(origin+'/editor?workspace=1&mode=admin');
 await expect(page.getByTestId('revision')).toBeVisible();
 const result=await page.evaluate(async({cases,references,source,font,nativeSvg})=>{
  const h='/tests/helpers/browser-module.ts',{loadedEditorModule}=await import(h);
  const p='/src/editor/pitchprint-text-masks.ts',q='/src/editor/text-clip-masks.ts',r='/tests/helpers/svg-color-reference.browser.ts';
  const{readPitchprintTextMasks,canonicalPitchprintTextMasks}=await import(loadedEditorModule(p)),{textClipCommands}=await import(loadedEditorModule(q)),{compareSupersampledSvg}=await import(r);
  const rows=[],geometrySvg=(mask:any)=>`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="-500 -500 1000 1000"><path d="${mask.commands.map((c:any[])=>c.join(' ')).join(' ')}" fill-rule="${mask.fillRule}"/></svg>`;
  for(let i=0;i<cases.length;i++){
   const actual=readPitchprintTextMasks(cases[i]!,String(cases[i]!.name))!,expected=references[i]!.masks;
   const canonical=canonicalPitchprintTextMasks(actual,.23,{x:3,y:-4})!,layers=[];
   for(let j=0;j<expected.length;j++){
    const restored=textClipCommands(canonical[j]!).map((c:any[])=>c[0]==='Z'?c:[c[0],...c.slice(1).map((v:number,k:number)=>(v+(k%2?-4:3))/.23)]);
    layers.push(await compareSupersampledSvg(geometrySvg(expected[j]),geometrySvg({commands:restored,fillRule:actual[j]!.fillRule}),500,500));
   }
   rows.push({name:cases[i]!.name,layers});
  }
  const importPath='/src/editor/pitchprint-import.ts',adapterPath='/src/editor/fabric-adapter.ts';
  const{importPitchPrint}=await import(loadedEditorModule(importPath)),{exportDocumentSvg}=await import(loadedEditorModule(adapterPath));
  const converted=await importPitchPrint(source,{monochrome:false,excludeBackground:false,font:async()=>font,image:async()=>{throw Error('Nessuna immagine TEST');}});
  const svg=await exportDocumentSvg(converted.document),pixels=await compareSupersampledSvg(nativeSvg,svg,996,678),wrong=structuredClone(converted.document);
  for(const object of wrong.objects)if(object.type==='text')object.textClipMasks=undefined;
  const negative=await compareSupersampledSvg(nativeSvg,await exportDocumentSvg(wrong),996,678);
  return{rows,document:converted.document,svg,pixels,negative,warnings:converted.warnings};
 },{cases,references,source,font,nativeSvg});
 const report={runtimeSha256:createHash('sha256').update(runtime).digest('hex'),requests,errors,writes,...result,document:undefined,svg:undefined,illustratorVerified:false};
 await writeFile(directory+'/report.json',JSON.stringify(report,null,2));
 for(const row of result.rows)for(const layer of row.layers){expect(layer.ratio,String(row.name)).toBeLessThan(.01);expect(layer.meanChannelError,String(row.name)).toBeLessThan(.25);}
 expect(result.pixels.ratio).toBeLessThan(.01);expect(result.pixels.meanChannelError).toBeLessThan(.25);expect(result.negative.ratio).toBeGreaterThan(.1);
 expect(requests).toEqual([]);expect(errors).toEqual([]);expect(writes).toEqual([]);
 await writeFile(directory+'/native-geometries.json',JSON.stringify(references,null,2));
 await writeFile(directory+'/native.svg',nativeSvg);
 await writeFile(directory+'/actual.svg',result.svg);
 await writeFile('fixtures/illustrator/pitchprint-text-masks.reference.TEST.svg',nativeSvg);
 await writeFile('fixtures/illustrator/pitchprint-text-masks.source.TEST.json',JSON.stringify(source,null,2)+'\n');
 await writeFile('fixtures/illustrator/pitchprint-text-masks.TEST.json',JSON.stringify(result.document,null,2)+'\n');
 await writeFile('fixtures/illustrator/pitchprint-text-masks.TEST.svg',result.svg);
 await page.getByLabel('Riapri progetto JSON').setInputFiles({name:'pitchprint-text-masks.TEST.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(result.document))});
 await expect.poll(async()=>JSON.parse((await page.getByTestId('graphic-state').textContent())!).documentId).toBe(result.document.documentId);
 await expect(page.getByTestId('editor-workspace')).toHaveAttribute('data-view-ready','true');
 await page.screenshot({path:directory+'/editor.png'});
 expect(errors).toEqual([]);expect(requests).toEqual([]);expect(writes).toEqual([]);
 console.log(JSON.stringify({cases:result.rows.length,pixels:result.pixels,negative:result.negative,requests,errors,writes}));
}finally{await browser.close();}
