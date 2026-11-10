import {FontChoiceScope} from '../editor/font-choice-scope';
import { readAdminSnapshot } from './api';
import { loadFontAssets, setFontVisibility, registeredFontAsset } from '../editor/fonts';
import {fontFamilyKey} from '../editor/font-family-key';
import type { FontAsset } from '../editor/font-assets';
import type { AdminSnapshot } from './schema';
/** A descriptive label must fit the portable asset without cutting a surrogate pair. */
export function libraryFontLabel(font:Pick<AdminSnapshot['fonts'][number],'source'|'family'|'actualFullName'>):string{
 const label=font.source==='google'?font.family:font.actualFullName&&font.actualFullName!==font.family?`${font.actualFullName} · ${font.family}`:font.family;
 return label.slice(0,160).replace(/[\uD800-\uDBFF]$/,'');
}
const choiceScope=new FontChoiceScope(setFontVisibility);
export const showProjectFontChoices=(assets:readonly FontAsset[]=[])=>choiceScope.setDocument(assets.map(asset=>asset.id));
export const includeIncomingFontChoices=(assets:readonly FontAsset[]=[])=>choiceScope.includePending(assets.map(asset=>asset.id));
type LibraryFont=AdminSnapshot['fonts'][number];
const loading=new Map<string,Promise<void>>();
async function loadLibraryFont(font:LibraryFont):Promise<void>{
 if(registeredFontAsset(`font-${font.id}`))return;
 const current=loading.get(font.id);if(current)return current;
 const pending=(async()=>{
  const response=await fetch(`/__editor-local/admin/font/${font.id}`,{headers:{'X-Editor-Local':'1'},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error(`Font ${font.family} non disponibile`);
  const bytes=new Uint8Array(await response.arrayBuffer());let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
  const asset:FontAsset={id:`font-${font.id}`,family:font.actualFamily??font.family,label:libraryFontLabel(font),format:font.format,dataBase64:btoa(binary),familyGroup:font.familyGroup??font.actualFamilyGroup??font.family,styleName:font.styleName??font.actualStyleName,weight:font.weight??font.actualWeight??400,italic:font.italic??font.actualItalic??false,...(font.sourceUrl?{sourceUrl:font.sourceUrl}:{}),...(font.licenseText?{licenseText:font.licenseText}:{})};
  await loadFontAssets([asset]);
 })().finally(()=>loading.delete(font.id));loading.set(font.id,pending);return pending;
}
/** Startup needs only the document files, or one named library face for a new design. */
export async function initializeLibraryFonts(documentAssets:readonly FontAsset[]=[]):Promise<void>{
 showProjectFontChoices(documentAssets);await loadFontAssets(documentAssets);
 const state=await readAdminSnapshot(),active=state.fonts.filter(font=>!font.archived);
 choiceScope.setLibrary(active.map(font=>`font-${font.id}`));
 if(documentAssets.length)return;
 const defaultFont=active.find(font=>fontFamilyKey(font.familyGroup??font.actualFamilyGroup??font.family)==='arial'&&(font.weight??font.actualWeight??400)===400&&!(font.italic??font.actualItalic??false))??[...active].sort((a,b)=>(a.familyGroup??a.family).localeCompare(b.familyGroup??b.family,'it')||Number(a.italic??a.actualItalic??false)-Number(b.italic??b.actualItalic??false)||Math.abs((a.weight??a.actualWeight??400)-400)-Math.abs((b.weight??b.actualWeight??400)-400))[0];
 if(defaultFont)await loadLibraryFont(defaultFont);
}
let pending:Promise<void>|null=null;
/** Small batches keep the canvas responsive; loaded immutable files are never fetched again. */
export async function refreshLibraryFonts(documentAssets:readonly FontAsset[]=[]):Promise<void>{
 showProjectFontChoices(documentAssets);await loadFontAssets(documentAssets);if(pending)return pending;
 pending=(async()=>{
  const state=await readAdminSnapshot(),active=state.fonts.filter(font=>!font.archived);
  choiceScope.setLibrary(active.map(font=>`font-${font.id}`));
  let failures=0;
  for(let offset=0;offset<active.length;offset+=4){const results=await Promise.allSettled(active.slice(offset,offset+4).map(loadLibraryFont));failures+=results.filter(result=>result.status==='rejected').length;await new Promise(resolve=>setTimeout(resolve,0));}
  if(failures)throw new Error(`${failures} font della libreria non caricabili. Controlla i file nel backend.`);
 })().finally(()=>{pending=null;});return pending;
}
