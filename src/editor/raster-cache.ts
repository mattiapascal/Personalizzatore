import { RasterSourceSchema, validatePngData, type RasterSource } from './raster-source';
import { rasterPixels, type RasterParameters } from './raster-processing';
import { analyzeRasterPixels, type RasterAnalysis } from './raster-analysis';
import { checkedRasterCrop, type RasterCrop } from './raster-geometry';
import { jpegInfo, jpegWithoutApp1, jpegOrientationMatrix } from './jpeg-source';
interface Prepared { source: RasterSource; image: HTMLImageElement | HTMLCanvasElement; analysis: RasterAnalysis; }
const prepared = new Map<string, Prepared>(), pending = new Map<string, { data: string; promise: Promise<void> }>();
const derived = new Map<string, HTMLCanvasElement>();
// Decode large sources sequentially, including when a document prepares four images.
let preparationQueue: Promise<unknown> = Promise.resolve();
function sameSource(a: RasterSource, b: RasterSource): boolean { return a.id === b.id && a.mime === b.mime && a.pixelWidth === b.pixelWidth && a.pixelHeight === b.pixelHeight && a.dataUrl === b.dataUrl; }
export function assertRasterPrepared(source: RasterSource): void {
  const existing = prepared.get(source.id);
  if (!existing || !sameSource(source, existing.source)) throw new Error('Sorgente raster non preparata o ID risorsa in conflitto');
}
export function rasterAnalysis(source: RasterSource): RasterAnalysis { assertRasterPrepared(source); return { ...prepared.get(source.id)!.analysis }; }
export function assertRasterParameters(source: RasterSource, params: RasterParameters): void {
  assertRasterPrepared(source);
  if (params.backgroundRemoval && rasterAnalysis(source).kind !== 'grayscale') throw new Error('Rimozione del bianco disponibile solo per originali in scala di grigi; canali RGB differenti richiedono una conversione esplicita');
}
function analysisOf(image: HTMLImageElement | HTMLCanvasElement, width: number, height: number): RasterAnalysis {
  // Scan every original pixel in strips; never allocate a second full-size RGBA
  // buffer just to classify a high-resolution photograph.
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = Math.min(height, 128);
  const context = canvas.getContext('2d', { willReadFrequently: true }); if (!context) throw new Error('Analisi raster non disponibile');
  let visiblePixels = 0, maxChannelDifference = 0;
  for (let top = 0; top < height; top += canvas.height) {
    const rows = Math.min(canvas.height, height - top); context.clearRect(0, 0, width, canvas.height);
    context.drawImage(image, 0, top, width, rows, 0, 0, width, rows);
    const part = analyzeRasterPixels(context.getImageData(0, 0, width, rows).data);
    visiblePixels += part.visiblePixels; maxChannelDifference = Math.max(maxChannelDifference, part.maxChannelDifference);
  }
  canvas.width = canvas.height = 1;
  return { kind: !visiblePixels ? 'empty' : maxChannelDifference === 0 ? 'grayscale' : maxChannelDifference <= 3 ? 'near-grayscale' : 'color', visiblePixels, maxChannelDifference };
}
export async function prepareRasterSource(raw: RasterSource): Promise<void> {
  const source = RasterSourceSchema.parse(raw), existing = prepared.get(source.id);
  if (existing) { if (!sameSource(source, existing.source)) throw new Error('ID sorgente raster già associato a un’altra immagine'); return; }
  const loading = pending.get(source.id); if (loading) { if (loading.data !== source.dataUrl) throw new Error('ID sorgente raster in conflitto'); return loading.promise; }
  const promise = preparationQueue.then(async () => {
    if (source.mime === 'image/png') {
      await validatePngData(source.dataUrl);
      const image = new Image(); image.src = source.dataUrl;
      try { await image.decode(); } catch { throw new Error('PNG non decodificabile: nessuna modifica applicata'); }
      if (image.naturalWidth !== source.pixelWidth || image.naturalHeight !== source.pixelHeight) throw new Error('Dimensioni decodificate diverse dall’intestazione PNG');
      prepared.set(source.id, { source: { ...source }, image, analysis: analysisOf(image, source.pixelWidth, source.pixelHeight) });
    } else {
      const info = jpegInfo(source.dataUrl), url = URL.createObjectURL(new Blob([jpegWithoutApp1(source.dataUrl)], { type: 'image/jpeg' }));
      try {
        const image = new Image(); image.src = url;
        try { await image.decode(); } catch { throw new Error('JPEG non decodificabile: nessuna modifica applicata'); }
        if (image.naturalWidth !== info.rawWidth || image.naturalHeight !== info.rawHeight) throw new Error('Dimensioni JPEG decodificate diverse dall’intestazione');
        const normalized = document.createElement('canvas'); normalized.width = info.width; normalized.height = info.height;
        const context = normalized.getContext('2d'); if (!context) throw new Error('Orientamento JPEG non disponibile in questo browser');
        context.setTransform(...jpegOrientationMatrix(info.orientation, info.rawWidth, info.rawHeight)); context.drawImage(image, 0, 0); context.resetTransform();
        prepared.set(source.id, { source: { ...source }, image: normalized, analysis: analysisOf(normalized, info.width, info.height) });
      } finally { URL.revokeObjectURL(url); }
    }
  });
  preparationQueue = promise.catch(() => {});
  pending.set(source.id, { data: source.dataUrl, promise });
  try { await promise; } finally { pending.delete(source.id); }
}
export function rasterCanvas(source: RasterSource, params: RasterParameters, rawCrop?: RasterCrop): HTMLCanvasElement {
  assertRasterParameters(source, params); const crop = checkedRasterCrop(source, rawCrop), key = `${source.id}:${params.mode ?? "binary"}:${params.threshold}:${params.invert}:${params.whiteTransparent}:${params.backgroundRemoval ?? 'none'}:${params.method ?? "threshold"}:${params.brightness ?? 0}:${params.contrast ?? 0}:${crop.leftPx}:${crop.topPx}:${crop.widthPx}:${crop.heightPx}`, cached = derived.get(key);
  if (cached) { derived.delete(key); derived.set(key, cached); return cached; }
  const canvas = document.createElement('canvas'); canvas.width = crop.widthPx; canvas.height = crop.heightPx;
  const context = canvas.getContext('2d', { willReadFrequently: true }); if (!context) throw new Error('Elaborazione raster non disponibile in questo browser');
  context.drawImage(prepared.get(source.id)!.image, crop.leftPx, crop.topPx, crop.widthPx, crop.heightPx, 0, 0, crop.widthPx, crop.heightPx);
  if (params.mode !== 'original') { const pixels = context.getImageData(0, 0, canvas.width, canvas.height), output = rasterPixels(pixels.data, params, canvas.width); pixels.data.set(output); context.putImageData(pixels, 0, 0); }
  derived.set(key, canvas);
  let pixels = [...derived.values()].reduce((sum, entry) => sum + entry.width * entry.height, 0);
  while (derived.size > 1 && (derived.size > 8 || pixels > 32_000_000)) { const oldest = derived.keys().next().value!, entry = derived.get(oldest)!; pixels -= entry.width * entry.height; derived.delete(oldest); }
  return canvas;
}
