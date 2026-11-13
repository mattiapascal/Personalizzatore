import {objectInclination} from './object-affine';
import { scaleTextClipMasks } from './text-clip-masks';
import { scaledTextPath } from './text-path-spec';
import { TEST_MARGIN_MM, cloneSceneObject, objectGeometry, objectCenter, placeObjectAtCenter, type GraphicDocument, type GraphicCommand, type Measure, type SceneObject, type SelectionTransformArguments } from './model';

import { objectWithAppearance } from './object-appearance';
import { areaAlignmentDelta } from './align-area';
import {rootGroupFor,cloneSceneGroup,remapSceneGroups} from './scene-groups';
import {objectIsVisible} from './scene-visibility';

type SelectionTool = 'inclineObjects' | 'reflectObjects' | 'placeObjects' | 'alignObjectsToArea' | 'reorderObjects' | 'styleObjects' | 'groupObjects' | 'ungroupObjects' | 'moveObjects' | 'transformObjects' | 'deleteObjects' | 'duplicateObjects' | 'alignObjects' | 'distributeObjects';
type SelectionCommand = Extract<GraphicCommand, { tool: SelectionTool }>;
export function isSelectionCommand(command: GraphicCommand): command is SelectionCommand {
  return ['inclineObjects', 'reflectObjects', 'placeObjects', 'alignObjectsToArea', 'reorderObjects', 'styleObjects', 'groupObjects', 'ungroupObjects', 'moveObjects', 'transformObjects', 'deleteObjects', 'duplicateObjects', 'alignObjects', 'distributeObjects'].includes(command.tool);
}
export function expandSelection(doc: GraphicDocument, ids: readonly string[]): string[] {
  const selected = new Set(ids);
  for (const group of doc.groups ?? []) if (!group.parentId&&group.objectIds.some(id => selected.has(id))) group.objectIds.forEach(id => selected.add(id));
  return doc.objects.filter(object => selected.has(object.id)).map(object => object.id);
}
export function selectionBounds(objects: readonly SceneObject[], measure: Measure) {
  if (!objects.length) throw new Error('Selezione vuota');
  const xMm = Math.min(...objects.map(object => object.xMm)), yMm = Math.min(...objects.map(object => object.yMm));
  return { xMm, yMm, widthMm: Math.max(...objects.map(object => object.xMm + objectGeometry(object, measure).widthMm)) - xMm, heightMm: Math.max(...objects.map(object => object.yMm + objectGeometry(object, measure).heightMm)) - yMm };
}
function selectedObjects(doc: GraphicDocument, ids: readonly string[], objectId: string, direct=false) {
  const objects = doc.objects.filter(object => ids.includes(object.id));
  if (new Set(ids).size !== ids.length || objects.length !== ids.length || !ids.includes(objectId)) throw new Error('Selezione non valida: ID duplicati, sconosciuti o comando estraneo');
  for (const group of doc.groups ?? []) if (!direct && group.objectIds.some(id => ids.includes(id)) && !group.objectIds.every(id => ids.includes(id))) throw new Error('La selezione deve comprendere l’intero gruppo');
  return objects;
}
export function selectionUnits(doc: GraphicDocument, ids: readonly string[]): SceneObject[][] {
  const remaining = new Set(ids), units: SceneObject[][] = [];
  for (const object of doc.objects) {
    if (!remaining.has(object.id)) continue;
    const members = rootGroupFor(doc,object.id)?.objectIds ?? [object.id];
    const unit = doc.objects.filter(object => members.includes(object.id));
    unit.forEach(object => remaining.delete(object.id)); units.push(unit);
  }
  return units;
}
export function canReorderSelection(doc: GraphicDocument, ids: readonly string[], direction: 'front' | 'back' | 'forward' | 'backward'): boolean {
  const units = selectionUnits(doc, doc.objects.map(object => object.id)), selected = new Set(ids), towardFront = direction === 'front' || direction === 'forward';
  return units.some((unit, index) => unit.some(object => selected.has(object.id)) && (towardFront ? units.slice(index + 1) : units.slice(0, index)).some(other => other.every(object => !selected.has(object.id))));
}
function translate(objects: readonly SceneObject[], x: number, y: number) { for (const object of objects) { object.xMm += x; object.yMm += y; } }
function cleanGroups(doc: GraphicDocument) { if (!doc.groups?.length) delete doc.groups; }

const normalizedAngle = (angle: number) => ((angle + 180) % 360 + 360) % 360 - 180;
const scalePoints = (points: number, factor: number) => Math.round(points * factor * 1e9) / 1e9;
/** Similitudine sul centro dell'ingombro iniziale: nessuno skew o scala non uniforme. */
export function transformSelection(objects: readonly SceneObject[], args: Omit<SelectionTransformArguments, 'objectIds'>, measure: Measure): SceneObject[] {
  const bounds = selectionBounds(objects, measure), pivot = { xMm: bounds.xMm + bounds.widthMm / 2, yMm: bounds.yMm + bounds.heightMm / 2 };
  if (args.scale === 1 && args.rotationDeg === 0) {
    const x = args.center.xMm - pivot.xMm, y = args.center.yMm - pivot.yMm;
    return objects.map(object => ({ ...cloneSceneObject(object), xMm: object.xMm + x, yMm: object.yMm + y }));
  }
  const angle = args.rotationDeg * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle);
  return objects.map(source => {
    const before = objectCenter(source, measure), object = cloneSceneObject(source), scale = args.scale;
    if (scale !== 1) {
      if (object.type === 'text') {
        object.fontSizePt = scalePoints(object.fontSizePt, scale);
        if(object.textClipMasks)object.textClipMasks=scaleTextClipMasks(object.textClipMasks,scale);
        if (object.strokeMm !== undefined) object.strokeMm *= scale;
        if (object.letterSpacingPt !== undefined) object.letterSpacingPt = scalePoints(object.letterSpacingPt, scale);
        if (object.textPath) object.textPath = scaledTextPath(object.textPath, scale);
        if (object.textBox) { object.textBox.widthMm *= scale; object.textBox.heightMm *= scale; }
        if (object.characterStyles) for (const run of object.characterStyles) { if (run.style.strokeMm !== undefined) run.style.strokeMm *= scale; if (run.style.fontSizePt !== undefined) run.style.fontSizePt = scalePoints(run.style.fontSizePt, scale); if (run.style.kerningPt !== undefined) run.style.kerningPt = scalePoints(run.style.kerningPt, scale); }
      } else if (object.type === 'image') { object.widthMm *= scale; object.heightMm *= scale; } else {
        object.strokeMm *= scale;
        if (object.type === 'circle') object.radiusMm *= scale;
        else if (object.type === 'ellipse') { object.rxMm *= scale; object.ryMm *= scale; }
        else if (object.type === 'line') object.lengthMm *= scale;
        else { object.widthMm *= scale; object.heightMm *= scale; if (object.type === 'rect' && object.cornerRadiusMm !== undefined) object.cornerRadiusMm *= scale; }
      }
    }
    if (args.rotationDeg !== 0 && (object.type !== 'circle'||!!object.skewXDeg)) object.rotationDeg = normalizedAngle((source.rotationDeg ?? 0) + args.rotationDeg);
    const x = (before.xMm - pivot.xMm) * scale, y = (before.yMm - pivot.yMm) * scale;
    return placeObjectAtCenter(object, { xMm: args.center.xMm + x * cos - y * sin, yMm: args.center.yMm + x * sin + y * cos }, measure);
  });
}

/** Un solo comando e una sola revisione per l'intera selezione; il chiamante valida prima del commit. */
export function applySelectionCommand(doc: GraphicDocument, command: SelectionCommand, measure: Measure): void {
  if (command.tool === 'ungroupObjects') {
    const ids = command.arguments.groupIds, groups = doc.groups?.filter(group => ids.includes(group.id)) ?? [];
    if (new Set(ids).size !== ids.length || groups.length !== ids.length || !groups.some(group => group.objectIds.includes(command.objectId))) throw new Error('Gruppi da separare non validi');
    const hidden=new Set(doc.objects.filter(object=>!objectIsVisible(doc,object)).map(object=>object.id));
    doc.groups = doc.groups?.filter(group => !ids.includes(group.id)).map(source=>{const group=cloneSceneGroup(source);let parent=group.parentId;while(parent&&ids.includes(parent))parent=groups.find(item=>item.id===parent)?.parentId;if(parent)group.parentId=parent;else delete group.parentId;return group;});
    for(const object of doc.objects)if(hidden.has(object.id)&&objectIsVisible(doc,object))object.visible=false;
    cleanGroups(doc); return;
  }
  const ids = command.tool === 'duplicateObjects' ? command.arguments.copies.map(copy => copy.objectId) : command.arguments.objectIds;
  if('targetScope' in command&&command.targetScope==='object'&&ids.length!==1)throw new Error('L’ambito oggetto richiede un solo elemento');
  const objects = selectedObjects(doc, ids, command.objectId, 'targetScope' in command && command.targetScope==='object');
  const selectedGroups = doc.groups?.filter(group => group.objectIds.every(id => ids.includes(id))) ?? [];
  switch (command.tool) {
    case 'placeObjects': {
      const { targetObjectId, side } = command.arguments;
      const units = selectionUnits(doc, doc.objects.map(object => object.id)), target = units.find(unit => unit.some(object => object.id === targetObjectId));
      if (!target || target.some(object => ids.includes(object.id))) throw new Error('Il livello di destinazione deve esistere ed essere esterno alla selezione');
      const selected = units.filter(unit => ids.includes(unit[0]!.id)), remaining = units.filter(unit => !ids.includes(unit[0]!.id)), at = remaining.indexOf(target) + Number(side === 'above');
      remaining.splice(at, 0, ...selected); doc.objects = remaining.flat(); break;
    }
    case 'groupObjects': {
      const { groupId } = command.arguments;
      if (selectedGroups.length) throw new Error('Separa i gruppi prima di creare un nuovo gruppo');
      if (doc.objects.some(object => object.id === groupId) || doc.groups?.some(group => group.id === groupId)) throw new Error('ID gruppo già presente');
      // Il gruppo occupa il livello dell'elemento selezionato più alto.
      const highest = Math.max(...objects.map(object => doc.objects.indexOf(object)));
      const before = doc.objects.slice(0, highest + 1).filter(object => !ids.includes(object.id));
      doc.objects = [...before, ...objects, ...doc.objects.slice(highest + 1)];
      (doc.groups ??= []).push({ id: groupId, objectIds: objects.map(object => object.id) }); break;
    }
    case 'moveObjects': translate(objects, command.arguments.deltaXmm, command.arguments.deltaYmm); break;
    case 'transformObjects': {
      const transformed = transformSelection(objects, command.arguments, measure);
      doc.objects = doc.objects.map(object => transformed.find(changed => changed.id === object.id) ?? object); break;
    }
    case 'reorderObjects': {
      const units = selectionUnits(doc, doc.objects.map(object => object.id)), selected = new Set(ids), active = (unit: SceneObject[]) => selected.has(unit[0]!.id), position = command.arguments.position;
      if (position === 'front') doc.objects = [...units.filter(unit => !active(unit)), ...units.filter(active)].flat();
      else if (position === 'back') doc.objects = [...units.filter(active), ...units.filter(unit => !active(unit))].flat();
      else {
        if (position === 'forward') { for (let i = units.length - 2; i >= 0; i--) if (active(units[i]!) && !active(units[i + 1]!)) [units[i], units[i + 1]] = [units[i + 1]!, units[i]!]; }
        else { for (let i = 1; i < units.length; i++) if (active(units[i]!) && !active(units[i - 1]!)) [units[i], units[i - 1]] = [units[i - 1]!, units[i]!]; }
        doc.objects = units.flat();
      }
      break;
    }
    case 'styleObjects': {
      const styled = new Map(objects.map(object => [object.id, objectWithAppearance(object, command.arguments.style, measure)]));
      doc.objects = doc.objects.map(object => styled.get(object.id) ?? object); break;
    }
    case 'deleteObjects':
      doc.objects = doc.objects.filter(object => !ids.includes(object.id));
      doc.groups = doc.groups?.filter(group => !selectedGroups.includes(group)); cleanGroups(doc); break;
    case 'duplicateObjects': {
      const mappings = command.arguments.groups;
      if (new Set(mappings.map(group => group.groupId)).size !== mappings.length || mappings.length !== selectedGroups.length || mappings.some(mapping => !selectedGroups.some(group => group.id === mapping.groupId))) throw new Error('Associazione delle copie dei gruppi non valida');
      const copies = objects.map(object => ({ ...cloneSceneObject(object), id: command.arguments.copies.find(copy => copy.objectId === object.id)!.newObjectId }));
      doc.objects.push(...copies);
      (doc.groups??=[]).push(...remapSceneGroups(selectedGroups,new Map(command.arguments.copies.map(copy=>[copy.objectId,copy.newObjectId])),new Map(mappings.map(mapping=>[mapping.groupId,mapping.newGroupId]))));
      break;
    }
    case 'inclineObjects': {
      for (const object of objects) {
        const center=objectCenter(object,measure);
        if(object.type==='text'&&!object.textPath){object.textSkewXDeg=command.arguments.angleDeg||0;delete object.skewXDeg;}else object.skewXDeg=command.arguments.angleDeg||0;
        if(object.type==='circle'&&!object.skewXDeg)object.rotationDeg=0;
        Object.assign(object,placeObjectAtCenter(object,center,measure));
      }
      break;
    }
    case 'reflectObjects': {
      const b=selectionBounds(objects,measure),pivot={xMm:b.xMm+b.widthMm/2,yMm:b.yMm+b.heightMm/2},horizontal=command.arguments.axis==='horizontal';
      for(const object of objects){
        const center=objectCenter(object,measure),inclination=objectInclination(object);
        object.rotationDeg=normalizedAngle(-(object.rotationDeg??0));
        if(object.type==='text'&&!object.textPath){object.textSkewXDeg=-inclination||0;delete object.skewXDeg;}else object.skewXDeg=-inclination||0;
        if(horizontal)object.mirrorX=!object.mirrorX;else object.mirrorY=!object.mirrorY;
        Object.assign(object,placeObjectAtCenter(object,{xMm:horizontal?2*pivot.xMm-center.xMm:center.xMm,yMm:horizontal?center.yMm:2*pivot.yMm-center.yMm},measure));
      }
      break;
    }
    case 'alignObjectsToArea': {
      const units=command.arguments.individually?selectionUnits(doc,ids):[objects];
      for(const unit of units){const delta=areaAlignmentDelta(selectionBounds(unit,measure),doc.areaMm,command.arguments.alignment,command.arguments.marginMm??TEST_MARGIN_MM);translate(unit,delta.xMm,delta.yMm);}
      break;
    }
    case 'alignObjects': {
      const units = selectionUnits(doc, ids), referenceId=command.arguments.referenceObjectId;
      const reference=referenceId?units.find(unit=>unit.some(object=>object.id===referenceId)):undefined;
      if(referenceId&&!reference)throw new Error('L’oggetto master deve appartenere alla selezione');
      const bounds = selectionBounds(reference??objects, measure), alignment = command.arguments.alignment; if (units.length < 2) throw new Error('Seleziona almeno due oggetti o gruppi distinti');
      for (const unit of units) {
        if(unit===reference)continue;
        const box = selectionBounds(unit, measure);
        const x = alignment === 'left' ? bounds.xMm - box.xMm : alignment === 'right' ? bounds.xMm + bounds.widthMm - box.xMm - box.widthMm : alignment === 'centerX' ? bounds.xMm + bounds.widthMm / 2 - box.xMm - box.widthMm / 2 : 0;
        const y = alignment === 'top' ? bounds.yMm - box.yMm : alignment === 'bottom' ? bounds.yMm + bounds.heightMm - box.yMm - box.heightMm : alignment === 'centerY' ? bounds.yMm + bounds.heightMm / 2 - box.yMm - box.heightMm / 2 : 0;
        translate(unit, x, y);
      }
      break;
    }
    case 'distributeObjects': {
      const horizontal = command.arguments.axis === 'horizontal', coordinate = horizontal ? 'xMm' : 'yMm', dimension = horizontal ? 'widthMm' : 'heightMm';
      const units = selectionUnits(doc, ids).map(unit => ({ unit, bounds: selectionBounds(unit, measure) })).sort((a, b) => a.bounds[coordinate] - b.bounds[coordinate]);
      if (units.length < 3) throw new Error('Seleziona almeno tre oggetti o gruppi distinti');
      const total = selectionBounds(objects, measure), gap = (total[dimension] - units.reduce((sum, unit) => sum + unit.bounds[dimension], 0)) / (units.length - 1);
      if (gap < -1e-8) throw new Error('Spazio insufficiente per distribuire senza sovrapposizioni');
      let position = total[coordinate];
      for (const { unit, bounds } of units) { const delta = position - bounds[coordinate]; translate(unit, horizontal ? delta : 0, horizontal ? 0 : delta); position += bounds[dimension] + gap; }
      break;
    }
  }
}
