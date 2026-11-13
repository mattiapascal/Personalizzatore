import { StaticCanvas,config,Color } from 'fabric';
import { SceneObjectSchema } from './model';
import { FontAssetsSchema } from './font-assets';
import { assertFontGeometry } from './verified-font-geometry';
import { loadFontAssets } from './fonts';
import { textMaskInspectionView } from './fabric-adapter';
import { textClipCommands } from './text-clip-masks';
import { compareTextMaskAlpha,type TextMaskInkInput,type TextMaskInkResult } from './text-mask-ink';
import { baseCharacterStyle,characterStyles } from './text-style';

export const TEXT_MASK_INSPECTION_LIMITS={scale:2,side:4096,pixels:2_000_000}as const;
function expectsInk(object:TextMaskInkInput['object']):boolean{
 const base=baseCharacterStyle(object),styles=characterStyles(object);
 return Array.from(object.text).some((character,index)=>{const style={...base,...styles[index]},glyph=!/[\s\p{Cf}\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/u.test(character),decoration=character!=='\n'&&(style.underline||style.overline||style.linethrough);return style.fillOpacity>0&&(glyph||decoration)||glyph&&style.stroke!=='none'&&style.strokeMm>0&&style.strokeOpacity>0;});
}
/** Actual glyph/decoration bounds, not the advance box: script fonts may have
 * long overhangs. Trace native text calls without painting or allocating a page. */
function inkBounds(view:ReturnType<typeof textMaskInspectionView>){
 const tiny=document.createElement('canvas');tiny.width=tiny.height=1;const context=tiny.getContext('2d')!;
 context.fillStyle=typeof view.fill==='string'?view.fill:'transparent';context.strokeStyle=typeof view.stroke==='string'?view.stroke:'transparent';context.lineWidth=view.strokeWidth;context.lineJoin=view.strokeLineJoin;context.miterLimit=view.strokeMiterLimit;context.lineCap=view.strokeLineCap;
 let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity,valid=true;
 const alpha=new Map<string,number>(),painted=(stroke:boolean)=>{const paint=stroke?context.strokeStyle:context.fillStyle;if(typeof paint!=='string')return true;let value=alpha.get(paint);if(value===undefined){value=new Color(paint).getAlpha();alpha.set(paint,value);}return value*context.globalAlpha>0;};
 const add=(x:number,y:number,w:number,h:number,padding=0)=>{if(![x,y,w,h,padding].every(Number.isFinite)){valid=false;return;}if(!w&&!h)return;const m=context.getTransform();for(const px of[x-padding,x+w+padding])for(const py of[y-padding,y+h+padding]){const point=new DOMPoint(px,py).matrixTransform(m);left=Math.min(left,point.x);right=Math.max(right,point.x);top=Math.min(top,point.y);bottom=Math.max(bottom,point.y);}};
 const text=(value:string,x:number,y:number,stroke:boolean)=>{if(!painted(stroke))return;const m=context.measureText(value),pad=stroke?context.lineWidth/2*(context.lineJoin==='miter'?Math.max(1,context.miterLimit):1):0;add(x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxAscent,m.actualBoundingBoxLeft+m.actualBoundingBoxRight,m.actualBoundingBoxAscent+m.actualBoundingBoxDescent,pad);};
 context.fillText=(value,x,y)=>text(value,x,y,false);context.strokeText=(value,x,y)=>text(value,x,y,true);
 context.fillRect=(x,y,w,h)=>{if(painted(false))add(Math.min(x,x+w),Math.min(y,y+h),Math.abs(w),Math.abs(h));};
 try{view._render(context);}finally{tiny.width=tiny.height=1;}
 if(!valid)throw Error('Le misure visive del font non sono disponibili: verifica questo testo nel canvas.');
 if(view.frame&&!view.frame.autoWidth){const extra=view.strokeBoundsWidth();left=Math.max(left,-(view.width+extra)/2);right=Math.min(right,(view.width+extra)/2);top=Math.max(top,-(view.height+extra)/2);bottom=Math.min(bottom,(view.height+extra)/2);}
 return{left,top,right,bottom};
}
/** One native glyph painting, clipped separately with Canvas2D paths. No SVG
 * rasterization, whole-page bitmap, native mask-cache aliasing or document edit. */
export async function inspectTextMaskInk(input:TextMaskInkInput):Promise<TextMaskInkResult>{
 const object=SceneObjectSchema.parse(input.object);if(object.type!=='text'||!object.textClipMasks?.length)return{status:'unavailable',message:'Questo testo non ha una maschera da controllare'};
 const fonts=FontAssetsSchema.parse(input.fonts),ids=new Set([object.fontFamily,...object.characterStyles?.flatMap(run=>run.style.fontFamily?[run.style.fontFamily]:[])??[]]);
 if([...ids].some(id=>!fonts.some(asset=>asset.id===id)))return{status:'unavailable',message:'Completa i font di questo testo prima del controllo della maschera.'};
 await assertFontGeometry({objects:[object],fontAssets:fonts});await loadFontAssets(fonts);
 if(!expectsInk(object))return{status:'clear',inkPixels:0,hiddenPixels:0,fullyHidden:false};
 const view=textMaskInspectionView(object),limits=TEXT_MASK_INSPECTION_LIMITS;
 try{
  const bounds=inkBounds(view);if(!(bounds.right>bounds.left&&bounds.bottom>bounds.top))return expectsInk(object)?{status:'limited',message:'Il disegno di questo testo non è rilevabile automaticamente: controllalo nel canvas.'}:{status:'clear',inkPixels:0,hiddenPixels:0,fullyHidden:false};
  const width=Math.ceil((bounds.right-bounds.left)*limits.scale)+16,height=Math.ceil((bounds.bottom-bounds.top)*limits.scale)+16,tx=8-bounds.left*limits.scale,ty=8-bounds.top*limits.scale;
  if(!Number.isFinite(width)||!Number.isFinite(height)||width>limits.side||height>limits.side||width*height>limits.pixels)return{status:'limited',message:'Verifica visivamente questo testo ingrandendo il canvas: l’ingombro supera il controllo automatico.'};
  if(view.clipPath){const extra=view.strokeBoundsWidth(),w=Math.max(config.minCacheSideLimit,(view.width+extra)*limits.scale+16),h=Math.max(config.minCacheSideLimit,(view.height+extra)*limits.scale+16);if(w>config.maxCacheSideLimit||h>config.maxCacheSideLimit||w*h>Math.min(limits.pixels,config.perfLimitSizeTotal))return{status:'limited',message:'Il box richiede un controllo visivo: verifica il testo ingrandendo il canvas.'};}
  const plain=document.createElement('canvas'),masked=document.createElement('canvas'),host=new StaticCanvas(document.createElement('canvas'),{width:1,height:1,enableRetinaScaling:false,renderOnAddRemove:false,skipOffscreen:false});plain.width=masked.width=width;plain.height=masked.height=height;
  try{
   host.setViewportTransform([limits.scale,0,0,limits.scale,0,0]);host.add(view);
   const context=plain.getContext('2d',{willReadFrequently:true}),clipped=masked.getContext('2d',{willReadFrequently:true});if(!context||!clipped)throw Error('Controllo grafico del testo non disponibile');
   context.setTransform(limits.scale,0,0,limits.scale,tx,ty);view.render(context);
   clipped.setTransform(limits.scale,0,0,limits.scale,tx,ty);
   for(const mask of object.textClipMasks){const path=new Path2D(textClipCommands(mask,8).map(command=>command.join(' ')).join(' '));clipped.clip(path,mask.fillRule);}
   clipped.setTransform(1,0,0,1,0,0);clipped.drawImage(plain,0,0);
   const result=compareTextMaskAlpha(context.getImageData(0,0,width,height).data,clipped.getImageData(0,0,width,height).data);
   return !result.inkPixels&&expectsInk(object)?{status:'limited',message:'Il testo è troppo fine per questo controllo automatico: verificalo ingrandendo il canvas.'}:result;
  }finally{host.remove(view);plain.width=plain.height=masked.width=masked.height=1;await host.dispose();}
 }finally{view.dispose();}
}
