import { Color } from 'fabric';
export type TextDecoration = 'underline' | 'overline' | 'linethrough';
export interface DecorationRect { x:number; y:number; width:number; height:number; fill:string; }

/** Capture the existing Canvas paint geometry. No font-metric approximation,
 * browser text-decoration inheritance, or second layout engine in SVG. */
export function decorationRects(draw: (context:CanvasRenderingContext2D)=>void):DecorationRect[] {
  const result:DecorationRect[]=[],recorder={fillStyle:'',fillRect(x:number,y:number,width:number,height:number){
    if(![x,y,width,height].every(Number.isFinite))throw Error('Decorazione del testo non finita');
    if(width&&height)result.push({x:width<0?x+width:x,y:height<0?y+height:y,width:Math.abs(width),height:Math.abs(height),fill:String(this.fillStyle)});
  }};
  draw(recorder as unknown as CanvasRenderingContext2D); return result;
}
export function decorationSvg(rectangles:DecorationRect[],decoration:TextDecoration):string {
  return rectangles.map(rect=>{
    const color=new Color(rect.fill);if(color.isUnrecognised)throw Error('Colore della decorazione non riconosciuto');
    return color.getAlpha()===0?'':`<rect data-editor-decoration="${decoration==='linethrough'?'line-through':decoration}" x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="#${color.toHex().toLowerCase()}" fill-opacity="${color.getAlpha()}" stroke="none"/>`;
  }).join('');
}
