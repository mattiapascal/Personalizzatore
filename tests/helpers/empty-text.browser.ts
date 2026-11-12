import { importPitchPrint } from '../../src/editor/pitchprint-import';
import { graphicPages } from '../../src/editor/pages';
import { exportDocumentSvg } from '../../src/editor/fabric-adapter';
import { type FontAsset } from '../../src/editor/font-assets';
import { pitchprintPageReferenceSvg } from './pitchprint-page-reference.browser';
import { compareSupersampledSvg } from './svg-color-reference.browser';

/** Refuse removal must not alter any visible glyph or the page count. */
export async function emptyTextImportProof(source: any, assets: FontAsset[]) {
  const original = JSON.stringify(source), asset = assets.find(f => f.familyGroup === 'Arimo' && f.weight === 400 && !f.italic)!, requested: string[] = [];
  const options = {monochrome: false, excludeBackground: false, font: async (family: string) => {requested.push(family); if(family !== 'Arimo') throw Error('Font esatto assente'); return asset;}, image: async () => {throw Error('Nessuna immagine TEST');}};
  const converted = await importPitchPrint(source, options), pages = graphicPages(converted.document), results = [];
  for (const [index, doc] of pages.entries()) {
    const reference = await pitchprintPageReferenceSvg({...source, pages: [source.pages[index]]}, converted.document.fontAssets!, {}, () => asset);
    const svg = await exportDocumentSvg(doc);
    results.push({ids: doc.objects.map(o=>o.id), text: doc.objects.map(o=>o.type==='text'?o.text:null), pixels: await compareSupersampledSvg(reference, svg, 800, 480)});
  }
  const broken = structuredClone(source); broken.pages[1].canvas.objects[0].fontFamily = 'Font visibile assente TEST';
  let rejected = '';
  try {await importPitchPrint(broken, options);} catch (error) {rejected = String(error);}
  return {document: converted.document, warnings: converted.warnings, requested, results, unchanged: JSON.stringify(source) === original, rejected};
}
