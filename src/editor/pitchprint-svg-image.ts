import{requestStrokeOutline}from'./stroke-outline';
import{ClipMasksSchema,type ClipMask}from'./clip-masks';
import{mapVector,vectorBounds,VectorCommandsSchema,type VectorCommand}from'./vector-geometry';
import{checkedRasterCrop}from'./raster-geometry';
import{objectCenter,type SceneObject}from'./model';
import{measureFabric}from'./fabric-adapter';
import{prepareSvg}from'./svg-import';
import{MAX_SVG_BYTES}from'./svg-sanitize';
import{sanitizeSvg}from'./svg-sanitize';
import{MAX_RASTER_PIXELS,MAX_RASTER_SIDE}from'./raster-limits';
import{pitchprintNumber as number}from'./pitchprint-units';
import{pitchprintImageClip}from'./pitchprint-image-clip';
import type{PitchprintMatrix}from'./pitchprint-tree';
/** The extension is not an authority: some legacy .png assets are real SVGs. */
export function svgImageText(bytes:Uint8Array):string|undefined{
 if(bytes[0]===0x89||bytes[0]===0xff)return;
 if(bytes.length>MAX_SVG_BYTES)throw Error('SVG incorporato oltre 2 MB');
 let text:string;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{return;}
 return /^\s*(?:<\?xml[^>]*>\s*|<!--[^]*?-->\s*|<!DOCTYPE[^>]*>\s*)*<svg[\s>]/i.test(text)?text:undefined;
}
const rect:VectorCommand[]=[['M',0,0],['L',1,0],['L',1,1],['L',0,1],['Z']];
/** Map the entire intrinsic viewport, including whitespace, into the legacy
 * image frame. Bake affine vectors; retain original pixels for bitmap children.
 * Unsupported sampling/skew fails the whole import instead of approximating. */
export async function convertPitchprintSvgImage(text:string,item:Record<string,unknown>,matrix:PitchprintMatrix,monochrome:boolean):Promise<SceneObject[]>{
 if(number(item.cropX??0,'Ritaglio SVG')||number(item.cropY??0,'Ritaglio SVG'))throw Error('Ritaglio sui pixel dell’anteprima SVG: griglia originale da verificare');
 const prepared=await prepareSvg(text,monochrome,'editable'),viewport=prepared.viewportMm;if(!viewport)throw Error('SVG privo del viewport originale');
 if(viewport.widthMm*96/25.4>MAX_RASTER_SIDE||viewport.heightMm*96/25.4>MAX_RASTER_SIDE||viewport.widthMm*viewport.heightMm*(96/25.4)**2>MAX_RASTER_PIXELS)throw Error('Griglia dell’immagine SVG oltre il budget raster locale');
 // Fabric 3 drawImage samples at most the intrinsic pixel grid. Query the
 // browser only after the complete preflight; never render the untrusted XML.
 const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(sanitizeSvg(text,monochrome,true));
 let timer:ReturnType<typeof setTimeout>|undefined;try{await Promise.race([image.decode(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Lettura delle dimensioni SVG non riuscita entro cinque secondi')),5000);})]);}catch(error){image.src='';throw error;}finally{clearTimeout(timer);}
 const intrinsic={width:image.naturalWidth,height:image.naturalHeight};image.src='';if(!intrinsic.width||!intrinsic.height)throw Error('SVG privo di una griglia intrinseca verificabile');
 const width=number(item.width,'Larghezza SVG'),height=number(item.height,'Altezza SVG');if(width<=0||height<=0)throw Error('Frame SVG privo di dimensioni positive');
 const sampled={width:Math.min(width,intrinsic.width),height:Math.min(height,intrinsic.height)},fit=Math.min(intrinsic.width/viewport.widthMm,intrinsic.height/viewport.heightMm),factorX=width*fit/sampled.width,factorY=height*fit/sampled.height,padX=(intrinsic.width-viewport.widthMm*fit)/2*width/sampled.width,padY=(intrinsic.height-viewport.heightMm*fit)/2*height/sampled.height;
 const map=(x:number,y:number)=>{const u=(x-viewport.xMm)*factorX+padX-width/2,v=(y-viewport.yMm)*factorY+padY-height/2;return{x:matrix[0]*u+matrix[2]*v+matrix[4],y:matrix[1]*u+matrix[3]*v+matrix[5]};};
 const maskInFrame=(commands:VectorCommand[],fillRule:ClipMask['fillRule'],bounds:ReturnType<typeof vectorBounds>):ClipMask=>{const b=vectorBounds(commands);if(!(b.width>0&&b.height>0&&bounds.width>0&&bounds.height>0))throw Error('Maschera SVG su geometria degenere');return{commands:mapVector(commands,(x,y)=>({x:(x-b.x)/b.width,y:(y-b.y)/b.height})),frame:{left:(b.x-bounds.x)/bounds.width,top:(b.y-bounds.y)/bounds.height,width:b.width/bounds.width,height:b.height/bounds.height},fillRule};};
 const boundary=pitchprintImageClip(item),frame=boundary??{left:-width/2,top:-height/2,right:width/2,bottom:height/2},frameWorld=mapVector(rect,(x,y)=>({x:matrix[0]*(frame.left+x*(frame.right-frame.left))+matrix[2]*(frame.top+y*(frame.bottom-frame.top))+matrix[4],y:matrix[1]*(frame.left+x*(frame.right-frame.left))+matrix[3]*(frame.top+y*(frame.bottom-frame.top))+matrix[5]}));
 const objects:SceneObject[]=[];for(const source of prepared.objects){
  if(source.type==='image'){
   const center=objectCenter(source,measureFabric),a=(source.rotationDeg??0)*Math.PI/180,cos=Math.cos(a),sin=Math.sin(a),fx=source.flipX?-1:1,fy=source.flipY?-1:1,point=(u:number,v:number)=>map(center.xMm+u*cos-v*sin,center.yMm+u*sin+v*cos),c=point(0,0),x=point(fx*source.widthMm,0),y=point(0,fy*source.heightMm),ax={x:x.x-c.x,y:x.y-c.y},ay={x:y.x-c.x,y:y.y-c.y},w=Math.hypot(ax.x,ax.y),h=Math.hypot(ay.x,ay.y);
   if(w<=0||h<=0||Math.abs(ax.x*ay.x+ax.y*ay.y)>1e-7*w*h)throw Error('SVG con bitmap inclinata dal frame: conversione affine esatta non disponibile');
   const determinant=ax.x*ay.y-ax.y*ay.x,angle=Math.atan2(ax.y,ax.x),flipY=determinant<0,crop=checkedRasterCrop(source.source,source.crop),corners=rect.filter(c=>c[0]!=='Z').map(p=>({x:c.x+(p[1]as number-.5)*ax.x+(p[2]as number-.5)*ay.x,y:c.y+(p[1]as number-.5)*ax.y+(p[2]as number-.5)*ay.y}));
   const localFrame=mapVector(frameWorld,(px,py)=>{const dx=px-c.x,dy=py-c.y;return{x:(dx*Math.cos(angle)+dy*Math.sin(angle))/w+.5,y:(-dx*Math.sin(angle)+dy*Math.cos(angle))/h*(flipY?-1:1)+.5};}),extra=maskInFrame(localFrame,'nonzero',{x:0,y:0,width:1,height:1});
   objects.push({...source,xMm:Math.min(...corners.map(p=>p.x)),yMm:Math.min(...corners.map(p=>p.y)),widthMm:w,heightMm:h,rotationDeg:angle*180/Math.PI,flipX:false,flipY,pixelAspectRatio:w*crop.heightPx/(h*crop.widthPx),clipMasks:ClipMasksSchema.parse([...source.clipMasks??[],extra])});continue;
  }
  if(source.type!=='vector'||source.rotationDeg)throw Error('SVG nel frame immagine con testo o geometria non ancora rappresentabile: importare il testo come contorni');
  const sx=Math.hypot(matrix[0]*factorX,matrix[1]*factorX),sy=Math.hypot(matrix[2]*factorY,matrix[3]*factorY);
  const inset=source.stroke==='none'?0:source.strokeMm/2,toPhysical=(x:number,y:number)=>({x:source.xMm+inset+x*source.widthMm,y:source.yMm+inset+y*source.heightMm}),physical=mapVector(source.commands,toPhysical),commands=mapVector(physical,map),strokeMm=source.stroke==='none'?source.strokeMm:source.strokeMm*sx;
  const clips=[...source.clipMasks??[]];if(source.clipRect){const c=source.clipRect;clips.push({commands:rect,frame:{left:c.left,top:c.top,width:c.right-c.left,height:c.bottom-c.top},fillRule:'nonzero'});}
  const world=clips.map(mask=>({commands:mapVector(mask.commands,(x,y)=>{const p=toPhysical(mask.frame.left+x*mask.frame.width,mask.frame.top+y*mask.frame.height);return map(p.x,p.y);}),fillRule:mask.fillRule}));world.push({commands:frameWorld,fillRule:'nonzero'});
  const emit=(geometry:VectorCommand[],fill:string,rule:'nonzero'|'evenodd',stroke:string,strokeWidth:number)=>{const box=vectorBounds(geometry);if(!(box.width>0&&box.height>0))throw Error('Geometria SVG con maschera priva di area');const result={...source,xMm:box.x-(stroke==='none'?0:strokeWidth/2),yMm:box.y-(stroke==='none'?0:strokeWidth/2),widthMm:box.width,heightMm:box.height,strokeMm:strokeWidth,fill,fillRule:rule,stroke,commands:VectorCommandsSchema.parse(mapVector(geometry,(x,y)=>({x:(x-box.x)/box.width,y:(y-box.y)/box.height}))),clipMasks:ClipMasksSchema.parse(world.map(mask=>maskInFrame(mask.commands,mask.fillRule,box)))};delete result.clipRect;objects.push(result);};
  const rawBounds=vectorBounds(commands);
  if(source.stroke!=='none'&&(!rawBounds.width||!rawBounds.height||Math.abs(sx-sy)>1e-7*Math.max(sx,sy)||Math.abs(matrix[0]*matrix[2]+matrix[1]*matrix[3])>1e-7)){
   const p=map(0,0),x=map(1,0),y=map(0,1),outline=await requestStrokeOutline({schemaVersion:1,commands:physical,matrix:[x.x-p.x,x.y-p.y,y.x-p.x,y.y-p.y,p.x,p.y],strokeWidth:source.strokeMm,lineCap:source.strokeLineCap,lineJoin:source.strokeLineJoin,miterLimit:source.strokeMiterLimit});
   const box=vectorBounds(commands);if(source.fill!=='none'&&box.width>0&&box.height>0)emit(commands,source.fill,source.fillRule,'none',.25);emit(outline.commands,source.stroke,'nonzero','none',.25);
  }else emit(commands,source.fill,source.fillRule,source.stroke,strokeMm);
 }return objects;
}
