/** Display-name search only: never resolves or substitutes a font file. */
export function fontNameMatches(name: string, query: string): boolean {
  const fold = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('it');
  const words = fold(query).match(/[\p{L}\p{N}]+/gu) ?? [];
  const label = fold(name);
  return words.every(word => label.includes(word));
}
