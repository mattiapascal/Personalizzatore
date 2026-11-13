/** Inject into an isolated page containing the ORIGINAL Fabric 3 runtime.
 * Captures its own Canvas path calls, dimensions and matrices; does not import
 * the new editor's parser or any canonical mask helpers. */
export function nativeMaskGeometry(L:any,raw:any,parent=[1,0,0,1,0,0]):any[]{
 const options={originX:'left',originY:'top',...raw,clipPath:undefined},shape=raw.type==='path'?new L.Path(raw.path,options):raw.type==='rect'?new L.Rect(options):null;if(!shape)throw Error('Forma fuori dal riferimento');
 try{
  const commands:any[]=[],matrix=L.util.multiplyTransformMatrices(parent,shape.calcOwnMatrix());let x=0,y=0;
  const context={beginPath(){},moveTo(a:number,b:number){commands.push(['M',a,b]);x=a;y=b;},lineTo(a:number,b:number){commands.push(['L',a,b]);x=a;y=b;},bezierCurveTo(a:number,b:number,c:number,d:number,e:number,f:number){commands.push(['C',a,b,c,d,e,f]);x=e;y=f;},quadraticCurveTo(a:number,b:number,c:number,d:number){commands.push(['C',x+2/3*(a-x),y+2/3*(b-y),c+2/3*(a-c),d+2/3*(b-d),c,d]);x=c;y=d;},closePath(){commands.push(['Z']);}};
  shape._renderPaintInOrder=()=>{};if(raw.type==='path')shape._renderPathCommands(context);else shape._render(context);
  const world=commands.map(c=>{if(c[0]==='Z')return c;const result=[c[0]];for(let i=1;i<c.length;i+=2){const p=L.util.transformPoint(new L.Point(c[i],c[i+1]),matrix);result.push(p.x,p.y);}return result;});
  return[{commands:world,fillRule:raw.fillRule??'nonzero',width:shape.width,height:shape.height,pathOffset:shape.pathOffset,matrix},...(raw.clipPath?nativeMaskGeometry(L,raw.clipPath,matrix):[])];
 }finally{if(typeof shape.dispose==='function')shape.dispose();}
}

/** Independent complete scene in Fabric 3. Relative masks are made explicit
 * from native Canvas path calls because legacy SVG drops nested intersections.
 * Requires nativeMaskGeometry and canvasDecorationReference in the page. */
export function nativeMaskedSceneSvg(L:any,source:any,fontFamily:string,images:Record<string,HTMLImageElement>={}){
 if(L.version!=='3.4.0')throw Error('Occorre Fabric 3.4.0 originale');let sequence=0;
 const geometry=(raw:any)=>Object.fromEntries(['left','top','width','height','scaleX','scaleY','angle','skewX','skewY','flipX','flipY','originX','originY','strokeWidth','strokeUniform'].filter(key=>raw[key]!==undefined).map(key=>[key,raw[key]]));
 const build=(raw:any):any=>{
  const options={originX:'left',originY:'top',...raw,clipPath:undefined};delete options.objects;
  let object:any;
  if(raw.type==='group'){object=new L.Group([],options);object.set(geometry(raw));object._objects=raw.objects.map(build);for(const child of object._objects)child.group=object;}
  else if(['text','i-text','textbox'].includes(raw.type)){
   object=raw.type==='textbox'?new L.Textbox(raw.text,{...options,fontFamily,fontWeight:'normal',fontStyle:'normal'}):new L.IText(raw.text,{...options,fontFamily,fontWeight:'normal',fontStyle:'normal'});
   const serialize=object.toSVG.bind(object);
   object.toSVG=()=>{
    const saved=object.clipPath;object.clipPath=undefined;let svg:string;try{svg=(window as any).canvasDecorationReference(object,()=>serialize());}finally{object.clipPath=saved;}
    const definitions:string[]=[],matrix=object.calcOwnMatrix();
    for(const mask of raw.clipPath?(window as any).nativeMaskGeometry(L,raw.clipPath):[]){const id='native-text-mask-'+(++sequence),d=mask.commands.map((c:any[])=>{if(c[0]==='Z')return'Z';const out=[c[0]];for(let i=1;i<c.length;i+=2){const p=L.util.transformPoint(new L.Point(c[i],c[i+1]),matrix);out.push(p.x,p.y);}return out.join(' ');}).join(' ');definitions.push(`<clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="${d}" clip-rule="${mask.fillRule}"/></clipPath>`);svg=`<g clip-path="url(#${id})">${svg}</g>`;}
    return`<defs>${definitions.join('')}</defs>${svg}`;
   };
  }else if(raw.type==='path')object=new L.Path(raw.path,options);
  else if(raw.type==='rect')object=new L.Rect(options);
  else if(raw.type==='image'){
   const image=images[raw.url||raw.src];if(!image)throw Error('Originale immagine del riferimento non disponibile');object=new L.Image(image,options);
   // Native SVG can disagree with its own Canvas for a negative crop or a
   // stretched frame. Capture the original drawImage call as the authority.
   object._toSVG=()=>{let sample:any[]=[];object._renderFill({drawImage:(...args:any[])=>{sample=args;}});if(sample.length!==9)throw Error('Campionamento nativo non riconosciuto');const[,sx,sy,sw,sh,x,y,w,h]=sample;return['<svg ','COMMON_PARTS',`x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${sx} ${sy} ${sw} ${sh}" preserveAspectRatio="none" overflow="hidden"><image width="${image.naturalWidth}" height="${image.naturalHeight}" xlink:href="${image.src}"/></svg>`];};
  }
  else throw Error('Tipo fuori dal riferimento completo');
  if(raw.clipPath)object.clipPath=build(raw.clipPath);return object;
 };
 const page=source.pages[0],clip=page.canvas.clipPath,canvas=new L.StaticCanvas(document.createElement('canvas'),{width:clip.width,height:clip.height,enableRetinaScaling:false,renderOnAddRemove:false});
 try{canvas.add(...page.canvas.objects.map(build));if(page.canvas.background)canvas.backgroundColor=page.canvas.background;L.Object.NUM_FRACTION_DIGITS=12;const svg=canvas.toSVG({viewBox:{x:clip.left??0,y:clip.top??0,width:clip.width,height:clip.height},width:`${page.pageData.fWidth}mm`,height:`${page.pageData.fHeight}mm`}),xml=new DOMParser().parseFromString(svg,'image/svg+xml');xml.documentElement.setAttribute('preserveAspectRatio','none');return new XMLSerializer().serializeToString(xml);}finally{canvas.dispose();}
}
