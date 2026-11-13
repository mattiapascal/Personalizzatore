import {textPathGuideCenter} from '../../src/editor/text-path-model';
import {FabricAdapter,measureFabric,exportDocumentSvg,prepareRasterSource} from '../../src/editor/fabric-adapter';
import {loadFontAssets} from '../../src/editor/fonts';
import {DocumentStore,objectCenter,objectGeometry,type GraphicDocument} from '../../src/editor/model';
import {frameToWorld,withoutObjectAffine} from '../../src/editor/object-affine';
import {compareSupersampledSvg} from './svg-color-reference.browser';
import {EditorTextBox,textFramePoint} from '../../src/editor/text-box';
import {Point,type Transform,type TPointerEvent} from 'fabric';
export async function checkObjectTransforms(document:GraphicDocument){
 await loadFontAssets(document.fontAssets);await Promise.all(document.objects.filter(o=>o.type==='image').map(o=>prepareRasterSource(o.source)));
 const reports=[];
 for(const source of document.objects){
  const centered=objectCenter(source,measureFabric),plain=withoutObjectAffine(source);plain.rotationDeg=0;if(plain.type==='text')delete plain.textSkewXDeg;
  const baseCenter=objectCenter(plain,measureFabric),base={...plain,xMm:plain.xMm+centered.xMm-baseCenter.xMm,yMm:plain.yMm+centered.yMm-baseCenter.yMm};
  const original=await exportDocumentSvg({...document,objects:[base]},true),xml=new DOMParser().parseFromString(original,'image/svg+xml'),root=xml.documentElement,g=xml.createElementNS('http://www.w3.org/2000/svg','g');while(root.firstChild)g.append(root.firstChild);
  const a=frameToWorld(source,1,0),b=frameToWorld(source,0,1),cx=centered.xMm*8,cy=centered.yMm*8;
  g.setAttribute('transform',`translate(${cx} ${cy}) matrix(${a.x} ${a.y} ${b.x} ${b.y} 0 0) translate(${-cx} ${-cy})`);root.append(g);
  const reference=new XMLSerializer().serializeToString(xml),actual=await exportDocumentSvg({...document,objects:[source]},true),pixels=await compareSupersampledSvg(reference,actual,document.areaMm.width*4,document.areaMm.height*4);
  if(pixels.ratio>=.01||pixels.meanChannelError>=.25)throw Error(JSON.stringify({id:source.id,pixels}));
  const view=new FabricAdapter(window.document.createElement('canvas'),()=>0,()=>{});
  try{view.render({...document,objects:[source]});const object=view.canvas.getObjects()[0]!,native=object.getBoundingRect(),geometry=objectGeometry(source,measureFabric);if(Math.abs(native.width/8-geometry.widthMm)>1e-7||Math.abs(native.left/8-source.xMm)>1e-7||Math.abs(native.height/8-geometry.heightMm)>1e-7)throw Error(JSON.stringify({id:source.id,native,geometry}));}finally{view.dispose();}
  if(source.type==='text'&&source.textPath){const center=textPathGuideCenter(source,measureFabric),store=new DocumentStore({...document,groups:undefined,objects:[source]},measureFabric,undefined,'admin');store.dispatch({schemaVersion:1,tool:'detachTextFromPath',objectId:source.id,expectedRevision:0,arguments:{pathObjectId:'detached-guide'}},'manual');const guide=store.document.objects.find(o=>o.id==='detached-guide')!,after=objectCenter(guide,measureFabric);if(guide.rotationDeg!==source.rotationDeg||guide.skewXDeg!==source.skewXDeg||Math.hypot(after.xMm-center.xMm,after.yMm-center.yMm)>1e-7)throw Error('Separazione del percorso trasformato incoerente');}
  reports.push({id:source.id,pixels});
 }
 return reports;
}
export async function checkMirroredTextHandles(document:GraphicDocument){
 await loadFontAssets(document.fontAssets);const source=document.objects.find(o=>o.type==='text');if(!source)throw Error('Fixture testo');let cases=0;
 for(const mirrorX of [true,false])for(const mirrorY of [true,false])for(const automatic of [true,false])for(const[name,[x,y]]of Object.entries({tl:[-.5,-.5],tr:[.5,-.5],br:[.5,.5],bl:[-.5,.5],ml:[-.5,0],mr:[.5,0],mt:[0,-.5],mb:[0,.5]})){
  const store=new DocumentStore({...document,groups:undefined,objects:[{...source,textPath:undefined,textSkewXDeg:0,skewXDeg:23,mirrorX,mirrorY,textBox:{widthMm:65,heightMm:20,autoWidth:automatic,autoHeight:true}}]},measureFabric);
  const view=new FabricAdapter(window.document.createElement('canvas'),()=>0,()=>{});
  try{view.render(store.document);const box=view.canvas.getObjects()[0] as EditorTextBox,extra=box.strokeBoundsWidth(),anchor=textFramePoint(box,-x!,-y!),start=textFramePoint(box,x!,y!),matrix=box.calcTransformMatrix(),end=new Point(x!*(box.width+extra)+(x?Math.sign(x)*18:0),y!*(box.height+extra)+(y?Math.sign(y)*12:0)).transform(matrix);
   const transform={target:box,ex:start.x,ey:start.y,original:{left:box.left,top:box.top}} as unknown as Transform;box.controls[name]!.actionHandler!({shiftKey:true} as TPointerEvent,transform,end.x,end.y);const opposite=textFramePoint(box,-x!,-y!);if(opposite.distanceFrom(anchor)>1e-7)throw Error(JSON.stringify({name,mirrorX,mirrorY,automatic,anchor,opposite}));cases++;
  }finally{view.dispose();}
 }
 return cases;
}

/** Real Fabric corner/edge handlers plus the same validated commit used by UI.
 * The final frame must keep the opposite pointer anchor, including mirrors. */
export async function checkShapeTransformHandles(document:GraphicDocument){
 await loadFontAssets(document.fontAssets);await Promise.all(document.objects.filter(o=>o.type==='image').map(o=>prepareRasterSource(o.source)));let cases=0;
 for(const source of document.objects.filter(o=>['rect','image','circle','ellipse','path','bezier','vector'].includes(o.type)))for(const name of ['br','mr','mb']){
  let revision=0,committed:GraphicDocument|null=null;
  const view=new FabricAdapter(window.document.createElement('canvas'),()=>revision,()=>{},undefined,undefined,undefined,(id,args)=>{const store=new DocumentStore({...document,groups:undefined,objects:[source]},measureFabric,undefined,'admin');store.dispatch({schemaVersion:1,tool:'transformObject',objectId:id,expectedRevision:0,arguments:args},'manual');committed=store.document;revision++;});
  try{
   view.render({...document,groups:undefined,objects:[source]},[source.id]);const object=view.canvas.getObjects()[0]!,dim=object._getNonTransformedDimensions(),control=object.controls[name]!;
   const point=(x:number,y:number)=>new Point(x*dim.x,y*dim.y).transform(object.calcTransformMatrix()),anchor=point(-control.x,-control.y),start=point(control.x,control.y);
   const originX=control.x>0?'left':'center',originY=control.y>0?'top':'center';
   const transform={target:object,corner:name,action:name==='br'?'scale':name==='mr'?'scaleX':'scaleY',ex:start.x,ey:start.y,originX,originY,scaleX:object.scaleX,scaleY:object.scaleY,skewX:object.skewX,skewY:0,theta:object.angle*Math.PI/180,width:object.width,height:object.height,signX:1,signY:1,original:{left:object.left,top:object.top,scaleX:object.scaleX,scaleY:object.scaleY,originX:object.originX,originY:object.originY}} as unknown as Transform;
   view.canvas.fire('before:transform',{transform,e:new MouseEvent('mousedown')});const end=point(control.x*(name==='mb'?1:1.1),control.y*(name==='mr'?1:1.1));control.actionHandler!({shiftKey:false} as TPointerEvent,transform,end.x,end.y);object.setCoords();
   const preview=point(-control.x,-control.y); // dim is the original intrinsic frame; scales carry the gesture.
   if(preview.distanceFrom(anchor)>1e-6)throw Error(JSON.stringify({id:source.id,name,phase:'preview-anchor',anchor,preview}));
   view.canvas.fire('object:modified',{target:object,action:transform.action,transform});await new Promise<void>(resolve=>queueMicrotask(resolve));if(!committed)throw Error('Nessun comando geometrico');
   view.render(committed,[source.id]);const after=view.canvas.getObjects()[0]!,size=after._getNonTransformedDimensions(),opposite=new Point(-control.x*size.x,-control.y*size.y).transform(after.calcTransformMatrix());
   if(opposite.distanceFrom(anchor)>1e-6)throw Error(JSON.stringify({id:source.id,name,phase:'commit-anchor',anchor,opposite}));cases++;
  }finally{view.dispose();}
 }
 return cases;
}

export async function checkRestoredImageControls(document:GraphicDocument){
 const source=document.objects.find(o=>o.type==='image');if(!source)throw Error('Fixture immagine');await prepareRasterSource(source.source);
 const view=new FabricAdapter(window.document.createElement('canvas'),()=>0,()=>{});
 try{view.render({...document,groups:undefined,objects:[source]},[source.id]);view.setRasterCropFocus(source.id,true);view.canvas.renderAll();view.setRasterCropFocus(null);const object=view.canvas.getActiveObject()!;const missing=Object.entries(object.controls).filter(([key,control])=>control.getVisibility(object,key)&&!object.oCoords[key]).map(([key])=>key);if(missing.length)throw Error('Coordinate maniglie mancanti dopo uscita ritaglio: '+missing.join(', '));view.canvas.renderAll();return Object.keys(object.controls).length;}finally{view.dispose();}
}
