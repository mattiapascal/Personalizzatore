import {test,expect,type APIRequestContext} from '@playwright/test';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {compressedFontDocument,compressedTestFonts} from '../helpers/compressed-fonts';
import {joinGraphicPages} from '../../src/editor/pages';
import {renderLocalDesignPdf} from '../../scripts/local-pdf-export';
import type {GraphicDocument} from '../../src/editor/model';
const run=promisify(execFile),origin='http://127.0.0.1:5173';
test.setTimeout(90000);
async function inspectPdf(bytes:Buffer){
 const directory=await mkdtemp(join(tmpdir(),'editor-pdf-font-test-'));
 try{
  const path=join(directory,'design.pdf');await writeFile(path,bytes);
  const [fonts,text,json,syntax]=await Promise.all([run('pdffonts',[path]),run('pdftotext',['-layout',path,'-']),run('qpdf',['--json','--json-stream-data=none',path]),run('qpdf',['--check',path])]);
  const data=JSON.parse(json.stdout),pages=data.pages.map((page:{object:string})=>data.qpdf[1][`obj:${page.object}`].value);
  return{fonts:fonts.stdout,text:text.stdout,json:data,pages,syntax:syntax.stdout};
 }finally{await rm(directory,{recursive:true,force:true});}
}
async function exportPdf(request:APIRequestContext,document:GraphicDocument,references=false){
 const response=await request.post(`/__editor-local/export-pdf${references?'?references=1':''}`,{headers:{'X-Editor-Local':'1','Content-Type':'application/json'},data:document,timeout:85000});
 expect(response.status(),response.ok()?'':await response.text()).toBe(200);expect(response.headers()['content-type']).toBe('application/pdf');expect(response.headers()['cache-control']).toBe('no-store');
 return inspectPdf(await response.body());
}
function physicalSize(page:Record<string,number[]>,width:number,height:number){
 for(const key of ['/MediaBox','/CropBox','/TrimBox']){
  expect(page[key]![0]).toBe(0);expect(page[key]![1]).toBe(0);expect(page[key]![2]).toBeCloseTo(width*72/25.4,7);expect(page[key]![3]).toBeCloseTo(height*72/25.4,7);
 }
}
test('PDF font compressi: WOFF e WOFF2 reali incorporati, testo misto Unicode e misure fisiche esatte',async({request})=>{
 const doc=compressedFontDocument(),before=structuredClone(doc);expect(compressedTestFonts().compressedCmap).toBe(true);const pdf=await exportPdf(request,doc);
 expect(doc).toEqual(before);expect(pdf.fonts).toContain('Arimo-Regular');expect(pdf.fonts).toContain('ABeeZee-Regular');
 const entries=pdf.fonts.split('\n').slice(2).filter(Boolean);expect(entries).toHaveLength(2);for(const line of entries)expect(line).toMatch(/yes\s+yes\s+yes/);
 expect(pdf.text).toContain('WOFF: Città 123');expect(pdf.text).toContain('ABC Città 123');expect(pdf.text).toContain('Stili misti: ABC - xyz');expect(pdf.pages).toHaveLength(1);physicalSize(pdf.pages[0],100,60);expect(pdf.syntax).toContain('No syntax or stream encoding errors');
});
test('PDF font compressi: pagine di misure diverse, controllo anche della pagina inattiva',async({request})=>{
 const first=compressedFontDocument(),second=structuredClone(first);second.areaMm={width:120,height:80};const doc=joinGraphicPages([first,second],['100 x 60','120 x 80']),before=structuredClone(doc),pdf=await exportPdf(request,doc);
 expect(doc).toEqual(before);expect(pdf.pages).toHaveLength(2);physicalSize(pdf.pages[0],100,60);physicalSize(pdf.pages[1],120,80);expect(pdf.text.match(/ABC Città 123/g)).toHaveLength(2);
 doc.otherPages![0]!.objects=[{id:'missing-on-page2',type:'text',xMm:5,yMm:5,text:'Ω',fontFamily:compressedTestFonts().woff2.id,fontSizePt:12,fill:'#000000'}];
 const response=await request.post('/__editor-local/export-pdf',{headers:{'X-Editor-Local':'1','Content-Type':'application/json'},data:doc});expect(response.status()).toBe(422);expect((await response.json()).error).toContain('120 x 80');expect((await response.json()).error).toContain('non contiene Ω');
});
test('PDF font compressi: riferimenti esclusi dalla produzione e presenti solo nei livelli non stampabili richiesti',async({request})=>{
 const doc=compressedFontDocument(),{woff2}=compressedTestFonts();doc.objects.push({id:'reference',type:'text',xMm:70,yMm:50,text:'ZZZ',fontSizePt:12,fontFamily:woff2.id,fill:'#0088cc',editor:{reference:true}});const before=structuredClone(doc),plain=await exportPdf(request,doc),layered=await exportPdf(request,doc,true);
 expect(plain.text).not.toContain('ZZZ');expect(layered.text).toContain('ZZZ');expect(doc).toEqual(before);physicalSize(layered.pages[0],100,60);
 const catalog=Object.values(layered.json.qpdf[1]).find((entry:any)=>entry.value?.['/Type']==='/Catalog')as any,groups=catalog.value['/OCProperties'];expect(groups['/OCGs']).toHaveLength(2);
 const referenceGroups=groups['/OCGs'].map((ref:string)=>layered.json.qpdf[1][`obj:${ref}`].value).filter((group:any)=>group['/Usage']?.['/Print']?.['/PrintState']==='/OFF');expect(referenceGroups).toHaveLength(2);
});
test('PDF font compressi: glifi e stili non validi respinti, file inutilizzato non impedisce un output verificato',async({request})=>{
 const doc=compressedFontDocument(),{woff2}=compressedTestFonts(),bad=Buffer.alloc(64);bad.write('wOF2');doc.fontAssets!.push({...woff2,id:'font-30303030-3030-4030-8030-303030303030',dataBase64:bad.toString('base64')});
 await exportPdf(request,doc);const target=doc.objects.find(object=>object.id==='woff2')!;expect(target.type).toBe('text');if(target.type!=='text')throw Error('Fixture errato');
 target.text='Ω';let response=await request.post('/__editor-local/export-pdf',{headers:{'X-Editor-Local':'1','Content-Type':'application/json'},data:doc});expect(response.status()).toBe(422);expect((await response.json()).error).toContain('non contiene Ω');
 target.text='ABC';target.fontWeight='bold';response=await request.post('/__editor-local/export-pdf',{headers:{'X-Editor-Local':'1','Content-Type':'application/json'},data:doc});expect(response.status()).toBe(422);expect((await response.json()).error).toContain('simulato');
 target.fontWeight='normal';target.fontFamily=doc.fontAssets!.at(-1)!.id;response=await request.post('/__editor-local/export-pdf',{headers:{'X-Editor-Local':'1','Content-Type':'application/json'},data:doc});expect(response.status()).toBe(422);expect((await response.json()).error).toContain('non verificabile');
});
test('PDF font compressi: download dall’editor reale senza mutare JSON, revisione o archivio',async({page})=>{
 const writes:string[]=[],external:string[]=[],errors:string[]=[],doc=compressedFontDocument();page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.fallback():(external.push(route.request().url()),route.abort()));await page.route('**/api/**',route=>route.abort());
 await page.route('**/__editor-local/admin/**',route=>{if(route.request().url().endsWith('/font-coverage'))return route.fallback();if(route.request().method()!=='GET')writes.push(route.request().url());return route.fulfill({json:{schemaVersion:1,revision:0,settings:{editorName:'TEST',gridMm:1,gridVisible:false,snapEnabled:false},fonts:[],records:[]}});});
 await page.goto('/editor?workspace=1&mode=test');await page.getByLabel('Riapri progetto JSON').setInputFiles({name:'pdf-fonts.TEST.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))});
 await expect(page.getByTestId('revision')).toBeVisible();await expect(page.getByRole('button',{name:'Scarica PDF',exact:true})).toBeEnabled();
 const state=await page.getByTestId('graphic-state').textContent(),revision=await page.getByTestId('revision').textContent(),downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Scarica PDF',exact:true}).click();const download=await downloadPromise;
 const pdf=await inspectPdf(await readFile((await download.path())!));expect(pdf.text).toContain('ABC Città 123');expect(pdf.fonts).toContain('ABeeZee-Regular');expect(await page.getByTestId('graphic-state').textContent()).toBe(state);expect(await page.getByTestId('revision').textContent()).toBe(revision);expect(writes).toEqual([]);expect(external).toEqual([]);expect(errors).toEqual([]);
});
test('PDF font compressi: il renderer rifiuta origini esterne e API prive di intestazione locale',async({request})=>{
 const doc=compressedFontDocument();await expect(renderLocalDesignPdf(doc,'https://example.com')).rejects.toThrow('loopback');const response=await request.post('/__editor-local/export-pdf',{data:doc});expect(response.status()).toBe(403);
});
