import{chromium,expect}from'@playwright/test';
import{mkdir,readFile,writeFile}from'node:fs/promises';
import{TEST_FONT_ASSETS,attachTestFonts,createTestDocument}from'../tests/helpers/editor-fonts';
const browser=await chromium.launch(),origin='http://127.0.0.1:5173';let writes=0;
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}});
 await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 await page.route('**/api/**',route=>route.abort());
 await page.route('**/__editor-local/admin/**',route=>{
  const request=route.request(),path=new URL(request.url()).pathname;if(request.method()!=='GET'){writes++;return route.abort();}
  const font=TEST_FONT_ASSETS.find(asset=>path.endsWith(`/font/${asset.id.slice(5)}`));if(font)return route.fulfill({body:Buffer.from(font.dataBase64,'base64'),contentType:'font/ttf'});
  return route.fulfill({json:{schemaVersion:1,revision:0,settings:{editorName:'TEST',gridMm:1,gridVisible:false,snapEnabled:false},fonts:TEST_FONT_ASSETS.map(({dataBase64,...asset})=>({...asset,id:asset.id.slice(5),actualFamily:asset.family,actualWeight:asset.weight,actualItalic:asset.italic,archived:false})),records:[]}});
 });
 await page.goto(`${origin}/editor?workspace=1`);await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 0 ·');
 const doc=createTestDocument(),text=doc.objects.find(object=>object.type==='text')!;if(text.type!=='text')throw new Error('Fixture testo assente');text.text='Impresa TEST';text.fontSizePt=14;text.characterStyles=[{start:0,end:7,style:{fontFamily:'font-aaaaaaaa-0000-4000-8000-000000000002'}}];
 await page.getByLabel('Riapri progetto JSON').setInputFiles({name:'font-styles.TEST.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(attachTestFonts(doc)))});await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 1 ·');
 await page.getByRole('button',{name:'Pannello livelli',exact:true}).click();await page.getByRole('button',{name:'Testo · text-1',exact:true}).click();await page.getByRole('button',{name:'Chiudi pannello livelli',exact:true}).click();await page.getByRole('tab',{name:'Testo',exact:true}).click();
 await expect(page.getByRole('button',{name:'Grassetto',exact:true})).toHaveAttribute('aria-pressed','mixed');await page.getByRole('button',{name:'Corsivo',exact:true}).click();await expect(page.getByTestId('revision')).toContainText('Revisione grafica: 2 ·');
 await expect(page.getByRole('region',{name:'Controllo font del progetto',exact:true})).toContainText('I caratteri usati sono presenti');await expect(page.getByRole('alert')).toHaveCount(0);
 await mkdir('.local/previews',{recursive:true});await mkdir('.local/verified-fixtures',{recursive:true});await page.screenshot({path:'.local/previews/editor-font-styles.png'});
 const snapshot=JSON.parse((await page.getByTestId('graphic-state').textContent())!);await writeFile('.local/verified-fixtures/font-styles.TEST.json',JSON.stringify(snapshot,null,2));
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Esporta SVG',exact:true}).click();const svg=await readFile((await(await pending).path())!,'utf8');await writeFile('.local/verified-fixtures/font-styles.TEST.svg',svg);
 if(writes)throw new Error('Il campione non deve scrivere nell’archivio');console.log(JSON.stringify({objects:snapshot.objects.length,fontFiles:snapshot.fontAssets.length,revision:snapshot.revision,adminWrites:writes,preview:'.local/previews/editor-font-styles.png'}));
}finally{await browser.close();}
