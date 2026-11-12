import{orientedPngFrameBytes}from'./png-orientation';
import{pngDescriptor}from'./png-source';
import{decodeCanonicalPng}from'./png-browser';
import { RasterSourceSchema, type RasterSource } from './raster-source';
import { rasterPixels, type RasterParameters } from './raster-processing';
import { analyzeRasterPixels, type RasterAnalysis } from './raster-analysis';
import { jpegInfo, jpegWithoutApp1, jpegOrientationMatrix } from './jpeg-source';
interface DecodedRaster {
  cacheId: number; mime: RasterSource['mime']; width: number; height: number;
  image: HTMLImageElement | HTMLCanvasElement; analysis: RasterAnalysis; svgPng?:string;
}
interface Prepared { source: RasterSource; resource: DecodedRaster; }
const prepared = new Map<string, Prepared>(), pending = new Map<string, { source: RasterSource; promise: Promise<void> }>();
// Exact embedded contents, not filenames, resource IDs, dimensions or a weak hash.
// Only publish after complete validation, decode and analysis have succeeded.
const contents = new Map<string, DecodedRaster>();
let nextCacheId = 0;
function sharedResource(source: RasterSource): DecodedRaster | undefined {
  const resource = contents.get(source.dataUrl);
  return resource?.mime === source.mime && resource.width === source.pixelWidth && resource.height === source.pixelHeight ? resource : undefined;
}
function publishResource(source: RasterSource, image: DecodedRaster['image'], svgPng?:string): void {
  const analysis = analysisOf(image, source.pixelWidth, source.pixelHeight);
  const resource = { cacheId: ++nextCacheId, mime: source.mime, width: source.pixelWidth, height: source.pixelHeight, image, analysis, ...(svgPng?{svgPng}:{}) };
  contents.set(source.dataUrl, resource);
  prepared.set(source.id, { source: { ...source }, resource });
}
const derived = new Map<string, HTMLCanvasElement>();
// Decode large sources sequentially, including documents with many image placements.
let preparationQueue: Promise<unknown> = Promise.resolve();
function sameSource(a: RasterSource, b: RasterSource): boolean { return a.id === b.id && a.mime === b.mime && a.pixelWidth === b.pixelWidth && a.pixelHeight === b.pixelHeight && a.dataUrl === b.dataUrl; }
export function assertRasterPrepared(source: RasterSource): void {
  const existing = prepared.get(source.id);
  if (!existing || !sameSource(source, existing.source)) throw new Error('Sorgente raster non preparata o ID risorsa in conflitto');
}
/** Prepared immutable source, reused by original-mode views without a cropped bitmap. */
export function originalRasterImage(source: RasterSource): HTMLImageElement | HTMLCanvasElement { assertRasterPrepared(source); return prepared.get(source.id)!.resource.image; }
export function rasterAnalysis(source: RasterSource): RasterAnalysis { assertRasterPrepared(source); return { ...prepared.get(source.id)!.resource.analysis }; }
export function assertRasterParameters(source: RasterSource, params: RasterParameters): void {
  assertRasterPrepared(source);
  if (params.backgroundRemoval && params.mode !== 'grayscale' && rasterAnalysis(source).kind !== 'grayscale') throw new Error('Rimozione del bianco disponibile solo per originali in scala di grigi; canali RGB differenti richiedono una conversione esplicita');
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
  const loading = pending.get(source.id); if (loading) { if (!sameSource(loading.source, source)) throw new Error('ID sorgente raster in conflitto'); return loading.promise; }
  const ready = sharedResource(source);
  if (ready) { prepared.set(source.id, { source: { ...source }, resource: ready }); return; }
  const promise = preparationQueue.then(async () => {
    // Another ID for these contents may have completed earlier in the queue.
    const shared = sharedResource(source);
    if (shared) { prepared.set(source.id, { source: { ...source }, resource: shared }); return; }
    if (source.mime === 'image/png') {
      const image=await decodeCanonicalPng(source.dataUrl);let svgPng:string|undefined;if(pngDescriptor(source.dataUrl).special){const bytes=await orientedPngFrameBytes(source.dataUrl);let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));svgPng='data:image/png;base64,'+btoa(binary);}publishResource(source,image,svgPng);
    } else {
      const info = jpegInfo(source.dataUrl), url = URL.createObjectURL(new Blob([jpegWithoutApp1(source.dataUrl)], { type: 'image/jpeg' }));
      try {
        const image = new Image(); image.src = url;
        try { await image.decode(); } catch { throw new Error('JPEG non decodificabile: nessuna modifica applicata'); }
        if (image.naturalWidth !== info.rawWidth || image.naturalHeight !== info.rawHeight) throw new Error('Dimensioni JPEG decodificate diverse dall’intestazione');
        const normalized = document.createElement('canvas'); normalized.width = info.width; normalized.height = info.height;
        const context = normalized.getContext('2d'); if (!context) throw new Error('Orientamento JPEG non disponibile in questo browser');
        context.setTransform(...jpegOrientationMatrix(info.orientation, info.rawWidth, info.rawHeight)); context.drawImage(image, 0, 0); context.resetTransform();
        publishResource(source, normalized);
      } finally { URL.revokeObjectURL(url); }
    }
  });
  preparationQueue = promise.catch(() => {});
  pending.set(source.id, { source, promise });
  try { await promise; } finally { pending.delete(source.id); }
}
/** Filters stay anchored to original pixels; cropping is a viewport, never a resampling step. */
export function rasterCanvas(source: RasterSource, params: RasterParameters): HTMLCanvasElement {
  assertRasterParameters(source, params); const key = `${prepared.get(source.id)!.resource.cacheId}:${params.mode ?? "binary"}:${params.threshold}:${params.invert}:${params.whiteTransparent}:${params.backgroundRemoval ?? 'none'}:${params.method ?? "threshold"}:${params.brightness ?? 0}:${params.contrast ?? 0}:${params.tintColor ?? "#000000"}`, cached = derived.get(key);
  if (cached) { derived.delete(key); derived.set(key, cached); return cached; }
  const canvas = document.createElement('canvas');
  canvas.width = source.pixelWidth; canvas.height = source.pixelHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true }); if (!context) throw new Error('Elaborazione raster non disponibile in questo browser');
  context.drawImage(prepared.get(source.id)!.resource.image, 0, 0);
  if (params.mode !== 'original') { const pixels = context.getImageData(0, 0, canvas.width, canvas.height), output = rasterPixels(pixels.data, params, canvas.width); pixels.data.set(output); context.putImageData(pixels, 0, 0); }
  derived.set(key, canvas);
  let pixels = [...derived.values()].reduce((sum, entry) => sum + entry.width * entry.height, 0);
  while (derived.size > 1 && (derived.size > 8 || pixels > 32_000_000)) { const oldest = derived.keys().next().value!, entry = derived.get(oldest)!; pixels -= entry.width * entry.height; derived.delete(oldest); }
  return canvas;
}

/** Lossless oriented native PNG samples, prepared before synchronous SVG serialization. */
export function originalPngSvgSource(source:RasterSource):string{assertRasterPrepared(source);return prepared.get(source.id)!.resource.svgPng??source.dataUrl;}
