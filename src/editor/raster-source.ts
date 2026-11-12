import { z } from 'zod';
import { jpegInfo } from './jpeg-source';
import { MAX_RASTER_BYTES, MAX_RASTER_SIDE } from './raster-limits';
export { MAX_RASTER_BYTES, MAX_RASTER_PIXELS, MAX_RASTER_SIDE, RASTER_PIXEL_LIMIT_LABEL } from './raster-limits';
import{pngInfo}from'./png-source';
export{pngInfo,validatePngData}from'./png-source';
export{crc32}from'./png-crc';
export const MAX_PNG_BYTES=MAX_RASTER_BYTES;
export const RasterSourceSchema = z.strictObject({
  id: z.string().regex(/^[a-zA-Z][a-zA-Z0-9-]{0,63}$/), mime: z.enum(['image/png', 'image/jpeg']),
  pixelWidth: z.number().int().min(1).max(MAX_RASTER_SIDE), pixelHeight: z.number().int().min(1).max(MAX_RASTER_SIDE), dataUrl: z.string().max(Math.ceil(MAX_RASTER_BYTES / 3) * 4 + 32),
}).superRefine((source, ctx) => {
  try { const info = source.mime === 'image/jpeg' ? jpegInfo(source.dataUrl) : pngInfo(source.dataUrl); if (info.width !== source.pixelWidth || info.height !== source.pixelHeight) throw new Error('Dimensioni dichiarate diverse dall’immagine orientata'); }
  catch (e) { ctx.addIssue({ code: 'custom', message: e instanceof Error ? e.message : 'Immagine non valida' }); }
});
export type RasterSource = z.infer<typeof RasterSourceSchema>;
export function rasterSourceFromBytes(id: string, bytes: Uint8Array): RasterSource {
  if (bytes.byteLength > MAX_RASTER_BYTES) throw new Error('Immagine oltre 20 MB');
  let binary = ''; for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  const mime = bytes[0] === 0xff && bytes[1] === 0xd8 ? 'image/jpeg' : 'image/png', dataUrl = `data:${mime};base64,` + btoa(binary), info = mime === 'image/jpeg' ? jpegInfo(dataUrl) : pngInfo(dataUrl);
  return RasterSourceSchema.parse({ id, mime, pixelWidth: info.width, pixelHeight: info.height, dataUrl });
}
