import{Path,Rect,type FabricObject}from'fabric';
import{clipMaskCommands,type ClipMask}from'./clip-masks';import{vectorBounds,type VectorCommand}from'./vector-geometry';
let svgMaskId=0;
const pathData=(commands:readonly VectorCommand[])=>commands.map(c=>c.join(' ')).join(' ');
/** Fabric renders intersecting clip chains; explicit SVG wrappers also retain
 * every intersection because nested clip export is not sufficient by itself. */
export function applyClipMasks(object:FabricObject,masks:readonly ClipMask[]):void{
 const width=object.width,height=object.height,previous=object.clipPath,layers=masks.map(mask=>({mask,commands:clipMaskCommands(mask,width,height)}));
 if(previous&&!(previous instanceof Rect))throw Error('Maschera preesistente non rappresentabile');
 const oldMarkup=previous?`<rect x="${previous.left-previous.width/2}" y="${previous.top-previous.height/2}" width="${previous.width}" height="${previous.height}"/>`:undefined;
 let parent:FabricObject|undefined=previous,parentCenter={x:previous?.left??0,y:previous?.top??0};
 for(const layer of layers){const box=vectorBounds(layer.commands),center={x:box.x+box.width/2,y:box.y+box.height/2},clip=new Path(layer.commands,{left:center.x,top:center.y,originX:'center',originY:'center',fill:'#000000',strokeWidth:0,fillRule:layer.mask.fillRule,objectCaching:false});if(parent){clip.set({left:center.x-parentCenter.x,top:center.y-parentCenter.y});parent.clipPath=clip;}else object.clipPath=clip;parent=clip;parentCenter=center;}
 const original=object.toSVG;
 object.toSVG=function(reviver){const clipping=this.clipPath;let svg:string;this.clipPath=undefined;try{svg=original.call(this,reviver);}finally{this.clipPath=clipping;}
  const matrix=this.calcOwnMatrix().join(' '),definitions:string[]=[],references:string[]=[];
  const add=(geometry:string)=>{const id=`editor-mask-${++svgMaskId}`;definitions.push(`<clipPath id="${id}" clipPathUnits="userSpaceOnUse">${geometry.replace(/^<(path|rect)\b/,`<$1 transform="matrix(${matrix})"`)}</clipPath>`);references.push(id);};
  if(oldMarkup)add(oldMarkup);for(const layer of layers)add(`<path d="${pathData(layer.commands)}" clip-rule="${layer.mask.fillRule}" fill-rule="${layer.mask.fillRule}"/>`);
  for(const id of references)svg=`<g clip-path="url(#${id})">${svg}</g>`;return`<defs>${definitions.join('')}</defs>${svg}`;
 };
}
