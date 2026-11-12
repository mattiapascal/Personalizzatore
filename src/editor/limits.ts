/** Lab resource ceilings, distinct from the production rules of a product profile. */
export const EDITOR_LIMITS={objects:1000,vectorCommandsPerObject:32768,vectorCommands:65536,groups:100,textCharacters:4000,textLines:100,documentTextCharacters:20000,minFontSizePt:0.1,maxFontSizePt:2000,minTrackingPt:-20,maxTrackingPt:100,minLineHeight:0.1,maxLineHeight:3,maxStrokeMm:100,maxObjectExtentMm:10000}as const;

/** Source parsing budgets can exceed the canonical count, never its complexity ceilings. */
export const GRAPHIC_IMPORT_LIMITS={sourceElements:2000,svgElements:4000,svgBytes:2*1024*1024}as const;

/** Technical drawing ceilings; independent from product or public chat rules. */
export const GRAPHIC_GEOMETRY_LIMITS={pageSideMm:3000,objectSideMm:3000,coordinateMm:10000,selectionSideMm:30000}as const;
