import type{ExifOrientation}from'./exif-orientation';
export interface PngPixelRows{width:number;height:number;readRows:(top:number,rows:number)=>Uint8Array|Uint8ClampedArray;}
const mismatch=()=>Error('Il PNG contiene immagini differenti concatenate: prepara un file con una sola immagine.');
/** Exact 8-bit premultiplied sRGB/alpha equivalence, as displayed by Canvas2D.
 * RGB differences below alpha precision do not change a displayed pixel. */
export function assertSamePngPixels(first:PngPixelRows,next:PngPixelRows):void{
 if(first.width!==next.width||first.height!==next.height)throw mismatch();for(let top=0;top<first.height;top+=128){const rows=Math.min(128,first.height-top),a=first.readRows(top,rows),b=next.readRows(top,rows);if(a.length!==first.width*rows*4||b.length!==a.length)throw Error('Buffer PNG decodificato non coerente');for(let i=0;i<a.length;i+=4){const alpha=a[i+3]!;if(alpha!==b[i+3])throw mismatch();for(let channel=0;channel<3;channel++)if(Math.round(a[i+channel]!*alpha/255)!==Math.round(b[i+channel]!*alpha/255))throw mismatch();}}
}
/** Integer pixel coordinates, matching the edge transforms used by SVG/canvas. */
export function rawPngPixelOffset(orientation:ExifOrientation,w:number,h:number,x:number,y:number):number{let sx=x,sy=y;switch(orientation){case 2:sx=w-1-x;break;case 3:sx=w-1-x;sy=h-1-y;break;case 4:sy=h-1-y;break;case 5:sx=y;sy=x;break;case 6:sx=y;sy=h-1-x;break;case 7:sx=w-1-y;sy=h-1-x;break;case 8:sx=w-1-y;sy=x;break;}return(sy*w+sx)*4;}
