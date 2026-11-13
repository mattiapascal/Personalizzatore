export type UnicodeRange = readonly [number, number];
import { z } from 'zod';
export const UnicodeCoverageSchema=z.array(z.tuple([z.number().int().min(0).max(0x10ffff),z.number().int().min(0).max(0x10ffff)])).max(4096).refine(ranges=>ranges.every(([start,end],index)=>start<=end&&(!index||start>ranges[index-1]![1])),'Mappa Unicode non valida');

/** Nominal Unicode coverage only. Unknown/invalid tables never mean universal support. */
export function readCmapCoverage(bytes: Uint8Array): UnicodeRange[] | undefined {
  try {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (bytes.length < 4 || view.getUint16(0) !== 0) return;
    const count = view.getUint16(2);
    if (count > 256 || 4 + count * 8 > bytes.length) return;
    const candidates: { offset: number; format: number }[] = [];
    for (let i = 0; i < count; i++) {
      const at = 4 + i * 8, platform = view.getUint16(at), encoding = view.getUint16(at + 2), offset = view.getUint32(at + 4);
      if (!(platform === 0 || platform === 3 && [1, 10].includes(encoding)) || offset + 2 > bytes.length) continue;
      const format = view.getUint16(offset);
      if (format === 4 || format === 12) candidates.push({ offset, format });
    }
    candidates.sort((a, b) => b.format - a.format);
    const selected = candidates[0]; if (!selected) return;
    const base = selected.offset, ranges: [number, number][] = [];
    const add = (start: number, end: number) => {
      if (start > end) return;
      const previous = ranges.at(-1);
      if (previous && start <= previous[1] + 1) previous[1] = Math.max(previous[1], end);
      else ranges.push([start, end]);
      if (ranges.length > 4096) throw new Error('Mappa troppo complessa');
    };
    if (selected.format === 12) {
      const length = view.getUint32(base + 4), groups = view.getUint32(base + 12);
      if (length < 16 || base + length > bytes.length || groups > 65536 || 16 + groups * 12 > length) return;
      let previous = -1;
      for (let i = 0; i < groups; i++) {
        const at = base + 16 + i * 12, start = view.getUint32(at), end = view.getUint32(at + 4), glyph = view.getUint32(at + 8);
        if (start > end || end > 0x10ffff || start <= previous || glyph + end - start > 65535) return;
        previous = end; add(start + (glyph === 0 ? 1 : 0), end);
      }
    } else {
      const length = view.getUint16(base + 2), segments = view.getUint16(base + 6) / 2;
      if (!Number.isInteger(segments) || segments < 1 || segments > 8192 || 16 + segments * 8 > length || base + length > bytes.length) return;
      let previous = -1;
      for (let i = 0; i < segments; i++) {
        const end = view.getUint16(base + 14 + i * 2), start = view.getUint16(base + 16 + segments * 2 + i * 2);
        const delta = view.getInt16(base + 16 + segments * 4 + i * 2), pointer = base + 16 + segments * 6 + i * 2, offset = view.getUint16(pointer);
        // Legacy writers may put FFFF in the empty closing segment. It is
        // never dereferenced; offsets for actual characters remain strict.
        const emptyLegacyEnd = i === segments - 1 && start === 0xffff && end === 0xffff && offset === 0xffff;
        if (start > end || start <= previous || (offset % 2 && !emptyLegacyEnd)) return;
        previous = end;
        for (let code = start; code <= end && code < 0xffff; code++) {
          let glyph = 0;
          if (!offset) glyph = (code + delta) & 0xffff;
          else {
            const at = pointer + offset + (code - start) * 2;
            if (at < base + 16 + segments * 8 || at + 2 > base + length) return;
            const index = view.getUint16(at); if (index) glyph = (index + delta) & 0xffff;
          }
          if (glyph) add(code, code);
        }
      }
    }
    return ranges;
  } catch { return; }
}

export function hasUnicode(ranges: readonly UnicodeRange[], code: number): boolean {
  let first = 0, last = ranges.length - 1;
  while (first <= last) {
    const middle = (first + last) >>> 1, range = ranges[middle]!;
    if (code < range[0]) last = middle - 1;
    else if (code > range[1]) first = middle + 1;
    else return true;
  }
  return false;
}
