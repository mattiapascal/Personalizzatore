import {Canvas,util,type FabricObject,type TPointerEvent} from 'fabric';
import {boundedBackingDensity} from './canvas-window';
import {CANVAS_BITMAP_LIMITS} from './canvas-size';
interface Paper{width:number;height:number;round:boolean;}
/** Fabric's native manager skips scaling below DPR 1 and can allocate a large
 * intermediate width*oldHeight. Keep this adaptation local to the editor. */
export class WindowCanvas extends Canvas{
 declare private backingDensity:number|undefined;
 declare private targetSurfaceReady:boolean|undefined;
 windowPaper:Paper|null=null;
 requestedRetina():number{return super.getRetinaScaling();}
 override getRetinaScaling():number{return this.backingDensity??super.getRetinaScaling();}
 protected override _createCacheCanvas(){super._createCacheCanvas();this.targetSurfaceReady=true;}
 protected override _setDimensionsImpl(dimensions:Parameters<Canvas['_setDimensionsImpl']>[0],options:Parameters<Canvas['_setDimensionsImpl']>[1]={}){
  const previous=this.backingDensity;
  if(!options.cssOnly)this.backingDensity=boundedBackingDensity(Number(dimensions.width??this.width??0),Number(dimensions.height??this.height??0),super.getRetinaScaling());
  const elements=this.elements,native=elements.setDimensions;
  elements.setDimensions=(size,retina)=>{
   const width=Math.floor(size.width*retina),height=Math.floor(size.height*retina);
   if(width>CANVAS_BITMAP_LIMITS.side||height>CANVAS_BITMAP_LIMITS.side||width*height>CANVAS_BITMAP_LIMITS.pixels)throw Error('Superficie canvas oltre il budget');
   for(const{el,ctx}of[elements.lower,elements.upper]){
    if(width*el.height>CANVAS_BITMAP_LIMITS.pixels||el.width*height>CANVAS_BITMAP_LIMITS.pixels){el.width=0;el.height=0;}
    el.width=width;el.height=height;ctx.scale(retina,retina);
   }
  };
  try{super._setDimensionsImpl(dimensions,options);}finally{elements.setDimensions=native;}
  if(this.targetSurfaceReady&&previous!==this.backingDensity)this.setTargetFindTolerance(this.targetFindTolerance??0);
 }
 protected override _getPointerImpl(event:TPointerEvent,fromViewport=false){
  // The bitmap is floored to integer pixels even on small paper. Compensate
  // that rounding before applying the camera, regardless of viewport mode.
  const point=super._getPointerImpl(event,true),retina=this.getRetinaScaling(),element=this.upperCanvasEl;
  point.x*=this.width*retina/Math.max(1,element.width);point.y*=this.height*retina/Math.max(1,element.height);
  return fromViewport?point:point.transform(util.invertTransform(this.viewportTransform));
 }
 private paperPath(context:CanvasRenderingContext2D){const paper=this.windowPaper!;context.beginPath();if(paper.round)context.arc(paper.width/2,paper.height/2,paper.width/2,0,Math.PI*2);else context.rect(0,0,paper.width,paper.height);}
 override _renderBackground(context:CanvasRenderingContext2D){
  if(!this.windowPaper){super._renderBackground(context);return;}
  if(!this.backgroundColor)return;
  context.save();context.transform(...this.viewportTransform);this.paperPath(context);context.fillStyle=typeof this.backgroundColor==='string'?this.backgroundColor:'#ffffff';context.fill();context.restore();
 }
 override _renderObjects(context:CanvasRenderingContext2D,objects:FabricObject[]){
  if(!this.windowPaper){super._renderObjects(context,objects);return;}
  context.save();this.paperPath(context);context.clip();super._renderObjects(context,objects);context.restore();
 }
}
