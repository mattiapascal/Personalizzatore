import type {GraphicDocument,SceneObject} from './model';
import {productionDocument} from './object-properties';
/** Declared sRGB styles, not pixel/ink/varnish analysis. Only the active scene. */
export function documentPaintColors(document:GraphicDocument):string[]{
 const page=productionDocument(document),colors=new Set<string>();
 const add=(color:string|undefined)=>{if(color&&/^#[0-9a-f]{6}$/.test(color))colors.add(color);};
 const appearance=(object:Exclude<SceneObject,{type:'image'}>)=>{if('fill'in object)add(object.fill);if('stroke'in object)add(object.stroke);};
 add(page.paperColor);
 for(const object of page.objects){
  if(object.type==='image'){if(object.raster.mode==='grayscale')add(object.raster.tintColor);continue;}
  if(object.type!=='text'){appearance(object);continue;}
  if(object.textPath?.showGuide&&!object.textPath.originalPathMetadata?.editor?.reference)add(object.textPath.guide.stroke);
  const length=Array.from(object.text).length;let cursor=0;
  for(const run of object.characterStyles??[]){if(run.start>cursor)appearance(object);add(run.style.fill??object.fill);add(run.style.stroke??object.stroke);cursor=run.end;}
  if(cursor<length||length===0)appearance(object);
 }
 return[...colors].sort();
}
