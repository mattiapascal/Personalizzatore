import {Parser} from 'htmlparser2';
/** Remove only a standard SVG declaration for parsing; original bytes stay in storage. */
export function svgMediaText(source:string):string{
 if(/<!ENTITY/i.test(source))throw Error('SVG con entità non consentite');
 const without=source.replace(/<!DOCTYPE\s+svg\s+PUBLIC\s+["']-\/\/W3C\/\/DTD SVG 1\.[01]\/\/EN["']\s+["']https?:\/\/www\.w3\.org\/Graphics\/SVG\/1\.[01]\/DTD\/svg1[01]\.dtd["']\s*>/g,'');
 if(/<!DOCTYPE/i.test(without))throw Error('Dichiarazione SVG esterna non consentita');return without.replace(/<!--[\s\S]*?-->/g,'').replace(/^\uFEFF/,'');
}
export const looksLikeMediaSvg=(source:string)=>/^\s*(?:<\?xml|<!--|<!DOCTYPE|<svg[\s>])/i.test(source);
/** Passive self-contained SVG, including gradients and simple CSS; no fallback fonts. */
export function validateMediaSvg(original:string):void{
 if(new TextEncoder().encode(original).length>2*1024*1024)throw Error('SVG oltre 2 MB');const source=svgMediaText(original);
 const allowed=new Set(['style','svg','g','defs','title','desc','metadata','path','rect','circle','ellipse','line','polyline','polygon','linearGradient','radialGradient','stop','clipPath','mask','use','symbol']);let count=0,depth=0,roots=0,styleDepth=0;
 const external=(text:string)=>/javascript:|https?:|data:|\/\//i.test(text)||/url\s*\(/i.test(text.replace(/url\(\s*#[\w.:-]+\s*\)/gi,''));
 const parser=new Parser({onopentag(name,attrs){if(!allowed.has(name)||++count>10000||++depth>64)throw Error(name==='text'||name==='tspan'?'SVG con testo: converti i caratteri in contorni per evitare font sostitutivi':'SVG con elementi attivi o complessità non supportati dalla libreria');if(name==='style')styleDepth=depth;if(name==='svg'&&depth===1)roots++;for(const[k,v]of Object.entries(attrs)){if(/^on/i.test(k)||external(v)&&!/^xmlns(?::\w+)?$/.test(k)||/(?:href)$/i.test(k)&&!/^#[\w.:-]+$/.test(v)||k==='style'&&/@|\\/.test(v))throw Error('SVG con risorse esterne o codice attivo');}},ontext(text){if(styleDepth&&(external(text)||/@|\\/.test(text)))throw Error('Stile SVG con risorse esterne');},onclosetag(){if(depth===styleDepth)styleDepth=0;depth--;},onprocessinginstruction(name){if(name!=='?xml')throw Error('Istruzione SVG non consentita');}},{xmlMode:true,decodeEntities:true});parser.write(source);parser.end();if(roots!==1||depth!==0||!/^\s*(?:<\?xml[^>]*>\s*)?<svg[\s>]/.test(source))throw Error('File SVG non valido');
}
