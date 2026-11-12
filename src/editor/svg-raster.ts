import{rasterSourceFromBytes,type RasterSource}from'./raster-source';
/** Only self-contained, structurally checked pixels reach Fabric. The media
 * type must agree with the bytes; neither remote URLs nor nested SVGs qualify. */
export function embeddedSvgRaster(value:string,id='svg-bitmap'):RasterSource{
 const match=value.match(/^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/]+={0,2})$/);
 if(!match||match[2]!.length%4)throw Error('Le immagini SVG richiedono PNG/JPEG incorporati in base64, senza collegamenti esterni');
 let binary:string;try{binary=atob(match[2]!);}catch{throw Error('Immagine SVG con base64 non valido');}
 const source=rasterSourceFromBytes(id,Uint8Array.from(binary,c=>c.charCodeAt(0)));
 if(source.mime!==match[1])throw Error('Tipo dichiarato dell’immagine SVG diverso dai pixel incorporati');
 return source;
}
