import { inspectDocumentFonts, type FontReport } from './font-preflight';
import type { FontAsset } from './font-assets';
import type { TextObject } from './text-style';

export type TextRenderStatus = 'pending' | 'blocked' | 'ready';
interface Entry { key: string; fonts: readonly FontAsset[]; status: TextRenderStatus; report?: FontReport; }
/** Geometry and selection must not trigger another check on every frame. */
function key(object: TextObject): string {
  return JSON.stringify([object.text, object.fontFamily, object.fontWeight, object.fontStyle,
    object.characterStyles?.map(run => [run.start, run.end, run.style.fontFamily, run.style.fontWeight, run.style.fontStyle])]);
}
function sameFiles(a: readonly FontAsset[], b: readonly FontAsset[]): boolean {
  return a.length === b.length && a.every((font, index) => font.id === b[index]?.id && font.format === b[index]?.format && font.dataBase64 === b[index]?.dataBase64);
}
export class TextRenderGuard {
  private entries = new Map<string, Entry>();
  private disposed = false;
  constructor(private readonly changed: () => void, private readonly inspect = inspectDocumentFonts) {}
  status(object: TextObject, assets: readonly FontAsset[] = []): TextRenderStatus {
    const nextKey = key(object), fonts = assets.filter(asset => asset.id === object.fontFamily || object.characterStyles?.some(run => run.style.fontFamily === asset.id));
    const previous = this.entries.get(object.id);
    if (previous?.key === nextKey && sameFiles(previous.fonts, fonts)) return previous.status;
    if (this.disposed) return 'blocked';
    const entry: Entry = { key: nextKey, fonts: fonts.map(font => ({ ...font })), status: 'pending' };
    this.entries.set(object.id, entry);
    void this.inspect({ objects: [structuredClone(object)], fontAssets: [...entry.fonts] }).then(report => {
      if (this.disposed || this.entries.get(object.id) !== entry) return;
      entry.report = report; entry.status = report.issues.length ? 'blocked' : 'ready'; this.changed();
    }).catch(() => {
      if (this.disposed || this.entries.get(object.id) !== entry) return;
      entry.status = 'blocked'; this.changed();
    });
    return 'pending';
  }
  retry(): void { this.entries.clear(); }
  retain(ids: ReadonlySet<string>): void { for (const id of this.entries.keys()) if (!ids.has(id)) this.entries.delete(id); }
  dispose(): void { this.disposed = true; this.entries.clear(); }
}
