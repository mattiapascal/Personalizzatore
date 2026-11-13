import {fixtureCatalog} from '../../src/catalog/adapter';
import {DocumentSchema,type GraphicDocument} from '../../src/editor/model';
import {DEFAULT_RASTER} from '../../src/editor/raster-processing';
import {rasterSourceFromBytes} from '../../src/editor/raster-source';
import type {RasterCrop} from '../../src/editor/raster-geometry';
import {createTestDocument} from './editor-fonts';
import {pngChunk,testPng} from './png';
import {tiffOrientation} from './png-exif';
import {jpegWithExif} from './jpeg';
export const binaryCropPixels=new Uint8Array([0,0,0,255,255,255,255,255,127,127,127,255,0,0,0,255,255,255,255,255,127,127,127,255]);
export function binaryCropFixture(scale=1):GraphicDocument{
 if(!Number.isInteger(scale)||scale<1||scale>64)throw Error('Scala del campione TEST non valida');
 const product=fixtureCatalog.list().find(product=>product.handle==='trodat-4913')!,doc=createTestDocument(product,fixtureCatalog.version);doc.documentId='14141414-1414-4414-8414-141414141414';
 const pixels=new Uint8Array(3*scale*2*scale*4);for(let y=0;y<2*scale;y++)for(let x=0;x<3*scale;x++){const index=(Math.floor(y/scale)*3+Math.floor(x/scale))*4;pixels.set(binaryCropPixels.subarray(index,index+4),(y*3*scale+x)*4);}
 const source=rasterSourceFromBytes(`crop-source-${scale}`,testPng(3*scale,2*scale,pixels));
 doc.objects=[
  {id:'clean-crop',type:'image',xMm:4,yMm:4,widthMm:8,heightMm:8,source,crop:{leftPx:0,topPx:0,widthPx:2*scale,heightPx:2*scale},raster:{...DEFAULT_RASTER,backgroundRemoval:'luminance'}},
  {id:'gray-crop',type:'image',xMm:18,yMm:4,widthMm:8,heightMm:8,source:{...source,id:`crop-alias-${scale}`},crop:{leftPx:scale,topPx:0,widthPx:2*scale,heightPx:2*scale},raster:{...DEFAULT_RASTER,backgroundRemoval:'luminance'}},
 ];return DocumentSchema.parse(doc);
}
/** Independent forward mapping of raw cell centers, used only as a TEST oracle. */
export function logicalPoint(orientation:number,w:number,h:number,x:number,y:number):[number,number]{
 switch(orientation){case 1:return[x,y];case 2:return[w-1-x,y];case 3:return[w-1-x,h-1-y];case 4:return[x,h-1-y];case 5:return[y,x];case 6:return[h-1-y,x];case 7:return[h-1-y,w-1-x];case 8:return[y,w-1-x];default:throw Error('Orientamento TEST');}
}
export function logicalCrop(orientation:number,w:number,h:number,raw:{left:number;top:number;width:number;height:number}):RasterCrop{
 const points=[raw.left,raw.left+raw.width-1].flatMap(x=>[raw.top,raw.top+raw.height-1].map(y=>logicalPoint(orientation,w,h,x,y))),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 return{leftPx:Math.min(...xs),topPx:Math.min(...ys),widthPx:Math.max(...xs)-Math.min(...xs)+1,heightPx:Math.max(...ys)-Math.min(...ys)+1};
}
let oriented:ReturnType<typeof createOrientedCases>|undefined;
async function createOrientedCases(){
 const w=32,h=24,pixels=new Uint8Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const gray=x>=16&&x<24&&y>=8&&y<16?127:0;pixels.set([gray,gray,gray,255],(y*w+x)*4);}
 const png=testPng(w,h,pixels),{default:sharp}=await import('sharp'),jpeg=await sharp(pixels,{raw:{width:w,height:h,channels:4}}).jpeg({quality:100,chromaSubsampling:'4:4:4'}).toBuffer(),cases=[];
 for(let orientation=1;orientation<=8;orientation++)for(const mime of['image/png','image/jpeg']as const){const exif=pngChunk('eXIf',tiffOrientation(orientation)),bytes=mime==='image/png'?Buffer.concat([png.subarray(0,33),exif,png.subarray(33)]):jpegWithExif(jpeg,orientation);cases.push({orientation,mime,source:rasterSourceFromBytes(`oriented-${mime.slice(6)}-${orientation}`,bytes),good:logicalCrop(orientation,w,h,{left:1,top:1,width:6,height:6}),bad:logicalCrop(orientation,w,h,{left:17,top:9,width:6,height:6})});}
 return cases;
}
export function binaryCropOrientationCases(){return oriented??=createOrientedCases();}
