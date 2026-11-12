import { objectGeometry, type GraphicDocument, type Measure } from './model';

/** Explicit migration policy requested by the owner. Never used by manual
 * editing: off-sheet objects and temporarily empty fields remain editable. */
export const pitchprintTextIsBlank = (text: string): boolean => /^[\p{White_Space}\p{Cf}\uFE00-\uFE0F\u{E0100}-\u{E01EF}]*$/u.test(text);

export function prunePitchprintRefuse(scene: Pick<GraphicDocument, 'objects' | 'groups' | 'areaMm'>, measure: Measure) {
  const removed: {id: string; reason: 'testo senza caratteri visibili' | 'oggetto interamente fuori foglio'}[] = [];
  const objects = scene.objects.filter(object => {
    if (object.type === 'text' && pitchprintTextIsBlank(object.text)) {removed.push({id: object.id, reason: 'testo senza caratteri visibili'}); return false;}
    const box = objectGeometry(object, measure);
    // Only disjoint bounding boxes are obvious refuse. Keep objects crossing
    // the edge, touching it, or with ambiguous rotated/compound geometry.
    if (object.xMm > scene.areaMm.width || object.yMm > scene.areaMm.height || object.xMm + box.widthMm < 0 || object.yMm + box.heightMm < 0) {
      removed.push({id: object.id, reason: 'oggetto interamente fuori foglio'}); return false;
    }
    return true;
  });
  const ids = new Set(objects.map(o => o.id)), groups = scene.groups?.map(group => ({...group, objectIds: group.objectIds.filter(id => ids.has(id))})).filter(group => group.objectIds.length);
  const groupIds = new Set(groups?.map(g => g.id));
  for (const group of groups ?? []) if (group.parentId && !groupIds.has(group.parentId)) delete group.parentId;
  return {objects, groups, removed};
}
