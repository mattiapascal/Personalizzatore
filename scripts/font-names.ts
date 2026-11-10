import { inflateSync } from 'node:zlib';
import { woff2AnalysisTable } from './woff2-tables';
export function fontTable(bytes: Buffer, format: string, tag: string): Buffer | undefined {
  if(format==='woff2')return woff2AnalysisTable(bytes,tag);
  try {
    if (format === 'ttf' || format === 'otf') {
      const count = bytes.readUInt16BE(4);
      for (let i = 0; i < count; i++) { const at = 12 + i * 16; if (bytes.toString('ascii', at, at + 4) === tag) { const start = bytes.readUInt32BE(at + 8), length = bytes.readUInt32BE(at + 12); if (start + length > bytes.length) return; return bytes.subarray(start, start + length); } }
    } else if (format === 'woff') {
      const count = bytes.readUInt16BE(12);
      for (let i = 0; i < count; i++) { const at = 44 + i * 20; if (bytes.toString('ascii', at, at + 4) === tag) { const start = bytes.readUInt32BE(at + 4), length = bytes.readUInt32BE(at + 8); if (start + length > bytes.length) return; const data = bytes.subarray(start, start + length); return data.length === bytes.readUInt32BE(at + 12) ? data : inflateSync(data, { maxOutputLength: 1024 * 1024 }); } }
    }
  } catch { return; }
}
export function fontNames(bytes: Buffer, format: string): { family?: string; postscriptName?:string; fullName?: string; familyGroup?: string; styleName?: string; weight?: number; italic?: boolean } {
  try {
    const table = fontTable(bytes, format, 'name'); if (!table || table.length < 6) return {};
    const found = new Map<number, { text: string; score: number }>(), count = table.readUInt16BE(2), offset = table.readUInt16BE(4);
    for (let i = 0; i < count; i++) {
      const at = 6 + i * 12; if (at + 12 > table.length) break;
      const platform = table.readUInt16BE(at), language = table.readUInt16BE(at + 4), id = table.readUInt16BE(at + 6), length = table.readUInt16BE(at + 8), start = offset + table.readUInt16BE(at + 10);
      if (![1,2,4,6,16,17].includes(id) || start + length > table.length) continue;
      const data = table.subarray(start, start + length), text = (platform === 0 || platform === 3 ? new TextDecoder('utf-16be').decode(data) : data.toString('latin1')).replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0,120), score = (platform === 3 ? 10 : platform === 0 ? 5 : 0) + (language === 0x409 ? 3 : 0);
      if (text && (!found.has(id) || found.get(id)!.score < score)) found.set(id, { text, score });
    }
    const os2 = fontTable(bytes, format, 'OS/2'), head = fontTable(bytes, format, 'head'), weight = os2 && os2.length >= 6 ? os2.readUInt16BE(4) : undefined;
    const italic = os2 && os2.length >= 64 ? !!(os2.readUInt16BE(62) & 1) : head && head.length >= 46 ? !!(head.readUInt16BE(44) & 2) : undefined;
    return { postscriptName:found.get(6)?.text, family: found.get(6)?.text ?? found.get(16)?.text ?? found.get(1)?.text, fullName: found.get(4)?.text ?? found.get(16)?.text ?? found.get(1)?.text, familyGroup: found.get(16)?.text ?? found.get(1)?.text, styleName: found.get(17)?.text ?? found.get(2)?.text, ...(weight && weight >= 1 && weight <= 1000 ? { weight } : {}), ...(italic === undefined ? {} : { italic }) };
  } catch { return {}; }
}

/** Classification hints from the actual file, never inferred from the filename. */
export function detectedFontCategories(bytes:Buffer,format:string):string[]{
 const result:string[]=[],os2=fontTable(bytes,format,'OS/2'),post=fontTable(bytes,format,'post');if(post&&post.length>=16&&post.readUInt32BE(12)>0)result.push('Monospaziati');
 if(os2&&os2.length>=42){const family=os2.readUInt16BE(30)>>8,panose=os2[32],serif=os2[33];if([1,2,3,4,5,7].includes(family))result.push('Serif');else if(family===8)result.push('Sans-serif');else if(family===10)result.push('Calligrafici');else if(family===9)result.push('Decorativi');else if(family===12)result.push('Simboli');else if(panose===2&&serif!==undefined){if(serif>=2&&serif<=10)result.push('Serif');else if(serif>=11&&serif<=15)result.push('Sans-serif');}else if(panose===3)result.push('Calligrafici');else if(panose===4)result.push('Decorativi');else if(panose===5)result.push('Simboli');}
 return [...new Set(result)];
}
