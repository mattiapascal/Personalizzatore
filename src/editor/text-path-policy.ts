import type {GraphicDocument, GraphicCommand, Measure, SceneObject} from './model';
import {effectiveObjectProperties, type EditorRole} from './object-properties';
import {restoredTextPathGuide} from './text-path-model';

/** Component permissions survive consumption of the original scene object. */
export function assertTextPathPolicies(
 before: GraphicDocument, after: GraphicDocument, command: GraphicCommand,
 role: EditorRole, measure: Measure,
 sameGeometry: (a: SceneObject, b: SceneObject) => boolean,
): void {
 if (role === 'admin') return;
 if (command.tool === 'attachTextToPath') {
  const props = effectiveObjectProperties(before, command.arguments.pathObjectId);
  if (props.selectionLocked || props.deleteLocked || props.transformLocked || props.hideMenus) {
   throw Error(`Il tracciato «${props.label || command.arguments.pathObjectId}» è protetto dal template: l’associazione si prepara in amministrazione.`);
  }
 }
 for (const source of before.objects) {
  if (source.type !== 'text' || !source.textPath) continue;
  const metadata = source.textPath.originalPathMetadata, props = metadata?.editor;
  const next = after.objects.find(object => object.id === source.id);
  if (!next || next.type !== 'text' || !next.textPath) {
   // Explicit separation restores the protected component as its own object.
   const detached = next?.type === 'text' && command.tool === 'detachTextFromPath' && command.objectId === source.id;
   if (!detached && (props?.deleteLocked || props?.selectionLocked)) {
    throw Error(`Eliminazione del tracciato bloccata: ${props.label || source.textPath.originalPathId}. Separa prima testo e tracciato.`);
   }
   continue;
  }
  if (JSON.stringify(metadata ?? {}) !== JSON.stringify(next.textPath.originalPathMetadata ?? {}) || source.textPath.originalPathId !== next.textPath.originalPathId) {
   throw Error('Il cliente non può cambiare le proprietà originali del tracciato.');
  }
  if ((props?.transformLocked || props?.selectionLocked) && command.tool !== 'changeShopProduct') {
   const path = restoredTextPathGuide(source, source.textPath.originalPathId, measure);
   const updated = restoredTextPathGuide(next, source.textPath.originalPathId, measure);
   if (!sameGeometry(path, updated)) {
    throw Error(`Trasformazioni del tracciato bloccate: ${props.label || path.id}. Puoi modificare il testo senza spostare il percorso.`);
   }
  }
 }
}
