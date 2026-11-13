import{referenceLayers}from'../src/editor/reference-layers';
import{pdfWithReferenceLayers,type PdfReferencePage}from'./pdf-reference-layers';
import{graphicPages}from'../src/editor/pages';
import { MAX_PROJECT_BYTES } from '../src/editor/project-limits';
import { assertOutputFonts } from '../src/editor/font-preflight';
import { productionDocument } from '../src/editor/object-properties';
import {LocalRenderFontCoverage} from './local-render-font-coverage';
import {exactPdfPageSize,mergeLocalPdfPages} from './pdf-page-size';
import type {Plugin} from 'vite';
import {withLocalGraphicRenderer} from './local-graphic-renderer';
import {parseGraphicDocument,type GraphicDocument} from '../src/editor/model';
async function renderSinglePagePdf(raw:unknown,origin:string,inspection:LocalRenderFontCoverage,transparentPaper=false,guideOnlyIds:readonly string[]=[]):Promise<Buffer>{
 const doc=parseGraphicDocument(raw);await assertOutputFonts(productionDocument(doc), {resolveWoff2:inspection.resolveWoff2});
 return withLocalGraphicRenderer(origin,inspection,async(page,context)=>{
  await page.evaluate(async({document,transparentPaper,guideOnlyIds}:{document:GraphicDocument;transparentPaper:boolean;guideOnlyIds:readonly string[]})=>{
   const adapterPath='/src/editor/fabric-adapter.ts',{exportDocumentSvg}=await import(adapterPath);
   const svg=await exportDocumentSvg(document,transparentPaper,{guideOnlyIds});
   window.document.body.innerHTML=svg;const style=window.document.createElement('style');style.textContent=`@page{size:${document.areaMm.width+1}mm ${document.areaMm.height+1}mm;margin:0}html,body{margin:0;padding:0;width:${document.areaMm.width}mm;height:${document.areaMm.height}mm;overflow:hidden}svg{display:block}`;window.document.head.append(style);await window.document.fonts.ready;
  },{document:doc,transparentPaper,guideOnlyIds});
  if(transparentPaper){const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setDefaultBackgroundColorOverride',{color:{r:0,g:0,b:0,a:0}});}
  return await exactPdfPageSize(await page.pdf({width:`${doc.areaMm.width+1}mm`,height:`${doc.areaMm.height+1}mm`,preferCSSPageSize:true,printBackground:true,pageRanges:'1',margin:{top:0,right:0,bottom:0,left:0}}),doc.areaMm.width,doc.areaMm.height);
 });
}
export async function renderLocalDesignPdf(raw:unknown,origin:string,includeReferences=false):Promise<Buffer>{
 const project=parseGraphicDocument(raw),pages=graphicPages(project),inspection=new LocalRenderFontCoverage(project.fontAssets);
 // Validate every page before starting a partial output; the response is one PDF.
 for(const page of pages)await assertOutputFonts(productionDocument(page),{resolveWoff2:inspection.resolveWoff2});
 if(includeReferences){const scenes=pages.map(referenceLayers);for(const scene of scenes)for(const layer of[scene.background,scene.foreground])if(layer)await assertOutputFonts(layer,{resolveWoff2:inspection.resolveWoff2});const output:PdfReferencePage[]=[];for(const scene of scenes)output.push({artwork:await renderSinglePagePdf(scene.artwork,origin,inspection,true),...(scene.background?{background:await renderSinglePagePdf(scene.background,origin,inspection,true)}:{}),...(scene.foreground?{foreground:await renderSinglePagePdf(scene.foreground,origin,inspection,true,scene.foregroundGuideIds??[])}:{})});return pdfWithReferenceLayers(output);}
 const output:Buffer[]=[];for(const page of pages)output.push(await renderSinglePagePdf(page,origin,inspection));return mergeLocalPdfPages(output);
}
export function localPdfExportPlugin():Plugin{
 let busy=false;return{name:'editor-local-pdf-export',apply:'serve',configureServer(server){server.middlewares.use(async(req,res,next)=>{
  const path=new URL(req.url??'/','http://localhost').pathname;if(!['/__editor-local/export-pdf','/__editor-local/pdf-renderer'].includes(path)){next();return;}
  const json=(status:number,error:string)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({error}));};
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress??'')||req.headers['x-editor-local']!=='1'||req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`||req.headers['sec-fetch-site']==='cross-site'){json(403,'Esportazione disponibile soltanto in locale');return;}
  if(path==='/__editor-local/pdf-renderer'&&req.method==='GET'){res.setHeader('Content-Type','text/html');res.setHeader('Cache-Control','no-store');res.end('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>');return;}
  if(req.method!=='POST'||req.headers['content-type']!=='application/json'){json(415,'Documento JSON richiesto');return;}if(busy){json(429,'Un PDF è già in preparazione. Riprova tra poco.');return;}busy=true;
  try{let length=0;const parts:Buffer[]=[];for await(const part of req){const bytes=Buffer.from(part);length+=bytes.length;if(length>MAX_PROJECT_BYTES)throw new Error('Documento oltre 120 MB');parts.push(bytes);}const address=server.httpServer?.address();if(!address||typeof address==='string')throw new Error('Server locale non disponibile');const bytes=await renderLocalDesignPdf(JSON.parse(Buffer.concat(parts).toString('utf8')),`http://127.0.0.1:${address.port}`,new URL(req.url??'/','http://localhost').searchParams.get('references')==='1');res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition','attachment; filename="design.pdf"');res.setHeader('Cache-Control','no-store');res.end(bytes);}catch(error){json(422,error instanceof Error?error.message:'PDF non esportato');}finally{busy=false;}
 });}};
}
