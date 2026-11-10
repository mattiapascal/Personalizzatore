export interface RasterAnalysis { kind: 'grayscale' | 'near-grayscale' | 'color' | 'empty'; visiblePixels: number; maxChannelDifference: number; }
/** Inspect original decoded pixels, never the thresholded preview or only the crop. */
export function analyzeRasterPixels(pixels: Uint8ClampedArray): RasterAnalysis {
  if (pixels.length % 4) throw new Error('Buffer RGBA incompleto');
  let visiblePixels = 0, maxChannelDifference = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] === 0) continue; visiblePixels++;
    maxChannelDifference = Math.max(maxChannelDifference, Math.max(pixels[i]!, pixels[i + 1]!, pixels[i + 2]!) - Math.min(pixels[i]!, pixels[i + 1]!, pixels[i + 2]!));
  }
  return { kind: !visiblePixels ? 'empty' : maxChannelDifference === 0 ? 'grayscale' : maxChannelDifference <= 3 ? 'near-grayscale' : 'color', visiblePixels, maxChannelDifference };
}
