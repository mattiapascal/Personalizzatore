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
 const sx=number(item.scaleX??1,name),sy=number(item.scaleY??1,name),width=number(item.width,name),height=number(item.height,name),stroke=number(item.strokeWidth??0,name);
 if(sx<=0||sy<=0||width<0||height<0||stroke<0)throw new Error(`${name}: dimensioni o scala non valide.`);
 const a=number(item.angle??0,name)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),dx=(.5-pitchprintOrigin(item.originX,'x'))*(width+stroke)*sx,dy=(.5-pitchprintOrigin(item.originY,'y'))*(height+stroke)*sy;
 const x=number(item.left,name)+dx*c-dy*s,y=number(item.top,name)+dx*s+dy*c;
 return[c*sx*(item.flipX===true?-1:1),s*sx*(item.flipX===true?-1:1),-s*sy*(item.flipY===true?-1:1),c*sy*(item.flipY===true?-1:1),x,y];
}
export function checkedPitchprintEffects(item:Record<string,unknown>,name:string):void{
 if(item.visible===false)throw new Error(`${name}: elemento nascosto, da gestire prima della conversione.`);
 if(Array.isArray(item.strokeDashArray)&&item.strokeDashArray.length)throw new Error(`${name}: tratteggio personalizzato da convertire. Il sorgente resta intatto.`);
 if(item.globalCompositeOperation&&item.globalCompositeOperation!=='source-over')throw new Error(`${name}: metodo di fusione non supportato.`);
 if(item.shadow||item.clipPath||item.clipTo||item.transformMatrix||Number(item.skewX??0)||Number(item.skewY??0)||item.opacity!==undefined&&item.opacity!==1)throw new Error(`${name}: maschera, ombra, skew o opacità non supportati.`);
}
const inheritedKeys=['transformLocked','selectionLocked','deleteLocked','hideMenus','reference'] as const;
export function inheritedPitchprintProperties(own:ObjectProperties,parent:ObjectProperties):ObjectProperties{const result={...own};for(const key of inheritedKeys)if(parent[key])result[key]=true;return result;}
export interface PitchprintLeaf{item:Record<string,unknown>;id:string;name:string;parent:PitchprintMatrix;inherited:ObjectProperties;rootGroup?:string;}
export interface PitchprintTree{leaves:PitchprintLeaf[];warnings:string[];}
/** Preflight the whole tree before fonts/assets are fetched. Nested visual groups
 * use the outer selection unit. Semantic group labels require a future group form
 * contract and are rejected rather than assigned to an arbitrary child. */
export function pitchprintTree(roots:Record<string,unknown>[],properties:(item:Record<string,unknown>,warnings:string[])=>ObjectProperties):PitchprintTree{
 const leaves:PitchprintLeaf[]=[],warnings:string[]=[];let count=0;
 const walk=(items:Record<string,unknown>[],parent:PitchprintMatrix,ancestry:string,inherited:ObjectProperties,rootGroup?:string,depth=0)=>{
  if(depth>12)throw new Error('Gruppi PitchPrint oltre il limite di 12 livelli.');
  items.forEach((item,index)=>{
   if(++count>1000)throw new Error('Template PitchPrint oltre 1000 elementi sorgente, inclusi i gruppi.');
   const id=`${ancestry}-${index+1}`,name=`Elemento ${id.slice(3).replaceAll('-',' · ')}`;checkedPitchprintEffects(item,name);
   if(item.type!=='group'){if(leaves.length>=200)throw new Error('Template PitchPrint oltre 200 elementi grafici.');leaves.push({item,id,name,parent,inherited,rootGroup});return;}
   if(!Array.isArray(item.objects)||!item.objects.length||item.objects.some(child=>!child||typeof child!=='object'||Array.isArray(child)))throw new Error(`${name}: gruppo privo di elementi validi.`);
   const own=properties(item,warnings);if(own.label?.trim()||own.order)throw new Error(`${name}: il gruppo ha label o ordine propri. Occorre separarli o assegnare i campi ai singoli elementi prima dell’importazione; nessuna proprietà viene scartata.`);
   if(depth)warnings.push('Gruppi annidati ricondotti al gruppo esterno: geometrie e ordine conservati; nell’editor la selezione è un gruppo unico.');
   if(inheritedKeys.some(key=>own[key]))warnings.push('Blocchi o riferimenti del gruppo applicati anche ai suoi elementi: controllare le proprietà dopo l’importazione.');
   walk(item.objects as Record<string,unknown>[],multiplyPitchprintMatrices(parent,pitchprintTransform(item,name)),id,inheritedPitchprintProperties(own,inherited),rootGroup??`${id}-group`,depth+1);
  });
 };walk(roots,PITCHPRINT_IDENTITY,'pp',{});return{leaves,warnings:[...new Set(warnings)]};
}
