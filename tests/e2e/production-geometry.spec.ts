import {test,expect,type Page,type APIRequestContext} from '@playwright/test';
import {productionGeometryFixture,geometryRect,geometryZoneId,holedGeometryVector,transparentGeometryImage} from '../helpers/production-geometry';
import {compressedTestFonts} from '../helpers/compressed-fonts';
import {joinGraphicPages} from '../../src/editor/pages';
import {DocumentSchema,type GraphicDocument} from '../../src/editor/model';
import {ProductionGeometryReportSchema,type ProductionGeometryReport} from '../../src/editor/production-geometry';
test.setTimeout(90000);
async function browserStart(page:Page){await page.goto('/editor?workspace=1&mode=test',{waitUntil:'domcontentloaded'});}
async function inspect(page:Page,document:GraphicDocument,limits?:{maxPixels?:number;maxMilliseconds?:number}):Promise<ProductionGeometryReport>{
 DocumentSchema.parse(document);const before=structuredClone(document),report=await page.evaluate(async({document,limits})=>{const path='/src/editor/production-geometry-browser.ts',{inspectProductionGeometry}=await import(path);return inspectProductionGeometry(document,limits);},{document,limits});expect(document).toEqual(before);return ProductionGeometryReportSchema.parse(report);
}
async function apiInspect(request:APIRequestContext,document:GraphicDocument){const response=await request.post('/__editor-local/check-geometry',{headers:{'X-Editor-Local':'1','Content-Type':'application/json'},data:document,timeout:80000});expect(response.status(),response.ok()?'':await response.text()).toBe(200);expect(response.headers()['cache-control']).toBe('no-store');return ProductionGeometryReportSchema.parse(await response.json());}
const rule=(report:ProductionGeometryReport,id=geometryZoneId)=>report.pages[0]!.rules.find(rule=>rule.id===id)!;
test('geometria produttiva: cornice vuota e box testo sovrapposti, controlla la pittura e non i bbox',async({page,request})=>{
 const doc=productionGeometryFixture();await browserStart(page);expect((await inspect(page,doc)).status).toBe('clear');const remote=await apiInspect(request,doc);expect(remote.status).toBe('clear');expect(remote.resolutionMm).toBe(.025);
 const text=doc.objects.find(object=>object.type==='text')!;if(text.type!=='text')throw Error('TEST');text.fontSizePt=70;const result=await inspect(page,doc);expect(rule(result).status).toBe('overlap');expect(rule(result).candidateObjectIds).toContain(text.id);
});
test('geometria produttiva: fori vettoriali, maschere e clip rettangolari conservano le zone vuote',async({page})=>{
 const doc=productionGeometryFixture();await browserStart(page);doc.objects=[holedGeometryVector()];expect(rule(await inspect(page,doc)).status).toBe('clear');
 doc.objects=[holedGeometryVector(true)];doc.productionProfile!.reservedAreas[0]={...doc.productionProfile!.reservedAreas[0]!,xMm:48,yMm:28,widthMm:4,heightMm:4};expect(rule(await inspect(page,doc)).status).toBe('clear');
 const vector=holedGeometryVector();if(vector.type!=='vector')throw Error('TEST');vector.commands=[['M',0,0],['L',1,0],['L',1,1],['L',0,1],['Z']];vector.clipRect={left:0,top:0,right:.2,bottom:1};doc.objects=[vector];expect(rule(await inspect(page,doc)).status).toBe('clear');delete vector.clipRect;expect(rule(await inspect(page,doc)).status).toBe('overlap');
});
test('geometria produttiva: pixel trasparenti e crop frazionario non diventano l’intera cornice dell’immagine',async({page,request})=>{
 const doc=productionGeometryFixture();doc.objects=[transparentGeometryImage()];await browserStart(page);expect(rule(await inspect(page,doc)).status).toBe('clear');expect((await apiInspect(request,doc)).status).toBe('clear');doc.objects[0]!.xMm=45;expect(rule(await inspect(page,doc)).status).toBe('overlap');
});
test('geometria produttiva: knockout bianco e ordine dei livelli nel timbro, bianco produttivo sulla targa',async({page})=>{
 const doc=productionGeometryFixture();doc.colorMode='monochrome';doc.productionProfile!.kind='stamp-ink';doc.productionProfile!.rasterMode='binary';doc.objects=[geometryRect('black',42,22,16,16),geometryRect('white',40,20,20,20,'#ffffff')];await browserStart(page);expect(rule(await inspect(page,doc)).status).toBe('clear');
 doc.objects.reverse();expect(rule(await inspect(page,doc)).status).toBe('overlap');doc.objects.reverse();doc.colorMode='color';doc.productionProfile!.kind='printed-plaque';doc.productionProfile!.rasterMode='color';expect(rule(await inspect(page,doc)).status).toBe('overlap');
});
test('geometria produttiva: maschere del testo e tinta di anteprima non cambiano l’impronta da controllare',async({page})=>{
 const doc=productionGeometryFixture();await browserStart(page);doc.objects=doc.objects.filter(object=>object.type==='text');const text=doc.objects[0]!;if(text.type!=='text')throw Error('TEST');text.fontSizePt=70;expect(rule(await inspect(page,doc)).status).toBe('overlap');
 text.textClipMasks=[{fillRule:'nonzero',commands:[['M',0,0],['L',1,0],['L',1,1],['L',0,1],['Z']],frameMm:{x:-20,y:-100,width:1,height:200}}];expect(rule(await inspect(page,doc)).status).toBe('clear');
 doc.colorMode='monochrome';doc.inkColor='red';doc.paperColor='#ffffff';doc.productionProfile!.kind='stamp-ink';doc.productionProfile!.rasterMode='binary';expect(rule(await inspect(page,doc)).status).toBe('clear');doc.paperColor='#000000';expect(rule(await inspect(page,doc)).status).toBe('overlap');
});
test('geometria produttiva: il colore esplicito del foglio è produttivo nelle zone, esentato dal solo margine',async({page})=>{
 const doc=productionGeometryFixture();doc.objects=[];doc.paperColor='#0088cc';await browserStart(page);const result=await inspect(page,doc);expect(rule(result,'margin').status).toBe('clear');expect(rule(result).status).toBe('overlap');delete doc.paperColor;expect((await inspect(page,doc)).status).toBe('clear');
});
test('geometria produttiva: riferimenti individuali e di gruppo esclusi, sfondo esentato solo dal margine',async({page})=>{
 const doc=productionGeometryFixture();doc.objects=[{...geometryRect('reference',0,0,100,60),editor:{reference:true}},geometryRect('member-a',42,22,3,3),geometryRect('member-b',47,27,3,3)];doc.groups=[{id:'reference-group',objectIds:['member-a','member-b'],editor:{reference:true}}];await browserStart(page);expect((await inspect(page,doc)).status).toBe('clear');
 delete doc.groups;doc.objects=[geometryRect('background',0,0,100,60)];doc.groups=[{id:'background-group',objectIds:['background']}];doc.backgroundGroupId='background-group';let report=await inspect(page,doc);expect(rule(report,'margin').status).toBe('clear');expect(rule(report).status).toBe('overlap');delete doc.backgroundGroupId;report=await inspect(page,doc);expect(rule(report,'margin').status).toBe('overlap');doc.backgroundGroupId='background-group';doc.colorMode='monochrome';doc.productionProfile!.kind='stamp-ink';doc.productionProfile!.rasterMode='binary';report=await inspect(page,doc);expect(rule(report,'margin').status).toBe('overlap');
});
test('geometria produttiva: ellipse, tangente e margine circolare senza falsa equivalenza con bbox',async({page})=>{
 const doc=productionGeometryFixture();doc.productionProfile!.reservedAreas[0]={...doc.productionProfile!.reservedAreas[0]!,shape:'ellipse',xMm:40,yMm:20,widthMm:20,heightMm:20};doc.objects=[geometryRect('corner',40.2,20.2,1,1)];await browserStart(page);expect(rule(await inspect(page,doc)).status).toBe('clear');
 doc.objects=[geometryRect('touch',35,28,5,4)];expect(rule(await inspect(page,doc)).status).toBe('boundary');doc.objects[0]!.xMm=35.2;expect(rule(await inspect(page,doc)).status).toBe('overlap');
 doc.shape='round';doc.areaMm={width:100,height:100};doc.productionProfile!.usableArea={shape:'round',widthMm:100,heightMm:100};doc.productionProfile!.reservedAreas=[];doc.objects=[geometryRect('corner-outside-page',1,1,2,2),geometryRect('center',48,48,4,4)];expect((await inspect(page,doc)).status).toBe('clear');doc.objects.push(geometryRect('top-margin',49,.5,2,1));expect(rule(await inspect(page,doc),'margin').status).toBe('overlap');
});
test('geometria produttiva: mancanza dati, errori font, budget e file ignoti non diventano un esito positivo',async({page,request})=>{
 const doc=productionGeometryFixture();await browserStart(page);doc.productionProfile!.safeMarginMm=null;expect((await inspect(page,doc)).status).toBe('unconfigured');doc.productionProfile!.safeMarginMm=2;expect((await inspect(page,doc,{maxPixels:0})).status).toBe('incomplete');expect((await inspect(page,doc,{maxMilliseconds:0})).status).toBe('incomplete');
 const {woff2}=compressedTestFonts();doc.fontAssets=[woff2];const text=doc.objects.find(object=>object.type==='text')!;if(text.type!=='text')throw Error('TEST');text.fontFamily=woff2.id;text.text='Ω';expect((await inspect(page,doc)).status).toBe('incomplete');doc.productionProfile!.safeMarginMm=0;doc.productionProfile!.reservedAreas=[];expect((await inspect(page,doc)).status).toBe('incomplete');const failed=await request.post('/__editor-local/check-geometry',{headers:{'X-Editor-Local':'1','Content-Type':'application/json'},data:doc});expect(failed.status()).toBe(422);expect((await failed.json()).error).toContain('non contiene Ω');
 delete doc.productionProfile;expect((await inspect(page,doc)).status).toBe('unconfigured');
});
test('geometria produttiva: font WOFF2 esatto, pagine già esistenti con formati distinti e profilo parametrico',async({request})=>{
 const doc=productionGeometryFixture(),{woff2}=compressedTestFonts();doc.fontAssets=[woff2];doc.objects=[{id:'text',type:'text',xMm:10,yMm:8,text:'ABC Città',fontFamily:woff2.id,fontSizePt:12,fill:'#000000'}];const second=structuredClone(doc);second.areaMm={width:120,height:80};second.objects.push(geometryRect('collision-page2',42,22,2,2));const project=joinGraphicPages([doc,second],['100 x 60','120 x 80']),before=structuredClone(project),report=await apiInspect(request,project);
 expect(report.pages).toHaveLength(2);expect(report.pages[0]!.status).toBe('clear');expect(report.pages[1]!.status).toBe('overlap');expect(project).toEqual(before);expect(report.pages[0]!.profile).toEqual(report.pages[1]!.profile);
});
test('geometria produttiva: molte sorgenti grandi superano il budget prima della decodifica e non producono un falso clear',async({page})=>{
 const {testPng}=await import('../helpers/png'),{rasterSourceFromBytes}=await import('../../src/editor/raster-source'),{DEFAULT_RASTER}=await import('../../src/editor/raster-processing'),doc=productionGeometryFixture(),rgba=new Uint8Array(4000*4000*4);doc.fontAssets=[];doc.objects=[];
 for(let i=0;i<4;i++){rgba[0]=i+1;rgba[3]=255;doc.objects.push({id:`image-${i}`,type:'image',xMm:10+i*15,yMm:8,widthMm:10,heightMm:10,source:rasterSourceFromBytes(`source-${i}`,testPng(4000,4000,rgba)),raster:{...DEFAULT_RASTER,mode:'original'}});}
 await browserStart(page);const before=structuredClone(doc),result=await inspect(page,doc);expect(result.status).toBe('incomplete');expect(result.pixels).toBe(0);expect(result.pages[0]!.message).toContain('immagini superano il budget');expect(doc).toEqual(before);
});
test('geometria produttiva: stessi comandi manuali/AI, Undo/Redo, JSON e SVG senza risultati o guide persistiti',async({page})=>{
 const doc=productionGeometryFixture();doc.objects=[geometryRect('moving',25,22,3,3)];await browserStart(page);
 const result=await page.evaluate(async document=>{
  const paths=['/src/editor/model.ts','/src/editor/fabric-adapter.ts','/src/editor/production-geometry-browser.ts'],[{DocumentStore},{measureFabric,exportDocumentSvg},{inspectProductionGeometry}]=await Promise.all(paths.map(path=>import(path))),manual=new DocumentStore(document,measureFabric),ai=new DocumentStore(document,measureFabric),command={schemaVersion:1,tool:'moveObject',objectId:'moving',expectedRevision:0,arguments:{xMm:45,yMm:24}};
  const before=await inspectProductionGeometry(manual.document);manual.dispatch(command,'manual');ai.dispatch(command,'ai-simulation');const moved=await inspectProductionGeometry(manual.document),same=JSON.stringify(manual.document)===JSON.stringify(ai.document),snapshot=structuredClone(manual.document),svg=await exportDocumentSvg(manual.document);manual.undo();const undone=await inspectProductionGeometry(manual.document);manual.redo();const redone=await inspectProductionGeometry(manual.document);return{same,before,moved,undone,redone,unmodified:JSON.stringify(snapshot)===JSON.stringify(ai.document),svg,keys:Object.keys(manual.document)};
 },doc);
 expect(result.same).toBe(true);expect(result.unmodified).toBe(true);expect(result.before.status).toBe('clear');expect(result.moved.status).toBe('overlap');expect(result.undone.status).toBe('clear');expect(result.redone.status).toBe('overlap');expect(result.svg).not.toContain('Area data TEST');expect(result.keys).not.toContain('geometryReport');
});
test('geometria produttiva: UI risultato legato alla revisione e richiesta asincrona obsoleta ignorata',async({page})=>{
 const doc=productionGeometryFixture(),writes:string[]=[];await page.route('**/__editor-local/admin/**',route=>{if(route.request().url().endsWith('/font-coverage'))return route.fallback();if(route.request().method()!=='GET')writes.push(route.request().url());return route.fulfill({json:{schemaVersion:1,revision:0,settings:{editorName:'TEST',gridMm:1,gridVisible:false,snapEnabled:false},fonts:[],records:[],productionProfiles:[]}});});
 await browserStart(page);await page.getByLabel('Riapri progetto JSON').setInputFiles({name:'geometry.TEST.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))});await expect(page.getByTestId('revision')).toBeVisible();await page.locator('.production-link-panel summary').click();const panel=page.getByRole('region',{name:'Controllo visuale di margini e zone'}),before=await page.getByTestId('graphic-state').textContent();
 await panel.getByRole('button',{name:'Controlla margini e zone',exact:true}).click();await expect(panel.getByLabel('Esito controllo visuale')).toContainText('Nessuna sovrapposizione rilevata');expect(await page.getByTestId('graphic-state').textContent()).toBe(before);
 const reopen=()=>page.getByLabel('Riapri progetto JSON').setInputFiles({name:'geometry-update.TEST.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))});doc.objects[0]!.xMm+=1;await reopen();await expect(panel).toContainText('Design modificato');
 let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});await page.route('**/__editor-local/check-geometry',async route=>{const report=await apiInspect(page.request,route.request().postDataJSON());await pending;await route.fulfill({json:report});});await panel.getByRole('button',{name:'Controlla margini e zone',exact:true}).click();await expect(panel).toContainText('Controllo della grafica in corso');doc.objects[0]!.xMm+=1;await reopen();release();await expect(panel).toContainText('Il design è cambiato: ripeti il controllo.');await expect(panel.getByLabel('Esito controllo visuale')).toHaveCount(0);expect(writes).toEqual([]);
});
test('geometria produttiva: endpoint solo loopback, intestazione e JSON; nessun dato di esito client accettato',async({request})=>{
 const document=productionGeometryFixture();expect((await request.post('/__editor-local/check-geometry',{data:document})).status()).toBe(403);expect((await request.get('/__editor-local/check-geometry',{headers:{'X-Editor-Local':'1'}})).status()).toBe(415);expect((await request.post('/__editor-local/check-geometry',{headers:{'X-Editor-Local':'1','Content-Type':'application/json',Origin:'https://example.com'},data:document})).status()).toBe(403);expect((await request.post('/__editor-local/check-geometry',{headers:{'X-Editor-Local':'1','Content-Type':'application/json'},data:{...document,geometryReport:{status:'clear'}}})).status()).toBe(422);
});
test('geometria produttiva: controllo reale di grandi formati a riquadri, nessuna bitmap del foglio intero',async({page})=>{
 const doc=productionGeometryFixture();doc.productionProfile!.reservedAreas=[];doc.areaMm={width:1100,height:400};doc.objects=[geometryRect('central',500,180,10,10)];await browserStart(page);let result=await inspect(page,doc);expect(result.status).toBe('clear');expect(result.pixels).toBeGreaterThan(1_000_000);expect(result.pixels).toBeLessThan(64_000_000);
 doc.shape='round';doc.areaMm={width:3000,height:3000};doc.productionProfile!.usableArea={widthMm:3000,heightMm:3000,shape:'round'};doc.objects=[geometryRect('central',1490,1490,20,20)];result=await inspect(page,doc);expect(result.status).toBe('clear');expect(result.pixels).toBeLessThan(64_000_000);
});
test('geometria produttiva: riquadro uguale al PNG a 150 dpi con testi, curve, shear e riflessioni',async({page})=>{
 const {objectTransformsFixture}=await import('../helpers/object-transforms'),doc=objectTransformsFixture();await browserStart(page);
 const result=await page.evaluate(async document=>{
  const path='/src/editor/fabric-adapter.ts',{createGraphicTileRenderer,exportDocumentPng}=await import(path),renderer=await createGraphicTileRenderer(document),bitmap=await createImageBitmap(await exportDocumentPng(document,150,true)),full=window.document.createElement('canvas');full.width=bitmap.width;full.height=bitmap.height;const context=full.getContext('2d')!;context.drawImage(bitmap,0,0);bitmap.close();const diffs=[];
  try{for(const [x,y]of [[40,50],[650,320],[80,620],[700,580]]){const tile={x,y,width:400,height:220,pixelsPerMm:150/25.4},a=renderer.read(tile),b=context.getImageData(x!,y!,400,220).data;let error=0;for(let i=0;i<a.length;i+=4){error+=Math.abs(a[i+3]!-b[i+3]!);for(let c=0;c<3;c++)error+=Math.abs(a[i+c]!*a[i+3]!/255-b[i+c]!*b[i+3]!/255);}diffs.push(error/a.length);}return diffs;}finally{await renderer.dispose();}
 },doc);
 for(const difference of result)expect(difference).toBeLessThan(.5);
});
