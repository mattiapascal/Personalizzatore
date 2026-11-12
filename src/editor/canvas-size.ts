/** Display scale only; physical SVG/PDF units remain millimetres. */
export const PX_PER_MM=8;
export const CANVAS_BITMAP_LIMITS={side:8192,pixels:16_000_000}as const;
/** Bound each backing surface, including Retina, before allocating a canvas.
 * Whole percent limits keep the range input and wheel clamp in agreement. */
export function canvasZoomLimit(area:{width:number;height:number},retina=1):number{
 if(!Number.isFinite(area.width)||!Number.isFinite(area.height)||area.width<=0||area.height<=0||!Number.isFinite(retina)||retina<=0)throw Error('Formato canvas non valido');
 const ratio=Math.max(1,retina),width=area.width*PX_PER_MM*ratio,height=area.height*PX_PER_MM*ratio;
 const limit=Math.floor(Math.min(4,CANVAS_BITMAP_LIMITS.side/Math.max(width,height),Math.sqrt(CANVAS_BITMAP_LIMITS.pixels/(width*height)))*100)/100;
 if(limit<.01)throw Error('Formato o densità dello schermo oltre il budget del canvas');
 return limit;
}
