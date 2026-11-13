import type { ProductProfile } from '../catalog/schema';
import type { GraphicCatalogContext, GraphicDocument, SceneObject } from './model';
import { productionDocument } from './object-properties';
import { characterStyles } from './text-style';
import {assertProfileForPage} from './production-profile-link';

export const INK_STAMP_MIN_FONT_PT = 7;
/** Confirmed ink-stamp rule, distinct from the editor's technical capacity.
 * Embossing has no inferred minimum; an explicit catalog value still applies. */
export function minimumFontForProduct(product?: ProductProfile): number | null {
  if (!product) return null;
  return product.mechanism === 'emboss' ? product.constraints.minFontSizePt
    : Math.max(INK_STAMP_MIN_FONT_PT, product.constraints.minFontSizePt ?? INK_STAMP_MIN_FONT_PT);
}
export function documentTextProduct(document: GraphicDocument, catalog?: GraphicCatalogContext): ProductProfile | undefined {
  if (!document.productId || !catalog || document.catalogVersion !== catalog.version) return;
  return catalog.products.find(product => product.productId === document.productId
    && product.variantIds.includes(document.variantId ?? '') && product.profileVersion === document.catalogProductProfileVersion);
}
export function minimumFontForDocument(document: GraphicDocument, catalog?: GraphicCatalogContext): number | null {
  const catalogMinimum=minimumFontForProduct(documentTextProduct(document,catalog)),profile=document.productionProfile;
  const profileMinimum=profile?.kind==='stamp-ink'?Math.max(INK_STAMP_MIN_FONT_PT,profile.minFontSizePt??INK_STAMP_MIN_FONT_PT):profile?.minFontSizePt??null;
  const values=[catalogMinimum,profileMinimum].filter((value):value is number=>value!==null);return values.length?Math.max(...values):null;
}
/** Inspect only printed code points. An unused base size or a newline's style
 * must not reject a larger visible run. Legacy vertical compression counts. */
export function smallestPrintedFontPt(object: SceneObject): number | null {
  if (object.type !== 'text') return null;
  const styles = characterStyles(object), sizes = Array.from(object.text).flatMap((character, index) =>
    /\s/u.test(character) ? [] : [(styles[index]?.fontSizePt ?? object.fontSizePt) * (object.textScaleY ?? 1)]);
  return sizes.length ? Math.min(...sizes) : null;
}
export function textProductionIssues(document: GraphicDocument, minimumPt: number | null) {
  if (minimumPt === null) return [];
  return productionDocument(document).objects.flatMap(object => {
    const actualPt = smallestPrintedFontPt(object);
    return actualPt !== null && actualPt < minimumPt - 1e-7
      ? [{ objectId: object.id, label: object.editor?.label || object.id, actualPt, minimumPt }] : [];
  });
}
export function assertMinimumText(document: GraphicDocument, minimumPt: number | null): void {
  const issue = textProductionIssues(document, minimumPt)[0];
  if (issue) throw Error(`Il testo «${issue.label}» è sotto ${issue.minimumPt} pt (${Number(issue.actualPt.toFixed(3))} pt). Correggi il corpo prima di confermare questo modello.`);
}
export function assertDocumentTextProduction(document: GraphicDocument, catalog?: GraphicCatalogContext, requireKnownBinding = false): void {
  if(document.productionProfile)assertProfileForPage(document.productionProfile,document,catalog,requireKnownBinding);
  const product = documentTextProduct(document, catalog);
  if (requireKnownBinding && document.productId && !product) throw Error('Il profilo del modello non è disponibile o è cambiato: riapri il progetto prima della conferma.');
  if (requireKnownBinding && product && document.plaque) throw Error('La configurazione della targa non è compatibile con una montatura timbro.');
  assertMinimumText(document, minimumFontForDocument(document,catalog));
  if (product && product.mechanism !== 'emboss' || document.productionProfile?.kind==='stamp-ink') {
    const partial = (value: number | undefined) => value !== undefined && value > 0 && value < 1;
    const issue = productionDocument(document).objects.find(object => {
      if (object.type === 'image') return object.raster.mode === 'grayscale';
      if (object.type === 'text') {
        const guide=object.textPath?.showGuide?object.textPath.guide:null;
        if(guide&&guide.stroke!=='none'&&guide.strokeMm>0&&partial(guide.strokeOpacity))return true;
        const styles = characterStyles(object);
        return Array.from(object.text).some((character,index) => {
          if(/\s/u.test(character))return false;
          const style=styles[index],stroke=style?.stroke??object.stroke??'none',width=style?.strokeMm??object.strokeMm??.25;
          return partial(style?.fillOpacity??object.fillOpacity)||stroke!=='none'&&width>0&&partial(style?.strokeOpacity??object.strokeOpacity);
        });
      }
      return object.fill !== undefined && object.fill !== 'none' && partial(object.fillOpacity) || object.stroke !== 'none' && object.strokeMm>0 && partial(object.strokeOpacity);
    });
    if (issue) throw Error(`Il timbro richiede grafica in bianco/nero senza sfumature o trasparenze parziali: correggi «${issue.editor?.label || issue.id}» prima di confermare.`);
  }
}
