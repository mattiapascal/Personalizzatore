import {rasterColorFixture} from './raster-color';
import {DocumentSchema} from '../../src/editor/model';
export function imageOpacityFixture(){
 const doc=rasterColorFixture();doc.documentId='29292929-2929-4929-8929-292929292929';
 doc.objects=doc.objects.map(object=>object.type==='image'?{...object,opacity:object.id==='original'?.65:.4}:object);
 doc.objects.unshift({id:'backdrop',type:'rect',xMm:3,yMm:3,widthMm:114,heightMm:42,stroke:'none',strokeMm:.25,fill:'#ffdd66'});
 const text=doc.objects.find(o=>o.type==='text');if(text?.type==='text')text.text='TEST · Trasparenza immagini';
 return DocumentSchema.parse(doc);
}
