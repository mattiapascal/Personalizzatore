import { FabricAdapter,exportDocumentSvg,exportDocumentPng,exportDocumentThumbnail,measureFabric } from '../../src/editor/fabric-adapter';
import { objectCenter,type GraphicDocument } from '../../src/editor/model';
import { compareSupersampledSvg } from './svg-color-reference.browser';
import { boxSampleRgba } from '../../src/editor/pixel-sampling';
async function bitmapComparison(reference:string,blob:Blob,pixelsPerMm:number,plain:GraphicDocument,paths:{d:string;rule:CanvasFillRule}[],matrix:number[]){
 const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);}),image=new Image();image.src=data;await image.decode();
 const width=image.naturalWidth,height=image.naturalHeight,xml=new DOMParser().parseFromString(reference,'image/svg+xml');
 for(const[key,value]of Object.entries({width,height,viewBox:`0 0 ${width/pixelsPerMm*8} ${height/pixelsPerMm*8}`,preserveAspectRatio:'none'}))xml.documentElement.setAttribute(key,String(value));
 const bitmap=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><image width="${width}" height="${height}" href="${data}"/></svg>`;
 const svgDiagnostic=await compareSupersampledSvg(new XMLSerializer().serializeToString(xml),bitmap,width,height,8,1);
 // Independent Canvas2D clipping in page coordinates. Keep native text cache
 // sampling equal: Fabric forces caching for clipped objects even when false.
 const samples=[8,4,2,1].find(n=>width*n<=8192&&height*n<=8192&&width*height*n*n<=16_000_000)!,view=new FabricAdapter(document.createElement('canvas'),()=>0,()=>{}),surface=document.createElement('canvas');surface.width=width*samples;surface.height=height*samples;
 try{
  view.render(plain);view.canvas.enableRetinaScaling=false;view.canvas.skipOffscreen=false;view.canvas.setViewportTransform([pixelsPerMm/8*samples,0,0,pixelsPerMm/8*samples,0,0]);
  const object=view.canvas.getObjects()[0]!;object.set('objectCaching',true);const context=surface.getContext('2d')!;context.setTransform(pixelsPerMm/8*samples,0,0,pixelsPerMm/8*samples,0,0);
  const paint=(masked:boolean)=>{context.save();if(masked)for(const path of paths){const world=new Path2D();world.addPath(new Path2D(path.d),new DOMMatrix(matrix));context.clip(world,path.rule);}object.render(context);context.restore();const raw=context.getImageData(0,0,surface.width,surface.height).data;return boxSampleRgba(raw,surface.width,surface.height,samples);};
  const expected=paint(true);context.save();context.setTransform(1,0,0,1,0,0);context.clearRect(0,0,surface.width,surface.height);context.restore();const negative=paint(false),target=document.createElement('canvas');target.width=width;target.height=height;const c=target.getContext('2d')!;c.drawImage(image,0,0);const actual=c.getImageData(0,0,width,height).data;
  const compare=(a:Uint8ClampedArray,b:Uint8ClampedArray)=>{let different=0,ink=0,error=0;for(let i=0;i<a.length;i+=4){let delta=0,dark=false;for(let channel=0;channel<3;channel++){const av=255-(255-a[i+channel]!)*a[i+3]!/255,bv=255-(255-b[i+channel]!)*b[i+3]!/255;delta=Math.max(delta,Math.abs(av-bv));dark ||= av<245||bv<245;}if(dark)ink++;if(delta>24)different++;error+=delta;}return{different,ink,ratio:different/Math.max(1,ink),meanChannelError:error/(width*height)};};
  return{canvas:compare(expected,actual),negative:compare(negative,actual),svgDiagnostic};
 }finally{view.dispose();surface.width=surface.height=1;}
}
/** Independent SVG clip composition. Read the physical contract directly;
 * no editor mask command mapper, renderer or clip view in the reference. */
export async function compareTextMasks(doc:GraphicDocument){
 const rows=[];
 for(const object of doc.objects){if(object.type!=='text'||!object.textClipMasks)continue;
  const plain={...object,textClipMasks:undefined},source=await exportDocumentSvg({...doc,objects:[plain]},true),center=objectCenter(plain,measureFabric),sx=object.textScaleX??1,sy=object.textScaleY??1,k=Math.tan((object.textSkewXDeg??0)*Math.PI/180),a=(object.rotationDeg??0)*Math.PI/180,m=[Math.cos(a)*sx,Math.sin(a)*sx,(Math.cos(a)*k-Math.sin(a))*sy,(Math.sin(a)*k+Math.cos(a))*sy,center.xMm*8,center.yMm*8];
  const xml=new DOMParser().parseFromString(source,'image/svg+xml'),root=xml.documentElement,ns='http://www.w3.org/2000/svg',group=xml.createElementNS(ns,'g'),definitions=xml.createElementNS(ns,'defs');
  while(root.firstChild)group.append(root.firstChild);let content=group;
  const paths:{d:string;rule:CanvasFillRule}[]=[];
  for(const[index,mask]of object.textClipMasks.entries()){
   const clip=xml.createElementNS(ns,'clipPath'),path=xml.createElementNS(ns,'path'),id=`independent-mask-${index}`;clip.setAttribute('id',id);clip.setAttribute('clipPathUnits','userSpaceOnUse');const f=mask.frameMm;
   const d=mask.commands.map(command=>command[0]==='Z'?'Z':command[0]+' '+command.slice(1).map((value,i)=>8*(i%2?f.y+Number(value)*f.height:f.x+Number(value)*f.width)).join(' ')).join(' ');paths.push({d,rule:mask.fillRule});path.setAttribute('d',d);path.setAttribute('transform',`matrix(${m.join(' ')})`);path.setAttribute('clip-rule',mask.fillRule);clip.append(path);definitions.append(clip);
   const outer=xml.createElementNS(ns,'g');outer.setAttribute('clip-path',`url(#${id})`);outer.append(content);content=outer;
  }
  root.append(definitions,content);const reference=new XMLSerializer().serializeToString(xml),actual=await exportDocumentSvg({...doc,objects:[object]},true),width=doc.areaMm.width*6,height=doc.areaMm.height*6;
  const scene={...doc,objects:[object]};
  rows.push({id:object.id,pixels:await compareSupersampledSvg(reference,actual,width,height),negative:await compareSupersampledSvg(reference,source,width,height),png:await bitmapComparison(reference,await exportDocumentPng(scene,150,true),150/25.4,{...doc,objects:[plain]},paths,m),thumbnail:await bitmapComparison(reference,await exportDocumentThumbnail(scene,960),960/Math.max(doc.areaMm.width,doc.areaMm.height),{...doc,objects:[plain]},paths,m)});
 }
 return rows;
}
