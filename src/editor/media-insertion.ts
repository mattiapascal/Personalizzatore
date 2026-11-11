import type{GraphicDocument,GraphicCommand,SceneObject}from'./model';import type{RasterSource}from'./raster-source';import{DEFAULT_RASTER}from'./raster-processing';
/** All callers dispatch this ordinary validated command; pixels never live only in Fabric. */
export function mediaRasterCommand(doc:GraphicDocument,source:RasterSource,title:string,background=false,defaultWidthMm?:number):GraphicCommand{
 const objectId=`object-${crypto.randomUUID()}`,area=doc.areaMm,scale=Math.min(Math.min(defaultWidthMm??50,defaultWidthMm?area.width-4:area.width*.7)/source.pixelWidth,(defaultWidthMm?area.height-4:Math.min(40,area.height*.7))/source.pixelHeight);
 let widthMm=source.pixelWidth*scale,heightMm=source.pixelHeight*scale,crop:Extract<SceneObject,{type:'image'}>['crop'];if(background){widthMm=area.width;heightMm=area.height;const fill=Math.max(widthMm/source.pixelWidth,heightMm/source.pixelHeight),w=widthMm/fill,h=heightMm/fill;crop={leftPx:(source.pixelWidth-w)/2,topPx:(source.pixelHeight-h)/2,widthPx:w,heightPx:h};}
 const object:SceneObject={id:objectId,type:'image',editor:{label:`${background?'Sfondo':'Immagine'} · ${title}`.slice(0,120)},xMm:(area.width-widthMm)/2,yMm:(area.height-heightMm)/2,widthMm,heightMm,source,raster:{...DEFAULT_RASTER,...(doc.colorMode==='color'?{mode:'original' as const}:{})},...(crop?{crop}:{})};
 return{schemaVersion:1,tool:background?'setBackgroundImage':'addObject',objectId,expectedRevision:doc.revision,arguments:{object}};
}
