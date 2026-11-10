import {Group,IText,Rect,Circle,Ellipse,Line,Path,Polygon,Polyline,FabricImage,StaticCanvas,type FabricObject} from 'fabric';
import {loadFontAssets,renderFontFamily,embedSvgFonts} from '../../src/editor/fonts';
import type {FontAsset} from '../../src/editor/font-assets';

/** Independent reference: let Fabric render the original relative coordinates.
 * Disable group relayout by installing the serialized child plane explicitly;
 * Fabric 7's automatic layout otherwise recentres legacy Fabric 3 groups. */
export async function pitchprintReferenceSvg(source:any,asset:FontAsset):Promise<string>{
 await loadFontAssets([asset]);
 const build=async(raw:any):Promise<FabricObject>=>{
  const {type,objects,...options}=raw;
  if(raw.type==='group'){
   const group=new Group([],{...options}),children=await Promise.all(objects.map(build));Object.assign(group,{_objects:children});for(const child of children)group.enterGroup(child,false);return group;
  }
  if(['text','i-text','textbox'].includes(type))return new IText(raw.text,{...options,fontFamily:renderFontFamily(asset.id),fontWeight:'normal',fontStyle:'normal',stroke:null,strokeWidth:0});
  if(type==='image')return FabricImage.fromURL(raw.src,{},options);
  if(type==='rect')return new Rect(options);if(type==='circle')return new Circle(options);if(type==='ellipse')return new Ellipse(options);if(type==='line')return new Line([raw.x1,raw.y1,raw.x2,raw.y2],options);if(type==='path')return new Path(raw.path,options);if(type==='polygon')return new Polygon(raw.points,options);if(type==='polyline')return new Polyline(raw.points,options);throw new Error('Tipo di riferimento TEST non previsto');
 };
 const page=source.pages[0],clip=page.canvas.clipPath,canvas=new StaticCanvas(document.createElement('canvas'),{width:clip.width,height:clip.height,renderOnAddRemove:false});
 try{canvas.add(...await Promise.all(page.canvas.objects.map(build)));return embedSvgFonts(canvas.toSVG({viewBox:{x:clip.left??0,y:clip.top??0,width:clip.width,height:clip.height},width:`${page.pageData.fWidth}mm`,height:`${page.pageData.fHeight}mm`}),[asset]);}finally{canvas.dispose();}
}
export async function svgPixelDifference(a:string,b:string,width=800,height=480){
 const pixels=async(svg:string)=>{const image=new Image();image.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;await image.decode();const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d')!;ctx.fillStyle='white';ctx.fillRect(0,0,width,height);ctx.drawImage(image,0,0,width,height);return ctx.getImageData(0,0,width,height).data;};
 const [x,y]=await Promise.all([pixels(a),pixels(b)]);let union=0,difference=0;
 for(let i=0;i<x.length;i+=4){const p=x[i]!<150&&x[i+3]!>128,q=y[i]!<150&&y[i+3]!>128;if(p||q)union++;if(p!==q)difference++;}return{union,difference,ratio:union?difference/union:0};
}
