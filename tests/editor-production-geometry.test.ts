import {it,expect} from 'vitest';
import {GEOMETRY_INSPECTION,pageGeometryRules,geometryRuleTiles,scanGeometryTile,geometryStatus,geometryReportCurrent,type GeometryRule,type ProductionGeometryReport} from '../src/editor/production-geometry';
import {productionProfileLinkFixture} from './helpers/production-profile-link';
import {localStorageTrialGuard} from '../scripts/local-storage-trial';
import type {Connect} from 'vite';
import type {IncomingMessage,ServerResponse} from 'node:http';
const doc=productionProfileLinkFixture(),reserved=pageGeometryRules(doc)[1]!,margin=pageGeometryRules(doc)[0]!,tile=(x:number,y:number)=>({x:Math.round(x*40),y:Math.round(y*40),width:1,height:1,pixelsPerMm:40}),pixel=(r=0,g=0,b=0,a=255)=>new Uint8ClampedArray([r,g,b,a]);
it('regole fisiche dal profilo: null non diventa zero e nessun margine viene inventato',()=>{
 const copy=structuredClone(doc);copy.productionProfile!.safeMarginMm=null;expect(pageGeometryRules(copy)[0]!.marginMm).toBeUndefined();expect([...geometryRuleTiles(pageGeometryRules(copy)[0]!)]).toHaveLength(0);copy.productionProfile!.safeMarginMm=0;expect(pageGeometryRules(copy)[0]!.marginMm).toBe(0);delete copy.productionProfile;expect(pageGeometryRules(copy)).toEqual([]);
});
it('campione nel margine e oltre il bordo sicuro: sovrapposizione, bordo incerto o nessun rilievo distinti',()=>{
 expect(scanGeometryTile(pixel(),tile(.5,10),margin,false)?.status).toBe('overlap');expect(scanGeometryTile(pixel(),tile(2,10),margin,false)?.status).toBe('boundary');expect(scanGeometryTile(pixel(),tile(3,10),margin,false)).toBeUndefined();
});
it('zona ellittica: i soli bbox sovrapposti non implicano una collisione',()=>{
 const rule:GeometryRule={...reserved,region:{...reserved.region!,xMm:10,yMm:10,widthMm:10,heightMm:10}};
 expect(scanGeometryTile(pixel(),tile(10.1,10.1),rule,false)).toBeUndefined();expect(scanGeometryTile(pixel(),tile(15,15),rule,false)?.status).toBe('overlap');expect(scanGeometryTile(pixel(),tile(10,15),rule,false)?.status).toBe('boundary');
});
it('zona rettangolare: tangenza non dichiarata come sovrapposizione e campione interno individuato',()=>{
 const rule:GeometryRule={...reserved,region:{...reserved.region!,xMm:10,yMm:10,widthMm:10,heightMm:10,shape:'rectangle'}};
 expect(scanGeometryTile(pixel(),tile(9.975,15),rule,false)?.status).toBe('boundary');expect(scanGeometryTile(pixel(),tile(12,15),rule,false)?.status).toBe('overlap');expect(scanGeometryTile(pixel(),tile(5,15),rule,false)).toBeUndefined();
});
it('bianco e trasparenza: il bianco non è inchiostro nel timbro, è pittura sulla targa',()=>{
 expect(scanGeometryTile(pixel(255,255,255),tile(.5,10),margin,true)).toBeUndefined();expect(scanGeometryTile(pixel(255,255,255),tile(.5,10),margin,false)?.status).toBe('overlap');
 expect(scanGeometryTile(pixel(0,0,0,0),tile(.5,10),margin,false)).toBeUndefined();expect(scanGeometryTile(pixel(120,120,120,100),tile(.5,10),margin,true)?.status).toBe('overlap');expect(scanGeometryTile(pixel(0,0,255,1),tile(.5,10),margin,false)?.status).toBe('overlap');
});
it('sagoma circolare: la corona ha geometria circolare, il centro è escluso',()=>{
 const rule:GeometryRule={...margin,round:true,area:{width:100,height:100}};
 expect(scanGeometryTile(pixel(),tile(50,.5),rule,false)?.status).toBe('overlap');expect(scanGeometryTile(pixel(),tile(50,2),rule,false)?.status).toBe('boundary');expect(scanGeometryTile(pixel(),tile(50,50),rule,false)).toBeUndefined();
});
for(const round of [false,true])it(`grande formato ${round?'tondo':'rettangolare'}: riquadri limitati alla corona, budget finito senza bitmap completa`,()=>{
 const rule:GeometryRule={...margin,round,area:{width:3000,height:3000}},tiles=[...geometryRuleTiles(rule)],pixels=tiles.reduce((sum,tile)=>sum+tile.width*tile.height,0);
 expect(tiles.length).toBeGreaterThan(100);expect(tiles.every(tile=>tile.width<=512&&tile.height<=512&&tile.x>=0&&tile.y>=0)).toBe(true);expect(pixels).toBeLessThan(GEOMETRY_INSPECTION.maxPixels);expect(pixels).toBeLessThan(3000*3000*40*40/100);
});
it('griglia delle zone frazionarie coperta con fascia di precisione, senza uscire dalla pagina',()=>{
 const rule:GeometryRule={...reserved,region:{...reserved.region!,xMm:.01,yMm:.02,widthMm:1.031,heightMm:2.047}},tiles=[...geometryRuleTiles(rule)];expect(tiles[0]!.x).toBe(0);expect(tiles[0]!.y).toBe(0);expect(tiles.at(-1)!.x+tiles.at(-1)!.width).toBeGreaterThanOrEqual(Math.ceil(1.041*40));
});
it('campioni e budget invalidi non producono un esito positivo',()=>{
 expect(()=>scanGeometryTile(new Uint8ClampedArray(3),tile(1,1),margin,false)).toThrow('incompleto');expect(()=>scanGeometryTile(pixel(),{...tile(1,1),x:NaN},margin,false)).toThrow('incompleto');expect(()=>[...geometryRuleTiles(margin,0)]).toThrow('Griglia');expect(()=>[...geometryRuleTiles({...margin,area:{width:Infinity,height:60}})]).toThrow('Area');expect(()=>[...geometryRuleTiles({...margin,marginMm:-1})]).toThrow('Margine');
});
it('stati incompleti, margini mancanti e contatti non diventano clear; una violazione dimostrata resta visibile',()=>{
 expect(geometryStatus([])).toBe('unconfigured');expect(geometryStatus(['clear','incomplete'])).toBe('incomplete');expect(geometryStatus(['clear','unconfigured'])).toBe('unconfigured');expect(geometryStatus(['clear','boundary'])).toBe('boundary');expect(geometryStatus(['overlap','incomplete'])).toBe('overlap');
});
it('esito legato al contenuto: scelta pagina senza modifica ammessa, editing/Undo/import e altro documento lo invalidano',()=>{
 const copy={...doc,revision:8,contentRevision:4},report={documentId:copy.documentId,revision:8,contentRevision:4}as ProductionGeometryReport;expect(geometryReportCurrent(report,copy)).toBe(true);expect(geometryReportCurrent(report,{...copy,revision:9})).toBe(true);expect(geometryReportCurrent(report,{...copy,revision:9,contentRevision:5})).toBe(false);expect(geometryReportCurrent(report,{...copy,documentId:'altro'})).toBe(false);
});
it('copia archivio di prova: permette la diagnostica di sola lettura e mantiene bloccate le altre scritture',()=>{
 let middleware:Connect.NextHandleFunction|undefined;const plugin=localStorageTrialGuard(),hook=plugin.configureServer;
 if(typeof hook!=='function')throw Error('Hook non disponibile');Reflect.apply(hook,null,[{middlewares:{use(handler:Connect.NextHandleFunction){middleware=handler;}}}]);
 for(const [url,allowed]of [['/__editor-local/check-geometry',true],['/__editor-local/configurations',false],['/api/chat',false],['/__editor-local/new-write',false]]as const){
  let next=false,status=0,ended=false;const response={set statusCode(value:number){status=value;},setHeader(){},end(){ended=true;}}as unknown as ServerResponse;
  middleware!({url,method:'POST'}as IncomingMessage,response,()=>{next=true;});expect(next).toBe(allowed);expect(ended).toBe(!allowed);if(!allowed)expect(status).toBe(403);
 }
});
