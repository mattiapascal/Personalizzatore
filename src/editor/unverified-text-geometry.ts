/** A recoverable draft condition, never a successful geometry measurement. */
export class UnverifiedTextGeometryError extends Error {
  constructor(message: string) { super(message); this.name = 'UnverifiedTextGeometryError'; }
}
