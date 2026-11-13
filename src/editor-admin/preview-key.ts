import{graphicPages}from'../editor/pages';
import{pngDescriptor,PNG_DECODING_POLICY}from'../editor/png-source';
import type { GraphicDocument } from '../editor/model';
import { productionDocument } from '../editor/object-properties';
import { hasReferenceLayers, referenceLayers } from '../editor/reference-layers';
export type ArchivePreviewMode = 'production' | 'technical';
/** Bump when renderer/output changes; metadata edits must not invalidate images. */
export const ARCHIVE_PREVIEW_RENDERER = 'png-3-fabric-7.4.0-text-paint';
export const ARCHIVE_PREVIEW_SIDE = 512;
export const ARCHIVE_PREVIEW_FONT_POLICY = 'strict-nominal-1';
export const ARCHIVE_PREVIEW_ORIGINAL_RASTER_POLICY = 'direct-source-1';
export const ARCHIVE_PREVIEW_PROCESSED_RASTER_POLICY = 'source-filter-grid-1';
export function archivePreviewContent(document: GraphicDocument, mode: ArchivePreviewMode = 'production'): string {
  document=graphicPages(document)[0]!;
  if (mode === 'technical' && hasReferenceLayers(document)) {
    const layers = referenceLayers(document);
    return JSON.stringify({renderer:'reference-layers-1',side:ARCHIVE_PREVIEW_SIDE,layers:{background:layers.background?archivePreviewContent(layers.background):null,artwork:archivePreviewContent(layers.artwork),foreground:layers.foreground?archivePreviewContent(layers.foreground):null}});
  }
  const visible = productionDocument(document);
  const fontIds = new Set(visible.objects.flatMap(object => object.type === 'text' ? [object.fontFamily, ...object.characterStyles?.flatMap(run => run.style.fontFamily ? [run.style.fontFamily] : []) ?? []] : []));
  return JSON.stringify({ renderer: ARCHIVE_PREVIEW_RENDERER,...(visible.objects.some(object=>object.type==='text'&&object.textPath?.showGuide&&object.textPath.guide.stroke!=='none'&&object.textPath.guide.strokeOpacity!==0&&(object.textPath.guide.strokeDash==='dotted'||(object.textPath.guide.type==='line'||object.textPath.guide.type==='vector')&&(object.textPath.guide.strokeLineCap??'round')!=='round'))?{guideStrokePolicy:'cap-and-dots-1'}:{}),...(visible.objects.some(object=>'clipMasks'in object&&object.clipMasks?.length||object.type==='text'&&object.textClipMasks?.length)?{maskSampling:'box-premultiplied-1'}:{}),...(visible.objects.some(o=>o.type==='image'&&o.source.mime==='image/png'&&pngDescriptor(o.source.dataUrl).special)?{pngPolicy:PNG_DECODING_POLICY}:{}), ...(visible.objects.some(object=>object.type==='image'&&object.raster.mode==='original')?{rasterPolicy:ARCHIVE_PREVIEW_ORIGINAL_RASTER_POLICY}:{}), ...(visible.objects.some(object=>object.type==='image'&&object.raster.mode!=='original')?{processedRasterPolicy:ARCHIVE_PREVIEW_PROCESSED_RASTER_POLICY}:{}), ...(fontIds.size ? { fontPolicy: ARCHIVE_PREVIEW_FONT_POLICY } : {}), side: ARCHIVE_PREVIEW_SIDE, area: document.areaMm, shape: document.shape,
    ...(document.paperColor?{paperColor:document.paperColor}:{}),
    ink: document.colorMode === 'color' ? 'original' : document.inkColor ?? 'black',
    objects: visible.objects.map(({ editor: _editor, visible: _visible, ...object }) => object),
    fonts: document.fontAssets?.filter(asset => fontIds.has(asset.id)).map(({id,format,dataBase64}) => ({id,format,dataBase64})).sort((a,b) => a.id.localeCompare(b.id)),
  });
}
export async function archivePreviewKey(document: GraphicDocument, mode: ArchivePreviewMode = 'production'): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(archivePreviewContent(document,mode)));
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
