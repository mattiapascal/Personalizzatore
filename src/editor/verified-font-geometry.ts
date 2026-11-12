import { inspectDocumentFonts, fontIssueMessage } from './font-preflight';
import type { GraphicDocument } from './model';
/** Every object participates in geometry, including reference guides. */
export async function assertFontGeometry(document: Pick<GraphicDocument, 'objects' | 'fontAssets'>&Partial<Pick<GraphicDocument,'otherPages'>>): Promise<void> {
  const report = await inspectDocumentFonts(document);
  if (report.issues.length) throw new Error(`Correggi i font prima di misurare o adattare la grafica. ${fontIssueMessage(report.issues[0]!)}`);
}
/** The geometric operation receives the exact snapshot that passed preflight. */
export async function withVerifiedFontGeometry<T>(document: GraphicDocument, operation: (snapshot: GraphicDocument) => T): Promise<T> {
  const snapshot = structuredClone(document);
  await assertFontGeometry(snapshot);
  return operation(snapshot);
}
