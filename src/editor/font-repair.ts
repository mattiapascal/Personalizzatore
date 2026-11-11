import { inspectDocumentFonts, type FontIssue } from './font-preflight';
import type { FontAsset } from './font-assets';
import { characterStyles, compressStyles } from './text-style';
import { objectCenter, placeObjectAtCenter, type GraphicDocument, type GraphicCommand, type Measure } from './model';

/** Explicit repair proposal. The caller still commits through updateObject and
 * its revision/permissions checks; this helper never edits the source document. */
export async function missingCharacterFontCommand(doc: GraphicDocument, issue: FontIssue, asset: FontAsset, measure: Measure): Promise<Extract<GraphicCommand, { tool: 'updateObject' }>> {
  if (issue.kind !== 'missing-characters' || !issue.characters?.length) throw Error('Seleziona una segnalazione di caratteri mancanti.');
  const object = doc.objects.find(object => object.id === issue.objectId);
  if (!object || object.type !== 'text') throw Error('Il testo segnalato non è più presente.');
  const current = await inspectDocumentFonts({ objects: [object], fontAssets: doc.fontAssets });
  const actual = current.issues.find(item => item.kind === 'missing-characters' && item.fontId === issue.fontId);
  const characters = Array.from(object.text), styles = characterStyles(object), missing = new Set(issue.characters.filter(character => actual?.characters?.includes(character)));
  const indices = characters.flatMap((character, index) => missing.has(character) && (styles[index]?.fontFamily ?? object.fontFamily) === issue.fontId ? [index] : []);
  if (!indices.length) throw Error('La segnalazione non corrisponde più al testo corrente.');
  const report = await inspectDocumentFonts({ fontAssets: [asset], objects: [{ ...object, text: indices.map(index => characters[index]!).join(''), fontFamily: asset.id, fontWeight: 'normal', fontStyle: 'normal', characterStyles: undefined }] });
  if (report.issues.length) throw Error(report.issues.some(issue => issue.kind === 'unknown-coverage') ? 'La copertura del file scelto non è verificabile: scegli un altro file per questi caratteri.' : 'Il file scelto non contiene tutti i caratteri da correggere. Scegli un altro file della libreria.');
  for (const index of indices) styles[index] = { ...styles[index], fontFamily: asset.id, fontWeight: 'normal', fontStyle: 'normal' };
  const changed = placeObjectAtCenter({ ...object, characterStyles: compressStyles(styles) }, objectCenter(object, measure), measure);
  const existing = doc.fontAssets?.find(font => font.id === asset.id);
  if (existing && (existing.dataBase64 !== asset.dataBase64 || existing.format !== asset.format || existing.family !== asset.family)) throw Error('La risorsa originale del font è immutabile.');
  return { schemaVersion: 1, tool: 'updateObject', objectId: object.id, expectedRevision: doc.revision, arguments: { object: changed, ...(!existing ? { fontAssets: [asset] } : {}) } };
}
