import {useLayoutEffect,useRef} from 'react';
/** Only a geometry command just applied by this very inspector may advance a
 * queued style from the same revision. External changes keep their conflict. */
export const INSPECTOR_COMMIT_ERROR='Correggi i valori non applicati nell’ispettore prima di continuare.';
export interface InspectorRevisionAdvance {from:number;to:number;}
export interface InspectorController {flush:(advance?:InspectorRevisionAdvance)=>boolean;}
export const inspectorStyleRevision=(expected:number,advance?:InspectorRevisionAdvance)=>advance&&expected===advance.from&&advance.to===advance.from+1?advance.to:expected;
export type InspectorControllerChange=(controller:InspectorController|null)=>void;
export function useInspectorController(flush:InspectorController['flush'],onChange?:InspectorControllerChange){
 const current=useRef(flush);current.current=flush;
 useLayoutEffect(()=>{onChange?.({flush:advance=>current.current(advance)});return()=>onChange?.(null);},[onChange]);
}
/** Includes incomplete NumberField input that has not emitted a domain command.
 * Native validity excludes disabled controls and permits genuinely mixed fields. */
export const inspectorControlsValid=(root:HTMLElement|null)=>!root?.querySelector(':invalid');
