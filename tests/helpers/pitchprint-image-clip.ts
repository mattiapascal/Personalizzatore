import { testPng } from './png';

export function imageClipTestSource() {
  const bytes = testPng(64, 48, new Uint8Array(Array.from({ length: 64 * 48 }, (_, i) => {
    const x = i % 64, y = Math.floor(i / 64);
    return x < 4 || x >= 60 || y < 4 || y >= 44 ? [10, 30, 50, 255] : (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? [0, 136, 204, 255] : [230, 90, 20, 180];
  }).flat())), url = `data:image/png;base64,${bytes.toString('base64')}`;
  const mask = { type: 'rect', originX: 'center', originY: 'center', left: 2.25, top: -1.5, width: 42.5, height: 31.25, strokeWidth: 1 };
  const image = { type: 'image', originX: 'center', originY: 'center', left: 350, top: 450, width: 64, height: 48, scaleX: 8, scaleY: 8, strokeWidth: 0, src: url, clipPath: mask };
  const pathMask = { ...mask, type: 'path', path: [['M', 10, 20], ['L', 52.5, 20], ['L', 52.5, 51.25], ['L', 10, 51.25], ['Z']] };
  return { title: 'Maschere rettangolari TEST', unit: 'mm', pages: [{ pageData: { fWidth: 140, fHeight: 90 }, canvas: {
    background: '#ffffff', clipPath: { left: 0, top: 0, width: 1400, height: 900 },
    objects: [image, { type: 'group', originX: 'center', originY: 'center', left: 1000, top: 450, width: 600, height: 500, scaleX: 1.1, scaleY: .8, angle: 20, strokeWidth: 0, objects: [{ ...image, left: 0, top: 0, width: 96, height: 72, scaleX: 7, scaleY: 7, flipX: true, flipY: true, clipPath: pathMask }] }],
  } }] };
}
