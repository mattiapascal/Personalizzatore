import { z } from 'zod';
import type { ContentBrief } from './content.ts';
import type { SelectionSession } from './schema.ts';
import { missingInformation, questions } from './rules.ts';
import type { CatalogAdapter } from '../catalog/adapter.ts';
import { adviseProducts } from './advisor.ts';

export const QuestionFieldSchema = z.enum(['content', 'graphicSubject', 'family', 'mechanism', 'material', 'shape', 'dimensions', 'targetArea', 'clarification', 'results']);
export function nextSelectionPrompt(session: SelectionSession, brief?: ContentBrief, catalog?: CatalogAdapter, destination: 'canvas' | 'product' = 'canvas'): { field: z.infer<typeof QuestionFieldSchema>; text: string; question?: string } {
  const place = destination === 'product' ? 'sulla pagina prodotto' : 'nel canvas';
  const r = session.requirements;
  if (!r.family) return { field: 'content', text: 'Che cosa vorresti mettere nel timbro: un testo, un logo o un’illustrazione, per esempio un ex-libris?' };
  if (r.family === 'other') return { field: 'family', text: 'Per ora posso guidarti nella scelta dei timbri. Vuoi scegliere un timbro?' };
  if (brief?.purpose === 'loyalty' && catalog) {
    const advice = adviseProducts(catalog, r, brief);
    if (!r.maximumAreaMm && !r.sizeUnknown && advice[0]) {
      const p = catalog.get(advice[0].profileId!);
      const question = 'Quanto misurano le caselline da timbrare, in mm? Se sono quadrate basta il lato, altrimenti larghezza × altezza.';
      const selfInking = p.mechanism === 'automatic' || /autoinchiostrante/i.test(p.title);
      const lead = !brief.kind && r.hasLogo === undefined ? 'Per timbrare le tessere, partirei da ' + (selfInking ? 'un timbro autoinchiostrante' : 'una montatura personalizzabile') + '. Nel catalogo c’è ' + p.title + ': la scheda lo indica per questo utilizzo. È una proposta iniziale da verificare.\n\n' : '';
      return { field: 'targetArea', text: lead + question, question };
    }
    if (r.maximumAreaMm && !advice.length && !session.candidates.length) return { field: 'targetArea', text: 'Per caselline di ' + r.maximumAreaMm.width + ' × ' + r.maximumAreaMm.height + ' mm non ho trovato un profilo con l’intera area nominale entro quello spazio. Una montatura più grande potrebbe richiedere una grafica ridotta, da verificare ' + place + '. Vuoi valutare altre misure?' };
    if ((r.maximumAreaMm || r.sizeUnknown) && advice.length && (brief.kind || r.hasLogo !== undefined)) return { field: 'results', text: 'Puoi partire dalla proposta nelle anteprime. La scelta del modello confermerà la montatura da provare; logo e margini andranno verificati ' + place + '.' };
  }
  if (brief?.purpose === 'exlibris' && !brief.graphicSubject) return { field: 'graphicSubject', text: 'Per il tuo ex-libris, quale soggetto vorresti raffigurare e quale nome o testo vuoi aggiungere?' };
  if (brief?.kind === 'text' && !brief.text) return { field: 'content', text: 'Scrivimi il testo che vuoi imprimere, andando a capo come preferisci: posso stimarne l’ingombro per aiutarti a scegliere.' };
  if (!r.mechanism && !r.shape && !brief?.kind && !r.lines && r.hasLogo === undefined) return { field: 'content', text: brief?.purpose === 'loyalty' ? 'Per le tessere del tuo bar, vuoi imprimere un piccolo logo, un simbolo oppure del testo?' : 'Che cosa vuoi imprimere? Puoi scrivere il testo, indicare le righe previste oppure descrivere la grafica che hai in mente.' };
  const missing = missingInformation(r)[0];
  if (missing === 'minimumAreaMm') return { field: 'dimensions', text: r.shape === 'square' ? 'Quanto deve misurare il lato del quadrato, in mm? Per esempio 10 mm. Se non sai la misura, possiamo esplorare i formati disponibili.' : r.shape === 'round' ? 'Quale diametro vorresti per l’impronta, in mm? Se non lo sai, possiamo esplorare i formati disponibili.' : 'Quali misure minime deve avere l’impronta, larghezza × altezza in mm? Puoi rispondere «Non so le misure».' };
  if (missing) return { field: missing, text: questions[missing] };
  return { field: 'results', text: session.candidates.length ? `Ho trovato ${session.candidates.length} possibilità per il tuo timbro. Dai un’occhiata alle anteprime e scegli quale provare. Verificheremo la composizione ${place}.` : 'Nessun modello corrisponde nei profili attualmente censiti. Vuoi cambiare forma, montatura o dimensioni? Il catalogo completo può contenere altre soluzioni.' };
}
export const nextSelectionQuestion = (session: SelectionSession, brief?: ContentBrief, catalog?: CatalogAdapter) => nextSelectionPrompt(session, brief, catalog).text;
// Il modello riceve la domanda utile, non il testo commerciale con fatti di catalogo.
export const modelQuestion = (prompt: ReturnType<typeof nextSelectionPrompt>) => prompt.question ?? (prompt.field === 'results' ? 'Vuoi provare un modello o cambiare qualche criterio?' : prompt.text);
