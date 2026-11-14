import {objectIsVisible} from './scene-visibility';
import {cloneGraphicDocument,cloneSceneObject,type GraphicDocument} from './model';
import {effectiveObjectProperties,productionDocument} from './object-properties';
import {backgroundObjectIds} from './background';
import {plaqueMountingPoints} from './plaque';
export interface ReferenceLayers{artwork:GraphicDocument;background:GraphicDocument|null;foreground:GraphicDocument|null;foregroundGuideIds?:string[];}
export function boundReferenceTexts(document:GraphicDocument){return document.objects.filter(object=>object.type==='text'&&objectIsVisible(document,object)&&object.textPath?.showGuide&&object.textPath.originalPathMetadata?.editor?.reference);}
function subset(document:GraphicDocument,ids:Set<string>):GraphicDocument{
 const scene=cloneGraphicDocument(document);scene.objects=scene.objects.map(object=>({...object,editor:{...object.editor,reference:!ids.has(object.id)}}));scene.groups=scene.groups?.map(group=>({...group,editor:{...group.editor,reference:false}}));
 const output=productionDocument(scene);delete output.paperColor;delete output.productionProfile;delete output.shopSelection;output.colorMode='color';output.productId=output.variantId=output.catalogVersion=output.catalogProductProfileVersion=null;return output;
}
/** Single-page export projections only. The canonical references are never changed. */
export function referenceLayers(document:GraphicDocument):ReferenceLayers{
 if(document.otherPages)throw Error('Seleziona una pagina prima di preparare i livelli.');
 const references=document.objects.filter(object=>objectIsVisible(document,object)&&effectiveObjectProperties(document,object.id).reference),backgrounds=backgroundObjectIds(document),backIds=new Set(references.filter(object=>backgrounds.has(object.id)).map(object=>object.id)),frontIds=new Set(references.filter(object=>!backgrounds.has(object.id)).map(object=>object.id));
 const artwork=productionDocument(cloneGraphicDocument(document)),background=backIds.size?subset(document,backIds):null,foreground=subset(document,frontIds);
 // A physical support colour belongs below the technical reference image.
 if(background&&artwork.paperColor){background.paperColor=artwork.paperColor;delete artwork.paperColor;}
 const usedIds=new Set(foreground.objects.map(object=>object.id)),unique=(prefix:string)=>{let count=0,id=prefix;while(usedIds.has(id))id=`${prefix}-${++count}`;usedIds.add(id);return id;};
 const foregroundGuideIds:string[]=[];
 for(const source of boundReferenceTexts(document)){
  const copy=cloneSceneObject(source);copy.id=unique('reference-text-guide');copy.editor={...copy.editor,reference:false};copy.visible=true;
  foreground.objects.push(copy);foregroundGuideIds.push(copy.id);
 }
 if(document.plaque){const mounting=document.plaque;for(const point of plaqueMountingPoints(document.areaMm,mounting,document.shape)){
  // Without a configured hole diameter these are position symbols, not hardware dimensions.
  const radius=mounting.holeDiameterMm?mounting.holeDiameterMm/2:Math.min(document.areaMm.width,document.areaMm.height)/80,strokeMm=Math.min(.25,radius/3),base={xMm:point.xMm-radius,yMm:point.yMm-radius,radiusMm:radius,stroke:'#006b9d',strokeMm,fill:mounting.method==='holes'?'#ffffff':'#c4d9e3'};
  foreground.objects.push({id:unique('reference-mounting'),type:'circle',...base});
  if(mounting.method==='screws'){for(const sign of[-1,1]){const dx=radius*.6,dy=sign*dx;foreground.objects.push({id:unique('reference-screw'),type:'path',xMm:point.xMm-dx,yMm:point.yMm-Math.abs(dy),widthMm:2*dx,heightMm:2*Math.abs(dy),points:[{x:0,y:sign===1?0:1},{x:1,y:sign===1?1:0}],closed:false,stroke:'#006b9d',strokeMm,fill:'none'});}}
  else if(mounting.method.startsWith('spacer'))foreground.objects.push({id:unique('reference-spacer'),type:'circle',...base,xMm:point.xMm-radius*.45,yMm:point.yMm-radius*.45,radiusMm:radius*.45,fill:'none'});
 }}
 if(foreground.objects.length)foreground.colorMode='color';
 return{artwork,background,foreground:foreground.objects.length?foreground:null,...(foregroundGuideIds.length?{foregroundGuideIds}:{})};
}
export function hasReferenceLayers(document:GraphicDocument):boolean{return boundReferenceTexts(document).length>0||document.objects.some(object=>objectIsVisible(document,object)&&effectiveObjectProperties(document,object.id).reference)||!!document.plaque&&plaqueMountingPoints(document.areaMm,document.plaque,document.shape).length>0;}
