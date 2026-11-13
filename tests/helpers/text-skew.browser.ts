const expect = (actual: number) => ({
  toBeLessThan(limit: number) { if (!(actual < limit)) throw Error(`${actual} >= ${limit}`); },
  toBeGreaterThan(limit: number) { if (!(actual > limit)) throw Error(`${actual} <= ${limit}`); },
  toBeCloseTo(value: number, digits: number) { if (Math.abs(actual-value) > 10 ** -digits) throw Error(`${actual} != ${value}`); },
});
import { FabricAdapter, exportDocumentSvg, measureFabric, measureTextFrame, PX_PER_MM } from '../../src/editor/fabric-adapter';
import { loadFontAssets } from '../../src/editor/fonts';
import { objectCenter, placeObjectAtCenter, type GraphicDocument } from '../../src/editor/model';
import { textFramePoint, EditorTextBox } from '../../src/editor/text-box';
import { compareSupersampledSvg } from './svg-color-reference.browser';
import { Control, type Transform, type TPointerEvent } from 'fabric';

/** Independent composition: neutral editable SVG, followed by a known affine
 * transform in SVG space. No Fabric skew/decomposition in the reference. */
export async function checkTextSkew(document: GraphicDocument) {
  await loadFontAssets(document.fontAssets);
  const reports = [];
  for (const object of document.objects) {
    if (object.type !== 'text') continue;
    const center = objectCenter(object, measureFabric), sx = object.textScaleX ?? 1, sy = object.textScaleY ?? 1;
    const plain = { ...object, textSkewXDeg: 0, rotationDeg: 0, textScaleX: 1, textScaleY: 1,
      ...(object.textBox ? { textBox: { ...object.textBox, widthMm: object.textBox.widthMm / sx, heightMm: object.textBox.heightMm / sy } } : {}) };
    const base = placeObjectAtCenter(plain, center, measureFabric);
    const svg = await exportDocumentSvg({ ...document, objects: [base] }, true);
    const xml = new DOMParser().parseFromString(svg, 'image/svg+xml'), root = xml.documentElement, group = xml.createElementNS('http://www.w3.org/2000/svg', 'g');
    while (root.firstChild) group.append(root.firstChild);
    const cx = center.xMm * PX_PER_MM, cy = center.yMm * PX_PER_MM;
    group.setAttribute('transform', `translate(${cx} ${cy}) rotate(${object.rotationDeg ?? 0}) skewX(${object.textSkewXDeg ?? 0}) scale(${sx} ${sy}) translate(${-cx} ${-cy})`);
    root.append(group);
    const reference = new XMLSerializer().serializeToString(xml), actual = await exportDocumentSvg({ ...document, objects: [object] }, true);
    const width = document.areaMm.width * 6, height = document.areaMm.height * 6;
    const pixels = await compareSupersampledSvg(reference, actual, width, height);
    expect(pixels.ratio).toBeLessThan(.01); expect(pixels.meanChannelError).toBeLessThan(.25);
    const wrong = await exportDocumentSvg({ ...document, objects: [{ ...object, textSkewXDeg: -(object.textSkewXDeg ?? 0) }] }, true);
    expect((await compareSupersampledSvg(reference, wrong, width, height)).ratio).toBeGreaterThan(.1);
    const view = new FabricAdapter(window.document.createElement('canvas'), () => 0, () => {});
    try {
      view.render({ ...document, objects: [object] });
      const box = view.canvas.getObjects()[0] as EditorTextBox, rawWidth = box.width + box.strokeBoundsWidth(), rawHeight = box.height + box.strokeBoundsWidth();
      const expectedWidth = (sx * rawWidth + Math.abs(Math.tan((object.textSkewXDeg ?? 0) * Math.PI / 180)) * rawHeight * sy) / PX_PER_MM;
      expect(measureFabric(object).widthMm).toBeCloseTo(expectedWidth, 8);
      const frame = measureTextFrame(object); expect(frame.widthMm).toBeCloseTo(box.width * sx / PX_PER_MM, 8);
      box.setCoords();
      for (const [name, [x,y]] of Object.entries({ tl: [-.5,-.5], tr: [.5,-.5], bl: [-.5,.5], br: [.5,.5], ml: [-.5,0], mr: [.5,0], mt: [0,-.5], mb: [0,.5] })) {
        const point = textFramePoint(box, x!, y!).transform(view.canvas.viewportTransform);
        expect(box.oCoords[name]!.x).toBeCloseTo(point.x, 8); expect(box.oCoords[name]!.y).toBeCloseTo(point.y, 8);
      }
      reports.push({ id: object.id, pixels, frame, measured: measureFabric(object) });
    } finally { view.dispose(); }
  }
  return reports;
}

/** Exercise every handle against an independently calculated affine point.
 * The pointer displacement is along the original layout axes, not the AABB. */
export async function checkTextSkewHandles(document: GraphicDocument) {
  await loadFontAssets(document.fontAssets);
  const source = document.objects[0]; if (source?.type !== 'text') throw Error('Fixture testo richiesta');
  let cases = 0;
  for (const automatic of [true, false]) for (const skew of [-32, 27]) for (const [name, [x,y]] of Object.entries({tl:[-.5,-.5],tr:[.5,-.5],bl:[-.5,.5],br:[.5,.5],ml:[-.5,0],mr:[.5,0],mt:[0,-.5],mb:[0,.5]})) {
    const view = new FabricAdapter(window.document.createElement('canvas'), () => 0, () => {});
    try {
      view.render({ ...document, objects: [{ ...source, textSkewXDeg: skew, rotationDeg: 23, textBox: { widthMm: 65, heightMm: 20, autoWidth: automatic, autoHeight: true } }] });
      const box = view.canvas.getObjects()[0] as EditorTextBox;
      const a = 23 * Math.PI / 180, k = Math.tan(skew * Math.PI / 180), rawWidth = box.width + box.strokeBoundsWidth(), rawHeight = box.height + box.strokeBoundsWidth();
      const point = (x:number, y:number) => ({ x: box.left + Math.cos(a)*(box.scaleX*x+k*box.scaleY*y)-Math.sin(a)*box.scaleY*y, y: box.top + Math.sin(a)*(box.scaleX*x+k*box.scaleY*y)+Math.cos(a)*box.scaleY*y });
      const anchor = point(-x! * rawWidth, -y! * rawHeight), start = point(x! * rawWidth, y! * rawHeight), font = box.fontSize;
      const dx = x ? Math.sign(x)*18 : 0, dy = y ? Math.sign(y)*12 : 0, end = point(x! * rawWidth + dx, y! * rawHeight + dy);
      const transform = { target: box, ex: start.x, ey: start.y, original: { left: box.left, top: box.top } } as unknown as Transform;
      box.controls[name]!.actionHandler!({ shiftKey: true } as TPointerEvent, transform, end.x, end.y);
      const opposite = point(-x!*(box.width+box.strokeBoundsWidth()), -y!*(box.height+box.strokeBoundsWidth()));
      if (Math.hypot(opposite.x-anchor.x,opposite.y-anchor.y)>1e-7) throw Error(JSON.stringify({name,automatic,skew,phase:'anchor',opposite,anchor}));
      if (!Number.isFinite(box.skewX) || !Number.isFinite(box.scaleX) || box.scaleX <= 0) throw Error('Trasformazione maniglia non valida');
      if (!automatic && !y && box.fontSize !== font) throw Error('Il box fisso ha cambiato corpo font');
      // Pointer tracking is exact on the actively resized axes; on a fixed
      // width box wrapping can change the perpendicular auto-height.
      if (automatic) {
        const moved = point(x!*(box.width+box.strokeBoundsWidth()), y!*(box.height+box.strokeBoundsWidth()));
        if (Math.hypot(moved.x-end.x,moved.y-end.y)>1e-7) throw Error(JSON.stringify({name,automatic,skew,phase:'pointer',moved,end,rawWidth,rawHeight,width:box.width,height:box.height,scaleX:box.scaleX,scaleY:box.scaleY}));
      }
      if (!(box.controls[name] instanceof Control)) throw Error('Controllo mancante'); cases++;
    } finally { view.dispose(); }
  }
  return cases;
}
