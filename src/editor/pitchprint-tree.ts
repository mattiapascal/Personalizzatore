import{pitchprintImageClip}from'./pitchprint-image-clip';
import{readPitchprintTextMasks}from'./pitchprint-text-masks';
import { pitchprintLinear } from './pitchprint-affine';
import{singleFillPitchprintOpacity}from'./pitchprint-opacity';
import{EDITOR_LIMITS,GRAPHIC_IMPORT_LIMITS}from'./limits';
import {pitchprintNumber as number} from './pitchprint-units';
import type {ObjectProperties} from './object-properties';
export type PitchprintMatrix=[number,number,number,number,number,number];
export const PITCHPRINT_IDENTITY:PitchprintMatrix=[1,0,0,1,0,0];
export function multiplyPitchprintMatrices(a:PitchprintMatrix,b:PitchprintMatrix):PitchprintMatrix{return[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];}
export function pitchprintPoint(m:PitchprintMatrix,x:number,y:number){return{x:m[0]*x+m[2]*y+m[4],y:m[1]*x+m[3]*y+m[5]};}
export function pitchprintOrigin(value:unknown,axis:'x'|'y'):number{
 if(value===undefined||value===(axis==='x'?'left':'top'))return 0;if(value==='center')return .5;if(value===(axis==='x'?'right':'bottom'))return 1;throw new Error('Origine PitchPrint non riconosciuta.');
}
/** Fabric 3 group children are expressed around the declared group centre.
 * Cached mtx values and a newly computed child bounding box are not authoritative. */
export function pitchprintTransform(item:Record<string,unknown>,name:string):PitchprintMatrix{
 const dimensions=pitchprintLinear(item,name),width=number(item.width,name),height=number(item.height,name),stroke=number(item.strokeWidth??0,name);
 if(width<0||height<0||stroke<0)throw new Error(`${name}: dimensioni o scala non valide.`);
 const uniform=item.strokeUniform===true,w=width+(uniform?0:stroke),h=height+(uniform?0:stroke);
 const boxWidth=Math.abs(dimensions[0])*w+Math.abs(dimensions[2])*h+(uniform?stroke:0),boxHeight=Math.abs(dimensions[1])*w+Math.abs(dimensions[3])*h+(uniform?stroke:0);
 const a=number(item.angle??0,name)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),dx=(.5-pitchprintOrigin(item.originX,'x'))*boxWidth,dy=(.5-pitchprintOrigin(item.originY,'y'))*boxHeight;
 const x=number(item.left,name)+dx*c-dy*s,y=number(item.top,name)+dx*s+dy*c;
 const matrix=multiplyPitchprintMatrices([c,s,-s,c,x,y],dimensions);
 if(!matrix.every(Number.isFinite))throw Error(`${name}: trasformazione non finita.`);
 return matrix;
}
export function checkedPitchprintEffects(item:Record<string,unknown>,name:string):void{
 if(item.visible===false)throw new Error(`${name}: elemento nascosto, da gestire prima della conversione.`);
 if(Array.isArray(item.strokeDashArray)&&item.strokeDashArray.length)throw new Error(`${name}: tratteggio personalizzato da convertire. Il sorgente resta intatto.`);
 if(item.globalCompositeOperation&&item.globalCompositeOperation!=='source-over')throw new Error(`${name}: metodo di fusione non supportato.`);
 if(item.fillRule!==undefined&&!['evenodd','nonzero'].includes(String(item.fillRule)))throw new Error(`${name}: regola di riempimento non riconosciuta.`);
 if(item.clipPath!=null){if(['text','i-text','textbox'].includes(String(item.type)))readPitchprintTextMasks(item,name);else pitchprintImageClip(item,name);}
 const skewX=number(item.skewX??0,name),skewY=number(item.skewY??0,name),hasSkew=skewX!==0||skewY!==0;
 if(hasSkew)pitchprintLinear(item,name);
 if(item.shadow||item.clipTo||item.transformMatrix||hasSkew&&!['group','text','i-text','textbox'].includes(String(item.type))||singleFillPitchprintOpacity(item)===null)throw new Error(`${name}: maschera, ombra, skew o opacità non supportati.`);
}
const inheritedKeys=['transformLocked','selectionLocked','deleteLocked','hideMenus','reference'] as const;
export function inheritedPitchprintProperties(own:ObjectProperties,parent:ObjectProperties):ObjectProperties{const result={...own};for(const key of inheritedKeys)if(parent[key])result[key]=true;return result;}
export interface PitchprintLeaf{item:Record<string,unknown>;id:string;name:string;parent:PitchprintMatrix;inherited:ObjectProperties;rootGroup?:string;}
export interface PitchprintTree{leaves:PitchprintLeaf[];groups:{id:string;parentId?:string;editor:ObjectProperties;leafIds:string[]}[];warnings:string[];}
/** Preflight the whole tree before fonts/assets are fetched. Hierarchy and own
 * properties remain canonical; selection still uses the outer group. */
export function pitchprintTree(roots:Record<string,unknown>[],properties:(item:Record<string,unknown>,warnings:string[])=>ObjectProperties):PitchprintTree{
 const leaves:PitchprintLeaf[]=[],groups:PitchprintTree['groups']=[],warnings:string[]=[];let count=0;
 const walk=(items:Record<string,unknown>[],parent:PitchprintMatrix,ancestry:string,inherited:ObjectProperties,rootGroup?:string,depth=0,parentGroup?:string)=>{
  if(depth>12)throw new Error('Gruppi PitchPrint oltre il limite di 12 livelli.');
  items.forEach((item,index)=>{
   if(++count>GRAPHIC_IMPORT_LIMITS.sourceElements)throw new Error(`Template PitchPrint oltre ${GRAPHIC_IMPORT_LIMITS.sourceElements} elementi sorgente, inclusi i gruppi.`);
   const id=`${ancestry}-${index+1}`,name=`Elemento ${id.slice(3).replaceAll('-',' · ')}`;checkedPitchprintEffects(item,name);
   if(item.type!=='group'){if(leaves.length>=EDITOR_LIMITS.objects)throw new Error(`Template PitchPrint oltre ${EDITOR_LIMITS.objects} elementi grafici.`);leaves.push({item,id,name,parent,inherited,rootGroup});return;}
   if(!Array.isArray(item.objects)||!item.objects.length||item.objects.some(child=>!child||typeof child!=='object'||Array.isArray(child)))throw new Error(`${name}: gruppo privo di elementi validi.`);
   const own=properties(item,warnings),groupId=`${id}-group`,firstLeaf=leaves.length,group={id:groupId,...(parentGroup?{parentId:parentGroup}:{}),editor:own,leafIds:[] as string[]};groups.push(group);
   if(depth)warnings.push('Gerarchia dei gruppi conservata; la selezione grafica agisce sul gruppo esterno.');
   if(inheritedKeys.some(key=>own[key]))warnings.push('Blocchi o riferimenti del gruppo ereditati dai suoi elementi: controllare le proprietà dopo l’importazione.');
   walk(item.objects as Record<string,unknown>[],multiplyPitchprintMatrices(parent,pitchprintTransform(item,name)),id,inheritedPitchprintProperties(own,inherited),rootGroup??groupId,depth+1,groupId);group.leafIds=leaves.slice(firstLeaf).map(leaf=>leaf.id);
  });
 };walk(roots,PITCHPRINT_IDENTITY,'pp',{});return{leaves,groups,warnings:[...new Set(warnings)]};
}
