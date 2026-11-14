import {Group,Rect,Path} from 'fabric';
import {qrSymbol} from './qr-code';
import {mapVector} from './vector-geometry';
import type {SceneObject} from './model';
/** One technical object, two native paints. The quiet zone is opaque white,
 * so page backgrounds cannot intrude into the mandatory empty border. */
export function qrView(source:Extract<SceneObject,{type:'qr'}>,common:ConstructorParameters<typeof Group>[1]){
 const width=source.widthMm*8,height=source.heightMm*8,symbol=qrSymbol(source.qr),options={originX:'center' as const,originY:'center' as const,left:0,top:0,strokeWidth:0,objectCaching:false,selectable:false,evented:false};
 const paper=new Rect({...options,width,height,fill:'#ffffff'}),ink=new Path(mapVector(symbol.commands,(x,y)=>({x:(x-.5)*width,y:(y-.5)*height})),{...options,fill:'#000000',fillRule:'nonzero'});
 return new Group([paper,ink],{...common,strokeWidth:0,objectCaching:false,subTargetCheck:false,perPixelTargetFind:false});
}
