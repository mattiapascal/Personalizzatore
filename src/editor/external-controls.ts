import type{Canvas,TPointerEvent}from'fabric';
/** Draw only controls beyond the paper on a DOM overlay. Fabric remains the
 * gesture engine, including its fixed anchors and document mouse-up handling.
 * The paper canvas and every physical/export coordinate stay unchanged. */
export class ExternalCanvasControls{
 private root:HTMLDivElement;private handles=new Map<string,HTMLCanvasElement>();
 constructor(private canvas:Canvas){this.root=document.createElement('div');this.root.className='external-canvas-controls';this.root.setAttribute('aria-hidden','true');canvas.upperCanvasEl.parentElement?.append(this.root);}
 render():void{
  const active=this.canvas.getActiveObject(),visible=new Set<string>();
  if(active&&active.hasControls&&!('isEditing'in active&&active.isEditing))for(const[name,control]of Object.entries(active.controls)){
   if(!control.getVisibility(active,name))continue;const point=active.oCoords?.[name];if(!point)continue;
   const radius=Math.max(control.sizeX||active.cornerSize,control.sizeY||active.cornerSize)/2+2;
   if(point.x-radius>=0&&point.x+radius<=this.canvas.width&&point.y-radius>=0&&point.y+radius<=this.canvas.height)continue;
   visible.add(name);let element=this.handles.get(name);
   if(!element){element=document.createElement('canvas');element.className='external-canvas-handle';element.dataset.control=name;this.root.append(element);this.handles.set(name,element);
    const start=(event:MouseEvent|TouchEvent)=>{if('button'in event&&event.button!==0)return;this.canvas.calcOffset();const current=this.canvas.getActiveObject();if(!current?.findControl(this.canvas.getViewportPoint(event),event.type==='touchstart'))return;event.preventDefault();event.stopPropagation();this.canvas.upperCanvasEl.focus({preventScroll:true});if(event.type==='touchstart')this.canvas._onTouchStart(event as TouchEvent);else this.canvas._onMouseDown(event as TPointerEvent);};
    element.addEventListener('mousedown',start);element.addEventListener('touchstart',start,{passive:false});element.addEventListener('dblclick',event=>{event.preventDefault();event.stopPropagation();this.canvas.upperCanvasEl.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,detail:2,clientX:event.clientX,clientY:event.clientY,button:0,shiftKey:event.shiftKey,altKey:event.altKey,ctrlKey:event.ctrlKey,metaKey:event.metaKey}));});
   }
   const size=Math.ceil(radius*2+4),retina=this.canvas.getRetinaScaling();element.style.left=`${point.x-size/2}px`;element.style.top=`${point.y-size/2}px`;element.style.width=element.style.height=`${size}px`;element.width=Math.ceil(size*retina);element.height=Math.ceil(size*retina);element.style.cursor=control.cursorStyleHandler({shiftKey:false}as TPointerEvent,control,active,point);const context=element.getContext('2d');if(context){context.scale(retina,retina);context.strokeStyle=context.fillStyle=active.cornerColor;control.render(context,size/2,size/2,{},active);}
  }
  for(const[name,element]of this.handles)if(!visible.has(name)){element.remove();this.handles.delete(name);}
 }
 dispose():void{this.root.remove();this.handles.clear();}
}
