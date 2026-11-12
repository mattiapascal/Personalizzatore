import { readFontCoverage as coverage, type FontInspectionOptions } from './font-coverage-cache';
export type { FontInspectionOptions } from './font-coverage-cache';
import { hasUnicode } from './font-cmap';
import type { GraphicDocument } from './model';

export interface FontIssue {
  objectId: string; fontId: string; fontLabel: string; pageId?:string; pageName?:string;
  kind: 'missing-characters' | 'synthetic-style' | 'unknown-coverage' | 'unembedded-font';
  characters?: string[];
}
export interface FontReport { issues: FontIssue[]; checkedFonts: number; }
/** Derives checks from exact embedded bytes, never client-supplied coverage metadata. */
export async function inspectDocumentFonts(doc: Pick<GraphicDocument, 'objects' | 'fontAssets'>&Partial<Pick<GraphicDocument,'otherPages'|'pageId'|'pageName'>>,options:FontInspectionOptions={}): Promise<FontReport> {
  const assets = new Map(doc.fontAssets?.map(asset => [asset.id, asset]) ?? []);
  const used = new Set<string>(), issues: FontIssue[] = [];
  const scenes=[{id:doc.pageId??'page-1',name:doc.pageName??'Pagina 1',objects:doc.objects},...doc.otherPages??[]];
  for(const scene of scenes){const pageInfo=doc.otherPages||doc.pageId?{pageId:scene.id,pageName:scene.name}:{};const addIssue=(issue:FontIssue)=>issues.push({...issue,...pageInfo});
  for (const object of scene.objects) {
    if (object.type !== 'text') continue;
    for(const fontId of new Set([object.fontFamily,...object.characterStyles?.flatMap(run=>run.style.fontFamily?[run.style.fontFamily]:[])??[]]))if(!fontId.startsWith('font-'))addIssue({objectId:object.id,fontId,fontLabel:fontId,kind:'unembedded-font'});
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
    // Empty fields still need the exact font for their caret, first line and
    // subsequent input. Warm its coverage just as for a field with glyphs.
    if (object.text.length === 0 && object.fontFamily.startsWith('font-')) byFont.set(object.fontFamily, { synthetic: object.fontWeight === 'bold' || object.fontStyle === 'italic', text: [] });
    for (const run of runs) { if (!run.fontId.startsWith('font-')) { if(!issues.some(issue=>issue.pageId===pageInfo.pageId&&issue.objectId===object.id&&issue.fontId===run.fontId&&issue.kind==='unembedded-font'))addIssue({objectId:object.id,fontId:run.fontId,fontLabel:run.fontId,kind:'unembedded-font'});continue; } const entry = byFont.get(run.fontId) ?? { synthetic: false, text: [] }; entry.synthetic ||= run.synthetic; entry.text.push(run.text.normalize('NFC')); byFont.set(run.fontId, entry); }
    for (const [fontId, entry] of byFont) {
      used.add(fontId);
      const asset = assets.get(fontId), fontLabel = asset?.label ?? asset?.family ?? fontId, base = { objectId: object.id, fontId, fontLabel };
      if (entry.synthetic) addIssue({ ...base, kind: 'synthetic-style' });
      const ranges = asset ? await coverage(asset,options) : undefined;
      if (!ranges) { addIssue({ ...base, kind: 'unknown-coverage' }); continue; }
      const supported = (character: string) => hasUnicode(ranges, character.codePointAt(0)!) || Array.from(character.normalize('NFD')).every(part => hasUnicode(ranges, part.codePointAt(0)!));
      const characters = [...new Set(entry.text.flatMap(text => Array.from(text)))].filter(character => !/[\n\p{Cf}\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/u.test(character) && !supported(character));
      if (characters.length) addIssue({ ...base, kind: 'missing-characters', characters });
    }
  }
  }
  const unknown = new Set(issues.filter(issue => issue.kind === 'unknown-coverage').map(issue => issue.fontId));
  return { issues, checkedFonts: used.size - unknown.size };
}

export function fontIssueMessage(issue: FontIssue): string {
  if(issue.pageName)return `${issue.pageName} · ${fontIssueMessage({...issue,pageName:undefined})}`;
  if(issue.kind==='unembedded-font')return `${issue.objectId}: il font «${issue.fontLabel}» non è incorporato. I font del computer non sono utilizzabili: scegli il file dalla libreria.`;
  if (issue.kind === 'missing-characters') {
    const describe = (value: string) => `${/\s/u.test(value) ? 'spazio' : value} (U+${value.codePointAt(0)!.toString(16).toUpperCase().padStart(4,'0')})`;
    const characters = issue.characters ?? [];
    return `${issue.objectId}: il font «${issue.fontLabel}» non contiene ${characters.slice(0,8).map(describe).join(', ')}${characters.length > 8 ? ` e altri ${characters.length - 8} caratteri` : ''}. Scegli un font che li contenga per tutto il box o per i soli caratteri interessati.`;
  }
  if (issue.kind === 'synthetic-style') return `${issue.objectId}: il grassetto o corsivo di «${issue.fontLabel}» è simulato. Scegli il file dello stile dall’ispettore.`;
  return `${issue.objectId}: copertura dei caratteri di «${issue.fontLabel}» non verificabile automaticamente. Riprova il controllo oppure scegli un file con copertura verificabile.`;
}

export async function assertDocumentFonts(doc: Pick<GraphicDocument, 'objects' | 'fontAssets'>&Partial<Pick<GraphicDocument,'otherPages'|'pageId'|'pageName'>>,options:FontInspectionOptions={}): Promise<FontReport> {
  const report = await inspectDocumentFonts(doc,options), blocking = report.issues.filter(issue => issue.kind !== 'unknown-coverage');
  if (blocking.length) throw new Error(fontIssueMessage(blocking[0]!));
  return report;
}

/** Output is stricter than an editable draft: unknown coverage is not proof
 * that the browser will use only the requested file. */
export async function assertOutputFonts(doc: Pick<GraphicDocument, 'objects' | 'fontAssets'>&Partial<Pick<GraphicDocument,'otherPages'|'pageId'|'pageName'>>, options: FontInspectionOptions = {}): Promise<FontReport> {
  const report = await inspectDocumentFonts(doc, options);
  if (report.issues.length) throw new Error(`Correggi i font prima di generare la grafica. ${fontIssueMessage(report.issues[0]!)}`);
  return report;
}
