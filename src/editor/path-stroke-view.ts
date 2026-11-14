import {Point,type FabricObject} from 'fabric';
/** Change only the symmetric control frame; the native path and its coordinate
 * plane stay intact. Fabric applies the same scaling/skew to these dimensions. */
export function pathStrokeFrameView(view:FabricObject,frame:{widthMm:number;heightMm:number}):void{
 const dimensions=view._getNonTransformedDimensions(),dx=Math.max(0,frame.widthMm*8-dimensions.x),dy=Math.max(0,frame.heightMm*8-dimensions.y),native=view._getTransformedDimensions;
 view._getNonTransformedDimensions=function(){return new Point(this.width+this.strokeWidth+dx,this.height+this.strokeWidth+dy);};
 view._getTransformedDimensions=function(options={}){return native.call(this,{...options,width:(options.width??this.width)+dx,height:(options.height??this.height)+dy});};
}
