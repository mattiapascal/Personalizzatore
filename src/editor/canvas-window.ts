import {CANVAS_BITMAP_LIMITS} from './canvas-size';
export interface CssRect{x:number;y:number;width:number;height:number;}
export interface CanvasWindow{paperWidth:number;paperHeight:number;x:number;y:number;width:number;height:number;windowed:boolean;}
function finitePositive(...values:number[]){return values.every(n=>Number.isFinite(n)&&n>0);}
/** Independent of document geometry and zoom. Fractional/sub-unit density is
 * supported by our canvas DOM manager, never by changing physical coordinates. */
export function boundedBackingDensity(width:number,height:number,requested:number):number{
 if(![width,height].every(n=>Number.isFinite(n)&&n>=0)||!finitePositive(requested))throw Error('Superficie canvas non valida');
 const side=Math.max(width,height),area=width*height;
 return Math.min(requested,side?CANVAS_BITMAP_LIMITS.side/side:requested,area?Math.sqrt(CANVAS_BITMAP_LIMITS.pixels/area):requested);
}
/** Keep legacy small-paper rendering exactly as it was. The logical paper can
 * be much larger than the bounded backing surface without allocating its pixels. */
export function canvasWindow(paper:{width:number;height:number},viewport:CssRect,retina:number,padding=128):CanvasWindow{
 if(!finitePositive(paper.width,paper.height,viewport.width,viewport.height,retina)||![viewport.x,viewport.y,padding].every(Number.isFinite)||padding<0)throw Error('Vista canvas non valida');
 const base={paperWidth:paper.width,paperHeight:paper.height};
 if(boundedBackingDensity(paper.width,paper.height,retina)>=retina)return{...base,x:0,y:0,width:paper.width,height:paper.height,windowed:false};
 const left=Math.max(0,viewport.x),top=Math.max(0,viewport.y),right=Math.min(paper.width,viewport.x+viewport.width),bottom=Math.min(paper.height,viewport.y+viewport.height);
 if(right<=left||bottom<=top)return{...base,x:Math.floor(Math.max(0,Math.min(paper.width-1,viewport.x))),y:Math.floor(Math.max(0,Math.min(paper.height-1,viewport.y))),width:1,height:1,windowed:true};
 const x=Math.floor(Math.max(0,left-padding)),y=Math.floor(Math.max(0,top-padding)),endX=Math.ceil(Math.min(paper.width,right+padding)),endY=Math.ceil(Math.min(paper.height,bottom+padding));
 return{...base,x,y,width:Math.max(1,endX-x),height:Math.max(1,endY-y),windowed:true};
}
export function sameCanvasWindow(a:CanvasWindow|null,b:CanvasWindow):boolean{return !!a&&Object.keys(b).every(key=>a[key as keyof CanvasWindow]===b[key as keyof CanvasWindow]);}
/** Retain an overscanned backing during small pans. Crossing the inner margin
 * replans it before any visible part of the page can expose missing pixels. */
export function canvasWindowContains(window:CanvasWindow,viewport:CssRect,margin=32):boolean{
 const left=Math.max(0,viewport.x),top=Math.max(0,viewport.y),right=Math.min(window.paperWidth,viewport.x+viewport.width),bottom=Math.min(window.paperHeight,viewport.y+viewport.height);
 return window.windowed&&right>left&&bottom>top&&left>=window.x+(window.x>0?margin:0)&&top>=window.y+(window.y>0?margin:0)&&right<=window.x+window.width-(window.x+window.width<window.paperWidth?margin:0)&&bottom<=window.y+window.height-(window.y+window.height<window.paperHeight?margin:0);
}
