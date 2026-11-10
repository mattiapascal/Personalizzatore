import { cloneSceneObject, type GraphicDocument, type SceneObject, type GraphicCommand } from './model';
import type { FontAsset } from './font-assets';
import { expandSelection } from './selection';

/** Appunti dell'editor: nessun contenuto negli appunti del sistema o nello storage. */
export interface GraphicClipboard {
  fontAssets?: FontAsset[];
  objects: SceneObject[];
  groups: { id: string; objectIds: string[] }[];
}
export function captureSelection(document: GraphicDocument, objectIds: readonly string[]): GraphicClipboard {
  if (!objectIds.length || new Set(objectIds).size !== objectIds.length || objectIds.some(id => !document.objects.some(object => object.id === id))) throw new Error('Selezione da copiare non valida');
  const selected = new Set(expandSelection(document, objectIds));
  return {
    ...(document.fontAssets ? { fontAssets: document.fontAssets.map(asset=>({...asset})) } : {}),
    objects: document.objects.filter(object => selected.has(object.id)).map(cloneSceneObject),
    groups: (document.groups ?? []).filter(group => group.objectIds.every(id => selected.has(id))).map(group => ({ id: group.id, objectIds: [...group.objectIds] })),
  };
}
export function clipboardInsertion(clipboard: GraphicClipboard, expectedRevision: number, makeId = (kind: 'object' | 'group') => `${kind}-${crypto.randomUUID()}`): Extract<GraphicCommand, { tool: 'insertObjects' }> {
  if (!clipboard.objects.length) throw new Error('Appunti dell’editor vuoti');
  const ids = new Map(clipboard.objects.map(object => [object.id, makeId('object')]));
  const objects = clipboard.objects.map(object => ({ ...cloneSceneObject(object), id: ids.get(object.id)! }));
  const groups = clipboard.groups.map(group => ({ id: makeId('group'), objectIds: group.objectIds.map(id => {
    const nextId = ids.get(id); if (!nextId) throw new Error('Gruppo incompleto negli appunti'); return nextId;
  }) }));
  return { schemaVersion: 1, tool: 'insertObjects', objectId: objects[0]!.id, expectedRevision, arguments: { objects, groups, ...(clipboard.fontAssets ? { fontAssets: clipboard.fontAssets } : {}) } };
}
