import { Color } from 'fabric';
import { expandSvgReferences } from './svg-references';
import { Parser } from 'htmlparser2';
export const MAX_SVG_BYTES = 256 * 1024;
const elements = new Set(['svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'title', 'desc', 'defs', 'clipPath']);
const properties = new Set(['fill', 'stroke', 'fill-rule', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'opacity', 'fill-opacity', 'stroke-opacity', 'display', 'visibility', 'color', 'clip-rule', 'clip-path']);
const geometry = new Set(['d', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'points', 'viewBox', 'preserveAspectRatio', 'transform', 'id', 'version', 'xmlns', 'xmlns:xlink', 'class', 'clipPathUnits']);
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]!);
const numeric = /^[+-]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?$/;
export function validateSvgPath(value: string): void {
  if (!value.trim()) return;
  const tokens = value.match(/[+-]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?|[a-zA-Z]/g) ?? [];
  if (tokens.length > 30000 || value.replace(/[+-]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?|[a-zA-Z]|[\s,]/g, '') || !/^[mM]$/.test(tokens[0] ?? '')) throw new Error('Tracciato SVG non valido o troppo complesso');
  const arity: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
  for (let i = 0; i < tokens.length;) {
    const command = tokens[i++]!.toUpperCase(), count = arity[command]; if (count === undefined) throw new Error('Comando del tracciato SVG non supportato');
    let n = 0; while (i < tokens.length && numeric.test(tokens[i]!)) { const value = Number(tokens[i++]!); if (!Number.isFinite(value) || Math.abs(value) > 1e6 || command === 'A' && (n % 7 === 3 || n % 7 === 4) && value !== 0 && value !== 1) throw new Error('Coordinate/archi SVG non validi'); n++; }
    if (count ? !n || n % count : n) throw new Error('Numero di coordinate SVG non valido');
  }
}
function validateTransform(value: string): void {
  const count: Record<string, number[]> = { matrix: [6], translate: [1,2], scale: [1,2], rotate: [1,3], skewX: [1], skewY: [1] }; let end = 0;
  for (const match of value.matchAll(/([a-zA-Z]+)\s*\(([^)]*)\)/g)) { if (value.slice(end, match.index).replace(/[\s,]/g,'')) throw new Error('Trasformazione SVG non valida'); const values = match[2]!.trim().split(/[\s,]+/); if (!count[match[1]!]?.includes(values.length) || values.some(v => !numeric.test(v) || !Number.isFinite(Number(v)) || Math.abs(Number(v)) > 1e6)) throw new Error('Trasformazione SVG non supportata'); end = match.index! + match[0].length; }
  if (!end || value.slice(end).trim()) throw new Error('Trasformazione SVG non valida');
}
export function sanitizeSvg(source: string, monochrome = false, allowText = false): string {
  if (new TextEncoder().encode(source).length > MAX_SVG_BYTES || source.includes('\0') || /<!ENTITY|<!DOCTYPE[^>]*\[/i.test(source)) throw new Error('SVG oltre 256 KB o dichiarazioni XML non consentite');
  source = expandSvgReferences(source, allowText);
  if (new TextEncoder().encode(source).length > MAX_SVG_BYTES) throw new Error('SVG espanso oltre 256 KB');
  let result = '', roots = 0, count = 0; const stack: string[] = [];
  const parser = new Parser({
    onprocessinginstruction(name) { if (!['?xml', '!DOCTYPE', '!doctype'].includes(name)) throw new Error('Istruzione XML non supportata'); },
    onopentag(name, attrs) {
      if (++count > 1000 || stack.length >= 32) throw new Error('SVG troppo complesso');
      if (!elements.has(name) && !(allowText && ['text','tspan'].includes(name))) throw new Error(name === 'text' || name === 'tspan' ? 'Testi SVG non ancora importabili: esportali come tracciati per conservare l’aspetto.' : `Elemento SVG non supportato: ${name}`);
      if (name === 'tspan' && (stack.at(-1) !== 'text' || Object.keys(attrs).length)) throw new Error('Testo SVG con stili o posizioni diversi nella stessa riga: separare le righe prima di importare');
      if (stack.some(tag => tag === 'text' || tag === 'tspan') && name !== 'tspan') throw new Error('Struttura del testo SVG non supportata');
      if (name === 'svg') { if (stack.length || ++roots !== 1) throw new Error('È supportata una sola area SVG'); if (!attrs.xmlns) attrs.xmlns = 'http://www.w3.org/2000/svg'; }
      else if (!stack.length) throw new Error('Manca la radice SVG');
      if (stack.includes('defs') && !stack.includes('clipPath') && !['defs', 'title', 'desc', 'clipPath'].includes(name)) throw new Error('Risorse SVG in defs non ancora supportate');
      if (attrs.style) { for (const entry of attrs.style.split(';').filter(value => value.trim())) { const at = entry.indexOf(':'), key = entry.slice(0, at).trim(), value = entry.slice(at + 1).trim(); if (at < 0 || !properties.has(key)) throw new Error(`Stile SVG non supportato: ${key}`); attrs[key] = value; } delete attrs.style; }
      for (const [key, value] of Object.entries(attrs)) {
        if (/^on/i.test(key) || /href/i.test(key) || (/url\s*\(/i.test(value) && !(key === 'clip-path' && /^url\(\s*#[a-zA-Z_][\w.:-]*\s*\)$/.test(value)) || /javascript:|data:|!important/i.test(value))) throw new Error('SVG con script o riferimenti a risorse non consentiti');
        const textProperty = allowText && ['font-family','font-size','font-weight','font-style','text-anchor','letter-spacing','textLength','lengthAdjust'].includes(key);
        if (!geometry.has(key) && !properties.has(key) && !textProperty) { if (/^(data-|aria-|inkscape:|sodipodi:|xmlns:)/.test(key)) { delete attrs[key]; continue; } throw new Error(`Attributo SVG non supportato: ${key}`); }
        if (key === 'font-family' && (!value.trim() || value.length > 160 || !/^[\p{L}\p{N} _.,+'"\/-]+$/u.test(value))) throw new Error('Nome font SVG non valido');
        if (key === 'font-weight' && !['normal','bold','400','700'].includes(value) || key === 'font-style' && !['normal','italic'].includes(value) || key === 'text-anchor' && !['start','middle','end'].includes(value)) throw new Error('Stile testo SVG non supportato');
        if (['font-size','letter-spacing'].includes(key) && (!/^[+-]?(?:\d*\.\d+|\d+\.?\d*)(?:px|pt|mm)?$/.test(value) || Math.abs(parseFloat(value)) > 1000 || key === 'font-size' && parseFloat(value) <= 0)) throw new Error('Misura del testo SVG non valida');
        if (key === 'textLength' && (name !== 'text' || !/^(?:\d*\.\d+|\d+\.?\d*)$/.test(value) || Number(value) <= 0 || Number(value) > 10000) || key === 'lengthAdjust' && value !== 'spacingAndGlyphs') throw new Error('Dilatazione del testo SVG non supportata');
        if (['fill','stroke','color'].includes(key) && value !== 'none') { const color = new Color(value), [r,g,b,a] = color.getSource(); if (color.isUnrecognised || a !== 1) throw new Error('Colore o opacità SVG non supportati'); if (r===g && g===b && (r===0 || r===255)) attrs[key]=r===0?'#000000':'#ffffff'; else if (monochrome) attrs[key]='#000000'; else throw new Error('SVG a colori: attiva la conversione al nero per il profilo timbro'); }
        if (key === 'clipPathUnits' && value !== 'userSpaceOnUse') throw new Error('Ritaglio SVG con unità non supportate');
        if (['opacity', 'fill-opacity', 'stroke-opacity'].includes(key) && Number(value) !== 1) throw new Error('Opacità SVG parziale non ancora supportata');
        if (key === 'stroke-dasharray' && value !== 'none' || key === 'stroke-dashoffset' && Number(value) !== 0) throw new Error('Tratteggio SVG personalizzato non ancora supportato');
        if (['x','y','x1','y1','x2','y2','cx','cy','r','rx','ry','width','height','stroke-width','stroke-miterlimit'].includes(key)) {
          const match = value.match(/^([+-]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?)(px|pt|mm|cm|in|pc)?$/);
          if (!match || !Number.isFinite(Number(match[1])) || Math.abs(Number(match[1])) > 1e6 || ['r','rx','ry','width','height','stroke-width'].includes(key) && Number(match[1]) < 0) throw new Error(`Misura SVG non valida: ${key}`);
        }
        if (key === 'points') { const tokens = value.trim().split(/[\s,]+/); if (tokens.length < 4 || tokens.length > 8192 || tokens.length % 2 || tokens.some(token => !numeric.test(token) || Math.abs(Number(token)) > 1e6)) throw new Error('Punti SVG non validi'); }
        if (['fill-rule','clip-rule'].includes(key) && !['evenodd','nonzero'].includes(value) || key === 'stroke-linecap' && !['butt','round','square'].includes(value) || key === 'stroke-linejoin' && !['miter','round','bevel'].includes(value) || key === 'visibility' && !['visible','hidden','collapse'].includes(value) || key === 'display' && !['inline','block','none'].includes(value)) throw new Error(`Proprietà SVG non supportata: ${key}`);
        if (key === 'transform') validateTransform(value);
        if (key === 'd') validateSvgPath(value);
        if (key === 'preserveAspectRatio' && !/^(none|x(?:Min|Mid|Max)Y(?:Min|Mid|Max)(?:\s+meet)?)$/.test(value)) throw new Error('Ritaglio del viewport SVG non ancora supportato');
        if (key === 'xmlns' && value !== 'http://www.w3.org/2000/svg' || key === 'xmlns:xlink' && value !== 'http://www.w3.org/1999/xlink') throw new Error('Namespace SVG non valido');
      }
      if (name === 'svg') { const box = attrs.viewBox?.trim().split(/[\s,]+/).map(Number); if (box && (box.length !== 4 || box.some(value => !Number.isFinite(value) || Math.abs(value) > 1e6) || box[2]! <= 0 || box[3]! <= 0)) throw new Error('viewBox SVG non valido'); if (!attrs.width && box) attrs.width = String(box[2]); if (!attrs.height && box) attrs.height = String(box[3]); for (const dimension of [attrs.width, attrs.height]) if (!dimension || !/^[+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[+-]?\d+)?(?:px|pt|mm|cm|in|pc)?$/i.test(dimension) || parseFloat(dimension) <= 0 || parseFloat(dimension) > 1e6) throw new Error('SVG richiede larghezza/altezza o viewBox con misure finite'); }
      stack.push(name); result += `<${name}${Object.entries(attrs).map(([key, value]) => ` ${key}="${escape(value)}"`).join('')}>`;
    },
    onclosetag(name, implied) { if (implied && !source.slice(parser.startIndex, parser.endIndex + 1).trim().endsWith('/>') || stack.pop() !== name) throw new Error('Struttura XML SVG non valida'); result += `</${name}>`; },
    ontext(value) { if (['title','desc',...(allowText ? ['text','tspan'] : [])].includes(stack.at(-1) ?? '')) result += escape(value); else if (value.trim()) throw new Error('Testo inatteso nel file SVG'); },
  }, { xmlMode: true, decodeEntities: true }); parser.end(source);
  if (stack.length || roots !== 1) throw new Error('File SVG incompleto'); return result;
}
