/** Independent Canvas2D reconstruction of Fabric 3's image drawImage mapping.
 * No importer, canonical geometry, crop helper or Fabric matrix utility is used. */
export async function pitchprintImageReference(source: any, urls: Record<string, string>, width = 1200, height = 750) {
  const page = source.pages[0], clip = page.canvas.clipPath, canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d')!; context.fillStyle = 'white'; context.fillRect(0, 0, width, height);
  context.scale(width / clip.width, height / clip.height); context.translate(-(clip.left ?? 0), -(clip.top ?? 0));
  const origin = (value: string | undefined) => value === 'center' ? .5 : value === 'right' || value === 'bottom' ? 1 : 0;
  const draw = async (raw: any) => {
    context.save();
    context.translate(raw.left, raw.top); context.rotate((raw.angle ?? 0) * Math.PI / 180);
    context.translate((.5 - origin(raw.originX)) * (raw.width + (raw.strokeWidth ?? 0)) * (raw.scaleX ?? 1), (.5 - origin(raw.originY)) * (raw.height + (raw.strokeWidth ?? 0)) * (raw.scaleY ?? 1));
    context.scale((raw.scaleX ?? 1) * (raw.flipX ? -1 : 1), (raw.scaleY ?? 1) * (raw.flipY ? -1 : 1));
    if (raw.type === 'group') for (const child of raw.objects) await draw(child);
    else if (raw.type === 'image') {
      const image = new Image(); image.src = urls[raw.url || raw.src] ?? raw.url ?? raw.src; await image.decode();
      context.drawImage(image, Math.max(raw.cropX ?? 0, 0), Math.max(raw.cropY ?? 0, 0), Math.min(raw.width, image.naturalWidth), Math.min(raw.height, image.naturalHeight), -raw.width / 2, -raw.height / 2, raw.width, raw.height);
    } else throw Error('Il riferimento immagini accetta solo immagini e gruppi.');
    context.restore();
  };
  for (const raw of page.canvas.objects) await draw(raw);
  return canvas;
}
export async function compareColorPixels(reference: HTMLCanvasElement, svg: string) {
  const image = new Image(); image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; await image.decode();
  const canvas = document.createElement('canvas'); canvas.width = reference.width; canvas.height = reference.height;
  const ctx = canvas.getContext('2d')!; ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const a = reference.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data, b = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let error = 0, different = 0, ink = 0;
  for (let i = 0; i < a.length; i += 4) {
    const delta = Math.max(Math.abs(a[i]! - b[i]!), Math.abs(a[i + 1]! - b[i + 1]!), Math.abs(a[i + 2]! - b[i + 2]!));
    if (Math.min(a[i]!, a[i + 1]!, a[i + 2]!, b[i]!, b[i + 1]!, b[i + 2]!) < 245) ink++;
    if (delta > 24) different++; error += delta;
  }
  return { different, ink, ratio: different / Math.max(ink, 1), meanChannelError: error / (a.length / 4), reference: reference.toDataURL() };
}
