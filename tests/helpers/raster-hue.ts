import {rasterColorFixture} from './raster-color';
import {DocumentSchema} from '../../src/editor/model';
import {DEFAULT_RASTER} from '../../src/editor/raster-processing';
export function rasterHueFixture(){const doc=rasterColorFixture();doc.documentId='24242424-2424-4424-8424-242424242424';const image=doc.objects[1]!,caption=doc.objects[2]!;if(image.type!=='image'||caption.type!=='text')throw Error('TEST');image.raster={...DEFAULT_RASTER,mode:'color',hueDeg:120};caption.text='TEST · Tonalità e trasparenza';return DocumentSchema.parse(doc);}
