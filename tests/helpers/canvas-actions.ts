import {sceneActionsFixture} from './scene-actions';
import {testPng} from './png';
import {rasterSourceFromBytes} from '../../src/editor/raster-source';
export function canvasActionsFixture(){
 const doc=sceneActionsFixture();doc.documentId='97979797-9797-4797-8797-979797979797';
 doc.objects.unshift({id:'background',type:'image',xMm:0,yMm:0,widthMm:120,heightMm:80,source:rasterSourceFromBytes('background-TEST',testPng(3,2,new Uint8Array(Array.from({length:6},()=>[245,245,245,255]).flat()))),raster:{threshold:128,invert:false,whiteTransparent:false,mode:'original'}});doc.backgroundImageId='background';
 const caption=doc.objects.find(o=>o.id==='caption');if(caption?.type==='text'){caption.text='TEST · Foglio e proprietà';caption.editor={label:'Intestazione TEST',includeInForm:true};}return doc;
}
