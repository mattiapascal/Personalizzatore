import{checkedRasterCrop}from'./raster-geometry';
import{cloneSceneObject,objectCenter,placeObjectAtCenter,type SceneObject,type Measure}from'./model';
import{transformSelection}from'./selection';import{resizeTextHeight}from'./text-sizing';
/** Inspector geometry uses the centre; graphic handles keep their opposite anchor. */
export function resizeObjectDimension(source:SceneObject,axis:'width'|'height',value:number,linked:boolean,measure:Measure):SceneObject{
 if(!Number.isFinite(value)||value<=0)throw Error('La misura deve essere positiva');const object=cloneSceneObject(source),center=objectCenter(source,measure);if(object.type==='qr')linked=true;
 if(object.type==='text'){
  const measured=measure(source),width=measured.textLayoutWidthMm??measured.widthMm,height=measured.textLayoutHeightMm??measured.heightMm;
  if(linked||object.textPath){const normalized=object.textScaleY&&object.textScaleY!==1?resizeTextHeight(object,height,measure):object,result=transformSelection([normalized],{scale:value/(axis==='width'?width:height),rotationDeg:0,center},measure)[0]!;if(result.type==='text')result.textScaleY=1;return result;}
  if(axis==='height')return resizeTextHeight(object,value,measure);
  if(object.textBox?.autoWidth===false)object.textBox.widthMm=value;
  else{object.textScaleX=(object.textScaleX??1)*value/width;if(object.textBox)object.textBox.widthMm=value;}
 }else if(object.type==='ellipse'){
  const factor=value/(2*(axis==='width'?object.rxMm:object.ryMm));if(axis==='width'||linked)object.rxMm*=factor;if(axis==='height'||linked)object.ryMm*=factor;
 }else if(object.type==='circle')object.radiusMm=value/2;
 else if(object.type==='line')object.lengthMm=value;
 else{const factor=value/(axis==='width'?object.widthMm:object.heightMm);if(!Number.isFinite(factor))throw Error('Un asse degenere non può essere ridimensionato');if(axis==='width'||linked)object.widthMm*=factor;if(axis==='height'||linked)object.heightMm*=factor;}
 if(object.type==='image'&&!linked){const crop=checkedRasterCrop(object.source,object.crop);object.pixelAspectRatio=object.widthMm*crop.heightPx/(object.heightMm*crop.widthPx);}
 return placeObjectAtCenter(object,center,measure);
}
