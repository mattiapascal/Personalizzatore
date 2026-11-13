import {layerVisibilityFixture} from './layer-visibility';
import {rasterSourceFromBytes} from '../../src/editor/raster-source';
import {DEFAULT_RASTER} from '../../src/editor/raster-processing';
import {testPng} from './png';
import type {SceneObject} from '../../src/editor/model';
export function documentPaletteFixture(extraColors=0,image=false){
 const doc=layerVisibilityFixture();doc.documentId='82828282-8282-4282-a282-828282828282';delete doc.groups;
 for(let index=0;index<extraColors;index++)doc.objects.push({id:'color-'+index,type:'rect',xMm:2,yMm:50,widthMm:1,heightMm:1,stroke:'none',strokeMm:.25,fill:'#'+(index+1).toString(16).padStart(6,'0')});
 if(image){const source=rasterSourceFromBytes('palette-image-TEST',testPng(2,2,new Uint8Array([0,0,0,255,255,255,255,255,127,127,127,255,0,0,0,255])));doc.objects.push({id:'tinted-image',type:'image',xMm:80,yMm:10,widthMm:10,heightMm:10,source,raster:{...DEFAULT_RASTER,mode:'grayscale',tintColor:'#aa00aa',backgroundRemoval:'luminance'}}as SceneObject);}
 return doc;
}
