import type { GraphicDocument, SceneObject, SceneGroup } from './model';
import { groupAncestors } from './scene-groups';
type Scene = Pick<GraphicDocument, 'objects' | 'groups'>;
export function objectIsVisible(scene: Scene, object: SceneObject): boolean {
  return object.visible !== false && !(scene.groups ?? []).some(group => group.visible === false && group.objectIds.includes(object.id));
}
export function groupIsVisible(scene: Scene, group: SceneGroup): boolean {
  return group.visible !== false && !groupAncestors(scene, group).some(parent => parent.visible === false);
}
/** Read-only view/output projection, never deletion from the canonical project. */
export function visibleDocument(document: GraphicDocument): GraphicDocument {
  const objects = document.objects.filter(object => objectIsVisible(document, object)), ids = new Set(objects.map(object => object.id));
  const groups = document.groups?.map(group => ({ ...group, objectIds: group.objectIds.filter(id => ids.has(id)) })).filter(group => group.objectIds.length);
  const result = { ...document, objects, ...(groups ? { groups } : {}) };
  if (result.backgroundImageId && !ids.has(result.backgroundImageId)) delete result.backgroundImageId;
  if (result.backgroundGroupId && !groups?.some(group => group.id === result.backgroundGroupId)) delete result.backgroundGroupId;
  return result;
}
