import type { RasterParameters } from './raster-processing';
/** Continuous grayscale/tint from original RGB; keep original alpha independent. */
export function monochromePixels(source: Uint8ClampedArray, params: Pick<RasterParameters,'tintColor'|'invert'|'brightness'|'contrast'|'backgroundRemoval'>): Uint8ClampedArray {
  const hex = params.tintColor ?? '#000000', tint = [1,3,5].map(index => Number.parseInt(hex.slice(index,index+2),16));
  const output = new Uint8ClampedArray(source.length), brightness = (params.brightness ?? 0) * 255 / 100;
  const contrast = params.contrast ?? 0, factor = (100 + contrast) / Math.max(.01,100 - contrast);
  for (let i=0;i<source.length;i+=4) {
    let gray = Math.max(0,Math.min(255,((2126*source[i]!+7152*source[i+1]!+722*source[i+2]!)/10000-127.5)*factor+127.5+brightness));
    if (params.invert) gray = 255-gray;
    for (let channel=0;channel<3;channel++) output[i+channel] = params.backgroundRemoval ? tint[channel]! : Math.round(tint[channel]!+(255-tint[channel]!)*gray/255);
    output[i+3] = params.backgroundRemoval ? Math.round((255-gray)*source[i+3]!/255) : source[i+3]!;
  }
  return output;
}
