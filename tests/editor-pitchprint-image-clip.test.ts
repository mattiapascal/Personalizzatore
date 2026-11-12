import { expect, it } from 'vitest';
import { pitchprintImageClip, clippedPitchprintImageGeometry } from '../src/editor/pitchprint-image-clip';
import { pitchprintImageGeometry } from '../src/editor/pitchprint-image';
import { pageImageGeometry, convertPageImage } from '../src/editor/pitchprint-page-images';
import { pitchprintTransform, pitchprintTree, multiplyPitchprintMatrices, pitchprintPoint } from '../src/editor/pitchprint-tree';
import { rasterSourceFromBytes } from '../src/editor/raster-source';
import { testPng } from './helpers/png';

const source = rasterSourceFromBytes('clip-original-TEST', testPng(20, 16));
const clip = { type: 'rect', left: -7.75, top: -6.5, width: 10.5, height: 8, strokeWidth: 0 };
const image = { type: 'image', left: 50, top: 40, originX: 'center', originY: 'center', width: 20, height: 16, scaleX: 2, scaleY: 3, strokeWidth: 0, clipPath: clip };
it('maschera rettangolare frazionaria: pixel/mm e centro espliciti senza alterare originale o cache', () => {
  const raw = { ...image, clipBounds: { width: 999 }, clipPathSvg: '<script>ignored</script>' }, before = structuredClone(raw);
  const g = clippedPitchprintImageGeometry(raw, source, pitchprintImageGeometry(raw, source, 2, 3), pitchprintTransform(raw, 'TEST'));
  expect(g).toEqual({ widthMm: 21, heightMm: 24, pixelAspectRatio: 2 / 3, crop: { leftPx: 2.25, topPx: 1.5, widthPx: 10.5, heightPx: 8 }, center: { xMm: 45, yMm: 32.5 } });
  expect(raw).toEqual(before); expect(source.pixelWidth).toBe(20);
});
it('path M/L/H/V relativo chiuso e rect equivalenti; pathOffset serializzato obsoleto ignorato', () => {
  const mask = { ...clip, type: 'path', width: 999, height: 999, pathOffset: { x: 999, y: 999 }, path: [['M', 100, 200], ['h', 10.5], ['v', 8], ['h', -10.5], ['z']] };
  expect(pitchprintImageClip({ ...image, clipPath: mask })).toEqual(pitchprintImageClip(image));
  const rotated = { ...clip, originX: 'center', originY: 'center', left: -2.5, top: -2.5, angle: 90, width: 8, height: 10.5 };
  const bounds = pitchprintImageClip({ ...image, clipPath: rotated })!;
  expect(bounds.left).toBeCloseTo(-7.75, 12); expect(bounds.bottom).toBeCloseTo(1.5, 12);
});
it('path senza coordinate esplicite conserva la posizione implicita del percorso; dati non validi e budget restano rifiutati', () => {
  const mask = { type: 'path', strokeWidth: 0, path: [['M', -5, -4], ['L', 5, -4], ['L', 5, 4], ['L', -5, 4], ['Z']] };
  expect(pitchprintImageClip({ ...image, clipPath: mask })).toEqual({ left: -5, top: -4, right: 5, bottom: 4 });
  for (const patch of [{ left: 'bad' }, { scaleX: 0 }, { path: [['M', 0, 0], ...Array.from({ length: 32768 }, () => ['L', 1, 1]), ['Z']] }, { path: [['M', 0, 0], ['L', Infinity, 1], ['L', 0, 1], ['Z']] }]) expect(() => pitchprintImageClip({ ...image, clipPath: { ...mask, ...patch } })).toThrow();
});
it('lo stroke della maschera non taglia i pixel ma partecipa alla posizione della sua origine legacy', () => {
  expect(pitchprintImageClip({ ...image, clipPath: { ...clip, stroke: 'red', strokeWidth: 2 } })).toEqual({ left: -6.75, top: -5.5, right: 3.75, bottom: 2.5 });
  expect(pitchprintImageClip({ ...image, clipPath: { ...clip, originX: 'center', originY: 'center', left: 0, top: 0, strokeWidth: 2 } })).toEqual({ left: -5.25, top: -4, right: 5.25, bottom: 4 });
  expect(pitchprintImageClip({ ...image, clipPath: { ...clip, strokeWidth: 2, scaleX: 2, scaleY: 2, strokeUniform: true } })).toEqual({ left: -6.75, top: -5.5, right: 10, bottom: 8 });
});
it('immagine stirata oltre i pixel disponibili: ritaglio applicato al campione, non ai pixel presunti del frame', () => {
  const raw = { ...image, width: 40, height: 32, clipPath: { type: 'rect', originX: 'center', originY: 'center', left: 0, top: 0, width: 20, height: 16, strokeWidth: 0 } };
  const g = clippedPitchprintImageGeometry(raw, source, pitchprintImageGeometry(raw, source, 2, 3), pitchprintTransform(raw, 'TEST'));
  expect(g).toMatchObject({ widthMm: 40, heightMm: 48, crop: { leftPx: 5, topPx: 4, widthPx: 10, heightPx: 8 } });
});
it('gruppi, rotazioni, origini e riflessioni conservano la posizione di ogni pixel trattenuto', () => {
  for (const angle of [0, 30, -90]) for (const flipX of [false, true]) for (const flipY of [false, true]) {
    const raw = { ...image, scaleY: 2, angle, flipX, flipY, originX: 'right', originY: 'bottom' }, parent = pitchprintTransform({ type: 'group', left: 50, top: 20, width: 80, height: 60, originX: 'center', originY: 'center', scaleX: .4, scaleY: .4, angle: 17, flipX: true, strokeWidth: 0 }, 'TEST'), matrix = multiplyPitchprintMatrices(parent, pitchprintTransform(raw, 'TEST')), sx = Math.hypot(matrix[0], matrix[1]), sy = Math.hypot(matrix[2], matrix[3]), g = clippedPitchprintImageGeometry(raw, source, pitchprintImageGeometry(raw, source, sx, sy), matrix);
    for (const [x, y] of [[3, 2], [10, 8]]) {
      const original = pitchprintPoint(matrix, x! - raw.width / 2, y! - raw.height / 2), cx = (x! - g.crop.leftPx) / g.crop.widthPx - .5, cy = (y! - g.crop.topPx) / g.crop.heightPx - .5;
      expect(g.center.xMm + matrix[0] / sx * cx * g.widthMm + matrix[2] / sy * cy * g.heightMm).toBeCloseTo(original.x, 10);
      expect(g.center.yMm + matrix[1] / sx * cx * g.widthMm + matrix[3] / sy * cy * g.heightMm).toBeCloseTo(original.y, 10);
    }
  }
});
it('fondo/primo piano con griglia anteprima: maschera relativa convertita sulla griglia originale', () => {
  const native = { ...image, width: 10, height: 8, cropX: 0, cropY: 0, clipPath: { type: 'rect', left: -3.875, top: -3.25, width: 5.25, height: 4, strokeWidth: 0 } };
  const g = pageImageGeometry(native, source, { pixelWidth: 10, pixelHeight: 8 }, [.5, 0, 0, .5, 0, 0]);
  expect(g).toMatchObject({ widthMm: 5.25, heightMm: 6, crop: { leftPx: 2.25, topPx: 1.5, widthPx: 10.5, heightPx: 8 }, center: { xMm: 23.75, yMm: 18.125 } });
});
it('maschera più grande intersecata con il frame; vuota o sotto un pixel resta rifiutata', () => {
  expect(pitchprintImageClip({ ...image, clipPath: { ...clip, left: -20, top: -20, width: 40, height: 40 } })).toEqual({ left: -10, top: -8, right: 10, bottom: 8 });
  expect(() => pitchprintImageClip({ ...image, clipPath: { ...clip, left: 100 } })).toThrow('maschera');
  const tiny = { ...image, clipPath: { ...clip, width: .5 } };
  expect(() => clippedPitchprintImageGeometry(tiny, source, pitchprintImageGeometry(tiny, source, 2, 3), pitchprintTransform(tiny, 'TEST'))).toThrow();
});
it('preflight blocca curve, fori, losanghe, rientranze, loop e semantiche non convertibili', async () => {
  const paths = [
    [['M', 0, 0], ['L', 10, 0], ['L', 10, 8], ['L', 4, 8], ['L', 4, 4], ['L', 0, 4], ['Z']],
    [['M', 0, 0], ['L', 10, 0], ['L', 10, 8], ['L', 0, 8], ['L', 0, 0], ['L', 10, 0], ['L', 10, 8], ['L', 0, 8], ['Z']],
    [['M', 0, 0], ['C', 1, 0, 2, 8, 0, 8], ['L', 0, 0], ['Z']],
    [['M', 0, 0], ['L', 10, 0], ['M', 2, 2], ['Z']],
  ];
  const masks: Record<string, unknown>[] = [...paths.map(path => ({ ...clip, type: 'path', path })), ...[{ angle: 45 }, { rx: 1 }, { inverted: true }, { absolutePositioned: true }, { skewX: 10 }, { clipPath: {} }, { shadow: {} }, { opacity: .5 }, { type: 'group' }, { path: [] , type: 'path' }].map(p => ({ ...clip, ...p }))];
  for (const clipPath of masks) {
    const raw = { ...image, clipPath };
    expect(() => pitchprintTree([raw], () => ({}))).toThrow('maschera');
    let requests = 0;
    await expect(convertPageImage({ role: 'background', native: raw, url: 'https://pitchprint.io/assets/TEST.png' }, 'print', { width: 100, height: 80 }, [1, 0, 0, 1, 0, 0], false, async () => { requests++; throw Error('Non leggere'); })).rejects.toThrow('maschera');
    expect(requests).toBe(0);
  }
  expect(() => pitchprintTree([{ ...image, type: 'text' }], () => ({}))).toThrow('maschera');
});
