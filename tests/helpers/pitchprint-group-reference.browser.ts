import{legacyImageReferenceMarkup}from'./pitchprint-raster-reference.browser';
import {config,Group,IText,Textbox,Rect,Circle,Ellipse,Line,Path,Polygon,Polyline,FabricImage,StaticCanvas,type FabricObject} from 'fabric';
import {pitchprintFontRequest,fontNameKey} from '../../src/editor/pitchprint-fonts';
import {loadFontAssets,renderFontFamily,embedSvgFonts} from '../../src/editor/fonts';
import type {FontAsset} from '../../src/editor/font-assets';

/** Independent reference: let Fabric render the original relative coordinates.
 * Disable group relayout by installing the serialized child plane explicitly;
 * Fabric 7's automatic layout otherwise recentres legacy Fabric 3 groups. */
export async function pitchprintReferenceSvg(source:any,asset:FontAsset|FontAsset[],fontFor?:(raw:any)=>FontAsset):Promise<string>{
 const assets=Array.isArray(asset)?asset:[asset];await loadFontAssets(assets);
 const font=(raw:any)=>{if(fontFor)return fontFor(raw);if(!Array.isArray(asset))return asset;const request=pitchprintFontRequest(raw),found=assets.find(item=>fontNameKey(item.familyGroup??item.family)===fontNameKey(request.family)&&item.weight===request.weight&&item.italic===request.italic);if(!found)throw Error('File esatto del riferimento TEST mancante');return found;};
 const build=async(raw:any):Promise<FabricObject>=>{
  const {type,objects,...serialized}=raw;
  // Legacy Fabric 3/PitchPrint defaults differ from Fabric 7's centered origin.
  const options={originX:'left' as const,originY:'top' as const,...serialized};
  if(raw.type==='group'){
   const group=new Group([],{...options}),children=await Promise.all(objects.map(build));Object.assign(group,{_objects:children});for(const child of children)group.enterGroup(child,false);return group;
  }
  if(['text','i-text','textbox'].includes(type)){
   const styles=structuredClone(raw.styles??{});for(const row of Object.values(styles) as any[])for(const style of Object.values(row) as any[])if(['fontFamily','fontWeight','fontStyle'].some(key=>style[key]!==undefined)){style.fontFamily=renderFontFamily(font({...raw,...style}).id);style.fontWeight=style.fontStyle='normal';}
   const textOptions={...options,styles,fontFamily:renderFontFamily(font(raw).id),fontWeight:'normal',fontStyle:'normal' as const,stroke:raw.stroke??null,strokeWidth:raw.strokeWidth??(raw.stroke?1:0)};return type==='textbox'?new Textbox(raw.text,textOptions):new IText(raw.text,textOptions);
  }
  if(type==='image'){const image=await FabricImage.fromURL(raw.src,{},{...options,clipPath:undefined});if(raw.clipPath)image.set({clipPath:await build(raw.clipPath)});image._toSVG=()=>legacyImageReferenceMarkup(image);return image;}
  // Legacy full circles store radians; Fabric 7 expects degrees. Keep the
  // independent reference faithful to the original full circle, not a 6° arc.
  if(type==='rect')return new Rect(options);if(type==='circle')return new Circle({...options,...((raw.startAngle??0)===0&&Math.abs(raw.endAngle-2*Math.PI)<1e-9?{endAngle:360}:{})});if(type==='ellipse')return new Ellipse(options);if(type==='line')return new Line([raw.x1,raw.y1,raw.x2,raw.y2],options);if(type==='path')return new Path(raw.path,options);if(type==='polygon')return new Polygon(raw.points,options);if(type==='polyline')return new Polyline(raw.points,options);throw new Error('Tipo di riferimento TEST non previsto');
 };
 const page=source.pages[0],clip=page.canvas.clipPath,canvas=new StaticCanvas(document.createElement('canvas'),{width:clip.width,height:clip.height,renderOnAddRemove:false});
 try{canvas.add(...await Promise.all(page.canvas.objects.map(build)));const unit=({mm:1,cm:10,in:25.4,inch:25.4,inches:25.4}as Record<string,number>)[String(source.unit).trim().toLowerCase()];if(!unit)throw Error('Unità del riferimento nativo non riconosciuta');const digits=config.NUM_FRACTION_DIGITS;try{config.NUM_FRACTION_DIGITS=12;return embedSvgFonts(canvas.toSVG({viewBox:{x:clip.left??0,y:clip.top??0,width:clip.width,height:clip.height},width:`${Number(page.pageData.fWidth)*unit}mm`,height:`${Number(page.pageData.fHeight)*unit}mm`}),assets);}finally{config.NUM_FRACTION_DIGITS=digits;}}finally{canvas.dispose();}
}
export async function svgPixelDifference(a:string,b:string,width=800,height=480){
 const pixels=async(svg:string)=>{const image=new Image();image.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;await image.decode();const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d')!;ctx.fillStyle='white';ctx.fillRect(0,0,width,height);ctx.drawImage(image,0,0,width,height);return ctx.getImageData(0,0,width,height).data;};
 const [x,y]=await Promise.all([pixels(a),pixels(b)]);let union=0,difference=0;
 for(let i=0;i<x.length;i+=4){const p=x[i]!<150&&x[i+3]!>128,q=y[i]!<150&&y[i+3]!>128;if(p||q)union++;if(p!==q)difference++;}return{union,difference,ratio:union?difference/union:0};
}
