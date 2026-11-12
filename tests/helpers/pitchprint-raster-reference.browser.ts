import type { FabricImage } from 'fabric';
const escapeXml = (value: string) => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
/** Fabric 3's image drawImage sampling stretches the sampled source rectangle
 * to the declared frame. Fabric 7's SVG serializer emits the bitmap at its
 * natural pixel size, which is not equivalent when the frame exceeds it.
 * Keep Fabric's native group/transform export, replace only the image plane.
 * No importer, canonical crop/geometry, or matrix helper is used here. */
export function legacyImageReferenceMarkup(image: FabricImage): string[] {
  const element=image.getElement() as HTMLImageElement, width=element.naturalWidth||element.width, height=element.naturalHeight||element.height,
    frameWidth=image.width, frameHeight=image.height, cropX=image.cropX, cropY=image.cropY,
    sampledWidth=Math.min(frameWidth,width), sampledHeight=Math.min(frameHeight,height);
  if([width,height,frameWidth,frameHeight,sampledWidth,sampledHeight].some(v=>!Number.isFinite(v)||v<=0)||[cropX,cropY].some(v=>!Number.isFinite(v)||v<0)||cropX+sampledWidth>width+1e-7||cropY+sampledHeight>height+1e-7)throw Error('Griglia immagine fuori dal riferimento nativo di prova');
  return ['<svg ','COMMON_PARTS',`x="${-frameWidth/2}" y="${-frameHeight/2}" width="${frameWidth}" height="${frameHeight}" viewBox="${cropX} ${cropY} ${sampledWidth} ${sampledHeight}" preserveAspectRatio="none" overflow="hidden"><image x="0" y="0" width="${width}" height="${height}" xlink:href="${escapeXml(image.getSrc(true))}"/></svg>\n`];
}
