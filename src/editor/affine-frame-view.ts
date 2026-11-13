import {Point,Control,util,type FabricObject,type Transform} from 'fabric';
import {physicalTextSkew,fabricTextSkew} from './text-skew';

/** Fabric's default aCoords first boxes a shear, then rotates that box. Keep
 * actual frame corners for layout, grouping, hit tests and drag commits. */
export function affineFrameView(object:FabricObject,resize=true):void{
 object.calcACoords=function(){
  const dim=this._getNonTransformedDimensions(),matrix=this.calcOwnMatrix(),point=(x:number,y:number)=>new Point(x*dim.x,y*dim.y).transform(matrix);
  return{tl:point(-.5,-.5),tr:point(.5,-.5),br:point(.5,.5),bl:point(-.5,.5)};
 };
 object.controls={...object.controls};
 for(const name of ['tl','tr','br','bl','ml','mr','mt','mb']){
  const original=object.controls[name];if(!original)continue;
  let gesture:Transform|undefined,anchor=new Point(),inverse=util.invertTransform(object.calcTransformMatrix()),baseX=object.scaleX,baseY=object.scaleY,width=object.width,height=object.height,skew=0;
  object.controls[name]=new Control({...original,positionHandler:(_dim,_matrix,target,control)=>{
   const dim=target._getNonTransformedDimensions();return new Point(control.x*dim.x,control.y*dim.y).transform(target.calcTransformMatrix()).transform(target.getViewportTransform());
  },...(resize?{actionHandler:(event,transform,px,py)=>{
   const target=transform.target,x=original.x,y=original.y;
   if(gesture!==transform){gesture=transform;const dim=target._getNonTransformedDimensions();width=dim.x;height=dim.y;baseX=target.scaleX;baseY=target.scaleY;skew=physicalTextSkew(target.skewX,baseX*(target.flipX?-1:1),baseY*(target.flipY?-1:1));const matrix=target.calcTransformMatrix();inverse=util.invertTransform(matrix);anchor=new Point(-x*width,-y*height).transform(matrix);}
   const delta=new Point(px-transform.ex,py-transform.ey).transform(inverse,true),proportional=!!x&&!!y&&!event.shiftKey;
   const factor=proportional?Math.max(.001,1+(Math.sign(x)*delta.x+Math.sign(y)*delta.y)/(width+height)):1;
   const sx=target.lockScalingX?baseX:baseX*(proportional?factor:x?Math.max(.001,1+Math.sign(x)*delta.x/width):1),sy=target.lockScalingY?baseY:baseY*(proportional?factor:y?Math.max(.001,1+Math.sign(y)*delta.y/height):1);
   target.set({scaleX:sx,scaleY:sy,skewX:fabricTextSkew(skew,sx*(target.flipX?-1:1),sy*(target.flipY?-1:1))});
   const opposite=new Point(-x*width,-y*height).transform(target.calcTransformMatrix()),correction=anchor.subtract(opposite),local=target.group?correction.transform(util.invertTransform(target.group.calcTransformMatrix()),true):correction;
   target.set({left:target.left+local.x,top:target.top+local.y});target.setCoords();return true;
  }}:{})});
 }
 const native=object.drawBorders;
 object.drawBorders=function(context,options,style){
  if(!this.skewX||style?.forActiveSelection){native.call(this,context,options,style);return;}
  const dim=this._getNonTransformedDimensions(),k=Math.tan(options.skewX*Math.PI/180);
  context.save();context.strokeStyle=style?.borderColor??this.borderColor;context.setLineDash(style?.borderDashArray??this.borderDashArray??[]);context.beginPath();
  for(const [index,[x,y]]of [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].entries()){const px=options.scaleX*(x!*dim.x+k*y!*dim.y),py=options.scaleY*y!*dim.y;if(index)context.lineTo(px,py);else context.moveTo(px,py);}
  context.closePath();context.stroke();context.restore();
 };
}
