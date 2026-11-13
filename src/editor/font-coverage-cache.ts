import { fontAssetBytes, type FontAsset } from './font-assets';
import { readCmapCoverage, UnicodeCoverageSchema, type UnicodeRange } from './font-cmap';
export interface FontInspectionOptions { resolveWoff2?: (asset: FontAsset) => Promise<readonly UnicodeRange[] | undefined>; includeHidden?: boolean; }
interface Entry { ranges?: UnicodeRange[]; promise?: Promise<UnicodeRange[] | undefined>; }
const entries = new Map<string, Entry>();
const byAsset = new WeakMap<FontAsset, { format: string; data: string; entry: Entry }>();
const listeners = new Set<() => void>(); let version = 0;
export const fontCoverageVersion = () => version;
export function subscribeFontCoverage(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function entryFor(asset: FontAsset, server = false): Entry {
  const previous = !server ? byAsset.get(asset) : undefined;
  if (previous?.format === asset.format && previous.data === asset.dataBase64 && previous.entry.ranges) return previous.entry;
  const key = `${server ? 'server' : 'browser'}:${asset.format}:${asset.dataBase64}`;
  let entry = entries.get(key);
  if (!entry) { if (entries.size >= 32) entries.delete(entries.keys().next().value!); entry = {}; entries.set(key, entry); }
  if (!server) byAsset.set(asset, { format: asset.format, data: asset.dataBase64, entry });
  return entry;
}
function cmapTable(asset: FontAsset): { bytes: Uint8Array; originalLength: number } | undefined {
  try {
    if (!['ttf', 'otf', 'woff'].includes(asset.format)) return;
    const bytes = fontAssetBytes(asset), view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length), woff = asset.format === 'woff';
    const count = view.getUint16(woff ? 12 : 4), start = woff ? 44 : 12, stride = woff ? 20 : 16;
    if (count > 4096 || start + count * stride > bytes.length) return;
    for (let i = 0; i < count; i++) {
      const at = start + i * stride;
      if (String.fromCharCode(...bytes.subarray(at, at + 4)) !== 'cmap') continue;
      const offset = view.getUint32(at + (woff ? 4 : 8)), length = view.getUint32(at + (woff ? 8 : 12)), originalLength = woff ? view.getUint32(at + 12) : length;
      if (length > 1024 * 1024 || originalLength > 1024 * 1024 || originalLength < length || offset + length > bytes.length) return;
      return { bytes: bytes.subarray(offset, offset + length), originalLength };
    }
  } catch { return; }
}
/** Only byte-derived ranges. No network or decompression in a native measure. */
export function peekFontCoverage(asset: FontAsset): readonly UnicodeRange[] | undefined {
  const entry = entryFor(asset);
  if (entry.ranges) return entry.ranges;
  const table = cmapTable(asset);
  if (table && table.bytes.length === table.originalLength) entry.ranges = readCmapCoverage(table.bytes);
  return entry.ranges;
}
export function readFontCoverage(asset: FontAsset, options: FontInspectionOptions = {}): Promise<UnicodeRange[] | undefined> {
  const entry = entryFor(asset, !!options.resolveWoff2);
  if (entry.ranges) return Promise.resolve(entry.ranges);
  if (entry.promise) return entry.promise;
  const pending = (async () => {
    try {
      if (asset.format === 'woff2') {
        if (options.resolveWoff2) { const ranges = await options.resolveWoff2(asset); return ranges ? UnicodeCoverageSchema.parse(ranges) : undefined; }
        if (typeof window === 'undefined' || !import.meta.env.DEV) return;
        const response = await fetch('/__editor-local/admin/font-coverage', { method: 'POST', headers: { 'X-Editor-Local': '1', 'Content-Type': 'font/woff2' }, body: fontAssetBytes(asset).buffer, signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw Error('Controllo font locale non disponibile');
        const result = await response.json(); return result.ranges ? UnicodeCoverageSchema.parse(result.ranges) : undefined;
      }
      const table = cmapTable(asset); if (!table) return;
      if (table.bytes.length === table.originalLength) return readCmapCoverage(table.bytes);
      const reader = new Blob([table.bytes as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();
      const parts: Uint8Array[] = []; let size = 0;
      try { for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > table.originalLength) return; parts.push(value); } }
      finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
      if (size !== table.originalLength) return;
      const bytes = new Uint8Array(size); let offset = 0; for (const part of parts) { bytes.set(part, offset); offset += part.length; }
      return readCmapCoverage(bytes);
    } catch { return; }
  })();
  entry.promise = pending;
  void pending.then(ranges => { const changed = !!ranges && entry.ranges !== ranges; entry.ranges = ranges; if (!ranges) entry.promise = undefined; if (changed) { version++; for (const listener of listeners) listener(); } });
  return pending;
}
