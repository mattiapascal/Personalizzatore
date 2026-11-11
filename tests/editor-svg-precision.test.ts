import { expect, it } from 'vitest';
import { config } from 'fabric';
import { preciseIntermediateSvg } from '../src/editor/svg-precision';

it('precisione intermedia soltanto sincrona, ripristinata anche dopo annidamento o errore', () => {
 const previous=config.NUM_FRACTION_DIGITS;
 expect(preciseIntermediateSvg(()=>{
  expect(config.NUM_FRACTION_DIGITS).toBeGreaterThanOrEqual(12);
  expect(preciseIntermediateSvg(()=>String(config.NUM_FRACTION_DIGITS))).toBe(String(Math.max(previous,12)));
  expect(config.NUM_FRACTION_DIGITS).toBe(Math.max(previous,12));
  return '<svg/>';
 })).toBe('<svg/>');
 expect(config.NUM_FRACTION_DIGITS).toBe(previous);
 expect(()=>preciseIntermediateSvg(()=>{throw Error('Serializzazione fallita');})).toThrow('Serializzazione fallita');
 expect(config.NUM_FRACTION_DIGITS).toBe(previous);
});
