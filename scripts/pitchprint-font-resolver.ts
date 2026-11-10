import {readFile,realpath,stat} from 'node:fs/promises';import {join,sep} from 'node:path';import {createHash} from 'node:crypto';
import {fontStyleContext} from '../src/editor/font-face-choice';import {FontAssetSchema,type FontAsset} from '../src/editor/font-assets';import {fontNameKey,type PitchprintFontRequest} from '../src/editor/pitchprint-fonts';import {PitchprintFontResolutionSchema,type PitchprintFontResolution} from '../src/editor/pitchprint-font-resolution';
import {fontFileFormat} from './font-format';import {fontNames} from './font-names';import {assertExactFontIdentity} from './font-identity';import {validateFontFile} from './editor-font-upload';import {EditorAdminStore} from './editor-admin-store';
function publicSourceUrl(value:unknown):string|undefined{try{const url=new URL(String(value));return url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash&&url.href.length<=1000?url.href:undefined;}catch{return undefined;}}
const sha256=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
const request=(family:string,weight:number,italic:boolean):PitchprintFontRequest=>({family,weight,italic});
function originalId(hash:string){return `font-${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;}
export async function readCatalogPitchprintFont(directory:string,family:string,weight=400,italic=false):Promise<PitchprintFontResolution>{
 try{
 const catalogPath=join(directory,'font-catalog/catalog.json');if((await stat(catalogPath)).size>8*1024*1024)throw new Error('Catalogo font oltre il limite locale.');
 const catalog=JSON.parse(await readFile(catalogPath,'utf8'));if(!Array.isArray(catalog.items)||!catalog.fontFamilies)throw new Error('Catalogo font PitchPrint locale non valido.');
 const items=catalog.items.filter((item:any)=>typeof item.fontFamily==='string'&&fontNameKey(item.fontFamily)===fontNameKey(family));
 const files=items.length===1&&Array.isArray(items[0].files)?items[0].files.filter((file:any)=>['normal','italic'].includes(file.style)&&Number(file.weight)===weight&&(file.style==='italic')===italic):[];
 if(files.length!==1)throw new Error(`File esatto del font «${family}» (${weight}${italic?' corsivo':''}) non presente nel catalogo locale.`);
 const file=files[0];if(typeof file.path!=='string'||typeof file.sha256!=='string'||!/^[a-f0-9]{64}$/.test(file.sha256))throw new Error('Riferimento al file font non valido.');
 const root=await realpath(join(directory,'font-catalog/files')),path=await realpath(file.path);if(!path.startsWith(root+sep))throw new Error('Percorso font fuori dal catalogo locale.');if((await stat(path)).size>1024*1024)throw new Error('Font originale oltre 1 MB.');
 const bytes=await readFile(path),hash=sha256(bytes);if(hash!==file.sha256)throw new Error('Checksum del font diverso dal catalogo.');const format=fontFileFormat(bytes),dataBase64=bytes.toString('base64');validateFontFile({format,dataBase64});
 const names=fontNames(bytes,format),actualFamily=names.familyGroup??names.family;if(!actualFamily||!/[\p{L}\p{N}]/u.test(actualFamily))throw new Error('Famiglia del file originale non rilevabile.');
 // The catalog proves the CSS alias; the actual file must still have the exact
 // requested weight/style and a valid variable-font default.
 assertExactFontIdentity(bytes,format,actualFamily,weight,italic);
 const label=`${names.fullName??actualFamily} · originale del template`.slice(0,160).replace(/[\uD800-\uDBFF]$/,'');
 const sourceUrl=publicSourceUrl(file.url),asset=FontAssetSchema.parse({id:originalId(hash),family:names.postscriptName??names.fullName??actualFamily,familyGroup:actualFamily,styleName:names.styleName,label,weight,italic,format,dataBase64,...(sourceUrl?{sourceUrl}:{})});
 return PitchprintFontResolutionSchema.parse({kind:'pitchprint-font-resolution',requested:request(family,weight,italic),asset,evidence:{kind:'original-catalog',sha256:hash,catalogFamily:items[0].fontFamily}});
 }catch(error){const code=(error as NodeJS.ErrnoException).code;if(code==='ENOENT')throw new Error(`File originale di «${family}» (${weight}${italic?' corsivo':''}) non disponibile nell’archivio locale. Carica il file esatto nella libreria font.`);if(code==='EACCES')throw new Error(`Archivio originale di «${family}» non leggibile. Controlla i permessi del file locale.`);throw error;}
}
export async function readPitchprintFont(directory:string,family:string,weight=400,italic=false):Promise<FontAsset>{return (await readCatalogPitchprintFont(directory,family,weight,italic)).asset;}
export async function readInstalledPitchprintFont(directory:string,family:string,weight:number,italic:boolean):Promise<FontAsset|null>{
 const state=await new EditorAdminStore(directory).read(),candidates:{font:typeof state.fonts[number];score:number}[]=[];
 for(const font of state.fonts){if(font.archived)continue;const bytes=Buffer.from(font.dataBase64,'base64'),names=fontNames(bytes,font.format);if(names.weight!==weight||names.italic!==italic)continue;if(![font.family,font.familyGroup,names.family,names.familyGroup,names.fullName].some(name=>name&&fontNameKey(name)===fontNameKey(family)))continue;try{assertExactFontIdentity(bytes,font.format,family,weight,italic);}catch{continue;}const exact=[names.family,names.fullName].some(name=>name&&fontNameKey(name)===fontNameKey(family)),score=exact?0:fontStyleContext(names.styleName)===''?1:2;candidates.push({font,score});}
 const best=Math.min(...candidates.map(candidate=>candidate.score)),matches=candidates.filter(candidate=>candidate.score===best);if(!matches.length||best===2)return null;
 if(matches.some(({font})=>font.dataBase64!==matches[0]!.font.dataBase64))throw new Error(`Più file differenti dichiarano il font «${family}» con questo peso e stile. Occorre identificarlo esplicitamente; nessun fallback consentito.`);
 const font=matches[0]!.font,names=fontNames(Buffer.from(font.dataBase64,'base64'),font.format);return FontAssetSchema.parse({id:`font-${font.id}`,family:names.postscriptName??names.fullName??family,familyGroup:font.familyGroup??names.familyGroup,label:names.fullName??font.family,styleName:names.styleName,weight,italic,format:font.format,dataBase64:font.dataBase64,licenseText:font.licenseText,sourceUrl:font.sourceUrl});
}
export async function resolvePitchprintFont(libraryDirectory:string,catalogDirectory:string,family:string,weight:number,italic:boolean):Promise<PitchprintFontResolution>{
 const installed=await readInstalledPitchprintFont(libraryDirectory,family,weight,italic);
 if(installed){const bytes=Buffer.from(installed.dataBase64,'base64'),names=fontNames(bytes,installed.format),declaredNames=[names.family,names.fullName,names.familyGroup].filter((name):name is string=>!!name);return PitchprintFontResolutionSchema.parse({kind:'pitchprint-font-resolution',requested:request(family,weight,italic),asset:installed,evidence:{kind:'file-metadata',declaredNames,sha256:sha256(bytes)}});}
 const original=await readCatalogPitchprintFont(catalogDirectory,family,weight,italic),state=await new EditorAdminStore(libraryDirectory).read();
 const identical=state.fonts.find(font=>!font.archived&&font.format===original.asset.format&&font.dataBase64===original.asset.dataBase64);
 if(identical)original.asset={...original.asset,id:`font-${identical.id}`,...(identical.licenseText?{licenseText:identical.licenseText}:{})};
 return original;
}
