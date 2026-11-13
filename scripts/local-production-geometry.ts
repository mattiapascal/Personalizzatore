import type {Plugin} from 'vite';
import {parseGraphicDocument} from '../src/editor/model';
import {graphicPages} from '../src/editor/pages';
import {productionDocument} from '../src/editor/object-properties';
import {assertOutputFonts} from '../src/editor/font-preflight';
import {ProductionGeometryReportSchema,type ProductionGeometryReport} from '../src/editor/production-geometry';
import {MAX_PROJECT_BYTES} from '../src/editor/project-limits';
import {LocalRenderFontCoverage} from './local-render-font-coverage';
import {withLocalGraphicRenderer} from './local-graphic-renderer';

export async function inspectLocalProductionGeometry(raw:unknown,origin:string):Promise<ProductionGeometryReport>{
 const document=parseGraphicDocument(raw),inspection=new LocalRenderFontCoverage(document.fontAssets);
 for(const page of graphicPages(document))if(page.productionProfile)await assertOutputFonts(productionDocument(page),{resolveWoff2:inspection.resolveWoff2});
 const result=await withLocalGraphicRenderer(origin,inspection,page=>page.evaluate(async document=>{
  const path='/src/editor/production-geometry-browser.ts',{inspectProductionGeometry}=await import(path);return inspectProductionGeometry(document);
 },document));return ProductionGeometryReportSchema.parse(result);
}
/** Read-only loopback diagnostic; no result supplied by the client is trusted
 * and no project/template, cart line or database state is written. */
export function localProductionGeometryPlugin():Plugin{
 let busy=false;return{name:'editor-local-production-geometry',apply:'serve',configureServer(server){server.middlewares.use(async(req,res,next)=>{
  if(new URL(req.url??'/','http://localhost').pathname!=='/__editor-local/check-geometry'){next();return;}
  const json=(status:number,value:unknown)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(value));};
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress??'')||req.headers['x-editor-local']!=='1'||req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`||req.headers['sec-fetch-site']==='cross-site'){json(403,{error:'Controllo disponibile soltanto in locale'});return;}
  if(req.method!=='POST'||req.headers['content-type']!=='application/json'){json(415,{error:'Documento JSON richiesto'});return;}
  if(busy){json(429,{error:'Un controllo visuale è già in corso. Riprova tra poco.'});return;}busy=true;
  try{
   let size=0;const parts:Buffer[]=[];for await(const part of req){const bytes=Buffer.from(part);size+=bytes.length;if(size>MAX_PROJECT_BYTES)throw Error('Documento oltre 120 MB');parts.push(bytes);}
   const address=server.httpServer?.address();if(!address||typeof address==='string')throw Error('Laboratorio locale non disponibile');json(200,await inspectLocalProductionGeometry(JSON.parse(Buffer.concat(parts).toString('utf8')),`http://127.0.0.1:${address.port}`));
  }catch(error){json(422,{error:error instanceof Error?error.message:'Controllo non completato'});}finally{busy=false;}
 });}};
}
