import {chromium,type Page,type BrowserContext} from '@playwright/test';
import {LocalRenderFontCoverage} from './local-render-font-coverage';

/** One isolated headless render, with byte-derived WOFF2 analysis satisfied in
 * memory. No archive writes, API calls, external requests or computer fonts. */
export async function withLocalGraphicRenderer<T>(origin:string,inspection:LocalRenderFontCoverage,render:(page:Page,context:BrowserContext)=>Promise<T>):Promise<T>{
 const url=new URL(origin);if(url.protocol!=='http:'||url.hostname!=='127.0.0.1'||url.origin!==origin)throw Error('Renderer grafico disponibile solo su loopback.');
 const browser=await chromium.launch({timeout:15000}),deadline=setTimeout(()=>void browser.close(),45000);
 try{
  const context=await browser.newContext({extraHTTPHeaders:{'X-Editor-Local':'1'}});await context.route('**/*',route=>{
   const request=route.request(),target=new URL(request.url());
   if(target.origin===origin&&target.pathname==='/__editor-local/admin/font-coverage'&&request.method()==='POST'&&request.headers()['content-type']==='font/woff2'){
    const result=inspection.response(request.postDataBuffer());return result?route.fulfill({json:result}):route.abort();
   }
   return target.origin===origin&&request.method()==='GET'&&!target.pathname.startsWith('/api/')?route.continue():route.abort();
  });
  const page=await context.newPage();page.setDefaultTimeout(20000);await page.goto(`${origin}/__editor-local/pdf-renderer`,{waitUntil:'domcontentloaded'});return await render(page,context);
 }finally{clearTimeout(deadline);await browser.close();}
}
