import type { Plugin } from 'vite';
import { z } from 'zod';
import { FontAssetsSchema } from '../src/editor/font-assets';
import { sanitizeSvg, MAX_SVG_BYTES } from '../src/editor/svg-sanitize';
import { convertLocalPdf } from './local-pdf-import';
const requestSchema=z.strictObject({svg:z.string().max(MAX_SVG_BYTES),fontAssets:FontAssetsSchema});
/** Local, offline conversion through the browser's font shaper and Poppler. */
export async function outlineLocalSvg(raw:unknown):Promise<string>{
 const {svg,fontAssets}=requestSchema.parse(raw),safe=sanitizeSvg(svg,false,true),{chromium}=await import('playwright'),browser=await chromium.launch({headless:true});
 try{const page=await browser.newPage();await page.route('**/*',route=>route.abort());await page.setContent(`<style>html,body{margin:0;padding:0}svg{display:block}</style>${safe}`);
  const size=await page.evaluate(async assets=>{for(const asset of assets){const bytes=Uint8Array.from(atob(asset.dataBase64),c=>c.charCodeAt(0)),alias=`EditorFont_${asset.id.slice(5).replaceAll('-','')}`,font=new FontFace(alias,bytes.buffer);await font.load();document.fonts.add(font);}await document.fonts.ready;const box=document.querySelector('svg')!.getBoundingClientRect();return{width:box.width,height:box.height};},fontAssets);
  if(!Number.isFinite(size.width)||!Number.isFinite(size.height)||size.width<=0||size.height<=0||size.width>4000||size.height>4000)throw new Error('Area SVG fuori dal limite locale di 4000 px');
  const pdf=await page.pdf({width:`${size.width}px`,height:`${size.height}px`,margin:{top:0,bottom:0,left:0,right:0},printBackground:true,scale:1});return(await convertLocalPdf(pdf)).svg;
 }finally{await browser.close();}
}
export function localSvgOutlinesPlugin():Plugin{let busy=false;return{name:'editor-local-svg-outlines',apply:'serve',configureServer(server){server.middlewares.use('/__editor-local/svg-outlines',async(req,res)=>{
 const json=(status:number,value:unknown)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(value));};
 if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress??'')||req.headers.origin!==`http://${req.headers.host}`||req.headers['x-editor-local']!=='1'){json(403,{error:'Conversione disponibile soltanto dall’editor locale'});return;}
 if(req.method!=='POST'||req.headers['content-type']!=='application/json'){json(415,{error:'Richiesta SVG non valida'});return;}if(busy){json(429,{error:'Una conversione SVG è già in elaborazione'});return;}busy=true;
 try{const chunks:Buffer[]=[];let length=0;for await(const part of req){const bytes=Buffer.from(part);length+=bytes.length;if(length>6*1024*1024)throw new Error('Richiesta SVG oltre 6 MB');chunks.push(bytes);}json(200,{svg:await outlineLocalSvg(JSON.parse(Buffer.concat(chunks).toString('utf8')))});}catch(error){json(422,{error:error instanceof Error?error.message:'Conversione dei testi in contorni non riuscita'});}finally{busy=false;}
 });}};}
