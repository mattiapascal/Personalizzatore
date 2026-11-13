import type { FontAsset } from './font-assets';
import { readFontCoverage } from './font-coverage-cache';
import { fontSupportsCharacter, FontSupportCharactersSchema, FontSupportResultSchema, FONT_SUPPORT_BATCH_SIZE, FONT_SUPPORT_MAX_CHARACTERS, type FontSupportRequest, type FontSupportResult } from './font-support';
import { readAdminSnapshot } from '../editor-admin/api';
import type { AdminSnapshot } from '../editor-admin/schema';
export type SupportingFont = { source: 'document'; asset: FontAsset } | { source: 'library'; font: AdminSnapshot['fonts'][number]; revision: number; fileHash: string };
export interface FontSupportProgress { checked: number; total: number; unknown: number; candidates: SupportingFont[]; complete: boolean; }
interface Access {
  snapshot(signal: AbortSignal): Promise<AdminSnapshot>;
  batch(request: FontSupportRequest, signal: AbortSignal): Promise<FontSupportResult>;
  coverage(asset: FontAsset): ReturnType<typeof readFontCoverage>;
}
const local: Access = {
  snapshot: readAdminSnapshot, coverage: readFontCoverage,
  async batch(request, signal) {
    const response = await fetch('/__editor-local/admin/font-support', { method: 'POST', headers: { 'X-Editor-Local': '1', 'Content-Type': 'application/json' }, body: JSON.stringify(request), signal });
    const result = await response.json(); if (!response.ok) throw Error(result.error ?? 'Ricerca dei font non disponibile.');
    return FontSupportResultSchema.parse(result);
  },
};
/** Explicit cancellable analysis. No FontFace, font downloads or scene commands. */
export async function findSupportingFonts(assets: readonly FontAsset[], requested: readonly string[], progress: (value: FontSupportProgress) => void, signal: AbortSignal, access: Access = local): Promise<FontSupportProgress> {
  const characters = [...new Set(requested)];
  if (!characters.length || characters.length > FONT_SUPPORT_MAX_CHARACTERS) throw Error(`La ricerca accetta da 1 a ${FONT_SUPPORT_MAX_CHARACTERS} caratteri distinti. Per questo testo usa il menu Font.`);
  FontSupportCharactersSchema.parse(characters); signal.throwIfAborted();
  const snapshot = await access.snapshot(signal); signal.throwIfAborted();
  const known = new Set(assets.map(asset => asset.id)), fonts = snapshot.fonts.filter(font => !font.archived && !known.has(`font-${font.id}`));
  const state: FontSupportProgress = { checked: 0, total: assets.length + fonts.length, unknown: 0, candidates: [], complete: false };
  const publish = () => { signal.throwIfAborted(); progress({ ...state, candidates: [...state.candidates] }); };
  publish();
  for (const asset of assets) {
    signal.throwIfAborted(); const ranges = await access.coverage(asset); signal.throwIfAborted();
    if (!ranges) state.unknown++;
    else if (characters.every(character => fontSupportsCharacter(ranges, character))) state.candidates.push({ source: 'document', asset });
    state.checked++; publish();
  }
  for (let start = 0; start < fonts.length; start += FONT_SUPPORT_BATCH_SIZE) {
    signal.throwIfAborted(); const batch = fonts.slice(start, start + FONT_SUPPORT_BATCH_SIZE);
    const result = await access.batch({ schemaVersion: 1, expectedRevision: snapshot.revision, fontIds: batch.map(font => font.id), characters }, signal); signal.throwIfAborted();
    if (result.revision !== snapshot.revision || result.results.length !== batch.length || new Set(result.results.map(row => row.id)).size !== batch.length || batch.some(font => !result.results.some(row => row.id === font.id))) throw Error('Risultato della ricerca non coerente: ripeti il controllo.');
    for (const row of result.results) {
      if (row.status === 'unknown') state.unknown++;
      if (row.status === 'supported') {
        if (!row.fileHash || row.missing.length) throw Error('File non verificato nella risposta della ricerca.');
        state.candidates.push({ source: 'library', font: batch.find(font => font.id === row.id)!, revision: snapshot.revision, fileHash: row.fileHash });
      }
      state.checked++;
    }
    publish();
  }
  state.complete = true; publish(); return { ...state, candidates: [...state.candidates] };
}
