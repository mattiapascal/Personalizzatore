import {createTestDocument} from './editor-fonts';
import {rasterSourceFromBytes} from '../../src/editor/raster-source';
import {DEFAULT_RASTER} from '../../src/editor/raster-processing';
import {DocumentSchema,type GraphicDocument} from '../../src/editor/model';
import {testPng} from './png';
export function selectionViewFixture(options:{grouped?:boolean;unverified?:boolean;large?:boolean}={}):GraphicDocument{
 const doc=createTestDocument();doc.documentId='20202020-2020-4020-8020-202020202020';doc.productId=null;doc.variantId=null;doc.catalogVersion=null;doc.catalogProductProfileVersion=null;doc.colorMode='color';doc.areaMm={width:100,height:70};
 const pixels=new Uint8Array(4*3*4);for(let i=0;i<12;i++)pixels.set([i%2?255:0,i%2?255:0,i%2?255:0,255],i*4);
 doc.objects=[
  {id:'main',type:'rect',xMm:62,yMm:30,widthMm:18,heightMm:10,rotationDeg:24,skewXDeg:8,mirrorX:true,fill:'#0088cc',stroke:'#00334d',strokeMm:.4},
  {id:'small',type:'rect',xMm:12,yMm:16,widthMm:8,heightMm:6,fill:'#ff5500',stroke:'none',strokeMm:.25},
  {id:'caption',type:'text',xMm:62,yMm:52,text:options.unverified?'A\u0378':'TEST · Città',fontFamily:doc.fontAssets![0]!.id,fontSizePt:10,textAlign:'center',fill:'#000000',lineHeight:1},
  {id:'outside-photo',type:'image',xMm:-6,yMm:8,widthMm:12,heightMm:9,rotationDeg:-15,flipX:true,source:rasterSourceFromBytes('selection-view-photo',testPng(4,3,pixels)),raster:{...DEFAULT_RASTER,mode:'original'}},
 ];
 if(options.grouped)doc.groups=[{id:'view-group',objectIds:['main','small']}];
 if(options.large){doc.areaMm={width:1100,height:400};doc.objects=doc.objects.map(object=>({...object,xMm:object.xMm+850,yMm:object.yMm+260}));const main=doc.objects[0]!;if(main.type==='rect'){main.widthMm=80;main.heightMm=45;}doc.objects[2]!.xMm=950;}
 return DocumentSchema.parse(doc);
}
