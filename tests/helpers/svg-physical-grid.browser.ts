import {boxSampleRgba} from '../../src/editor/pixel-sampling';
export function physicalPixelGrid(area:{width:number;height:number},pixelsPerMm:number,samples=4){
 if(![area.width,area.height,pixelsPerMm].every(v=>Number.isFinite(v)&&v>0)||![1,2,4,8].includes(samples))throw Error('Griglia fisica TEST non valida');
 const width=Math.ceil(area.width*pixelsPerMm),height=Math.ceil(area.height*pixelsPerMm),sampleWidth=width*samples,sampleHeight=height*samples;
 if(!Number.isSafeInteger(sampleWidth)||!Number.isSafeInteger(sampleHeight)||sampleWidth>8192||sampleHeight>8192||sampleWidth*sampleHeight>64*1024*1024)throw Error('Griglia fisica TEST oltre budget');
 return{area:{...area},pixelsPerMm,samples,width,height,sampleWidth,sampleHeight,viewportWidth:area.width*pixelsPerMm*samples,viewportHeight:area.height*pixelsPerMm*samples};
}
export type PhysicalPixelGrid=ReturnType<typeof physicalPixelGrid>;
/** Explicit integer outer viewport prevents HTMLImageElement's natural-size
 * rounding of mm SVGs. The original inner viewBox/aspect policy stays intact.
 * Fractional page edges are padded, never independently stretched or cropped. */
export function svgOnPhysicalGrid(source:string,grid:PhysicalPixelGrid):string{
 const xml=new DOMParser().parseFromString(source,'image/svg+xml'),root=xml.documentElement,ns='http://www.w3.org/2000/svg';
 if(root.localName!=='svg'||root.namespaceURI!==ns||xml.querySelector('parsererror'))throw Error('SVG TEST non valido');
 for(const[key,expected]of[['width',grid.area.width],['height',grid.area.height]]as const){const raw=root.getAttribute(key),value=raw?.match(/^(\d+(?:\.\d+)?(?:e[+-]?\d+)?)mm$/i);if(!value||Math.abs(Number(value[1])-expected)>1e-8)throw Error('Misure fisiche SVG diverse dalla griglia');}
 const viewBox=root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
 if(!viewBox||viewBox.length!==4||!viewBox.every(Number.isFinite)||viewBox[2]!<=0||viewBox[3]!<=0||['width','height','x','y'].some(key=>root.style.getPropertyValue(key)))throw Error('Viewport SVG TEST non verificabile');
 const outer=xml.createElementNS(ns,'svg');outer.setAttribute('width',String(grid.sampleWidth));outer.setAttribute('height',String(grid.sampleHeight));outer.setAttribute('viewBox',`0 0 ${grid.sampleWidth} ${grid.sampleHeight}`);
 root.setAttribute('x','0');root.setAttribute('y','0');root.setAttribute('width',String(grid.viewportWidth));root.setAttribute('height',String(grid.viewportHeight));outer.append(root);
 return new XMLSerializer().serializeToString(outer);
}
export async function svgPhysicalPixels(source:string,grid:PhysicalPixelGrid){
 const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgOnPhysicalGrid(source,grid));await image.decode();
 const canvas=document.createElement('canvas');canvas.width=grid.sampleWidth;canvas.height=grid.sampleHeight;const context=canvas.getContext('2d')!;context.fillStyle='white';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0);
 const pixels=boxSampleRgba(context.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height,grid.samples);canvas.width=canvas.height=1;return pixels;
}
export function physicalPixelDifference(a:Uint8ClampedArray,b:Uint8ClampedArray){
 if(!a.length||a.length!==b.length||a.length%4)throw Error('Campioni TEST non confrontabili');let different=0,ink=0,error=0;
 for(let i=0;i<a.length;i+=4){const delta=Math.max(Math.abs(a[i]!-b[i]!),Math.abs(a[i+1]!-b[i+1]!),Math.abs(a[i+2]!-b[i+2]!));if(Math.min(a[i]!,a[i+1]!,a[i+2]!,b[i]!,b[i+1]!,b[i+2]!)<245)ink++;if(delta>24)different++;error+=delta;}
 return{different,ink,ratio:different/Math.max(1,ink),meanChannelError:error/(a.length/4)};
}
