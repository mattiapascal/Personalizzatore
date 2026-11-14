import type {GraphicDocument} from '../../src/editor/model';
import {boundedBackingDensity} from '../../src/editor/canvas-window';
import {config} from 'fabric';

/** Independent Canvas2D drawing of one canonical rectangle. The camera is
 * read from the DOM; no Fabric object geometry or rendering is reused. */
export function compareViewportRectangle(doc:GraphicDocument){
 const wrapper=document.querySelector<HTMLElement>('.canvas-container')!,actual=wrapper.querySelector<HTMLCanvasElement>('.lower-canvas')!,w=parseFloat(actual.style.width),h=parseFloat(actual.style.height),density=boundedBackingDensity(w,h,config.devicePixelRatio),zoom=parseFloat(wrapper.style.width)/(doc.areaMm.width*8),ox=Number(wrapper.dataset.canvasOriginX),oy=Number(wrapper.dataset.canvasOriginY);
 const reference=document.createElement('canvas');reference.width=actual.width;reference.height=actual.height;const ctx=reference.getContext('2d')!;ctx.setTransform(density*zoom,0,0,density*zoom,-density*ox,-density*oy);
 ctx.beginPath();if(doc.shape==='round')ctx.arc(doc.areaMm.width*4,doc.areaMm.height*4,doc.areaMm.width*4,0,2*Math.PI);else ctx.rect(0,0,doc.areaMm.width*8,doc.areaMm.height*8);ctx.fillStyle=doc.paperColor??'#ffffff';ctx.fill();ctx.clip();
 for(const o of doc.objects){if(o.type!=='rect'||o.stroke!=='none'||o.rotationDeg||o.skewXDeg)throw Error('Riferimento limitato a rettangoli semplici senza contorno');ctx.fillStyle=o.fill!;ctx.fillRect(o.xMm*8,o.yMm*8,o.widthMm*8,o.heightMm*8);}
 const a=actual.getContext('2d')!.getImageData(0,0,actual.width,actual.height).data,b=ctx.getImageData(0,0,actual.width,actual.height).data;let differing=0,error=0,ink=0;
 for(let p=0;p<a.length;p+=4){let delta=Math.abs(a[p+3]!-b[p+3]!);for(let c=0;c<3;c++)delta+=Math.abs(a[p+c]!*a[p+3]!/255-b[p+c]!*b[p+3]!/255);if(delta>4)differing++;error+=delta;if(b[p+3]!>0&&(b[p]!<250||b[p+1]!<250||b[p+2]!<250))ink++;}
 return{ratio:differing/(a.length/4),mean:error/a.length,ink,width:actual.width,height:actual.height,density,origin:{x:ox,y:oy}};
}
