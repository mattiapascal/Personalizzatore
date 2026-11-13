import { chromium, expect } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { affineTextSource } from '../tests/helpers/pitchprint-affine-text';
import { TEST_DEFAULT_FONT } from '../tests/helpers/editor-fonts';
import { canvasDecorationReference } from '../tests/helpers/canvas-decoration-reference.browser';

const argument = process.argv.indexOf('--legacy-file');
if (argument < 0 || !process.argv[argument+1]) throw Error('Indicare --legacy-file con il runtime originale Fabric 3.4.0 già disponibile localmente. Nessun download automatico.');
const runtime = await readFile(resolve(process.argv[argument+1]!), 'utf8');
const directory = '.local/affine-text-reference', origin = 'http://127.0.0.1:5173';
await mkdir(directory, { recursive: true });
const source = affineTextSource(), font = TEST_DEFAULT_FONT;
const probes: Record<string,unknown>[] = [];
for (const originX of ['left','center','right']) for (const originY of ['top','center','bottom']) for (const flipX of [false,true]) for (const flipY of [false,true]) for (const strokeUniform of [false,true]) for (const [skewX,skewY] of [[25,0],[0,-17],[-12,9]]) probes.push({ left:130,top:-70,width:213,height:57,strokeWidth:3,scaleX:1.7,scaleY:2.2,angle:23,originX,originY,flipX,flipY,strokeUniform,skewX,skewY });
const browser = await chromium.launch();
try {
  const requests: string[] = [], errors: string[] = [], writes: string[] = [];
  const legacy = await browser.newPage();
  await legacy.route('**/*', route => { requests.push(route.request().url()); return route.abort(); });
  legacy.on('pageerror', error => errors.push(error.message));
  await legacy.goto('about:blank');
  await legacy.evaluate('window.__name=value=>value');
  await legacy.addScriptTag({ content: runtime });
  await legacy.addScriptTag({ content: `window.canvasDecorationReference=${canvasDecorationReference.toString()};` });
  const native = await legacy.evaluate(async ({ source, font, probes }) => {
    const L = (window as any).fabric;
    if (L.version !== '3.4.0') throw Error('Occorre il riferimento originale Fabric 3.4.0');
    L.Object.NUM_FRACTION_DIGITS = 12;
    const alias = 'ArimoNativeAffineTEST', face = new FontFace(alias, Uint8Array.from(atob(font.dataBase64), c => c.charCodeAt(0)), { weight:'400', style:'normal' });
    document.fonts.add(await face.load()); await document.fonts.load(`38px "${alias}"`, 'TEST · Città');
    const geometry = (raw:any) => Object.fromEntries(['left','top','width','height','scaleX','scaleY','angle','skewX','skewY','flipX','flipY','originX','originY','strokeWidth','strokeUniform'].filter(key => raw[key] !== undefined).map(key => [key,raw[key]]));
    const matrices = probes.map(raw => new L.Object(geometry(raw)).calcOwnMatrix());
    let vectorDecorations=false;
    const build = (raw:any):any => {
      const options = {originX:'left',originY:'top',...raw}; delete options.objects;
      if (raw.type === 'group') {
        const group = new L.Group([], options); group.set(geometry(raw));
        group._objects = raw.objects.map(build); for (const child of group._objects) child.group = group;
        return group;
      }
      if (['text','i-text','textbox'].includes(raw.type)) {
        if (raw.fontFamily !== 'Arimo') throw Error('Il riferimento sintetico richiede Arimo esatto');
        const text=raw.type === 'textbox' ? new L.Textbox(raw.text,{...options,fontFamily:alias}) : new L.IText(raw.text,{...options,fontFamily:alias});
        const original=text.toSVG.bind(text);text.toSVG=(...args:any[])=>vectorDecorations?(window as any).canvasDecorationReference(text,()=>original(...args)):original(...args);return text;
      }
      if (raw.type === 'rect') return new L.Rect(options);
      throw Error('Tipo fuori dal riferimento sintetico');
    };
    const page = source.pages[0]!, clip = page.canvas.clipPath, canvas = new L.StaticCanvas(document.createElement('canvas'), {width:996*4,height:678*4,enableRetinaScaling:false,renderOnAddRemove:false});
    try {
      canvas.add(...page.canvas.objects.map(build));
      const px=996*4/clip.width,py=678*4/clip.height;canvas.setViewportTransform([px,0,0,py,-clip.left*px,-clip.top*py]);canvas.renderAll();
      const cachedPng=canvas.lowerCanvasEl.toDataURL('image/png');
      const uncached=(object:any)=>{object.objectCaching=false;if(object._objects)object._objects.forEach(uncached);};canvas.getObjects().forEach(uncached);canvas.renderAll();const png=canvas.lowerCanvasEl.toDataURL('image/png');
      const output=()=>{const svg=canvas.toSVG({viewBox:{x:clip.left,y:clip.top,width:clip.width,height:clip.height},width:`${page.pageData.fWidth}mm`,height:`${page.pageData.fHeight}mm`}),xml=new DOMParser().parseFromString(svg,'image/svg+xml'),root=xml.documentElement;root.setAttribute('preserveAspectRatio','none');const style=xml.createElementNS(root.namespaceURI,'style');style.textContent=`@font-face{font-family:"${alias}";src:url(data:font/ttf;base64,${font.dataBase64});font-style:normal;font-weight:400;}`;root.prepend(style);return new XMLSerializer().serializeToString(xml);};
      const originalSvg=output();vectorDecorations=true;
      return { version:L.version, matrices, png, cachedPng, originalSvg, svg:output() };
    } finally { canvas.dispose(); }
  }, {source,font,probes});
  await legacy.close();
  const page = await browser.newPage({viewport:{width:1500,height:1000}});
  await page.addInitScript({content:'window.__name=value=>value;'});
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.fallback() : (requests.push(route.request().url()),route.abort()));
  await page.route('**/api/**', route => route.abort());
  await page.route('**/__editor-local/media/**', route => route.fulfill({json:{schemaVersion:1,revision:0,categories:[],assets:[]}}));
  await page.route('**/__editor-local/admin/**', route => { if (route.request().method() !== 'GET') writes.push(route.request().url()); return route.fulfill({json:{schemaVersion:1,revision:0,settings:{editorName:'TEST',gridMm:1,gridVisible:false,snapEnabled:false},records:[],fonts:[]}}); });
  await page.goto(origin+'/editor?workspace=1&mode=admin');
  await expect(page.getByTestId('revision')).toBeVisible();
  const result = await page.evaluate(async ({ source, font, probes, native }) => {
    const h='/tests/helpers/browser-module.ts',{loadedEditorModule}=await import(h);
    const {pitchprintTransform}=await import(loadedEditorModule('/src/editor/pitchprint-tree.ts'));
    let matrixError=0;
    probes.forEach((raw,index)=>pitchprintTransform(raw,'TEST').forEach((value:number,i:number)=>{matrixError=Math.max(matrixError,Math.abs(value-native.matrices[index][i]));}));
    if(matrixError>1e-9)throw Error(`Matrici discordanti: ${matrixError}`);
    const {importPitchPrint}=await import(loadedEditorModule('/src/editor/pitchprint-import.ts'));
    const converted=await importPitchPrint(source,{monochrome:false,excludeBackground:false,font:async()=>font,image:async()=>{throw Error('Nessuna immagine TEST');}});
    const {exportDocumentSvg,FabricAdapter}=await import(loadedEditorModule('/src/editor/fabric-adapter.ts')),svg=await exportDocumentSvg(converted.document);
    const reference='/tests/helpers/svg-color-reference.browser.ts',{compareSupersampledSvg}=await import(reference);
    const pixels=await compareSupersampledSvg(native.svg,svg,996,678);
    const wrap=(png:string)=>`<svg xmlns="http://www.w3.org/2000/svg" width="3984" height="2712"><image href="${png}" width="3984" height="2712"/></svg>`;
    const view=new FabricAdapter(document.createElement('canvas'),()=>0,()=>{});let canvasPng='';try{view.render(converted.document);view.canvas.setDimensions({width:3984,height:2712});view.canvas.setViewportTransform([3,0,0,3,0,0]);view.canvas.renderAll();canvasPng=view.canvas.lowerCanvasEl.toDataURL('image/png');}finally{view.dispose();}
    const canvasPixels=await compareSupersampledSvg(wrap(native.png),wrap(canvasPng),996,678),svgAgainstCanvas=await compareSupersampledSvg(wrap(native.png),svg,996,678),nativeSvgAgainstCanvas=await compareSupersampledSvg(wrap(native.png),native.svg,996,678),nativeOriginalSvgAgainstCanvas=await compareSupersampledSvg(wrap(native.png),native.originalSvg,996,678),cachedCanvasPixels=await compareSupersampledSvg(wrap(native.cachedPng),wrap(canvasPng),996,678);
    const isolate=(svg:string,index:number)=>{const xml=new DOMParser().parseFromString(svg,'image/svg+xml');Array.from(xml.querySelectorAll('text')).forEach((node,i)=>{if(i!==index)node.remove();});for(const node of xml.querySelectorAll('path,rect,ellipse,polygon,polyline'))if(!node.closest('defs,clipPath'))node.remove();return new XMLSerializer().serializeToString(xml);};
    const perText=[];for(let i=0;i<4;i++)perText.push(await compareSupersampledSvg(isolate(native.svg,i),isolate(svg,i),996,678));
    const wrong=structuredClone(converted.document);for(const object of wrong.objects)if(object.type==='text')object.textSkewXDeg=0;
    const negative=await compareSupersampledSvg(native.svg,await exportDocumentSvg(wrong),996,678);
    return {document:converted.document,svg,pixels,canvasPixels,svgAgainstCanvas,nativeSvgAgainstCanvas,nativeOriginalSvgAgainstCanvas,cachedCanvasPixels,perText,negative,matrixError,warnings:converted.warnings};
  }, {source,font,probes,native});
  await writeFile(directory+'/native.svg',native.svg);
  await writeFile(directory+'/native-original.svg',native.originalSvg);
  await writeFile(directory+'/native-cached.png',Buffer.from(native.cachedPng.split(',')[1]!,'base64'));
  await writeFile(directory+'/native-uncached.png',Buffer.from(native.png.split(',')[1]!,'base64'));
  await writeFile(directory+'/actual.svg',result.svg);
  await writeFile(directory+'/report.json',JSON.stringify({legacyVersion:native.version,runtimeSha256:createHash('sha256').update(runtime).digest('hex'),matrixCases:probes.length,...result,document:undefined,svg:undefined,errors,requests,writes,illustratorVerified:false},null,2));
  console.log(JSON.stringify({matrixCases:probes.length,matrixError:result.matrixError,pixels:result.pixels,canvasPixels:result.canvasPixels,svgAgainstCanvas:result.svgAgainstCanvas,nativeSvgAgainstCanvas:result.nativeSvgAgainstCanvas,nativeOriginalSvgAgainstCanvas:result.nativeOriginalSvgAgainstCanvas,cachedCanvasPixels:result.cachedCanvasPixels,perText:result.perText,negative:result.negative,errors,requests,writes}));
  expect(result.pixels.ratio).toBeLessThan(.01); expect(result.pixels.meanChannelError).toBeLessThan(.25);
  expect(result.negative.ratio).toBeGreaterThan(.1);expect(errors).toEqual([]);expect(requests).toEqual([]);expect(writes).toEqual([]);
  await writeFile('fixtures/illustrator/affine-text.source.TEST.json',JSON.stringify(source,null,2)+'\n');
  await writeFile('fixtures/illustrator/affine-text.TEST.json',JSON.stringify(result.document,null,2)+'\n');
  await writeFile('fixtures/illustrator/affine-text.TEST.svg',result.svg);
  await page.getByLabel('Riapri progetto JSON').setInputFiles({name:'affine-text.TEST.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(result.document))});
  await expect.poll(async()=>JSON.parse((await page.getByTestId('graphic-state').textContent())!).documentId).toBe(result.document.documentId);
  await expect(page.getByTestId('editor-workspace')).toHaveAttribute('data-view-ready','true');
  await page.screenshot({path:directory+'/affine-text.png'});
} finally { await browser.close(); }
