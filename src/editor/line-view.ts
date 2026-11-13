import {Line} from 'fabric';
/** Fabric Line removes a flat cap's horizontal overhang in its untransformed
 * dimensions, but ObjectGeometry adds it back in the scaled dimensions.
 * Keep measurement, ordinary bounds and affine frame corners consistent. */
export class EditorLine extends Line{
 override _getTransformedDimensions(options:Parameters<Line['_getTransformedDimensions']>[0]={}){
  return super._getTransformedDimensions(this.strokeLineCap==='butt'?{...options,width:(options.width??this.width)-(options.strokeWidth??this.strokeWidth)}:options);
 }
}
