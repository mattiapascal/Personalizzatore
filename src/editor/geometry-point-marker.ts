import type {GraphicDocument} from './model';
import {geometryFocusCurrent,type GeometryFocus} from './geometry-focus';
/** A DOM view decoration, not a Fabric object or a pixel of the artwork.
 * Fixed screen size, no hit area, excluded from every project/output format. */
export class GeometryPointMarker{
 private element:HTMLDivElement|null=null;
 private disposed=false;
 constructor(private readonly host:HTMLElement){}
 update(focus:GeometryFocus|null,document:GraphicDocument|null):void{
  if(this.disposed||!focus||!document||!geometryFocusCurrent(focus,document)){this.clear();return;}
  if(!this.element){
   this.element=window.document.createElement('div');this.element.className='geometry-point-marker';this.element.dataset.testid='geometry-point-marker';this.element.setAttribute('role','img');
   this.element.innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true"><circle class="point-halo" cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="10"/><path d="M16 1v9M16 22v9M1 16h9M22 16h9"/><circle cx="16" cy="16" r="2"/></svg>';this.host.append(this.element);
  }
  this.element.dataset.status=focus.status;this.element.dataset.pageId=focus.pageId;this.element.dataset.contentRevision=String(focus.contentRevision);this.element.dataset.xMm=String(focus.xMm);this.element.dataset.yMm=String(focus.yMm);
  this.element.style.left=`${focus.xMm/document.areaMm.width*100}%`;this.element.style.top=`${focus.yMm/document.areaMm.height*100}%`;this.element.setAttribute('aria-label',`Punto segnalato: ${focus.label}, X ${focus.xMm.toFixed(2)}, Y ${focus.yMm.toFixed(2)} mm`);
 }
 clear():void{this.element?.remove();this.element=null;}
 dispose():void{this.disposed=true;this.clear();}
}
