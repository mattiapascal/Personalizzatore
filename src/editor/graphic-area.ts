import{z}from'zod';
import{GRAPHIC_GEOMETRY_LIMITS}from'./limits';
/** Local graphic documents can exceed the public stamp catalogue dimensions. */
export const GraphicAreaSchema=z.strictObject({width:z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.pageSideMm),height:z.number().finite().positive().max(GRAPHIC_GEOMETRY_LIMITS.pageSideMm)});
