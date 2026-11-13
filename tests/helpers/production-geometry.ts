import {DocumentSchema,type SceneObject} from '../../src/editor/model';
import {productionProfileLinkFixture} from './production-profile-link';
import {rasterSourceFromBytes} from '../../src/editor/raster-source';
import {DEFAULT_RASTER} from '../../src/editor/raster-processing';
import {testPng} from './png';
import {holeMask} from './clip-masks';
import type {VectorCommand} from '../../src/editor/vector-geometry';

export const geometryZoneId='41414141-4141-4141-8141-414141414141';
export const geometryRect=(id:string,xMm:number,yMm:number,widthMm:number,heightMm:number,fill='#000000'):SceneObject=>({id,type:'rect',xMm,yMm,widthMm,heightMm,fill,stroke:'none',strokeMm:.25});
export function productionGeometryFixture(){
 const doc=productionProfileLinkFixture();doc.documentId='42424242-4242-4242-8242-424242424242';doc.productionProfile!.reservedAreas=[{id:geometryZoneId,label:'Area data TEST',xMm:40,yMm:20,widthMm:20,heightMm:20,shape:'rectangle'}];
 doc.objects=[{id:'clear-frame',type:'rect',xMm:30,yMm:10,widthMm:40,heightMm:40,fill:'none',stroke:'#0088cc',strokeMm:.5},{id:'clear-text-frame',type:'text',xMm:30,yMm:24,text:'X',fontFamily:doc.fontAssets![0]!.id,fontSizePt:12,fill:'#000000',textAlign:'left',textBox:{widthMm:40,heightMm:10,autoWidth:false,autoHeight:true}}];return DocumentSchema.parse(doc);
}
export function holedGeometryVector(mask=false):SceneObject{
 const outer=[['M',0,0],['L',1,0],['L',1,1],['L',0,1],['Z']]as const,inner=[['M',.1,.1],['L',.9,.1],['L',.9,.9],['L',.1,.9],['Z']]as const;
 return {id:'holed-vector',type:'vector',xMm:30,yMm:10,widthMm:40,heightMm:40,fill:'#0088cc',stroke:'none',strokeMm:.25,fillRule:'evenodd',strokeLineCap:'butt',strokeLineJoin:'miter',strokeMiterLimit:4,commands:(mask?outer:[...outer,...inner]).map(command=>[...command])as VectorCommand[],...(mask?{clipMasks:[structuredClone(holeMask)]}:{})};
}
export function transparentGeometryImage():SceneObject{
 const rgba=new Uint8Array(Array.from({length:64},(_,index)=>[0,0,0,index%8===0?255:0]).flat()),source=rasterSourceFromBytes('transparent-geometry-TEST',testPng(8,8,rgba));
 return{id:'transparent-image',type:'image',xMm:30,yMm:10,widthMm:40,heightMm:40,source,raster:{...DEFAULT_RASTER,mode:'original'},crop:{leftPx:.25,topPx:.25,widthPx:7.5,heightPx:7.5}};
}
