import{loadSVGFromString,type FabricObject}from'fabric';
import type{VectorCommand}from'./vector-geometry';
import{GRAPHIC_IMPORT_LIMITS,EDITOR_LIMITS}from'./limits';
export interface SvgWorldClip{commands:VectorCommand[];fillRule:'nonzero'|'evenodd';}
/** Resolve each owner's clip in its own coordinate system before Fabric moves
 * shared definitions or collapses inherited clip-path attributes. All source
 * attributes have already passed the strict SVG preflight. */
export async function extractSvgClips(xml:Document,commands:(object:FabricObject)=>VectorCommand[]):Promise<Map<string,SvgWorldClip[]>>{
 const root=xml.documentElement,serializer=new XMLSerializer(),batch=root.cloneNode(false)as Element,bindings=new Map<string,{owner:string;rule:'nonzero'|'evenodd'}>(),result=new Map<string,SvgWorldClip[]>();let count=0,commandCount=0;const encoder=new TextEncoder();let bytes=encoder.encode(serializer.serializeToString(batch)).length;
 batch.removeAttribute('clip-path');
 const definitions=new Map(Array.from(xml.querySelectorAll('clipPath')).map(clip=>[clip.id,clip]));
 for(const element of xml.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon,image,text')){
  if(element.closest('defs,clipPath'))continue;
  const owners:Element[]=[];for(let owner:Element|null=element;owner;owner=owner.parentElement)owners.unshift(owner);
  const clipped=owners.filter(owner=>owner.hasAttribute('clip-path'));if(!clipped.length)continue;if(clipped.length>8)throw Error('SVG con più di otto maschere su uno stesso oggetto');
  const id=`editor-import-${crypto.randomUUID()}`;element.setAttribute('id',id);result.set(id,[]);
  for(const owner of clipped){
   if(++count>GRAPHIC_IMPORT_LIMITS.svgElements)throw Error('SVG con troppe intersezioni di maschere');
   const reference=owner.getAttribute('clip-path')!.match(/^url\(\s*#([^\s)]+)\s*\)$/),definition=definitions.get(reference?.[1]??'');if(!definition)throw Error('Maschera SVG non risolta');
   const originalShape=definition.firstElementChild!,shape=originalShape.cloneNode(true)as Element;let rule='nonzero';for(let node:Element|null=originalShape;node;node=node.parentElement)if(node.hasAttribute('clip-rule')){rule=node.getAttribute('clip-rule')!;break;}if(rule!=='nonzero'&&rule!=='evenodd')throw Error('Regola della maschera SVG non valida');
   if([definition,shape].some(node=>node.getAttribute('display')==='none'||['hidden','collapse'].includes(node.getAttribute('visibility')??'')))throw Error('Maschera SVG invisibile non rappresentabile');
   const transforms=owners.slice(1,owners.indexOf(owner)+1).map(node=>node.getAttribute('transform')??'');transforms.push(definition.getAttribute('transform')??'');
   const group=xml.createElementNS('http://www.w3.org/2000/svg','g');group.setAttribute('transform',transforms.join(' '));
   const maskId=`mask-${count}`;shape.setAttribute('id',maskId);shape.setAttribute('fill','#000000');shape.setAttribute('fill-rule',rule);shape.setAttribute('stroke','none');shape.removeAttribute('clip-path');group.appendChild(shape);bytes+=encoder.encode(serializer.serializeToString(group)).length;if(bytes>GRAPHIC_IMPORT_LIMITS.svgBytes)throw Error('Espansione delle maschere SVG oltre 2 MB');batch.appendChild(group);bindings.set(maskId,{owner:id,rule});
  }
 }
 if(!count)return result;
 // Keep every inherited intersection ourselves; never ask Fabric's mutable SVG
 // definition resolver to guess which ancestor owns a shared clipping path.
 for(const element of[root,...xml.querySelectorAll('[clip-path]')])element.removeAttribute('clip-path');
 await loadSVGFromString(serializer.serializeToString(batch),(element,object)=>{const binding=bindings.get(element.id);if(!binding)throw Error('Geometria della maschera SVG non identificata');const raw=commands(object),closed:VectorCommand[]=[];let open=false;
  for(const command of raw){if(command[0]==='M'){if(open)closed.push(['Z']);open=true;}closed.push(command);if(command[0]==='Z')open=false;}if(open)closed.push(['Z']);
  commandCount+=closed.length;if(commandCount>EDITOR_LIMITS.vectorCommands)throw Error('Maschere SVG oltre il budget dei comandi vettoriali');result.get(binding.owner)!.push({commands:closed,fillRule:binding.rule});
 });
 for(const[id,clips]of result)if(clips.length!==Array.from(bindings.values()).filter(binding=>binding.owner===id).length)throw Error('Il parser SVG ha perso una maschera');
 return result;
}
