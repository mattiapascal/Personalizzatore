import {selectionBounds} from './selection';
import type {GraphicDocument,Measure} from './model';
import {PX_PER_MM} from './canvas-size';
export interface SelectionViewBounds{xMm:number;yMm:number;widthMm:number;heightMm:number;}
/** Exact selection, including direct group members; no Fabric preview geometry. */
export function selectionViewBounds(document:Pick<GraphicDocument,'objects'>,ids:readonly string[],measure:Measure):SelectionViewBounds|null{
 if(!ids.length)return null;
 const selected=new Set(ids),objects=document.objects.filter(object=>selected.has(object.id));
 if(selected.size!==ids.length||objects.length!==ids.length)throw Error('Selezione non disponibile: seleziona di nuovo gli oggetti.');
 return selectionBounds(objects,measure);
}
/** Display-only scale and center. The caller supplies the working-view limit. */
export function selectionViewFit(bounds:SelectionViewBounds,viewport:{width:number;height:number},maximumZoom:number,padding=48){
 if(![bounds.xMm,bounds.yMm,bounds.widthMm,bounds.heightMm,viewport.width,viewport.height,maximumZoom,padding].every(Number.isFinite)||bounds.widthMm<=0||bounds.heightMm<=0||maximumZoom<.01||maximumZoom>4||padding<0||viewport.width<=2*padding||viewport.height<=2*padding)throw Error('Spazio insufficiente per inquadrare la selezione.');
 const desired=Math.min((viewport.width-2*padding)/(bounds.widthMm*PX_PER_MM),(viewport.height-2*padding)/(bounds.heightMm*PX_PER_MM));
 const center={xMm:bounds.xMm+bounds.widthMm/2,yMm:bounds.yMm+bounds.heightMm/2};
 if(!Number.isFinite(desired)||desired<=0||!Number.isFinite(center.xMm)||!Number.isFinite(center.yMm))throw Error('Ingombro della selezione non valido.');
 const zoom=Math.max(.01,Math.min(maximumZoom,desired));
 return{zoom,center,fits:bounds.widthMm*PX_PER_MM*zoom<=viewport.width-2*padding+1e-6&&bounds.heightMm*PX_PER_MM*zoom<=viewport.height-2*padding+1e-6};
}
