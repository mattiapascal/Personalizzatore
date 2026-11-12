import{GRAPHIC_IMPORT_LIMITS}from'./limits';
import { svgCssRules, resolveSvgCss } from './svg-css';
import { Parser } from 'htmlparser2';
interface Node { name: string; attrs: Record<string,string>; children: (Node|string)[]; }
const tags = new Set(['svg','g','path','rect','circle','ellipse','line','polyline','polygon','title','desc','defs','use','symbol','style','clipPath']);
const xml = (s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'})[c]!);
/** Expand only local references. Never hand URLs or use elements to the renderer. */
export function expandSvgReferences(source:string, allowText=false):string {
 if(new TextEncoder().encode(source).length>GRAPHIC_IMPORT_LIMITS.svgBytes)throw Error('SVG oltre 2 MB');
 const roots:Node[]=[],stack:Node[]=[],ids=new Map<string,Node>();let count=0;
 const parser=new Parser({onopentag(name,attrs){if(++count>GRAPHIC_IMPORT_LIMITS.svgElements||stack.length>=32)throw new Error('SVG troppo complesso');if(!tags.has(name)&&!(allowText&&['text','tspan'].includes(name)))throw new Error(name==='text'||name==='tspan'?'Testi SVG non ancora importabili: esportali come tracciati per conservare l’aspetto.':`Elemento SVG non supportato: ${name}`);for(const[key,value]of Object.entries(attrs))if(/^on/i.test(key)||/href/i.test(key)&&(name!=='use'||!/^#[a-zA-Z_][\w.:-]*$/.test(value)))throw new Error('SVG con script o riferimenti a risorse non consentiti');const node:Node={name,attrs,children:[]};if(attrs.id){if(ids.has(attrs.id))throw new Error('ID SVG duplicato');ids.set(attrs.id,node);}if(stack.length)stack.at(-1)!.children.push(node);else roots.push(node);stack.push(node);},onclosetag(name,implied){if(implied&&!source.slice(parser.startIndex,parser.endIndex+1).trim().endsWith('/>')||stack.pop()?.name!==name)throw new Error('Struttura XML SVG non valida');},ontext(value){if(stack.length)stack.at(-1)!.children.push(value);else if(value.trim())throw new Error('Testo esterno alla radice SVG');},onprocessinginstruction(name){if(!['?xml','!DOCTYPE','!doctype'].includes(name))throw new Error('Istruzione XML non supportata');}},{xmlMode:true,decodeEntities:true});parser.end(source);
 if(stack.length||roots.length!==1||roots[0]!.name!=='svg')throw new Error('File SVG incompleto');
 const styles:string[]=[];const walk=(node:Node,fn:(node:Node)=>void)=>{fn(node);for(const child of node.children)if(typeof child!=='string')walk(child,fn);};walk(roots[0]!,node=>{if(node.name==='style'){if(node.children.some(c=>typeof c!=='string'))throw new Error('CSS SVG non valido');styles.push(node.children.join(''));}});const rules=svgCssRules(styles.join('\n'));walk(roots[0]!,node=>{node.attrs=resolveSvgCss(node.name,node.attrs,rules);if(node.attrs['clip-path']){const match=node.attrs['clip-path'].match(/^url\(\s*#([a-zA-Z_][\w.:-]*)\s*\)$/),target=match?ids.get(match[1]!):undefined;if(!target||target.name!=='clipPath')throw new Error('Ritaglio SVG con riferimento non valido');const children=target.children.filter((child):child is Node=>typeof child!=='string');if(children.length!==1||!['path','rect'].includes(children[0]!.name))throw new Error('Sono supportati ritagli SVG rettangolari semplici');walk(target,n=>{if(n.attrs['clip-path'])throw new Error('Ritagli SVG annidati non ancora supportati');});}});
 let expanded=0,bytes=0;const chunks:string[]=[],encoder=new TextEncoder();
 // Emit into one bounded output. Bounding only after recursive string joins can
 // allocate gigabytes when a large local definition is referenced many times.
 const emit=(part:string)=>{bytes+=encoder.encode(part).length;if(bytes>GRAPHIC_IMPORT_LIMITS.svgBytes)throw Error('SVG espanso oltre 2 MB');chunks.push(part);};
 const attributes=(attrs:Record<string,string>)=>Object.entries(attrs).map(([k,v])=>` ${k}="${xml(v)}"`).join('');
 const render=(node:Node,chain:Node[]):void=>{
  if(++expanded>GRAPHIC_IMPORT_LIMITS.svgElements||chain.length>32)throw Error('Espansione SVG oltre i limiti');
  if(chain.includes(node))throw Error('Riferimenti SVG ciclici');
  if(node.name==='style')return;
  if(node.name==='defs'){
   const clips=node.children.filter((child):child is Node=>typeof child!=='string'&&child.name==='clipPath');
   if(clips.length){emit('<defs>');for(const child of clips)render(child,[...chain,node]);emit('</defs>');}return;
  }
  if(node.name==='use'){
   const ref=node.attrs.href??node.attrs['xlink:href'];if(!ref||node.attrs.width||node.attrs.height)throw Error('Riferimento SVG non supportato');
   const target=ids.get(ref.slice(1));if(!target)throw Error('Riferimento SVG mancante');
   const attrs={...node.attrs};delete attrs.href;delete attrs['xlink:href'];delete attrs.id;
   const x=attrs.x??'0',y=attrs.y??'0';if(!/^[+-]?(?:\d*\.\d+|\d+\.?\d*)(?:e[+-]?\d+)?$/i.test(x)||!/^[+-]?(?:\d*\.\d+|\d+\.?\d*)(?:e[+-]?\d+)?$/i.test(y))throw Error('Posizione del riferimento SVG non valida');
   delete attrs.x;delete attrs.y;attrs.transform=`${attrs.transform??''} translate(${x} ${y})`;emit(`<g${attributes(attrs)}>`);render(target,[...chain,node]);emit('</g>');return;
  }
  const attrs={...node.attrs};if(node.name!=='clipPath')delete attrs.id;
  if(node.name==='symbol'){if(attrs.viewBox||attrs.width||attrs.height||attrs.overflow&&attrs.overflow!=='visible')throw Error('Viewport del simbolo SVG non ancora supportato');delete attrs.overflow;}
  const name=node.name==='symbol'?'g':node.name;emit(`<${name}${attributes(attrs)}>`);
  for(const child of node.children){if(typeof child==='string')emit(xml(child));else render(child,[...chain,node]);}emit(`</${name}>`);
 };render(roots[0]!,[]);return chunks.join('');
}
