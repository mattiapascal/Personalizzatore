import {exactPdfPageSize} from './pdf-page-size';
import type {Plugin} from 'vite';
import {chromium} from '@playwright/test';
import {parseGraphicDocument,type GraphicDocument} from '../src/editor/model';
export async function renderLocalDesignPdf(raw:unknown,origin:string):Promise<Buffer>{
 const doc=parseGraphicDocument(raw),url=new URL(origin);if(url.protocol!=='http:'||url.hostname!=='127.0.0.1')throw new Error('Renderer PDF disponibile solo su loopback.');
 const browser=await chromium.launch({timeout:15000}),deadline=setTimeout(()=>void browser.close(),45000);
 try{
  const context=await browser.newContext({extraHTTPHeaders:{'X-Editor-Local':'1'}});await context.route('**/*',route=>{const request=route.request();return new URL(request.url()).origin===origin&&request.method()==='GET'&&!new URL(request.url()).pathname.startsWith('/api/')?route.continue():route.abort();});
  const page=await context.newPage();page.setDefaultTimeout(20000);await page.goto(`${origin}/__editor-local/pdf-renderer`,{waitUntil:'domcontentloaded'});
  await page.evaluate(async(document:GraphicDocument)=>{
   const adapterPath='/src/editor/fabric-adapter.ts',fontPath='/src/editor/fonts.ts',rasterPath='/src/editor/raster-cache.ts';
   const[{FabricAdapter},{loadFontAssets},{prepareRasterSource}]=await Promise.all([import(adapterPath),import(fontPath),import(rasterPath)]);
   await Promise.all([loadFontAssets(document.fontAssets),...document.objects.filter(object=>object.type==='image').map(object=>prepareRasterSource(object.source))]);
   const adapter=new FabricAdapter(window.document.createElement('canvas'),()=>0,()=>{});let svg:string;try{svg=adapter.exportSvg(document);}finally{adapter.dispose();}
   window.document.body.innerHTML=svg;const style=window.document.createElement('style');style.textContent=`@page{size:${document.areaMm.width+1}mm ${document.areaMm.height+1}mm;margin:0}html,body{margin:0;padding:0;width:${document.areaMm.width}mm;height:${document.areaMm.height}mm;overflow:hidden}svg{display:block}`;window.document.head.append(style);await window.document.fonts.ready;
  },doc);
  return await exactPdfPageSize(await page.pdf({width:`${doc.areaMm.width+1}mm`,height:`${doc.areaMm.height+1}mm`,preferCSSPageSize:true,printBackground:true,pageRanges:'1',margin:{top:0,right:0,bottom:0,left:0}}),doc.areaMm.width,doc.areaMm.height);
 }finally{clearTimeout(deadline);await browser.close();}
}
export function localPdfExportPlugin():Plugin{
 let busy=false;return{name:'editor-local-pdf-export',apply:'serve',configureServer(server){server.middlewares.use(async(req,res,next)=>{
  const path=new URL(req.url??'/','http://localhost').pathname;if(!['/__editor-local/export-pdf','/__editor-local/pdf-renderer'].includes(path)){next();return;}
  const json=(status:number,error:string)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({error}));};
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress??'')||req.headers['x-editor-local']!=='1'||req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`||req.headers['sec-fetch-site']==='cross-site'){json(403,'Esportazione disponibile soltanto in locale');return;}
  if(path==='/__editor-local/pdf-renderer'&&req.method==='GET'){res.setHeader('Content-Type','text/html');res.setHeader('Cache-Control','no-store');res.end('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>');return;}
  if(req.method!=='POST'||req.headers['content-type']!=='application/json'){json(415,'Documento JSON richiesto');return;}if(busy){json(429,'Un PDF è già in preparazione. Riprova tra poco.');return;}busy=true;
  try{let length=0;const parts:Buffer[]=[];for await(const part of req){const bytes=Buffer.from(part);length+=bytes.length;if(length>10*1024*1024)throw new Error('Documento oltre 10 MB');parts.push(bytes);}const address=server.httpServer?.address();if(!address||typeof address==='string')throw new Error('Server locale non disponibile');const bytes=await renderLocalDesignPdf(JSON.parse(Buffer.concat(parts).toString('utf8')),`http://127.0.0.1:${address.port}`);res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition','attachment; filename="design.pdf"');res.setHeader('Cache-Control','no-store');res.end(bytes);}catch(error){json(422,error instanceof Error?error.message:'PDF non esportato');}finally{busy=false;}
 });}};
}
