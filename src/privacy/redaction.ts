import { AiRequestSchema, type AiRequest } from '../ai/request.ts';
import { AiToolSchema, type AiTool } from '../ai/contract.ts';

// Il lessico evita falsi allarmi su marchi/termini tecnici in maiuscolo. Una
// parola sconosciuta NON è un dato personale: servono segnali identificativi.
const ordinary = new Set(`a ad ai al alla alle allo all anche ancora alcuni altre altri altro almeno altezza alto automatico automatica automatici autoinchiostrante autoinchiostranti azienda aziendali aziendale bar basta bene bianco bisogno boh buongiorno caffè casella caselle caselline cerchio cerco che chiaro circa cm col con come composizione comprare conoscere contenuto contenuti cosa così ciao da dal dalla dalle dati dei del della delle dello devo di diametro dimensione dimensioni dire disposto dove due e è ed emboss es esempio esiste essere ex exlibris fare farlo fattura fatture fedeltà fino forma formato formati forse fra grazie grafica grafico grafiche grande grandi ha hai hanno ho i il impronta in incorporato indicare informazioni invece io la larghezza lato le legno libri libris logo loghi lo loro ma manuale manuali materiale materiali me mi mio mia miei mie misure mm montatura molto nero ne nel nella nelle nello nessuna no nome non noto note numeri numero o ok oppure ora ottone parte per perché piccolo piccola piccoli più plastica poco posso possiamo preferisco preferirei preferenza prima prodotto prodotti prova punti quadrata quadrate quadrati quadrato quale quali quanto quattro quello quella quelle quelli questo questa queste questi raccolta raccolte rettangolare rettangolo righe rilievo rispondi rotonda rotondo rotonde sapere scrivere scrivimi se secondo sei senza separato serva serve servirebbe sette si sì simbolo simboli so solo sono spazio stampare stima stimare su sul sulla targa targhe tascabile tascabili tampone testo testi tessera tessere ti timbrare timbri timbro tipo tre tu tua tuo tutti tutte un una uno uso utilizzo va vorrei voglio x abbonamento abbonamenti bancone veloci velocemente nonostante cambiare cambio togli togliere scelta preferenze nessun opzioni rettangolari uguale entrambe entrambi due diam min minimo minima minimi minime massimo massima massimi massime lunghezza larghe grandezza figura illustrazione illustrazioni soggetto gufo libro gatto cane disegno disegnare nome indirizzo partita iva codice fiscale telefono email pec fatture timpro bottega quadrato lato millimetri centimetri automatic senza dentro farebbe misurano vorresti mettere iniziale obiettivo utile utile chiarire puoi può puoi come logo prova test json svg ai api`.split(/\s+/));
for (const word of 'preferisci preferire scegliere scegli indicato indicata indicare misurare previsto previste chiama chiamo chiamato confermare confermi'.split(' ')) ordinary.add(word);
for (const word of 'degli dagli negli sugli agli buongiorno buonasera buon giorno salve'.split(' ')) ordinary.add(word);
const givenNames = new Set('mario maria davide luca luigi marco paolo paola anna andrea francesco francesca giovanni giovanna giuseppe giuseppina laura lorenzo giulia giulio chiara claudio claudia simone simona alessandro alessandra roberto roberta antonio antonella antonietta antonino carlo carla massimo massimo massimo michele michela nicola nicole federico federica stefano stefania daniele daniela sara serena elena enrico enrica pietro piero franca franco giorgio giorgia gabriele gabriella fabio fabiola silvia silvio valentina valentino riccardo beatrice benedetta rosa luna aurora angelo angela cristina cristian cristiano christian elisa elisabetta emanuele emanuela alberto alessio erika erica martina matteo mattia mauro patrizia raffaele raffaella renato renata salvatore sofia tommaso vincenzo vittorio vittoria valeria valerio walter william john jane james emily michael david daniel alex sarah omar'.split(' '));
const tokenPattern = /\[RISERVATO_\d+\]/g;
const words = /[\p{L}]+(?:['’\-][\p{L}]+)*/gu;
const patterns: RegExp[] = [
  /https?:\/\/[^\s<>]+|\bwww\.[^\s<>]+/gi,
  /[\p{L}\d.!#$%&'*+/=?^_`{|}~-]+@[\p{L}\d.-]+\.[\p{L}]{2,}/giu,
  /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z\d]){11,30}\b/gi,
  /\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/gi,
  /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g,
  /(?<![\p{L}\d])(?:\+\d[\d ()./-]{6,}\d|\d[\d .()/-]{6,}\d)(?![\p{L}\d])/gu,
  /\b\d{4,}\b/g,
  /\b(?:[Vv]ia|[Vv]iale|[Pp]iazza|[Cc]orso|[Vv]icolo|[Ss]trada|[Pp]iazzale)\s+(?:\p{Lu}[\p{L}'’-]*\s*){1,5}(?:\d{1,4}[A-Za-z]?)?/gu,
  /\b(?:via|viale|piazza|corso|vicolo|strada|piazzale)\s+[\p{L}'’ .-]{1,70}\s+\d{1,4}[a-z]?\b/giu,
  /\b(?:[\p{Lu}][\p{L}'’.-]*\s+){1,5}(?:s\.?r\.?l\.?|s\.?p\.?a\.?|s\.?n\.?c\.?|s\.?a\.?s\.?)\b/gu,
  /(?<=\b(?:mi chiamo|azienda chiamata|ditta|società|il bar si chiama|il mio bar si chiama)\s+)[^\n,;:.]{1,100}/giu,
  /(?<=\b(?:nome(?: e cognome)?|cognome|ragione sociale|azienda)\s*:\s*)[^\n,;:.]{1,100}/giu,
];
export type PrivacyNature = 'private' | 'generic';
export interface PrivacyPart { token: string; original: string; kind: 'word' | 'identifier' | 'content'; canRelease: boolean }
interface Entry { original: string; kind: PrivacyPart['kind']; nature?: PrivacyNature }
export interface PreparedPrivacy { request: AiRequest; needsReview: boolean; parts: PrivacyPart[]; localText?: string; source: AiRequest }
interface Span { start: number; end: number; kind: PrivacyPart['kind'] | 'placeholder'; priority: number }
const intersects = (a: Span, b: Span) => a.start < b.end && b.start < a.end;
const hasIdentifiers = (text: string) => patterns.some(pattern => [...text.matchAll(pattern)].length > 0);
const exactSpans = (text: string, value: string): Span[] => {
  const found: Span[] = [];
  for (let start = text.indexOf(value); start >= 0; start = text.indexOf(value, start + value.length)) {
    const end = start + value.length;
    if (!/[\p{L}\d]/u.test(text[start - 1] ?? '') && !/[\p{L}\d]/u.test(text[end] ?? '')) found.push({ start, end, kind: 'word', priority: 0 });
  }
  return found;
};
export class PrivacyVault {
  private values = new Map<string, Entry>();
  private publicFragments: string[] = [];
  private vocabulary = new Set(ordinary);
  constructor(catalogTitles: readonly string[] = [], publicFragments: readonly string[] = []) {
    this.allowCatalogTitles(catalogTitles);
    if (publicFragments.some(value => hasIdentifiers(value) || /\[RISERVATO_/.test(value))) throw new Error('Un recapito o codice identificativo deve restare protetto');
    this.publicFragments = [...publicFragments];
  }
  allowCatalogTitles(titles: readonly string[]) {
    // Solo parole già pubbliche delle referenze fornite dal catalogo, mai parole
    // scelte dall'utente come eccezione automatica alla protezione dei nomi.
    for (const title of titles) for (const word of title.match(/[\p{L}]+/gu) ?? []) this.vocabulary.add(word.toLocaleLowerCase('it'));
  }
  private token(value: string, kind: Entry['kind']) {
    const rank = { word: 1, content: 2, identifier: 3 };
    for (const [key, entry] of this.values) if (entry.original === value) {
      if (rank[kind] > rank[entry.kind]) this.values.set(key, { original: value, kind, ...(entry.nature === 'private' ? { nature: 'private' as const } : {}) });
      return key;
    }
    const key = `[RISERVATO_${this.values.size + 1}]`; this.values.set(key, { original: value, kind }); return key;
  }
  clear() { this.values.clear(); this.publicFragments = []; }
  private released(entry: Entry) { return entry.nature === 'generic' && !hasIdentifiers(entry.original); }
  private knownWord(word: string): boolean {
    const normalized = word.toLocaleLowerCase('it').replace(/’/g, "'");
    if (this.vocabulary.has(normalized)) return true;
    if (normalized.includes('-')) return normalized.split('-').every(part => this.knownWord(part));
    const elision = /^(?:all|dall|dell|nell|sull|coll|l|d|un|quest|quell)'(.+)$/u.exec(normalized);
    // Il prefisso grammaticale non autorizza il resto: d'Angelo resta privato.
    return !!elision && this.vocabulary.has(elision[1]!);
  }
  protect(text: string, opaque = false, _maskUnknown = false): string {
    if (!text) return text;
    if (opaque) return /^\[RISERVATO_\d+\]$/.test(text) ? text : this.token(text, 'content');
    const placeholders: Span[] = [...text.matchAll(/\[(?:RISERVATO_\d+|DATO)\]/g)].map(m => ({ start: m.index, end: m.index + m[0].length, kind: 'placeholder', priority: 4 }));
    const candidates: Span[] = [...placeholders];
    const approved = this.publicFragments.flatMap(value => exactSpans(text, value));
    const allowed = [...approved, ...[...this.values.values()].filter(entry => this.released(entry)).flatMap(entry => exactSpans(text, entry.original))];
    for (const entry of this.values.values()) if (!this.released(entry) && (entry.kind === 'content' || entry.nature === 'private')) {
      for (const span of exactSpans(text, entry.original)) candidates.push({ ...span, kind: entry.kind, priority: entry.kind === 'content' ? 3 : 2 });
    }
    for (const pattern of patterns) for (const match of text.matchAll(pattern)) {
      const span: Span = { start: match.index, end: match.index + match[0].length, kind: 'identifier', priority: 2 };
      if (!placeholders.some(other => intersects(span, other)) && !approved.some(other => other.start <= span.start && other.end >= span.end)) candidates.push(span);
    }
    const tokens = [...text.matchAll(words)];
    const stem = (value: string) => value.replace(/^(?:all|dall|dell|nell|sull|coll|l|d|un|quest|quell)['’]/iu, '');
    const proper = (value: string) => /^\p{Lu}/u.test(stem(value)) && !this.knownWord(value);
    for (const [index, match] of tokens.entries()) {
      const span: Span = { start: match.index, end: match.index + match[0].length, kind: 'word', priority: 1 };
      const previous = tokens[index - 1], next = tokens[index + 1];
      const adjacent = (other: typeof match | undefined) => other && /^[ \t]+$/.test(text.slice(Math.min(span.end, other.index + other[0].length), Math.max(span.start, other.index)));
      const lowerName = givenNames.has(stem(match[0]).toLocaleLowerCase('it'));
      const nameContext = tokens.length === 1 || /^\p{Lu}/u.test(stem(match[0])) || /\b(?:per|di|da|studio|officina)\s*$/iu.test(text.slice(0, match.index));
      const firstOfName = lowerName && (nameContext || (adjacent(next) && !this.knownWord(next![0])));
      const afterGivenName = previous && adjacent(previous) && givenNames.has(stem(previous[0]).toLocaleLowerCase('it')) && !this.knownWord(match[0]);
      const capitalizedName = proper(match[0]) && ((adjacent(previous) && proper(previous![0])) || (adjacent(next) && proper(next![0])));
      const apostropheName = /^(?:d|o|l)['’]\p{Lu}/iu.test(match[0]) && !this.knownWord(match[0]);
      if ((firstOfName || afterGivenName || capitalizedName || apostropheName) && !this.knownWord(match[0]) && !allowed.some(other => other.start <= span.start && other.end >= span.end)) candidates.push(span);
    }
    const selected: Span[] = [];
    for (const span of candidates.sort((a, b) => b.priority - a.priority || (b.end - b.start) - (a.end - a.start) || a.start - b.start)) if (!selected.some(other => intersects(span, other))) selected.push(span);
    const grouped: Span[] = [];
    for (const span of selected.sort((a, b) => a.start - b.start)) {
      const previous = grouped.at(-1);
      if (previous?.kind === 'word' && span.kind === 'word' && /^[ \t]+$/.test(text.slice(previous.end, span.start)) && span.end - previous.start <= 480) previous.end = span.end;
      else grouped.push({ ...span });
    }
    let result = '', cursor = 0;
    for (const span of grouped) {
      const original = text.slice(span.start, span.end);
      const token = span.kind === 'placeholder' ? original : this.token(original, span.kind);
      const entry = this.values.get(token);
      result += text.slice(cursor, span.start) + (entry && this.released(entry) ? entry.original : token); cursor = span.end;
    }
    result += text.slice(cursor);
    return result;
  }
  protectHistory(messages: readonly { role: 'user' | 'assistant'; text: string }[]) {
    return messages.slice(-6).map(message => {
      const text = this.protect(message.text, false, true);
      let start = Math.max(0, text.length - 400);
      for (const match of text.matchAll(tokenPattern)) if (match.index < start && match.index + match[0].length > start) start = match.index + match[0].length;
      return { ...message, text: text.slice(start) };
    });
  }
  prepare(input: AiRequest): PreparedPrivacy {
    // Contenuto esplicitamente marcato o multilinea: opaco, mai fatto interpretare
    // al provider. La quantità di righe resta disponibile senza rivelare i valori.
    const marked = /(?:testo(?: da (?:imprimere|inserire))?\s*:\s*)([\s\S]+)/i.exec(input.message);
    const localText = marked?.[1]?.trim() ?? (input.lastQuestionField === 'content' && input.message.includes('\n') ? input.message.trim() : undefined);
    if (localText && localText.length > 480) throw new Error('Il testo da imprimere può avere al massimo 480 caratteri nel prototipo');
    const contentHasSignals = localText && new PrivacyVault([...this.vocabulary]).protect(localText) !== localText;
    const contentToken = localText ? this.protect(localText, true) : undefined;
    const contentEntry = contentToken && this.values.get(contentToken);
    // Il testo da imprimere è già opaco per minimizzazione: chiederne la natura
    // solo se contiene un segnale di dati personali, non per ogni testo nuovo.
    if (localText && contentEntry && !contentEntry.nature && !contentHasSignals) contentEntry.nature = 'private';
    const message = localText ? this.protect(input.message.slice(0, input.message.indexOf(localText)), false, true) + (contentEntry && this.released(contentEntry) ? localText : contentToken) + ` (${localText.split('\n').length} righe di testo da imprimere)` : this.protect(input.message, false, true);
    const request = AiRequestSchema.parse({ ...input, message,
      lastQuestion: input.lastQuestion ? this.protect(input.lastQuestion, false, true).slice(0, 300) : null,
      recentMessages: this.protectHistory(input.recentMessages),
      contentBrief: input.contentBrief ? { ...input.contentBrief, ...(input.contentBrief.text ? { text: this.protect(input.contentBrief.text, true) } : {}), ...(input.contentBrief.graphicSubject ? { graphicSubject: this.protect(input.contentBrief.graphicSubject, false, true).slice(0, 300) } : {}) } : undefined,
      privacyReviewed: false,
      publicFragments: [],
    });
    const allFields = [request.message, request.lastQuestion ?? '', ...request.recentMessages.map(m => m.text), request.contentBrief?.graphicSubject ?? '', request.contentBrief?.text ?? ''];
    const customerFields = [request.message, ...request.recentMessages.filter(m => m.role === 'user').map(m => m.text), request.contentBrief?.graphicSubject ?? '', request.contentBrief?.text ?? ''];
    const tokens = new Set(customerFields.flatMap(value => value.match(tokenPattern) ?? []));
    // Il testo generico rilasciato può non avere più un segnaposto nel messaggio.
    const parts = [...tokens].flatMap(token => { const entry = this.values.get(token); return entry && !entry.nature ? [{ token, original: entry.original, kind: entry.kind, canRelease: !hasIdentifiers(entry.original) }] : []; });
    const generic = [...this.publicFragments, ...[...this.values.values()].filter(entry => this.released(entry)).map(entry => entry.original)];
    request.publicFragments = [...new Set(generic)].filter(value => allFields.some(text => exactSpans(text, value).length));
    request.privacyReviewed = !parts.length && (tokens.size > 0 || request.publicFragments.length > 0);
    return { request: AiRequestSchema.parse(request), needsReview: parts.length > 0, parts, localText, source: input };
  }
  review(prepared: PreparedPrivacy, choices: Readonly<Record<string, PrivacyNature>>): PreparedPrivacy {
    if (prepared.parts.some(part => !['private', 'generic'].includes(choices[part.token] ?? ''))) throw new Error('Indica la natura di ogni parte evidenziata');
    if (prepared.parts.some(part => this.values.get(part.token)?.original !== part.original)) throw new Error('Verifica privacy non corrente');
    for (const part of prepared.parts) {
      const entry = this.values.get(part.token); if (!entry || entry.original !== part.original) throw new Error('Verifica privacy non corrente');
      entry.nature = choices[part.token];
    }
    const reviewed = this.prepare(prepared.source);
    if (reviewed.needsReview) throw new Error('Sono presenti nuove parti da classificare');
    reviewed.request.privacyReviewed = true;
    return reviewed;
  }
  restoreCall(raw: unknown, localText?: string): AiTool {
    const call = AiToolSchema.parse(raw);
    const restore = (text: string) => text.replace(tokenPattern, token => {
      const entry = this.values.get(token); if (!entry) throw new Error('Segnaposto AI sconosciuto: nessun contenuto privato ripristinato'); return entry.original;
    });
    if (call.tool !== 'collectRequirements') return call;
    // Solo i campi di composizione riacquistano gli originali, mai la prosa AI.
    const brief = { ...call.contentBrief };
    if (brief.text) brief.text = restore(brief.text);
    if (brief.graphicSubject) brief.graphicSubject = restore(brief.graphicSubject);
    if (localText) { brief.text = localText; brief.kind ??= 'text'; }
    return AiToolSchema.parse({ ...call, ...(Object.keys(brief).length ? { contentBrief: brief } : {}) });
  }
}

// Difesa server: la chiamata diretta non può aggirare il filtro su dati noti né
// trasmettere testo da imprimere in chiaro. Il controllo umano copre l'ambiguità.
export function assertProtectedRequest(input: AiRequest, catalogTitles: readonly string[] = []) {
  if (input.publicFragments.length && !input.privacyReviewed) throw new Error('Verifica privacy locale richiesta prima dell’invio');
  const vault = new PrivacyVault(catalogTitles, input.publicFragments);
  const fields = [input.message, input.lastQuestion ?? '', ...input.recentMessages.map(m => m.text), input.contentBrief?.graphicSubject ?? ''];
  if (fields.some(value => vault.protect(value) !== value)) throw new Error('Protezione dati richiesta: verifica il testo prima dell’invio');
  if (input.contentBrief?.text && !/^\[RISERVATO_\d+\]$/.test(input.contentBrief.text)) throw new Error('Il testo da imprimere deve restare nel browser');
  const customerFields = [input.message, ...input.recentMessages.filter(m => m.role === 'user').map(m => m.text), input.contentBrief?.graphicSubject ?? '', input.contentBrief?.text ?? ''];
  if (!input.privacyReviewed && (customerFields.some(value => /\[RISERVATO_\d+\]/.test(value)) || vault.prepare(input).needsReview)) throw new Error('Verifica privacy locale richiesta prima dell’invio');
}
