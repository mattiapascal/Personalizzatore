import {fixtureCatalog} from '../../src/catalog/adapter';
import {DocumentSchema,type SceneObject} from '../../src/editor/model';
import {rasterSourceFromBytes} from '../../src/editor/raster-source';
import {DEFAULT_RASTER} from '../../src/editor/raster-processing';
import {createTestDocument} from './editor-fonts';
import {testPng} from './png';
/** Deliberately unfinished TEST imprint: continuous image alpha and a local
 * semitransparent text outline. Editing/export remains possible; final check
 * requires correction. Exact source bytes are kept throughout the exercises. */
export function stampProductionFixture(){
 const product=fixtureCatalog.list().find(p=>p.handle==='trodat-4913')!,doc=createTestDocument(product,fixtureCatalog.version);
 doc.documentId='13131313-1313-4313-8313-131313131313';
 const gray=rasterSourceFromBytes('gray-source',testPng(2,2)),binary=rasterSourceFromBytes('binary-source',testPng(2,2,new Uint8Array([0,0,0,255,255,255,255,255,0,0,0,0,0,0,0,255])));
 const images:SceneObject[]=[{id:'alpha-image',type:'image',xMm:4,yMm:7,widthMm:8,heightMm:8,source:gray,raster:{...DEFAULT_RASTER,backgroundRemoval:'luminance'}},{id:'binary-image',type:'image',xMm:18,yMm:7,widthMm:8,heightMm:8,source:binary,raster:{...DEFAULT_RASTER,backgroundRemoval:'luminance'}}];
 doc.objects=[...images,{id:'outlined-text',type:'text',xMm:31,yMm:8,text:'ABC',fontSizePt:10,fontFamily:doc.fontAssets![0]!.id,fill:'#000000',stroke:'#000000',strokeMm:.2,characterStyles:[{start:1,end:2,style:{strokeOpacity:.5}}]}];
 return DocumentSchema.parse(doc);
}
