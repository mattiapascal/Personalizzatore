import { fontTable } from './font-names';
import { readCmapCoverage } from '../src/editor/font-cmap';
export function fontCoverage(bytes: Buffer, format: string) {
  const table = fontTable(bytes, format, 'cmap');
  return table ? readCmapCoverage(table) : undefined;
}
