import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {compressedFontDocument} from '../tests/helpers/compressed-fonts';
import {renderLocalDesignPdf} from './local-pdf-export';
const run=promisify(execFile),origin='http://127.0.0.1:5173',doc=compressedFontDocument(),before=structuredClone(doc),directory='.local/pdf-fonts-capture';
await mkdir(directory,{recursive:true});await mkdir('output/pdf',{recursive:true});
const pdf=await renderLocalDesignPdf(doc,origin),path='output/pdf/editor-font-compressi.TEST.pdf';await writeFile(path,pdf);expect(doc).toEqual(before);
const browser=await chromium.launch();let svg='';
try{
 const context=await browser.newContext({extraHTTPHeaders:{'X-Editor-Local':'1'}}),page=await context.newPage();
 await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 // The blank local renderer imports the same checked exporter. No editor
 // startup, personal library read or archive command is needed for this TEST.
 await page.goto(origin+'/__editor-local/pdf-renderer',{waitUntil:'domcontentloaded'});
 svg=await page.evaluate(async document=>{const path='/src/editor/fabric-adapter.ts',{exportDocumentSvg}=await import(path);return exportDocumentSvg(document);},doc);
}finally{await browser.close();}
await writeFile('fixtures/illustrator/pdf-fonts.TEST.json',JSON.stringify(doc,null,2)+'\n');await writeFile('fixtures/illustrator/pdf-fonts.TEST.svg',svg);
const [fonts,text,info]=await Promise.all([run('pdffonts',[path]),run('pdftotext',['-layout',path,'-']),run('pdfinfo',[path])]);await run('qpdf',['--check',path]);await run('pdftoppm',['-png','-r','150',path,directory+'/page']);
expect(fonts.stdout).toContain('Arimo-Regular');expect(fonts.stdout).toContain('ABeeZee-Regular');expect(text.stdout).toContain('ABC Città 123');expect(text.stdout).toContain('Stili misti: ABC - xyz');
await writeFile(directory+'/report.json',JSON.stringify({pdf:path,bytes:pdf.length,fontNames:fonts.stdout,text:text.stdout,info:info.stdout,documentUnchanged:JSON.stringify(doc)===JSON.stringify(before),illustratorVerified:false},null,2));
console.log(JSON.stringify({pdf:path,bytes:pdf.length,fonts:['Arimo-Regular','ABeeZee-Regular'],sizeMm:[100,60],illustratorVerified:false}));
