import {MAX_RASTER_BYTES,MAX_RASTER_PIXELS} from './raster-limits';
import type{RasterSource}from'./raster-source';
import type{RasterParameters}from'./raster-processing';
/** More placements, while keeping the old four-full-size-image resource ceiling.
 * Processed appearances are charged separately: evicting a derived-cache entry
 * does not release a bitmap still referenced by an object on the canvas. */
export const MAX_DOCUMENT_IMAGES=32;
export const MAX_DOCUMENT_SOURCE_PIXELS=4*MAX_RASTER_PIXELS;
export const MAX_DOCUMENT_FILTER_PIXELS=4*MAX_RASTER_PIXELS;
export const MAX_DOCUMENT_IMAGE_BYTES=4*MAX_RASTER_BYTES;
type Entry={source:RasterSource;raster:RasterParameters};
export interface RasterDocumentUsage{images:number;sourcePixels:number;filterPixels:number;embeddedBytes:number;}
/** Sources have already passed RasterSourceSchema. No extra base64 decode or
 * re-encoding; repeated data remain charged for every embedded JSON placement. */
export function rasterDocumentUsage(images:readonly Entry[]):RasterDocumentUsage{
 const sources=new Map<string,number>();let filterPixels=0,embeddedBytes=0;
 for(const {source,raster}of images){const pixels=source.pixelWidth*source.pixelHeight;sources.set(source.dataUrl,Math.max(sources.get(source.dataUrl)??0,pixels));if(raster.mode!=='original')filterPixels+=pixels;const length=source.dataUrl.length-source.dataUrl.indexOf(',')-1,padding=source.dataUrl.endsWith('==')?2:source.dataUrl.endsWith('=')?1:0;embeddedBytes+=length*3/4-padding;}
 return{images:images.length,sourcePixels:[...sources.values()].reduce((a,b)=>a+b,0),filterPixels,embeddedBytes};
}
export function rasterDocumentIssues(usage:RasterDocumentUsage):string[]{
 const issues:string[]=[];
 if(usage.images>MAX_DOCUMENT_IMAGES)issues.push(`Massimo ${MAX_DOCUMENT_IMAGES} immagini nel progetto.`);
 if(usage.sourcePixels>MAX_DOCUMENT_SOURCE_PIXELS)issues.push('Gli originali del progetto superano complessivamente 96 milioni di pixel. Usa immagini a risoluzione inferiore.');
 if(usage.filterPixels>MAX_DOCUMENT_FILTER_PIXELS)issues.push('Le immagini elaborate del progetto superano complessivamente 96 milioni di pixel. Riduci la risoluzione o il numero di copie elaborate.');
 if(usage.embeddedBytes>MAX_DOCUMENT_IMAGE_BYTES)issues.push('Le immagini incorporate nel progetto superano complessivamente 80 MB. Usa file più leggeri o meno copie.');
 return issues;
}
