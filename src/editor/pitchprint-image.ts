import type { RasterSource } from './raster-source';
import { checkedRasterCrop } from './raster-geometry';
import { pitchprintNumber } from './pitchprint-units';

/** Fabric 3 stretches the sampled source rectangle to the declared object size.
 * Preserve that mapping explicitly, including page pixel rounding. Never round
 * crop coordinates or silently replace an unavailable original with a preview. */
export function pitchprintImageGeometry(item: Record<string, unknown>, source: RasterSource, axisX: number, axisY: number) {
  const width = pitchprintNumber(item.width, 'Larghezza immagine'), height = pitchprintNumber(item.height, 'Altezza immagine');
  if (width <= 0 || height <= 0) throw Error('Immagine priva di dimensioni positive.');
  const crop = checkedRasterCrop(source, {
    leftPx: pitchprintNumber(item.cropX ?? 0, 'Ritaglio X'), topPx: pitchprintNumber(item.cropY ?? 0, 'Ritaglio Y'),
    widthPx: Math.min(width, source.pixelWidth), heightPx: Math.min(height, source.pixelHeight),
  });
  const widthMm = width * axisX, heightMm = height * axisY;
  const pixelAspectRatio = widthMm * crop.heightPx / (heightMm * crop.widthPx);
  return { widthMm, heightMm, pixelAspectRatio, crop };
}

export function pitchprintImageUrl(item: Record<string, unknown>): string {
  const url = typeof item.url === 'string' && item.url ? item.url : typeof item.src === 'string' ? item.src : '';
  if (!url) throw Error('Immagine priva di sorgente.');
  let address:URL|undefined;try{address=new URL(url);}catch{}
  if(address&&['http:','https:'].includes(address.protocol)&&/\/(?:lowres|thumbs)\//i.test(address.pathname))throw Error('Manca l’originale verificato dell’immagine: l’anteprima non viene usata come file produttivo.');
  return url;
}
