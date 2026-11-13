import type { FontAsset } from './font-assets';
import { peekFontCoverage } from './font-coverage-cache';
import { textFontKey } from './text-render-guard';
import type { TextObject } from './text-style';

interface Identity { data: string; format: string; label?: string; family: string; weight?: number; italic?: boolean; token: number; }
const identities = new WeakMap<FontAsset, Identity>();
let token = 0;
/** Local invalidation identity, not proof of coverage or a persisted file hash.
 * Keep large binaries out of React keys. Changed bytes under the same ID/ref
 * invalidate the result; a fresh asset reference conservatively checks again. */
export function fontDiagnosticAssetKey(asset?: FontAsset): readonly [number, boolean] | null {
  if (!asset) return null;
  let identity = identities.get(asset);
  if (!identity || identity.data !== asset.dataBase64 || identity.format !== asset.format || identity.label !== asset.label || identity.family !== asset.family || identity.weight !== asset.weight || identity.italic !== asset.italic) {
    identity = { data: asset.dataBase64, format: asset.format, label: asset.label, family: asset.family, weight: asset.weight, italic: asset.italic, token: ++token };
    identities.set(asset, identity);
  }
  return [identity.token, peekFontCoverage(asset) !== undefined];
}

/** Neither geometry nor unrelated library files can change a glyph diagnosis. */
export function textFontDiagnosticKey(object: TextObject, assets: readonly FontAsset[]): string {
  const byId = new Map(assets.map(asset => [asset.id, asset]));
  const ids = new Set([object.fontFamily, ...object.characterStyles?.flatMap(run => run.style.fontFamily ? [run.style.fontFamily] : []) ?? []]);
  return JSON.stringify([object.id, textFontKey(object), [...ids].map(id => [id, fontDiagnosticAssetKey(byId.get(id))])]);
}
