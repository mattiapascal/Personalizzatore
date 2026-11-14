import type {SceneObject} from './model';
export type StrokeCap='butt'|'round'|'square';
export function hasEditableStrokeCap(object:SceneObject):object is Extract<SceneObject,{type:'line'|'vector'|'path'|'bezier'}>{return object.type==='line'||object.type==='vector'||object.type==='path'||object.type==='bezier';}
export function effectiveStrokeCap(object:{strokeDash?:'solid'|'dashed'|'dotted';strokeLineCap?:StrokeCap}):StrokeCap{return object.strokeDash==='dotted'?'round':object.strokeLineCap??'round';}
/** Convert a live horizontal scale back to nominal length, preserving stroke. */
export function scaledLineLength(object:Extract<SceneObject,{type:'line'}>,scaleX:number):number{
 const overhang=effectiveStrokeCap(object)==='butt'?0:object.strokeMm;
 return(object.lengthMm+overhang)*scaleX-overhang;
}
