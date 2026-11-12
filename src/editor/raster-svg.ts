import{originalPngSvgSource}from'./raster-cache';
import type { FabricImage } from 'fabric';
import type { RasterSource } from './raster-source';
import { checkedRasterCrop, type RasterCrop } from './raster-geometry';
import { jpegInfo, jpegWithoutApp1, jpegOrientationMatrix } from './jpeg-source';

/** Keep compressed original pixels in productive SVG. Fabric still supplies
 * placement/rotation/reflections; this viewport supplies crop and EXIF explicitly.
 * Never ask Fabric to encode a high-resolution JPEG as a much larger PNG. */
export function originalRasterSvg(image: FabricImage, source: RasterSource, rawCrop?: RasterCrop): void {
  const crop = checkedRasterCrop(source, rawCrop), serialize = image.toSVG.bind(image);
  let original: string | undefined;
  const getSrc = image.getSrc.bind(image);
  image.getSrc = filtered => filtered ? '' : getSrc(filtered); // No PNG encoding during SVG serialization.
  image.toSVG = reviver => {
    if (!original) {
      let href = source.dataUrl, width = source.pixelWidth, height = source.pixelHeight, transform = '';
      if (source.mime === 'image/jpeg') {
        const info = jpegInfo(source.dataUrl); width = info.rawWidth; height = info.rawHeight;
        const bytes = jpegWithoutApp1(source.dataUrl); let binary = '';
        for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
        href = `data:image/jpeg;base64,${btoa(binary)}`;
        transform = ` transform="matrix(${jpegOrientationMatrix(info.orientation, width, height).join(' ')})"`;
      }
      else href=originalPngSvgSource(source);
      original = `<svg x="${-image.width / 2}" y="${-image.height / 2}" width="${image.width}" height="${image.height}" viewBox="${crop.leftPx} ${crop.topPx} ${crop.widthPx} ${crop.heightPx}" preserveAspectRatio="none" overflow="hidden"><g${transform}><image x="0" y="0" width="${width}" height="${height}" xlink:href="${href}" /></g></svg>`;
    }
    const markup = serialize(), svg = markup.replace(/<image\b[^>]*(?:\/>|><\/image>)/, original);
    if(svg===markup)throw new Error('Serializzazione dell’immagine originale non riuscita.');
    return reviver ? reviver(svg) : svg;
  };
}
