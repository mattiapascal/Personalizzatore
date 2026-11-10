import { z } from 'zod';
export const InkColorSchema=z.enum(['black','blue','red','green','violet']);
export type InkColor=z.infer<typeof InkColorSchema>;
/** Demonstration preview colors. Not a catalogue of available pad SKUs or measured ink samples. */
export const INK_PREVIEWS:Record<InkColor,{label:string;hex:string}>={black:{label:'Nero',hex:'#000000'},blue:{label:'Blu',hex:'#0000cc'},red:{label:'Rosso',hex:'#cc0000'},green:{label:'Verde',hex:'#008000'},violet:{label:'Viola',hex:'#800080'}};
export function inkChannels(color:InkColor):[number,number,number]{const hex=INK_PREVIEWS[color].hex;return[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];}
/** Color only the monochromatic positive artwork; white/alpha remain unchanged. */
export function tintImprintPixels(pixels:Uint8ClampedArray,color:InkColor):void{
 if(color==='black')return;const ink=inkChannels(color);
 for(let at=0;at<pixels.length;at+=4){if(pixels[at]!==pixels[at+1]||pixels[at]!==pixels[at+2])continue;const gray=pixels[at]!/255;for(let channel=0;channel<3;channel++)pixels[at+channel]=Math.round(ink[channel]!+(255-ink[channel]!)*gray);}
}
