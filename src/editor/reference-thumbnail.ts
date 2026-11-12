import type { GraphicDocument } from './model';
import { exportDocumentThumbnail } from './fabric-adapter';
import { hasReferenceLayers, referenceLayers } from './reference-layers';

/** Read-only bounded composition. Artwork keeps its ink preview; materials
 * and fixtures keep their own colours. Productive exports are untouched. */
export async function exportReferenceThumbnail(document: GraphicDocument, side = 512): Promise<Blob> {
  if (!Number.isInteger(side) || side < 32 || side > 1024) throw Error('Dimensione miniatura non valida');
  if (!hasReferenceLayers(document)) return exportDocumentThumbnail(document,side);
  const layers = referenceLayers(document), element = window.document.createElement('canvas');
  const scale = side / Math.max(document.areaMm.width, document.areaMm.height);
  element.width = Math.max(1,Math.round(document.areaMm.width*scale));element.height = Math.max(1,Math.round(document.areaMm.height*scale));
  const context = element.getContext('2d');if (!context) throw Error('Anteprima non disponibile');
  try {
    for (const layer of [layers.background,layers.artwork,layers.foreground]) {
      if (!layer) continue;
      const uri = URL.createObjectURL(await exportDocumentThumbnail(layer,side)), image = new Image();
      try {image.src=uri;await image.decode();context.drawImage(image,0,0);} finally {URL.revokeObjectURL(uri);}
    }
    return await new Promise<Blob>((resolve,reject)=>element.toBlob(blob=>blob?resolve(blob):reject(Error('Anteprima non generata')),'image/png'));
  } finally {element.width=element.height=1;}
}
