import {productionGeometryFixture,geometryRect} from './production-geometry';
export function geometryFocusFixture(){const document=productionGeometryFixture();document.objects.push(geometryRect('moving',45,24,4,3));return document;}
