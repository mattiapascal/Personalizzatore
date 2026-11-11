import { config } from 'fabric';

/** Fabric's four-decimal SVG matrices lose physical precision on reimport.
 * Keep the higher precision strictly within a synchronous serialization: no
 * pending async render can observe a changed global setting. */
export function preciseIntermediateSvg(serialize: () => string): string {
  const previous = config.NUM_FRACTION_DIGITS;
  try {
    config.NUM_FRACTION_DIGITS = Math.max(previous, 12);
    return serialize();
  } finally {
    config.NUM_FRACTION_DIGITS = previous;
  }
}
