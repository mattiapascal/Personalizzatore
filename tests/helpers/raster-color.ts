import {createTestDocument} from './editor-fonts';
import {DocumentSchema} from '../../src/editor/model';
import {DEFAULT_RASTER} from '../../src/editor/raster-processing';
import {rasterSourceFromBytes} from '../../src/editor/raster-source';
import {testPng} from './png';
export function rasterColorFixture(){
 const doc=createTestDocument();doc.documentId='23232323-2323-4323-8323-232323232323';doc.productId=null;doc.variantId=null;doc.catalogVersion=null;doc.catalogProductProfileVersion=null;doc.colorMode='color';doc.areaMm={width:120,height:65};
 const pixels=new Uint8Array(64*40*4);for(let y=0;y<40;y++)for(let x=0;x<64;x++)pixels.set([Math.round(x*255/63),Math.round(y*255/39),Math.round((63-x)*255/63),y<28?255:x<20?0:x<44?128:255],(y*64+x)*4);
 const source=rasterSourceFromBytes('raster-color-source',testPng(64,40,pixels));doc.objects=[
  {id:'original',type:'image',xMm:7,yMm:8,widthMm:44,heightMm:44*36/59,source,raster:{...DEFAULT_RASTER,mode:'original'},rotationDeg:-6,crop:{leftPx:2.5,topPx:1.25,widthPx:59,heightPx:36}},
  {id:'adjusted',type:'image',xMm:64,yMm:8,widthMm:44,heightMm:44*36/59,source,raster:{...DEFAULT_RASTER,mode:'color',saturation:150,brightness:10,contrast:5},rotationDeg:8,mirrorX:true,crop:{leftPx:2.5,topPx:1.25,widthPx:59,heightPx:36}},
  {id:'caption',type:'text',xMm:20,yMm:48,text:'TEST · Colori e trasparenza',fontFamily:doc.fontAssets![0]!.id,fontSizePt:12,fill:'#000000',textAlign:'center',lineHeight:1},
 ];return DocumentSchema.parse(doc);
}
