import {rasterSampleWindow,assertSampleWindow,type RasterSampleWindow} from './raster-sample-window';
import type {GraphicCatalogContext,GraphicDocument,SceneObject} from './model';
import {graphicPages} from './pages';
import {productionDocument} from './object-properties';
import {assertDocumentTextProduction,documentTextProduct} from './text-production';

export type RasterObject=Extract<SceneObject,{type:'image'}>;
export type BinaryRasterCheck=(object:RasterObject)=>Promise<boolean>;

/** Source pixels, before display interpolation. Transparent RGB is irrelevant;
 * any visible intermediate RGB or alpha is unsuitable for a binary imprint. */
function binaryInkSample(pixels:Uint8Array|Uint8ClampedArray,index:number):boolean{
 const alpha=pixels[index+3]!;if(alpha===0)return true;if(alpha!==255)return false;const value=pixels[index]!;return(value===0||value===255)&&pixels[index+1]===value&&pixels[index+2]===value;
}
export function binaryInkPixels(pixels:Uint8Array|Uint8ClampedArray):boolean{
 if(pixels.length%4)throw Error('Buffer RGBA incompleto');for(let index=0;index<pixels.length;index+=4)if(!binaryInkSample(pixels,index))return false;return true;
}
export function binaryInkWindow(pixels:Uint8Array|Uint8ClampedArray,width:number,window:RasterSampleWindow):boolean{
 if(!Number.isInteger(width)||width<1||pixels.length%(width*4))throw Error('Buffer RGBA incompleto');assertSampleWindow(window,width,pixels.length/width/4);
 for(let y=window.top;y<window.top+window.height;y++)for(let x=window.left;x<window.left+window.width;x++)if(!binaryInkSample(pixels,(y*width+x)*4))return false;return true;
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
    const window=rasterSampleWindow(object.source,object.crop),key=JSON.stringify({raster:object.raster,mime:object.source.mime,width:object.source.pixelWidth,height:object.source.pixelHeight,window:guaranteesBinaryRaster(object)?null:window});let result=variants.get(key);if(!result){result=checkRaster(object);variants.set(key,result);}
    if(!await result)throw Error(`${page.productionProfile&&!page.productionProfile.kind.startsWith('stamp-')?'Il profilo tecnico':'Il timbro'} richiede immagini in bianco/nero senza grigi, colori o trasparenze parziali: converti «${object.editor?.label||object.id}» in B/N nell’ispettore prima di confermare. Il controllo considera tutti i pixel del ritaglio, anche quelli nascosti dalle maschere.`);
   }
  }catch(error){if(pages.length===1)throw error;throw Error(`${page.pageName??'Pagina'}: ${error instanceof Error?error.message:'Controllo produttivo non riuscito'}`);}
 }
}
