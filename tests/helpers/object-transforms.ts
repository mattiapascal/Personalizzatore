import {createTestDocument,TEST_DEFAULT_FONT} from './editor-fonts';
import {rasterSourceFromBytes} from '../../src/editor/raster-source';
import {DEFAULT_RASTER} from '../../src/editor/raster-processing';
import {testPng} from './png';
import type {SceneObject} from '../../src/editor/model';
export function objectTransformsFixture(){
 const doc=createTestDocument();doc.areaMm={width:220,height:150};doc.colorMode='color';
 const base={xMm:12,yMm:12,skewXDeg:24,rotationDeg:17,mirrorX:true,strokeMm:.4,stroke:'#000000',fill:'#0088cc'};
 doc.objects=[
  {...base,id:'affine-rect',type:'rect',widthMm:30,heightMm:18,cornerRadiusMm:3},
  {...base,id:'affine-circle',type:'circle',xMm:65,radiusMm:11},
  {...base,id:'affine-ellipse',type:'ellipse',xMm:105,rxMm:16,ryMm:9},
  {...base,id:'affine-line',type:'line',xMm:158,lengthMm:30,fill:'none'},
  {...base,id:'affine-polygon',type:'path',yMm:55,widthMm:32,heightMm:22,points:[{x:0,y:0},{x:1,y:.3},{x:.6,y:1}],closed:true},
  {...base,id:'affine-bezier',type:'bezier',xMm:65,yMm:55,widthMm:30,heightMm:22,nodes:[{x:0,y:0,out:{x:.4,y:0}},{x:1,y:1,in:{x:.6,y:1}}],closed:false,fill:'none'},
  {...base,id:'affine-vector',type:'vector',xMm:112,yMm:55,widthMm:30,heightMm:22,commands:[['M',0,0],['L',1,0],['L',1,1],['L',0,1],['Z'],['M',.2,.2],['L',.8,.2],['L',.8,.8],['L',.2,.8],['Z']],fillRule:'evenodd',strokeLineCap:'butt',strokeLineJoin:'miter',strokeMiterLimit:4},
  {id:'affine-image',type:'image',xMm:162,yMm:55,widthMm:25,heightMm:20,source:rasterSourceFromBytes('asset-affine',testPng(5,4)),raster:{...DEFAULT_RASTER,mode:'original'},skewXDeg:-23,rotationDeg:-15,mirrorY:true},
  {id:'affine-text',type:'text',xMm:12,yMm:105,text:'TEST · Città',fontFamily:TEST_DEFAULT_FONT.id,fontSizePt:24,fill:'#0088cc',textScaleX:1.4,skewXDeg:24,rotationDeg:-12,mirrorX:true,characterStyles:[{start:7,end:12,style:{fontSizePt:20,fill:'#aa3300',underline:true}}]},
  {id:'affine-path-text',type:'text',xMm:120,yMm:100,text:'TEST',fontFamily:TEST_DEFAULT_FONT.id,fontSizePt:18,fill:'#000000',textScaleX:1.3,skewXDeg:24,rotationDeg:-12,mirrorY:true,textPath:{guide:{type:'circle',radiusMm:16,strokeMm:.25,stroke:'#000000'},originalPathId:'guide-affine',offsetMm:0,baseline:'baseline',reversed:false,showGuide:false}}
 ] satisfies SceneObject[];
 return doc;
}
