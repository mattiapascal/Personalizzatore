import {effectiveObjectProperties} from './object-properties';
import {objectIsVisible} from './scene-visibility';
import { cloneSceneObject, type GraphicDocument, type SceneGroup,type SceneObject, type GraphicCommand,type Measure } from './model';
import {cloneSceneGroup,remapSceneGroups} from './scene-groups';
import type { FontAsset } from './font-assets';
import { expandSelection,selectionBounds,transformSelection } from './selection';

/** Portable, independent snapshot. Shared locally by the clipboard storage adapter. */
export interface GraphicClipboard {
  fontAssets?: FontAsset[];
  objects: SceneObject[];
  groups: SceneGroup[];
}
export function captureSelection(document: GraphicDocument, objectIds: readonly string[],direct=false): GraphicClipboard {
  if (!objectIds.length || new Set(objectIds).size !== objectIds.length || objectIds.some(id => !document.objects.some(object => object.id === id))) throw new Error('Selezione da copiare non valida');
  const selected = new Set(direct?objectIds:expandSelection(document, objectIds));
  const objects=document.objects.filter(object=>selected.has(object.id));
  const used=new Set(objects.flatMap(object=>object.type==='text'?[object.fontFamily,...object.characterStyles?.flatMap(run=>run.style.fontFamily?[run.style.fontFamily]:[])??[]]:[]));
  return {
    ...(document.fontAssets ? { fontAssets: document.fontAssets.filter(asset=>used.has(asset.id)).map(asset=>({...asset})) } : {}),
    objects: objects.map(object=>direct?{...cloneSceneObject(object),...(!objectIsVisible(document,object)?{visible:false}:{}),editor:effectiveObjectProperties(document,object.id)}:cloneSceneObject(object)),
    groups: (direct?[]:document.groups ?? []).filter(group => group.objectIds.every(id => selected.has(id))).map(cloneSceneGroup),
  };
}
export function clipboardInsertion(clipboard: GraphicClipboard, expectedRevision: number, makeId = (kind: 'object' | 'group') => `${kind}-${crypto.randomUUID()}`): Extract<GraphicCommand, { tool: 'insertObjects' }> {
  if (!clipboard.objects.length) throw new Error('Appunti dell’editor vuoti');
  const ids = new Map(clipboard.objects.map(object => [object.id, makeId('object')]));
  const objects = clipboard.objects.map(object => ({ ...cloneSceneObject(object), id: ids.get(object.id)! }));
  const groups = remapSceneGroups(clipboard.groups,ids,new Map(clipboard.groups.map(group=>[group.id,makeId('group')])));
  return { schemaVersion: 1, tool: 'insertObjects', objectId: objects[0]!.id, expectedRevision, arguments: { objects, groups, ...(clipboard.fontAssets ? { fontAssets: clipboard.fontAssets } : {}) } };
}
/** Explicit proportional fit; never enlarge, distort, discard, or rebind a product. */
export function fittedClipboard(clipboard:GraphicClipboard,target:Pick<GraphicDocument,'areaMm'|'shape'>,measure:Measure):GraphicClipboard{
 const bounds=selectionBounds(clipboard.objects,measure),width=target.areaMm.width,height=target.areaMm.height;
 // A rectangle inscribed in the round work area keeps every corner visible.
 const factor=target.shape==='round'?Math.SQRT1_2:1;
 const scale=Math.min(1,(width*factor-.2)/Math.max(bounds.widthMm,1e-9),(height*factor-.2)/Math.max(bounds.heightMm,1e-9));
 if(scale<=0)throw Error('Il formato è troppo piccolo per gli oggetti da incollare.');
 return{...clipboard,objects:transformSelection(clipboard.objects,{scale,rotationDeg:0,center:{xMm:width/2,yMm:height/2}},measure),groups:clipboard.groups.map(cloneSceneGroup)};
}
