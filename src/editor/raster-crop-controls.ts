import { FabricImage, Control } from 'fabric';
import type { ImageObject } from './raster-geometry';
import { dragRasterCrop, panRasterContents } from './raster-crop-edit';
import type { Measure, SceneObject } from './model';
export class RasterCropControls {
  private saved: { object: FabricImage; controls: Record<string, Control>; visibility: Record<string, boolean>;hasControls:boolean } | null = null;
  preview: ImageObject | null = null;
  configure(object: FabricImage | null, source: ImageObject | null, measure: Measure, render: (source: SceneObject) => unknown, active: () => void, moveContents=false, zoom=1): void {
    this.restore(); if (!object || !source) return; this.saved = { object,hasControls:object.hasControls, controls: object.controls, visibility: Object.fromEntries(Object.keys(object.controls).map(key => [key, object.isControlVisible(key)])) };
    if(moveContents){
      const width=object.width*Math.abs(object.scaleX)*zoom,height=object.height*Math.abs(object.scaleY)*zoom;
      const handle=new Control({x:0,y:0,sizeX:Math.max(22,width),sizeY:Math.max(22,height),touchSizeX:Math.max(26,width),touchSizeY:Math.max(26,height),actionName:'panRasterContents',cursorStyle:'grab',
        actionHandler:(_event,transform,px,py)=>{
          try{const next=panRasterContents(source,(px-transform.ex)/8,(py-transform.ey)/8),crop=next.crop??{leftPx:0,topPx:0};
            const target=transform.target as FabricImage;if(target.cropX===crop.leftPx&&target.cropY===crop.topPx)return false;
            target.set({cropX:crop.leftPx,cropY:crop.topPx,dirty:true});this.preview=next;active();target.canvas?.setCursor('grabbing');return true;
          }catch{return false;}
        },
        render:(context,left,top)=>{context.save();context.translate(left,top);context.rotate(object.angle*Math.PI/180);context.fillStyle='#fff';context.strokeStyle='#0088cc';context.lineWidth=2;context.fillRect(-10,-10,20,20);context.strokeRect(-10,-10,20,20);context.beginPath();context.moveTo(-7,0);context.lineTo(7,0);context.moveTo(0,-7);context.lineTo(0,7);context.moveTo(-4,-3);context.lineTo(-7,0);context.lineTo(-4,3);context.moveTo(4,-3);context.lineTo(7,0);context.lineTo(4,3);context.moveTo(-3,-4);context.lineTo(0,-7);context.lineTo(3,-4);context.moveTo(-3,4);context.lineTo(0,7);context.lineTo(3,4);context.stroke();context.restore();},
      });
      object.controls={photoPan:handle};object.hasControls=true;object.setControlVisible('photoPan',true);object.setCoords();return;
    }
    const controls: Record<string, Control> = {}, points = { tl: [-.5, -.5], tr: [.5, -.5], br: [.5, .5], bl: [-.5, .5], ml: [-.5, 0], mr: [.5, 0], mt: [0, -.5], mb: [0, .5] };
    for (const [key, [x = 0, y = 0]] of Object.entries(points)) controls[key] = new Control({ x, y, actionName: 'cropRaster', cursorStyle: 'crosshair', touchSizeX: 26, touchSizeY: 26,
      actionHandler: (_event, transform, px, py) => {
        try { const next = dragRasterCrop(source, x, y, (px - transform.ex) / 8, (py - transform.ey) / 8, measure), fresh = render(next) as FabricImage, target = transform.target as FabricImage;
          target.setElement(fresh.getElement()); target.set({ left: fresh.left, top: fresh.top, width: fresh.width, height: fresh.height, cropX:fresh.cropX,cropY:fresh.cropY, scaleX: fresh.scaleX, scaleY: fresh.scaleY, angle: fresh.angle, flipX: fresh.flipX, flipY: fresh.flipY }); target.setCoords(); target.set('dirty', true); this.preview = next; active(); return true;
        } catch { return false; }
      },
      render: (context, left, top) => { context.save(); context.translate(left, top); context.rotate(object.angle * Math.PI / 180); context.strokeStyle = '#fff'; context.lineWidth = 5; context.beginPath(); if (x && y) { context.moveTo(-Math.sign(x) * 9, 0); context.lineTo(0, 0); context.lineTo(0, -Math.sign(y) * 9); } else { context.moveTo(x ? 0 : -6, y ? 0 : -6); context.lineTo(x ? 0 : 6, y ? 0 : 6); } context.stroke(); context.strokeStyle = '#0088cc'; context.lineWidth = 2; context.stroke(); context.restore(); },
    });
    object.controls = controls; object.setControlsVisibility(Object.fromEntries(Object.keys(controls).map(key => [key, true]))); object.setCoords();
  }
  restore(): void { if (this.saved) { this.saved.object.controls = this.saved.controls;this.saved.object.hasControls=this.saved.hasControls; this.saved.object.setControlsVisibility(this.saved.visibility); } this.saved = null; this.preview = null; }
}
