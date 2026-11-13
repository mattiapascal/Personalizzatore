import{Path,Rect,type FabricObject}from'fabric';
import{clipMaskCommands,type ClipMask}from'./clip-masks';import{vectorBounds,type VectorCommand}from'./vector-geometry';
let svgMaskId=0;
const pathData=(commands:readonly VectorCommand[])=>commands.map(c=>c.join(' ')).join(' ');
export interface ClipGeometry{commands:VectorCommand[];fillRule:'nonzero'|'evenodd';}
interface ClipView{original:FabricObject['toSVG'];layers:ClipGeometry[];frameMarkup?:string;}
const views=new WeakMap<FabricObject,ClipView>();
/** Refreshable local clip geometry. Text relayout must replace the clip chain,
 * not append another SVG wrapper or retain an obsolete wrapping rectangle. */
export function setClipGeometry(object:FabricObject,layers:ClipGeometry[],frame?:Rect):void{
 let state=views.get(object);object.clipPath=frame;object.set('dirty',true);
 if(!layers.length){if(state){object.toSVG=state.original;views.delete(object);}return;}
 if(!state){state={original:object.toSVG,layers:[]};views.set(object,state);
  object.toSVG=function(reviver){const state=views.get(this)!;const clipping=this.clipPath;let svg:string;this.clipPath=undefined;try{svg=state.original.call(this,reviver);}finally{this.clipPath=clipping;}
   const matrix=this.calcOwnMatrix().join(' '),definitions:string[]=[],references:string[]=[];
   const add=(geometry:string)=>{const id=`editor-mask-${++svgMaskId}`;definitions.push(`<clipPath id="${id}" clipPathUnits="userSpaceOnUse">${geometry.replace(/^<(path|rect)\b/,`<$1 transform="matrix(${matrix})"`)}</clipPath>`);references.push(id);};
   if(state.frameMarkup)add(state.frameMarkup);for(const layer of state.layers)add(`<path d="${pathData(layer.commands)}" clip-rule="${layer.fillRule}" fill-rule="${layer.fillRule}"/>`);
   for(const id of references)svg=`<g clip-path="url(#${id})">${svg}</g>`;return`<defs>${definitions.join('')}</defs>${svg}`;
  };
 }
 state.layers=layers;state.frameMarkup=frame?`<rect x="${frame.left-frame.width/2}" y="${frame.top-frame.height/2}" width="${frame.width}" height="${frame.height}"/>`:undefined;
 let parent:FabricObject|undefined=frame,parentCenter={x:frame?.left??0,y:frame?.top??0};
 if(frame)frame.clipPath=undefined;
 for(const layer of layers){const box=vectorBounds(layer.commands),center={x:box.x+box.width/2,y:box.y+box.height/2},clip=new Path(layer.commands,{left:center.x,top:center.y,originX:'center',originY:'center',fill:'#000000',strokeWidth:0,fillRule:layer.fillRule,objectCaching:false});if(parent){clip.set({left:center.x-parentCenter.x,top:center.y-parentCenter.y});parent.clipPath=clip;}else object.clipPath=clip;parent=clip;parentCenter=center;}
}
/** Images/vectors retain their existing frame-relative mask contract. */
export function applyClipMasks(object:FabricObject,masks:readonly ClipMask[]):void{
 const previous=object.clipPath;if(previous&&!(previous instanceof Rect))throw Error('Maschera preesistente non rappresentabile');
 setClipGeometry(object,masks.map(mask=>({fillRule:mask.fillRule,commands:clipMaskCommands(mask,object.width,object.height)})),previous);
}
