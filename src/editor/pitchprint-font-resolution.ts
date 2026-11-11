import {fontIdentityNameKey} from './font-family-key';
import {verifiedPitchprintCssFace} from './pitchprint-css-faces';
import {z} from 'zod';
import {FontAssetSchema,fontAssetBytes,type FontAsset} from './font-assets';
import {fontNameKey,type PitchprintFontRequest} from './pitchprint-fonts';
const RequestSchema=z.strictObject({family:z.string().trim().min(1).max(120),weight:z.number().int().min(1).max(1000),italic:z.boolean()});
export const PitchprintFontResolutionSchema=z.strictObject({
 kind:z.literal('pitchprint-font-resolution'),requested:RequestSchema,asset:FontAssetSchema.safeExtend({weight:z.number().int().min(1).max(1000),italic:z.boolean()}),
 evidence:z.discriminatedUnion('kind',[
  z.strictObject({kind:z.literal('file-metadata'),declaredNames:z.array(z.string().trim().min(1).max(120)).min(1).max(3),sha256:z.string().regex(/^[a-f0-9]{64}$/)}),
  z.strictObject({kind:z.literal('original-catalog'),sha256:z.string().regex(/^[a-f0-9]{64}$/),catalogFamily:z.string().trim().min(1).max(120)}),
  z.strictObject({kind:z.literal('original-css-face'),sha256:z.string().regex(/^[a-f0-9]{64}$/),catalogFamily:z.string().trim().min(1).max(120)}),
 ]),
});
export type PitchprintFontResolution=z.infer<typeof PitchprintFontResolutionSchema>;
export type PitchprintFontResult=FontAsset|PitchprintFontResolution;
const checksums=new Map<string,Promise<string>>();
async function checksum(asset:FontAsset):Promise<string>{let pending=checksums.get(asset.dataBase64);if(!pending){if(checksums.size>=16)checksums.delete(checksums.keys().next().value!);pending=crypto.subtle.digest('SHA-256',fontAssetBytes(asset).buffer).then(digest=>[...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join(''));checksums.set(asset.dataBase64,pending);pending.catch(()=>checksums.delete(asset.dataBase64));}return pending;}
export async function checkedPitchprintFont(raw:PitchprintFontResult,requested:PitchprintFontRequest):Promise<{asset:FontAsset;warnings:string[]}>{
 const wrapped=!!raw&&typeof raw==='object'&&'kind' in raw,proof=wrapped?PitchprintFontResolutionSchema.parse(raw):undefined,asset=proof?.asset??FontAssetSchema.parse(raw);
 const cssFace=proof?.evidence.kind==='original-css-face'?verifiedPitchprintCssFace(requested,proof.evidence.sha256,asset.weight??400,!!asset.italic,asset.sourceUrl):undefined;
 if(proof?.evidence.kind==='original-css-face'&&!cssFace)throw new Error('Collegamento alla faccia CSS originale non verificato. Nessun fallback consentito.');
 if(!cssFace&&((asset.weight??400)!==requested.weight||!!asset.italic!==requested.italic))throw new Error(`Il file di ${requested.family} non corrisponde al peso/stile richiesto. Nessun fallback consentito.`);
 if(proof){
  if(fontNameKey(proof.requested.family)!==fontNameKey(requested.family)||proof.requested.weight!==requested.weight||proof.requested.italic!==requested.italic)throw new Error('La risoluzione del font appartiene a una richiesta diversa.');
  if(proof.evidence.kind==='file-metadata'&&(!fontIdentityNameKey(requested.family)||!proof.evidence.declaredNames.some(name=>fontIdentityNameKey(name)===fontIdentityNameKey(requested.family))))throw new Error('I nomi interni del file non corrispondono al font richiesto.');
  if(proof.evidence.kind!=='file-metadata'&&fontNameKey(proof.evidence.catalogFamily)!==fontNameKey(requested.family))throw new Error('La voce del catalogo non corrisponde al font richiesto.');
  const hash=await checksum(asset);
  if(hash!==proof.evidence.sha256)throw new Error('Il file font ricevuto non corrisponde all’hash verificato.');
 }
 const nameMatches=[asset.family,asset.familyGroup].some(name=>name&&fontNameKey(name)===fontNameKey(requested.family));
 if(!nameMatches&&!proof)throw new Error(`Il font ricevuto non dichiara «${requested.family}» e manca un collegamento verificato al catalogo originale.`);
 const warnings=cssFace?[`Faccia CSS PitchPrint «${requested.family}»: peso nominale ${requested.weight}, file originale verificato con peso interno ${asset.weight}. Nessuno stile simulato.`]:proof?.evidence.kind==='original-catalog'&&!nameMatches?[`Alias PitchPrint «${requested.family}» collegato al file originale verificato «${asset.label??asset.family}».`]:[];
 return {asset,warnings};
}
