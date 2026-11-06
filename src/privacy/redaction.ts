import { AiRequestSchema, type AiRequest } from '../ai/request.ts';
import { AiToolSchema, type AiTool } from '../ai/contract.ts';

// Un dizionario determina solo quando chiedere la verifica privacy, non interpreta
// i requisiti: l'interpretazione commerciale resta interamente al modello AI.
const ordinary = new Set(`a ad ai al alla alle allo all anche ancora alcuni altre altri altro almeno altezza alto automatico automatica automatici autoinchiostrante autoinchiostranti azienda aziendali aziendale bar basta bene bianco bisogno boh buongiorno caffè casella caselle caselline cerchio cerco che chiaro circa cm col con come composizione comprare conoscere contenuto contenuti cosa così ciao da dal dalla dalle dati dei del della delle dello devo di diametro dimensione dimensioni dire disposto dove due e è ed emboss es esempio esiste essere ex exlibris fare farlo fattura fatture fedeltà fino forma formato formati forse fra grazie grafica grafico grafiche grande grandi ha hai hanno ho i il impronta in incorporato indicare informazioni invece io la larghezza lato le legno libri libris logo loghi lo loro ma manuale manuali materiale materiali me mi mio mia miei mie misure mm montatura molto nero ne nel nella nelle nello nessuna no nome non noto note numeri numero o ok oppure ora ottone parte per perché piccolo piccola piccoli più plastica poco posso possiamo preferisco preferirei preferenza prima prodotto prodotti prova punti quadrata quadrate quadrati quadrato quale quali quanto quattro quello quella quelle quelli questo questa queste questi raccolta raccolte rettangolare rettangolo righe rilievo rispondi rotonda rotondo rotonde sapere scrivere scrivimi se secondo sei senza separato serva serve servirebbe sette si sì simbolo simboli so solo sono spazio stampare stima stimare su sul sulla targa targhe tascabile tascabili tampone testo testi tessera tessere ti timbrare timbri timbro tipo tre tu tua tuo tutti tutte un una uno uso utilizzo va vorrei voglio x abbonamento abbonamenti bancone veloci velocemente nonostante cambiare cambio togli togliere scelta preferenze nessun opzioni rettangolari uguale entrambe entrambi due diam min minimo minima minimi minime massimo massima massimi massime lunghezza larghe grandezza figura illustrazione illustrazioni soggetto gufo libro gatto cane disegno disegnare nome indirizzo partita iva codice fiscale telefono email pec fatture timpro bottega quadrato lato millimetri centimetri automatic senza dentro farebbe misurano vorresti mettere iniziale obiettivo utile utile chiarire puoi può puoi come logo prova test json svg ai api`.split(/\s+/));
for (const word of 'preferisci preferire scegliere scegli indicato indicata indicare misurare previsto previste chiama chiamato confermare confermi'.split(' ')) ordinary.add(word);
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
  /\b(?:via|viale|piazza|corso|vicolo|strada|piazzale)\s+[^\n,;]{1,100}/gi,
  /\b(?:[\p{Lu}][\p{L}'’.-]*\s+){1,5}(?:s\.?r\.?l\.?|s\.?p\.?a\.?|s\.?n\.?c\.?|s\.?a\.?s\.?)\b/gu,
  /(?<=\b(?:mi chiamo|nome e cognome|ragione sociale|azienda chiamata|ditta|società|il bar si chiama|il mio bar si chiama|nome|cognome)\s*:?\s*)[^\n,;:.]{1,100}/giu,
];
export class PrivacyVault {
  private values = new Map<string, string>();
  private vocabulary = new Set(ordinary);
  constructor(catalogTitles: readonly string[] = []) { this.allowCatalogTitles(catalogTitles); }
  allowCatalogTitles(titles: readonly string[]) {
    // Solo parole già pubbliche delle referenze fornite dal catalogo, mai parole
    // scelte dall'utente come eccezione automatica alla protezione dei nomi.
    for (const title of titles) for (const word of title.match(/[\p{L}]+/gu) ?? []) this.vocabulary.add(word.toLocaleLowerCase('it'));
  }
  private token(value: string) {
    for (const [key, original] of this.values) if (original === value) return key;
    const key = `[RISERVATO_${this.values.size + 1}]`; this.values.set(key, value); return key;
  }
  clear() { this.values.clear(); }
  private knownWord(word: string): boolean {
    const normalized = word.toLocaleLowerCase('it').replace(/’/g, "'");
    if (this.vocabulary.has(normalized)) return true;
    if (normalized.includes('-')) return normalized.split('-').every(part => this.knownWord(part));
    const elision = /^(?:all|dall|dell|nell|sull|coll|l|d|un|quest|quell)'(.+)$/u.exec(normalized);
    // Il prefisso grammaticale non autorizza il resto: d'Angelo resta privato.
    return !!elision && this.vocabulary.has(elision[1]!);
  }
  protect(text: string, opaque = false, maskUnknown = false): string {
    if (!text) return text;
    if (opaque) return /^\[RISERVATO_\d+\]$/.test(text) ? text : this.token(text);
    let result = text;
    for (const [key, original] of [...this.values].sort((a, b) => b[1].length - a[1].length)) result = result.split(original).join(key);
    // I segnaposto esistenti sono sottratti ai match e ripristinati in seguito.
    const stored: string[] = [];
    const stash = (value: string) => { stored.push(value); return `\u0001${String.fromCharCode(0xe000 + stored.length - 1)}\u0002`; };
    result = result.replace(/\[(?:RISERVATO_\d+|DATO)\]/g, stash);
    for (const pattern of patterns) result = result.replace(pattern, value => stash(this.token(value)));
    result = result.replace(words, value => (maskUnknown || /^\p{Lu}/u.test(value)) && !this.knownWord(value) ? stash(this.token(value)) : value);
    result = result.replace(/\u0001([\ue000-\uf8ff])\u0002/g, (_, index: string) => stored[index.charCodeAt(0) - 0xe000]!);
    return result;
  }
  uncertain(text: string): boolean {
    const clean = text.replace(/\[(?:RISERVATO_\d+|DATO)\]/g, '');
    return clean.match(words)?.some(word => !this.knownWord(word)) ?? false;
  }
  prepare(input: AiRequest): { request: AiRequest; needsReview: boolean; localText?: string } {
    // Contenuto esplicitamente marcato o multilinea: opaco, mai fatto interpretare
    // al provider. La quantità di righe resta disponibile senza rivelare i valori.
    const marked = /(?:testo(?: da (?:imprimere|inserire))?\s*:\s*)([\s\S]+)/i.exec(input.message);
    const localText = marked?.[1]?.trim() ?? (input.lastQuestionField === 'content' && input.message.includes('\n') ? input.message.trim() : undefined);
    if (localText && localText.length > 480) throw new Error('Il testo da imprimere può avere al massimo 480 caratteri nel prototipo');
    const message = localText ? this.protect(input.message.slice(0, input.message.indexOf(localText)), false, true) + this.protect(localText, true) + ` (${localText.split('\n').length} righe di testo da imprimere)` : this.protect(input.message, false, true);
    const request = AiRequestSchema.parse({ ...input, message,
      lastQuestion: input.lastQuestion ? this.protect(input.lastQuestion, false, true).slice(0, 300) : null,
      recentMessages: input.recentMessages.map(m => ({ ...m, text: this.protect(m.text, false, true).slice(-400) })),
      contentBrief: input.contentBrief ? { ...input.contentBrief, ...(input.contentBrief.text ? { text: this.protect(input.contentBrief.text, true) } : {}), ...(input.contentBrief.graphicSubject ? { graphicSubject: this.protect(input.contentBrief.graphicSubject, false, true).slice(0, 300) } : {}) } : undefined,
      privacyReviewed: false,
    });
    const customerFields = [request.message, ...request.recentMessages.filter(m => m.role === 'user').map(m => m.text), request.contentBrief?.graphicSubject ?? ''];
    const needsReview = !!localText || customerFields.some(t => /\[RISERVATO_\d+\]/.test(t) || this.uncertain(t));
    return { request, needsReview, localText };
  }
  restoreCall(raw: unknown, localText?: string): AiTool {
    const call = AiToolSchema.parse(raw);
    const restore = (text: string) => text.replace(tokenPattern, token => {
      const value = this.values.get(token); if (!value) throw new Error('Segnaposto AI sconosciuto: nessun contenuto privato ripristinato'); return value;
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
  const vault = new PrivacyVault(catalogTitles);
  const fields = [input.message, input.lastQuestion ?? '', ...input.recentMessages.map(m => m.text), input.contentBrief?.graphicSubject ?? ''];
  if (fields.some(value => vault.protect(value) !== value)) throw new Error('Protezione dati richiesta: verifica il testo prima dell’invio');
  if (input.contentBrief?.text && !/^\[RISERVATO_\d+\]$/.test(input.contentBrief.text)) throw new Error('Il testo da imprimere deve restare nel browser');
  if (!input.privacyReviewed && vault.prepare(input).needsReview) throw new Error('Verifica privacy locale richiesta prima dell’invio');
}
