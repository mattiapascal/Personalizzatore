import { parseDocument, DomUtils } from 'htmlparser2';
import type { KnowledgeDocument } from './model.ts';
type Node = ReturnType<typeof parseDocument>['children'][number];
function text(node: Node): string {
  if (node.type === 'text') return node.data;
  if ('name' in node && node.name === 'br') return '\n';
  if ('attribs' in node && (['script', 'style', 'nav', 'footer', 'noscript', 'template'].includes(node.name) || node.attribs.hidden !== undefined || node.attribs['aria-hidden'] === 'true')) return '';
  if (!('children' in node)) return '';
  const result = node.children.map(text).join('');
  return 'name' in node && /^(p|li|div|h[1-6]|br|section)$/.test(node.name) ? '\n' + result + '\n' : result;
}
export function plainText(html: string): string { return text(parseDocument(html)).replace(/[ \t\r]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim(); }
function excludedParent(node: Node): boolean { let parent = node.parent; while (parent) { if ('attribs' in parent && /product-block|product-card|newsletter|review|cc-accordion-item|collapsible-faqs/.test(parent.attribs.class ?? '')) return true; parent = parent.parent; } return false; }
export function extractPage(html: string, url: string): KnowledgeDocument[] {
  const dom = parseDocument(html);
  const main = DomUtils.findOne(el => el.name === 'main', dom.children, true);
  if (!main) return [];
  const h1 = DomUtils.findOne(el => el.name === 'h1', [main], true);
  const title = ((h1 ? plainText(DomUtils.getOuterHTML(h1)) : '') || 'Informazioni del negozio').slice(0, 240);
  const docs: KnowledgeDocument[] = [];
  const details = DomUtils.findAll(el => el.name === 'details' && /cc-accordion-item|faq/.test(el.attribs.class ?? ''), [main]);
  for (const [i, detail] of details.entries()) {
    const summary = DomUtils.findOne(el => el.name === 'summary', detail.children, true);
    const content = DomUtils.findOne(el => (el.attribs.class ?? '').split(' ').includes('cc-accordion-item__content'), detail.children, true);
    if (!summary || !content) continue;
    const question = plainText(DomUtils.getOuterHTML(summary)), answer = plainText(DomUtils.getOuterHTML(content));
    if (!question || !answer) continue;
    docs.push({ id: url + ':faq:' + i, title: (title + ' · ' + question).slice(0, 240), text: question + '\n' + answer, url, kind: 'faq', stamp: /^timbr/i.test(title) || /\/collections\/timbri/.test(url) });
  }
  // Solo testo editoriale, non navigazione, recensioni, script o prezzi delle card.
  if (!url.includes('/products/')) {
    const paragraphs = DomUtils.findAll(el => el.name === 'p' && !excludedParent(el), [main]);
    for (const [i, p] of paragraphs.entries()) { const value = plainText(DomUtils.getOuterHTML(p)); if (value.length >= 45 && value.length <= 1800) docs.push({ id: url + ':p:' + i, title, text: value, url, kind: 'page' }); }
  }
  if (new URL(url).pathname === '/') {
    const footers = DomUtils.findAll(el => el.name === 'footer' || (el.attribs.class ?? '').split(' ').includes('shopify-section-group-footer-group'), dom.children);
    const texts = [...new Set(footers.flatMap(footer => DomUtils.findAll(el => el.name === 'p', footer.children).map(p => plainText(DomUtils.getOuterHTML(p)))).filter(p => p.length >= 8 && p.length <= 1800))];
    for (const [i, value] of texts.entries()) docs.push({ id: url + ':footer:' + i, title: 'Informazioni del negozio · Contatti e servizi', text: value, url, kind: 'page' });
  }
  return docs.slice(0, 100);
}
