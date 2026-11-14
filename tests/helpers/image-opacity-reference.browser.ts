import type {GraphicDocument} from '../../src/editor/model';
/** Independent Canvas2D compositing, with a separately specified global alpha.
 * Existing pixel filters supply only the bitmap; Fabric placement/opacity and
 * SVG serialization never supply the reference drawing. */
export async function compareImageOpacity(source:GraphicDocument){
 const h='/tests/helpers/browser-module.ts',{loadedEditorModule}=await import(h),{FabricAdapter,exportDocumentSvg,exportDocumentPng,exportDocumentThumbnail}=await import(loadedEditorModule('/src/editor/fabric-adapter.ts')),{originalRasterImage,rasterCanvas}=await import(loadedEditorModule('/src/editor/raster-cache.ts'));
 const doc=structuredClone(source);doc.objects=doc.objects.filter(o=>o.type!=='text');
 const expected=(width:number,height:number,scale:number,white=false)=>{
  const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d')!;if(white){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);}ctx.scale(scale,scale);
  for(const o of doc.objects){if(o.type==='rect'){ctx.fillStyle=o.fill!;ctx.fillRect(o.xMm,o.yMm,o.widthMm,o.heightMm);continue;}if(o.type!=='image')throw Error('Fixture immagine');
   const a=(o.rotationDeg??0)*Math.PI/180,bw=Math.abs(o.widthMm*Math.cos(a))+Math.abs(o.heightMm*Math.sin(a)),bh=Math.abs(o.widthMm*Math.sin(a))+Math.abs(o.heightMm*Math.cos(a)),bitmap=o.raster.mode==='original'?originalRasterImage(o.source):rasterCanvas(o.source,o.raster),crop=o.crop??{leftPx:0,topPx:0,widthPx:o.source.pixelWidth,heightPx:o.source.pixelHeight};
   ctx.save();ctx.globalAlpha=o.opacity??1;ctx.translate(o.xMm+bw/2,o.yMm+bh/2);ctx.rotate(a);ctx.scale(!!o.flipX!==!!o.mirrorX?-1:1,!!o.flipY!==!!o.mirrorY?-1:1);ctx.drawImage(bitmap,crop.leftPx,crop.topPx,crop.widthPx,crop.heightPx,-o.widthMm/2,-o.heightMm/2,o.widthMm,o.heightMm);ctx.restore();
  }return ctx.getImageData(0,0,width,height).data;
 };
 const compare=(a:Uint8ClampedArray,b:Uint8ClampedArray)=>{let ink=0,different=0,error=0;for(let i=0;i<a.length;i+=4){if(!a[i+3]&&!b[i+3])continue;ink++;let delta=Math.abs(a[i+3]!-b[i+3]!);for(let c=0;c<3;c++)delta=Math.max(delta,Math.abs(a[i+c]!*a[i+3]!/255-b[i+c]!*b[i+3]!/255));if(delta>12)different++;error+=delta;}return{ink,ratio:different/Math.max(1,ink),mean:error/Math.max(1,ink)};};
 const read=async(url:string,width?:number,height?:number)=>{const img=new Image();img.src=url;await img.decode();const c=document.createElement('canvas');c.width=width??img.naturalWidth;c.height=height??img.naturalHeight;const ctx=c.getContext('2d')!;ctx.drawImage(img,0,0,c.width,c.height);return{width:c.width,height:c.height,data:ctx.getImageData(0,0,c.width,c.height).data};};
 const readBlob=async(blob:Blob)=>{const url=URL.createObjectURL(blob);try{return await read(url);}finally{URL.revokeObjectURL(url);}};
 const png=await exportDocumentPng(doc,150,true),p=await readBlob(png);const pngPixels=compare(p.data,expected(p.width,p.height,150/25.4));
 const thumb=await exportDocumentThumbnail(doc,512),t=await readBlob(thumb);const thumbnailPixels=compare(t.data,expected(t.width,t.height,512/120));
 let svg=await exportDocumentSvg(doc,true);const xml=new DOMParser().parseFromString(svg,'image/svg+xml');xml.documentElement.setAttribute('width','960');xml.documentElement.setAttribute('height','520');const rendered=await read('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(xml)),960,520),svgPixels=compare(rendered.data,expected(960,520,8));
 const view=new FabricAdapter(document.createElement('canvas'),()=>doc.revision,()=>{});try{view.render(doc,[]);view.canvas.renderAll();const c=view.canvas.lowerCanvasEl,canvasPixels=compare(c.getContext('2d')!.getImageData(0,0,c.width,c.height).data,expected(c.width,c.height,8*view.canvas.getRetinaScaling(),true));return{pngPixels,thumbnailPixels,svgPixels,canvasPixels,svg};}finally{view.dispose();}
}
