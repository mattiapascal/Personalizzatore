import {FontChoiceScope} from '../editor/font-choice-scope';
import { readAdminSnapshot } from './api';
import { loadFontAssets, setFontVisibility, setFontMenuEntries, registeredFontAsset } from '../editor/fonts';
import {fontFamilyKey} from '../editor/font-family-key';
import type { FontAsset } from '../editor/font-assets';
import type { AdminSnapshot } from './schema';
import { fontAssetBytes } from '../editor/font-assets';
/** A descriptive label must fit the portable asset without cutting a surrogate pair. */
export function libraryFontLabel(font:Pick<AdminSnapshot['fonts'][number],'source'|'family'|'actualFullName'>):string{
 const label=font.source==='google'?font.family:font.actualFullName&&font.actualFullName!==font.family?`${font.actualFullName} · ${font.family}`:font.family;
 return label.slice(0,160).replace(/[\uD800-\uDBFF]$/,'');
}
const choiceScope=new FontChoiceScope(setFontVisibility);
export const showProjectFontChoices=(assets:readonly FontAsset[]=[])=>choiceScope.setDocument(assets.map(asset=>asset.id));
export const includeIncomingFontChoices=(assets:readonly FontAsset[]=[])=>choiceScope.includePending(assets.map(asset=>asset.id));
type LibraryFont=AdminSnapshot['fonts'][number];
function menuIndex(active:readonly LibraryFont[]){setFontMenuEntries(active.map(font=>({id:`font-${font.id}`,family:font.familyGroup??font.actualFamilyGroup??font.family,weight:font.weight??font.actualWeight??400,italic:font.italic??font.actualItalic??false})));}
const loading=new Map<string,Promise<void>>();
async function fontHash(bytes:Uint8Array<ArrayBuffer>){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(byte=>byte.toString(16).padStart(2,'0')).join('');}
async function loadLibraryFont(font:LibraryFont,signal?:AbortSignal,expectedHash?:string):Promise<void>{
 const verify=async()=>{const asset=registeredFontAsset(`font-${font.id}`);if(!asset||expectedHash&&await fontHash(fontAssetBytes(asset))!==expectedHash)throw Error('Il file non corrisponde a quello verificato: ripeti la ricerca dei font.');await loadFontAssets([asset]);};
 if(registeredFontAsset(`font-${font.id}`)){if(expectedHash)await verify();return;}
 const current=loading.get(font.id);if(current){await current;if(expectedHash)await verify();return;}
 const pending=(async()=>{
  const response=await fetch(`/__editor-local/admin/font/${font.id}`,{headers:{'X-Editor-Local':'1'},signal:signal??AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error(`Font ${font.family} non disponibile`);
  const bytes=new Uint8Array(await response.arrayBuffer());if(expectedHash&&await fontHash(bytes)!==expectedHash)throw Error('Il file non corrisponde a quello verificato: ripeti la ricerca dei font.');signal?.throwIfAborted();let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
  const asset:FontAsset={id:`font-${font.id}`,family:font.actualFamily??font.family,label:libraryFontLabel(font),format:font.format,dataBase64:btoa(binary),familyGroup:font.familyGroup??font.actualFamilyGroup??font.family,styleName:font.styleName??font.actualStyleName,weight:font.weight??font.actualWeight??400,italic:font.italic??font.actualItalic??false,...(font.sourceUrl?{sourceUrl:font.sourceUrl}:{}),...(font.licenseText?{licenseText:font.licenseText}:{})};
  await loadFontAssets([asset]);
 })().finally(()=>loading.delete(font.id));loading.set(font.id,pending);return pending;
}
/** An explicit search result prepares one exact file, never the whole library. */
export async function prepareLibraryFontChoice(id:string,revision:number,fileHash:string,signal:AbortSignal):Promise<FontAsset>{
 const state=await readAdminSnapshot(signal),font=state.fonts.find(font=>font.id===id&&!font.archived);
 if(state.revision!==revision||!font)throw Error('La libreria è cambiata: ripeti la ricerca dei font.');
 menuIndex(state.fonts.filter(font=>!font.archived));choiceScope.setLibrary(state.fonts.filter(font=>!font.archived).map(font=>`font-${font.id}`));
 await loadLibraryFont(font,signal,fileHash);signal.throwIfAborted();
 const asset=registeredFontAsset(`font-${id}`);if(!asset)throw Error('Il file font non è disponibile.');
 await loadFontAssets([asset]);signal.throwIfAborted();
 const hash=await fontHash(fontAssetBytes(asset));
 if(hash!==fileHash)throw Error('Il file non corrisponde a quello verificato: ripeti la ricerca dei font.');
 const latest=await readAdminSnapshot(signal);menuIndex(latest.fonts.filter(font=>!font.archived));choiceScope.setLibrary(latest.fonts.filter(font=>!font.archived).map(font=>`font-${font.id}`));if(latest.revision!==revision)throw Error('La libreria è cambiata: ripeti la ricerca dei font.');
 signal.throwIfAborted();return asset;
}
/** Startup needs only the document files, or one named library face for a new design. */
export async function initializeLibraryFonts(documentAssets:readonly FontAsset[]=[],signal=AbortSignal.timeout(8000)):Promise<void>{
 showProjectFontChoices(documentAssets);await loadFontAssets(documentAssets);
 const state=await readAdminSnapshot(signal);signal.throwIfAborted();const active=state.fonts.filter(font=>!font.archived);
 menuIndex(active);
 choiceScope.setLibrary(active.map(font=>`font-${font.id}`));
 if(documentAssets.length)return;
 const defaultFont=active.find(font=>fontFamilyKey(font.familyGroup??font.actualFamilyGroup??font.family)==='arial'&&(font.weight??font.actualWeight??400)===400&&!(font.italic??font.actualItalic??false))??[...active].sort((a,b)=>(a.familyGroup??a.family).localeCompare(b.familyGroup??b.family,'it')||Number(a.italic??a.actualItalic??false)-Number(b.italic??b.actualItalic??false)||Math.abs((a.weight??a.actualWeight??400)-400)-Math.abs((b.weight??b.actualWeight??400)-400))[0];
 if(defaultFont)await loadLibraryFont(defaultFont,signal);
}
let pending:Promise<void>|null=null;
/** Refresh availability on mount/focus without downloading unused font files. */
export async function refreshLibraryFontIndex(documentAssets:readonly FontAsset[]=[]):Promise<AdminSnapshot>{
 showProjectFontChoices(documentAssets);await loadFontAssets(documentAssets);
 const state=await readAdminSnapshot(AbortSignal.timeout(8000)),active=state.fonts.filter(font=>!font.archived);menuIndex(active);choiceScope.setLibrary(active.map(font=>`font-${font.id}`));return state;
}
/** Prepare only the selected text families so familiar B/I controls stay usable. */
export async function prepareLibraryFontFamilies(ids:readonly string[],documentAssets:readonly FontAsset[]=[],signal?:AbortSignal,state?:AdminSnapshot):Promise<void>{
 const families=new Set(ids.flatMap(id=>{const asset=registeredFontAsset(id);return asset?[fontFamilyKey(asset.familyGroup??asset.family)]:[];}));if(!families.size)return;
 const current=state??await refreshLibraryFontIndex(documentAssets),active=current.fonts.filter(font=>!font.archived&&families.has(fontFamilyKey(font.familyGroup??font.actualFamilyGroup??font.family)));
 const bounded=signal?AbortSignal.any([signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000);
 for(let offset=0;offset<active.length;offset+=4){bounded.throwIfAborted();await Promise.all(active.slice(offset,offset+4).map(font=>loadLibraryFont(font)));bounded.throwIfAborted();}
}
/** Small batches keep the canvas responsive; loaded immutable files are never fetched again. */
export async function refreshLibraryFonts(documentAssets:readonly FontAsset[]=[]):Promise<void>{
 showProjectFontChoices(documentAssets);await loadFontAssets(documentAssets);if(pending)return pending;
 pending=(async()=>{
  const state=await refreshLibraryFontIndex(documentAssets),active=state.fonts.filter(font=>!font.archived);
  let failures=0;
  for(let offset=0;offset<active.length;offset+=4){const results=await Promise.allSettled(active.slice(offset,offset+4).map(font=>loadLibraryFont(font)));failures+=results.filter(result=>result.status==='rejected').length;await new Promise(resolve=>setTimeout(resolve,0));}
  if(failures)throw new Error(`${failures} font della libreria non caricabili. Controlla i file nel backend.`);
 })().finally(()=>{pending=null;});return pending;
}
