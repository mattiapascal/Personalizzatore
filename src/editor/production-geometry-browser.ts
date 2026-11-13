import {parseGraphicDocument,type GraphicDocument} from './model';
import {graphicPages} from './pages';
import {productionDocument} from './object-properties';
import {backgroundObjectIds} from './background';
import {assertProfileForPage} from './production-profile-link';
import {assertOutputFonts} from './font-preflight';
import {createGraphicTileRenderer} from './fabric-adapter';
import {GEOMETRY_INSPECTION,geometryStatus,pageGeometryRules,geometryRuleTiles,scanGeometryTile,ProductionGeometryReportSchema,type ProductionGeometryReport,type GeometryRuleResult} from './production-geometry';

/** Diagnostic only: visible paint sampled at a declared physical resolution.
 * Unknown data, exhausted resources and border samples are never a clear result.
 * The local API invokes this exact function against its own captured document. */
export async function inspectProductionGeometry(raw:GraphicDocument,limits:{maxPixels?:number;maxMilliseconds?:number}={}):Promise<ProductionGeometryReport>{
 const document=parseGraphicDocument(raw),pages=graphicPages(document),report:ProductionGeometryReport={schemaVersion:1,documentId:document.documentId,revision:document.revision,contentRevision:document.contentRevision??document.revision,resolutionMm:1/GEOMETRY_INSPECTION.pixelsPerMm,status:'unconfigured',pixels:0,pages:[]};
 const maxPixels=limits.maxPixels??GEOMETRY_INSPECTION.maxPixels,maxMilliseconds=limits.maxMilliseconds??GEOMETRY_INSPECTION.maxMilliseconds,start=performance.now();
 const uniqueSources=new Set<string>();let sourcePixels=0,tilesSinceYield=0;
 if(!Number.isFinite(maxPixels)||maxPixels<0||maxPixels>GEOMETRY_INSPECTION.maxPixels||!Number.isFinite(maxMilliseconds)||maxMilliseconds<0||maxMilliseconds>GEOMETRY_INSPECTION.maxMilliseconds)throw Error('Budget di controllo non valido');
 for(const page of pages){
  const profile=page.productionProfile,result:ProductionGeometryReport['pages'][number]={id:page.pageId??'page-1',name:page.pageName??'Pagina 1',...(profile?{profile:{id:profile.id,version:profile.version,label:profile.label}}:{}),status:'unconfigured',rules:[]};report.pages.push(result);
  if(!profile){result.message='Nessun profilo tecnico collegato a questa pagina.';continue;}
  const rules=pageGeometryRules(page),renderers=new Map<'margin'|'reserved',Awaited<ReturnType<typeof createGraphicTileRenderer>>>();
  try{
   assertProfileForPage(profile,page);
   const artwork=productionDocument(page);
   // Also guard the zero-margin/no-zone case, which needs no pixels. A font
   // failure must not become a clear report only because no tile was visited.
   await assertOutputFonts(artwork);
   for(const object of artwork.objects)if(object.type==='image'&&!uniqueSources.has(object.source.dataUrl)){uniqueSources.add(object.source.dataUrl);sourcePixels+=object.source.pixelWidth*object.source.pixelHeight;}
   if(sourcePixels>GEOMETRY_INSPECTION.maxSourcePixels)throw Error('Le immagini superano il budget del controllo visuale; il progetto resta modificabile.');
   for(const rule of rules){
    const renderKey=rule.kind==='margin'?'margin':'reserved';
    const item:GeometryRuleResult={id:rule.id,label:rule.label,kind:rule.kind,status:rule.unconfigured||rule.kind==='margin'&&rule.marginMm===undefined?'unconfigured':'clear',pixels:0};result.rules.push(item);
    if(item.status==='unconfigured'){item.message=rule.unconfigured??'Il margine non è stato definito nel profilo.';continue;}
    let boundary:ReturnType<typeof scanGeometryTile>;
    for(const tile of geometryRuleTiles(rule)){
     if(report.pixels+tile.width*tile.height>maxPixels||performance.now()-start>=maxMilliseconds){item.status='incomplete';item.message='Budget del controllo visuale raggiunto; nessun esito positivo attribuito alla parte non esaminata.';break;}
     const fullBleed=profile.kind==='printed-plaque'&&(backgroundObjectIds(artwork).size>0||!!artwork.paperColor);
     let renderer=renderers.get(renderKey)??(fullBleed?undefined:renderers.values().next().value);
     if(!renderer){
      let source=artwork;
      // Printed supports allow an explicitly linked full-bleed background.
      // Ink/engraving margins still constrain all paint, including backgrounds;
      // no background is exempt from mechanical reserved-zone checks.
      if(rule.kind==='margin'&&profile.kind==='printed-plaque'){
       const ids=backgroundObjectIds(artwork);source=productionDocument({...artwork,objects:artwork.objects.map(object=>ids.has(object.id)?{...object,editor:{...object.editor,reference:true}}:object)});delete source.paperColor;
      }
      renderer=await createGraphicTileRenderer(source);
     }
     renderers.set(renderKey,renderer);
     const pixels=renderer.read(tile);item.pixels+=tile.width*tile.height;report.pixels+=tile.width*tile.height;
     const witness=scanGeometryTile(pixels,tile,rule,profile.kind==='stamp-ink');
     if(witness?.status==='overlap'){item.status='overlap';item.witness={xMm:witness.xMm,yMm:witness.yMm};const candidates=renderer.candidates(witness.xMm,witness.yMm);item.candidateObjectIds=candidates.slice(0,8);item.candidateObjectCount=candidates.length;break;}
     if(witness)boundary??=witness;
     // Yield so the timeout and browser remain responsive between bounded tiles.
     if(++tilesSinceYield%8===0)await new Promise<void>(resolve=>setTimeout(resolve,0));
    }
    if(item.status==='clear'&&boundary){item.status='boundary';item.witness={xMm:boundary.xMm,yMm:boundary.yMm};const candidates=renderers.get(renderKey)!.candidates(boundary.xMm,boundary.yMm);item.candidateObjectIds=candidates.slice(0,8);item.candidateObjectCount=candidates.length;}
   }
  }catch(error){
   const message=(error instanceof Error?error.message:'Controllo visuale non disponibile').slice(0,1000);
   for(const rule of rules)if(!result.rules.some(item=>item.id===rule.id))result.rules.push({id:rule.id,label:rule.label,kind:rule.kind,status:'incomplete',pixels:0,message});
   for(const item of result.rules)if(item.status==='clear'){item.status='incomplete';item.message=message;}
   // Preserve a demonstrated overlap, but never hide a later rendering error.
   result.message=message;
  }finally{for(const renderer of new Set(renderers.values()))await renderer.dispose();}
  result.status=geometryStatus(result.rules.map(item=>item.status));
 }
 report.status=geometryStatus(report.pages.map(page=>page.status));return ProductionGeometryReportSchema.parse(report);
}
