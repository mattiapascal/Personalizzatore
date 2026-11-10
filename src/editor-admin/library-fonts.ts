import { readAdminSnapshot } from './api';
import { loadFontAssets, setFontVisibility } from '../editor/fonts';
import type { FontAsset } from '../editor/font-assets';
import type { AdminSnapshot } from './schema';
/** A descriptive label must fit the portable asset without cutting a surrogate pair. */
export function libraryFontLabel(font:Pick<AdminSnapshot['fonts'][number],'source'|'family'|'actualFullName'>):string{
 const label=font.source==='google'?font.family:font.actualFullName&&font.actualFullName!==font.family?`${font.actualFullName} · ${font.family}`:font.family;
 return label.slice(0,160).replace(/[\uD800-\uDBFF]$/,'');
}
let pending:Promise<void>|null=null;
export async function refreshLibraryFonts(documentAssets:readonly FontAsset[]=[]):Promise<void>{if(pending)return pending;pending=(async()=>{const state=await readAdminSnapshot(),active=state.fonts.filter(f=>!f.archived);const results=await Promise.allSettled(active.map(async font=>{const response=await fetch(`/__editor-local/admin/font/${font.id}`,{headers:{'X-Editor-Local':'1'}});if(!response.ok)throw new Error(`Font ${font.family} non disponibile`);const bytes=new Uint8Array(await response.arrayBuffer());let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);const label=libraryFontLabel(font);const asset:FontAsset={id:`font-${font.id}`,family:font.actualFamily??font.family,label,format:font.format,dataBase64:btoa(binary),familyGroup:font.familyGroup??font.actualFamilyGroup??font.family,styleName:font.styleName??font.actualStyleName,weight:font.weight??font.actualWeight??400,italic:font.italic??font.actualItalic??false,...(font.sourceUrl?{sourceUrl:font.sourceUrl}:{}),...(font.licenseText?{licenseText:font.licenseText}:{})};await loadFontAssets([asset]);}));await loadFontAssets(documentAssets);setFontVisibility([...active.map(f=>`font-${f.id}`),...documentAssets.map(f=>f.id)]);const failures=results.filter(result=>result.status==='rejected');if(failures.length)throw new Error(`${failures.length} font della libreria non caricabili. Controlla i file nel backend.`);})().finally(()=>{pending=null;});return pending;}
