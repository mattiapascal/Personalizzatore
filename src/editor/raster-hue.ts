/** RGB rotation used by Fabric 7.4 HueRotation (MIT), independent of DOM/GPU.
 * Reference: node_modules/fabric/src/filters/HueRotation.ts. The caller writes
 * through Uint8ClampedArray before applying the remaining color adjustments. */
export function hueRotationMatrix(degrees:number):readonly number[]{
 if(!Number.isFinite(degrees)||Math.abs(degrees)>180)throw Error('Tonalità non valida');
 const angle=degrees/180*Math.PI,cosine=Math.abs(degrees)===90?0:Math.cos(angle),sine=degrees===180?0:Math.sin(angle),third=1/3,sin=Math.sqrt(third)*sine,oneMinusCos=1-cosine;
 return[cosine+oneMinusCos/3,third*oneMinusCos-sin,third*oneMinusCos+sin,
  third*oneMinusCos+sin,cosine+third*oneMinusCos,third*oneMinusCos-sin,
  third*oneMinusCos-sin,third*oneMinusCos+sin,cosine+third*oneMinusCos];
}
