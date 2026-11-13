import type {GraphicCatalogContext,GraphicDocument,SceneObject} from './model';
import {graphicPages} from './pages';
import {productionDocument} from './object-properties';
import {assertDocumentTextProduction,documentTextProduct} from './text-production';

export type RasterObject=Extract<SceneObject,{type:'image'}>;
export type BinaryRasterCheck=(object:RasterObject)=>Promise<boolean>;

/** Source pixels, before display interpolation. Transparent RGB is irrelevant;
 * any visible intermediate RGB or alpha is unsuitable for a binary imprint. */
export function binaryInkPixels(pixels:Uint8Array|Uint8ClampedArray):boolean{
 if(pixels.length%4)throw Error('Buffer RGBA incompleto');
 for(let i=0;i<pixels.length;i+=4){const alpha=pixels[i+3]!;if(alpha===0)continue;if(alpha!==255)return false;const value=pixels[i]!;if(value!==0&&value!==255||pixels[i+1]!==value||pixels[i+2]!==value)return false;}
 return true;
}

/** Binary threshold/dither produces only binary samples, regardless of input.
 * Luminance removal instead keeps continuous alpha and needs pixel inspection. */
export const guaranteesBinaryRaster=(object:RasterObject)=>object.raster.mode!=='original'&&object.raster.mode!=='grayscale'&&!object.raster.backgroundRemoval;

/** Same read-only final gate in the browser and local API. The decoder is an
 * adapter: no DOM/native code enters this domain module. Check every page and
 * only artwork; JSON, crops, resources, revision and history remain unchanged. */
export async function assertDocumentProduction(document:GraphicDocument,catalog:GraphicCatalogContext|undefined,checkRaster:BinaryRasterCheck,requireKnownBinding=false):Promise<void>{
 const checked=new Map<string,Map<string,Promise<boolean>>>(),pages=graphicPages(document);
 for(const page of pages){
  try{
   assertDocumentTextProduction(page,catalog,requireKnownBinding);
   const product=documentTextProduct(page,catalog);
   if((!product||product.mechanism==='emboss')&&page.productionProfile?.rasterMode!=='binary')continue;
   for(const object of productionDocument(page).objects){
    if(object.type!=='image')continue;
    let variants=checked.get(object.source.dataUrl);if(!variants){variants=new Map();checked.set(object.source.dataUrl,variants);}
    const key=JSON.stringify(object.raster);let result=variants.get(key);if(!result){result=checkRaster(object);variants.set(key,result);}
    if(!await result)throw Error(`${page.productionProfile&&!page.productionProfile.kind.startsWith('stamp-')?'Il profilo tecnico':'Il timbro'} richiede immagini in bianco/nero senza grigi, colori o trasparenze parziali: converti «${object.editor?.label||object.id}» in B/N nell’ispettore prima di confermare. Il controllo considera l’immagine completa, anche fuori dal ritaglio.`);
   }
  }catch(error){if(pages.length===1)throw error;throw Error(`${page.pageName??'Pagina'}: ${error instanceof Error?error.message:'Controllo produttivo non riuscito'}`);}
 }
}
