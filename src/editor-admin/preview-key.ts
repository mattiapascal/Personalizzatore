import type { GraphicDocument } from '../editor/model';
import { productionDocument } from '../editor/object-properties';
/** Bump when renderer/output changes; metadata edits must not invalidate images. */
export const ARCHIVE_PREVIEW_RENDERER = 'png-1-fabric-7.4.0';
export const ARCHIVE_PREVIEW_SIDE = 512;
export const ARCHIVE_PREVIEW_FONT_POLICY = 'strict-nominal-1';
export function archivePreviewContent(document: GraphicDocument): string {
  const visible = productionDocument(document);
  const fontIds = new Set(visible.objects.flatMap(object => object.type === 'text' ? [object.fontFamily, ...object.characterStyles?.flatMap(run => run.style.fontFamily ? [run.style.fontFamily] : []) ?? []] : []));
  return JSON.stringify({ renderer: ARCHIVE_PREVIEW_RENDERER, ...(fontIds.size ? { fontPolicy: ARCHIVE_PREVIEW_FONT_POLICY } : {}), side: ARCHIVE_PREVIEW_SIDE, area: document.areaMm, shape: document.shape,
    ink: document.colorMode === 'color' ? 'original' : document.inkColor ?? 'black',
    objects: visible.objects.map(({ editor: _editor, ...object }) => object),
    fonts: document.fontAssets?.filter(asset => fontIds.has(asset.id)).map(({id,format,dataBase64}) => ({id,format,dataBase64})).sort((a,b) => a.id.localeCompare(b.id)),
  });
}
export async function archivePreviewKey(document: GraphicDocument): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(archivePreviewContent(document)));
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
