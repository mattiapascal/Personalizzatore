import type {FontAsset} from './font-assets';
/** Width/design qualifiers are independent of bold and italic. */
export function fontStyleContext(style=''):string{
 return style.toLowerCase().replace(/(?:extra|ultra|semi|demi)[\s-]*(?:light|bold)/g,' ').replace(/\b(?:regular|normal|normale|roman|book|medium|light|thin|bold|black|heavy|italic|oblique|corsivo|[1-9]\d{1,3})\b/g,' ').replace(/[\s_-]+/g,'').trim();
}
export function exactStyleVariant(current:FontAsset,candidates:readonly FontAsset[],weight:number,italic:boolean):FontAsset|undefined{
 const matches=candidates.filter(asset=>(asset.weight??400)===weight&&!!asset.italic===italic&&fontStyleContext(asset.styleName)===fontStyleContext(current.styleName));
 if(!matches.length||matches.some(asset=>asset.format!==matches[0]!.format||asset.dataBase64!==matches[0]!.dataBase64))return undefined;
 return matches[0];
}
