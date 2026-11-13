import { createHash } from 'node:crypto';
import { FontSupportRequestSchema, fontSupportsCharacter, type FontSupportResult } from '../src/editor/font-support';
import type { UnicodeRange } from '../src/editor/font-cmap';
import { fontCoverage } from './font-coverage';

export interface FontSearchIndex { revision: number; fonts: { id: string; archived: boolean; format: string }[]; }
export interface FontSupportAccess {
  readFontSearchIndex(): Promise<FontSearchIndex>;
  readFont(id: string): Promise<{ format: string; dataBase64: string } | undefined>;
}
/** Bounded byte-derived cache. Never retains font binaries or unknown proofs. */
export class FontSupportSearch {
  private cache = new Map<string, readonly UnicodeRange[]>();
  private ranges = 0;
  constructor(private readonly inspect = fontCoverage, private readonly maxEntries = 64, private readonly maxRanges = 32768) {}
  private coverage(bytes: Buffer, format: string, hash: string): readonly UnicodeRange[] | undefined {
    const key = `${format}:${hash}`, cached = this.cache.get(key);
    if (cached) { this.cache.delete(key); this.cache.set(key, cached); return cached; }
    let result: readonly UnicodeRange[] | undefined;
    try { result = this.inspect(bytes, format); } catch { return; }
    if (!result || result.length > this.maxRanges) return result;
    while (this.cache.size && (this.cache.size >= this.maxEntries || this.ranges + result.length > this.maxRanges)) {
      const oldest = this.cache.keys().next().value!; this.ranges -= this.cache.get(oldest)!.length; this.cache.delete(oldest);
    }
    if (this.maxEntries > 0) { const copy = result.map(range => [range[0], range[1]] as UnicodeRange); this.cache.set(key, copy); this.ranges += copy.length; return copy; }
    return result;
  }
  async batch(access: FontSupportAccess, raw: unknown, signal?: AbortSignal): Promise<FontSupportResult> {
    const request = FontSupportRequestSchema.parse(raw), before = await access.readFontSearchIndex();
    const assertRevision = (index: FontSearchIndex) => { if (index.revision !== request.expectedRevision) throw Object.assign(new Error('La libreria è cambiata: ripeti la ricerca dei font.'), { code: 'revision_conflict' }); };
    assertRevision(before);
    const active = new Map(before.fonts.filter(font => !font.archived).map(font => [font.id, font]));
    if (request.fontIds.some(id => !active.has(id))) throw Error('Il lotto contiene font assenti o archiviati. Ripeti la ricerca.');
    const results: FontSupportResult['results'] = [];
    for (const id of request.fontIds) {
      signal?.throwIfAborted();
      const file = await access.readFont(id);
      if (!file || file.format !== active.get(id)!.format) { results.push({ id, status: 'unknown', missing: [] }); continue; }
      const bytes = Buffer.from(file.dataBase64, 'base64');
      if (bytes.length > 1024 * 1024) { results.push({ id, status: 'unknown', missing: [] }); continue; }
      const fileHash = createHash('sha256').update(bytes).digest('hex'), ranges = this.coverage(bytes, file.format, fileHash);
      const missing = ranges ? request.characters.filter(character => !fontSupportsCharacter(ranges, character)) : [];
      results.push({ id, fileHash, status: !ranges ? 'unknown' : missing.length ? 'unsupported' : 'supported', missing });
      // Yield between files so cancellation and other local requests can run.
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
    signal?.throwIfAborted(); assertRevision(await access.readFontSearchIndex());
    return { schemaVersion: 1, revision: before.revision, results };
  }
}
