import {uniqueTags} from './archive-tags';
export const DEFAULT_FONT_CATEGORIES=['Serif','Sans-serif','Calligrafici','Decorativi','Monospaziati','Simboli'];
export function googleFontCategories(category:string|undefined):string[]{
 const key=category?.trim().toLowerCase().replace(/[ _]+/g,'-');
 return key?({serif:['Serif'],'sans-serif':['Sans-serif'],handwriting:['Calligrafici'],display:['Decorativi'],monospace:['Monospaziati']} as Record<string,string[]>)[key]??[]:[];
}
export function fontCategories(fonts:readonly {categories?:string[]}[]):string[]{return uniqueTags([...DEFAULT_FONT_CATEGORIES,...fonts.flatMap(font=>font.categories??[])]);}
