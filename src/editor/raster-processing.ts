import { ColorSchema } from './paint';
import { monochromePixels } from './raster-monochrome';
import { z } from 'zod';
import { analyzeRasterPixels } from './raster-analysis';
export const RasterParametersSchema = z.strictObject({
  mode: z.enum(['binary', 'original', 'grayscale', 'color']).optional(),
  threshold: z.number().int().min(0).max(255), invert: z.boolean(), whiteTransparent: z.boolean(),
  method: z.enum(['threshold', 'ordered', 'diffusion']).optional(),
  brightness: z.number().finite().min(-100).max(100).optional(), contrast: z.number().finite().min(-100).max(100).optional(),
  saturation: z.number().finite().min(0).max(200).optional(),
  backgroundRemoval: z.literal('luminance').optional(),
  tintColor: ColorSchema.optional(),
}).refine(params => params.mode !== 'original' || !params.backgroundRemoval && !params.invert && !params.whiteTransparent && !params.brightness && !params.contrast && (!params.method || params.method === 'threshold'), 'La modalità originale conserva i pixel senza elaborazioni bianco/nero').refine(params => !params.tintColor || params.mode === 'grayscale', 'La tinta richiede la modalità monocolore').refine(params => params.mode !== 'grayscale' || !params.whiteTransparent && (!params.method || params.method === 'threshold'), 'Il monocolore usa grigi continui; soglia e mezzitoni restano nella conversione binaria').refine(params => params.saturation === undefined || params.mode === 'color', 'La saturazione richiede le regolazioni a colori').refine(params => params.mode !== 'color' || !params.backgroundRemoval && !params.invert && !params.whiteTransparent && (!params.method || params.method === 'threshold'), 'Le regolazioni a colori conservano la trasparenza originale e non applicano conversioni binarie');
export type RasterParameters = z.infer<typeof RasterParametersSchema>;
export const DEFAULT_RASTER: RasterParameters = { threshold: 128, invert: false, whiteTransparent: false };
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5] as const;
/** Black ink with continuous opacity: white disappears, gray keeps proportional coverage. */
export function rasterPixels(source: Uint8ClampedArray, raw: RasterParameters, width = source.length / 4): Uint8ClampedArray {
  const params = RasterParametersSchema.parse(raw);
  if (params.mode === 'original') {
    if (!Number.isInteger(width) || width <= 0 || source.length % 4 || source.length / 4 % width) throw new Error('Dimensioni RGBA non valide');
    return source.slice();
  }
  if (params.mode === 'color') {
    if (!Number.isInteger(width) || width <= 0 || source.length % 4 || source.length / 4 % width) throw new Error('Dimensioni RGBA non valide');
    const output=source.slice(),saturation=(params.saturation??100)/100,brightness=(params.brightness??0)*255/100,contrast=params.contrast??0,factor=(100+contrast)/Math.max(.01,100-contrast);
    if(saturation===1&&brightness===0&&contrast===0)return output;
    for(let i=0;i<source.length;i+=4){
      const gray=(2126*source[i]!+7152*source[i+1]!+722*source[i+2]!)/10000;
      for(let channel=0;channel<3;channel++){const value=gray+saturation*(source[i+channel]!-gray);output[i+channel]=Math.round(Math.max(0,Math.min(255,(value-127.5)*factor+127.5+brightness)));}
    }
    return output;
  }
  if (params.mode === 'grayscale') {
    if (!Number.isInteger(width) || width <= 0 || source.length % 4 || source.length / 4 % width) throw new Error('Dimensioni RGBA non valide');
    return monochromePixels(source, params);
  }
  if (!params.backgroundRemoval) return binaryPixels(source, params, width);
  if (!Number.isInteger(width) || width <= 0 || source.length % 4 || source.length / 4 % width) throw new Error('Dimensioni RGBA non valide');
  const kind = analyzeRasterPixels(source).kind;
  if (kind !== 'grayscale' && kind !== 'empty') throw new Error('La rimozione del bianco richiede pixel grigi: i canali RGB devono essere uguali');
  const output = new Uint8ClampedArray(source.length), brightness = (params.brightness ?? 0) * 255 / 100, contrast = params.contrast ?? 0, factor = (100 + contrast) / Math.max(0.01, 100 - contrast);
  for (let i = 0; i < source.length; i += 4) {
    const gray = Math.max(0, Math.min(255, (source[i]! - 127.5) * factor + 127.5 + brightness));
    const coverage = params.invert ? gray : 255 - gray;
    output[i + 3] = Math.round(coverage * source[i + 3]! / 255);
  }
  return output;
}
/** Pixel RGB/alpha binari; due sole righe di errore, mai modificare l'originale. */
export function binaryPixels(source: Uint8ClampedArray, raw: RasterParameters, width = source.length / 4): Uint8ClampedArray {
  const params = RasterParametersSchema.parse(raw); if (source.length % 4) throw new Error('Buffer RGBA incompleto');
  if (!Number.isInteger(width) || width <= 0 || width > source.length / 4 || source.length / 4 % width !== 0) throw new Error('Dimensioni RGBA non valide');
  const height = source.length / 4 / width, output = new Uint8ClampedArray(source.length), method = params.method ?? 'threshold';
  const brightness = (params.brightness ?? 0) * 255 / 100, contrast = params.contrast ?? 0, factor = (100 + contrast) / Math.max(0.01, 100 - contrast);
  let current = method === 'diffusion' ? new Float64Array(width + 2) : null, next = method === 'diffusion' ? new Float64Array(width + 2) : null;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = y * width + x, i = pixel * 4, alpha = source[i + 3]! / 255;
      const rawLuminance = (2126 * source[i]! + 7152 * source[i + 1]! + 722 * source[i + 2]!) / 10000 * alpha + 255 * (1 - alpha);
      const luminance = Math.max(0, Math.min(255, (rawLuminance - 127.5) * factor + 127.5 + brightness));
      const value = luminance + (current?.[x + 1] ?? 0);
      // La matrice varia la soglia attorno al valore scelto. Gli estremi 0/255
      // restano saturi, per non introdurre puntini nel nero/bianco puro.
      const limit = method === 'ordered' ? params.threshold + (BAYER4[(y % 4) * 4 + x % 4]! + 0.5) * 16 - 128 : params.threshold;
      const quantized = luminance === 0 || luminance === 255 || params.threshold === 0 ? luminance < params.threshold ? 0 : 255 : value < limit ? 0 : 255;
      const black = (quantized === 0) !== params.invert, result = black ? 0 : 255;
      output[i] = output[i + 1] = output[i + 2] = result; output[i + 3] = alpha === 0 || !black && params.whiteTransparent ? 0 : 255;
      if (current && next && alpha > 0) {
        const error = value - quantized;
        if (x + 1 < width && source[i + 7]! > 0) current[x + 2] = current[x + 2]! + error * 7 / 16;
        if (y + 1 < height) {
          const below = ((y + 1) * width + x) * 4;
          if (x > 0 && source[below - 1]! > 0) next[x] = next[x]! + error * 3 / 16;
          if (source[below + 3]! > 0) next[x + 1] = next[x + 1]! + error * 5 / 16;
          if (x + 1 < width && source[below + 7]! > 0) next[x + 2] = next[x + 2]! + error / 16;
        }
      }
    }
    if (current && next) { [current, next] = [next, current]; next.fill(0); }
  }
  return output;
}
