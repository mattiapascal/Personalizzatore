import type {FontAsset} from '../src/editor/font-assets';
import type {UnicodeRange} from '../src/editor/font-cmap';
import {fontCoverage} from './font-coverage';

/** Per-export analysis of exact embedded WOFF2 contents. The headless page's
 * normal font preflight receives the same byte-derived result without making
 * HTTP writes or opening access to fonts outside the captured project. */
export class LocalRenderFontCoverage{
 private readonly known:Set<string>;
 private readonly inspected=new Map<string,readonly UnicodeRange[]|undefined>();
 constructor(assets:readonly FontAsset[]=[]){this.known=new Set(assets.filter(asset=>asset.format==='woff2').map(asset=>asset.dataBase64));}
 private inspect(data:string):readonly UnicodeRange[]|undefined{
  if(!this.known.has(data))return;
  if(!this.inspected.has(data))this.inspected.set(data,fontCoverage(Buffer.from(data,'base64'),'woff2'));
  return this.inspected.get(data)?.map(([start,end])=>[start,end] as const);
 }
 resolveWoff2=async(asset:FontAsset):Promise<readonly UnicodeRange[]|undefined>=>asset.format==='woff2'?this.inspect(asset.dataBase64):undefined;
 response(bytes:Buffer|null):{ranges:readonly UnicodeRange[]|null}|null{
  if(!bytes)return null;const data=bytes.toString('base64');if(!this.known.has(data))return null;
  return{ranges:this.inspect(data)??null};
 }
}
