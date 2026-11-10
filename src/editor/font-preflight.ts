import { fontAssetBytes, type FontAsset } from './font-assets';
import { hasUnicode, readCmapCoverage, UnicodeCoverageSchema, type UnicodeRange } from './font-cmap';
import type { GraphicDocument } from './model';

export interface FontIssue {
  objectId: string; fontId: string; fontLabel: string;
  kind: 'missing-characters' | 'synthetic-style' | 'unknown-coverage';
  characters?: string[];
}
export interface FontReport { issues: FontIssue[]; checkedFonts: number; }
const cache = new Map<string, Promise<UnicodeRange[] | undefined>>();
export interface FontInspectionOptions {resolveWoff2?:(asset:FontAsset)=>Promise<readonly UnicodeRange[]|undefined>;}

async function coverage(asset: FontAsset,options:FontInspectionOptions): Promise<UnicodeRange[] | undefined> {
  const key = `${options.resolveWoff2?'server':'browser'}:${asset.format}:${asset.dataBase64}`, existing = cache.get(key); if (existing) return existing;
  const pending = (async () => {
    try {
      if(asset.format==='woff2'){
        if(options.resolveWoff2){const ranges=await options.resolveWoff2(asset);return ranges?UnicodeCoverageSchema.parse(ranges):undefined;}
        if(typeof window==='undefined'||!import.meta.env.DEV)return;
        const response=await fetch('/__editor-local/admin/font-coverage',{method:'POST',headers:{'X-Editor-Local':'1','Content-Type':'font/woff2'},body:fontAssetBytes(asset).buffer,signal:AbortSignal.timeout(10000)});
        if(!response.ok)throw new Error('Controllo font locale non disponibile');const result=await response.json();return result.ranges?UnicodeCoverageSchema.parse(result.ranges):undefined;
      }
      const bytes = fontAssetBytes(asset), view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length);
      const woff = asset.format === 'woff';
      if (!woff && asset.format !== 'ttf' && asset.format !== 'otf') return;
      const count = view.getUint16(woff ? 12 : 4), directory = woff ? 44 : 12, stride = woff ? 20 : 16;
      if (count > 4096 || directory + count * stride > bytes.length) return;
      for (let i = 0; i < count; i++) {
        const at = directory + i * stride;
        if (String.fromCharCode(...bytes.subarray(at, at + 4)) !== 'cmap') continue;
        const offset = view.getUint32(at + (woff ? 4 : 8)), length = view.getUint32(at + (woff ? 8 : 12));
        if (length > 1024 * 1024 || offset + length > bytes.length) return;
        let table: Uint8Array = bytes.subarray(offset, offset + length);
        if (woff) {
          const originalLength = view.getUint32(at + 12);
          if (originalLength > 1024 * 1024 || originalLength < length) return;
          if (originalLength !== length) {
            const reader = new Blob([table as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();
            const parts: Uint8Array[] = []; let size = 0;
            try {
              for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > originalLength) return; parts.push(value); }
            } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
            if (size !== originalLength) return;
            table = new Uint8Array(size); let start = 0; for (const part of parts) { table.set(part, start); start += part.length; }
          }
        }
        return readCmapCoverage(table);
      }
    } catch { return; }
  })();
  if (cache.size >= 32) cache.delete(cache.keys().next().value!);
  cache.set(key, pending); return pending;
}

/** Derives checks from exact embedded bytes, never client-supplied coverage metadata. */
export async function inspectDocumentFonts(doc: Pick<GraphicDocument, 'objects' | 'fontAssets'>,options:FontInspectionOptions={}): Promise<FontReport> {
  const assets = new Map(doc.fontAssets?.map(asset => [asset.id, asset]) ?? []);
  const used = new Set<string>(), issues: FontIssue[] = [];
  for (const object of doc.objects) {
    if (object.type !== 'text') continue;
    const runs: { fontId: string; synthetic: boolean; text: string }[] = [];
    for (const [index, character] of Array.from(object.text).entries()) {
      const style = object.characterStyles?.find(run => run.start <= index && run.end > index)?.style;
      const fontId = style?.fontFamily ?? object.fontFamily;
      const synthetic = (style?.fontWeight ?? object.fontWeight) === 'bold' || (style?.fontStyle ?? object.fontStyle) === 'italic';
      const previous = runs.at(-1);
      if (previous?.fontId === fontId && previous.synthetic === synthetic) previous.text += character;
      else runs.push({ fontId, synthetic, text: character });
    }
    const byFont = new Map<string, { synthetic: boolean; text: string[] }>();
    for (const run of runs) { if (!run.fontId.startsWith('font-')) continue; const entry = byFont.get(run.fontId) ?? { synthetic: false, text: [] }; entry.synthetic ||= run.synthetic; entry.text.push(run.text.normalize('NFC')); byFont.set(run.fontId, entry); }
    for (const [fontId, entry] of byFont) {
      used.add(fontId);
      const asset = assets.get(fontId), fontLabel = asset?.label ?? asset?.family ?? fontId, base = { objectId: object.id, fontId, fontLabel };
      if (entry.synthetic) issues.push({ ...base, kind: 'synthetic-style' });
      const ranges = asset ? await coverage(asset,options) : undefined;
      if (!ranges) { issues.push({ ...base, kind: 'unknown-coverage' }); continue; }
      const supported = (character: string) => hasUnicode(ranges, character.codePointAt(0)!) || Array.from(character.normalize('NFD')).every(part => hasUnicode(ranges, part.codePointAt(0)!));
      const characters = [...new Set(entry.text.flatMap(text => Array.from(text)))].filter(character => !/[\n\p{Cf}\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/u.test(character) && !supported(character));
      if (characters.length) issues.push({ ...base, kind: 'missing-characters', characters });
    }
  }
  const unknown = new Set(issues.filter(issue => issue.kind === 'unknown-coverage').map(issue => issue.fontId));
  return { issues, checkedFonts: used.size - unknown.size };
}

export function fontIssueMessage(issue: FontIssue): string {
  if (issue.kind === 'missing-characters') {
    const describe = (value: string) => `${/\s/u.test(value) ? 'spazio' : value} (U+${value.codePointAt(0)!.toString(16).toUpperCase().padStart(4,'0')})`;
    const characters = issue.characters ?? [];
    return `${issue.objectId}: il font «${issue.fontLabel}» non contiene ${characters.slice(0,8).map(describe).join(', ')}${characters.length > 8 ? ` e altri ${characters.length - 8} caratteri` : ''}. Scegli un font che li contenga per tutto il box o per i soli caratteri interessati.`;
  }
  if (issue.kind === 'synthetic-style') return `${issue.objectId}: il grassetto o corsivo di «${issue.fontLabel}» è simulato. Scegli il file della variante nel menu Variante font.`;
  return `${issue.objectId}: copertura dei caratteri di «${issue.fontLabel}» non verificabile automaticamente. Controlla l’anteprima; il testo non viene dichiarato verificato.`;
}

export async function assertDocumentFonts(doc: Pick<GraphicDocument, 'objects' | 'fontAssets'>,options:FontInspectionOptions={}): Promise<FontReport> {
  const report = await inspectDocumentFonts(doc,options), blocking = report.issues.filter(issue => issue.kind !== 'unknown-coverage');
  if (blocking.length) throw new Error(fontIssueMessage(blocking[0]!));
  return report;
}
