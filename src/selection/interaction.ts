import type { CatalogAdapter } from '../catalog/adapter';
import { executeTool, type AiTool } from '../ai/contract';
import { chooseProduct, newSession, updateRequirements } from './session';
import type { Requirements, SelectionSession } from './schema';
import type { ContentBrief } from './content';
import { adviseProducts } from './advisor';

export interface SelectionInteraction {
  session: SelectionSession;
  feedback: string;
  feedbackRevision: number;
  clarification?: string | null;
  clarificationBlocksSelection?: boolean;
  contentBrief?: ContentBrief;
}
export type SelectionAction =
  | { type: 'patch'; patch: Requirements }
  | { type: 'tool'; call: AiTool }
  | { type: 'error'; message: string }
  | { type: 'choose'; productId: string }
  | { type: 'acceptAdvice'; productId: string }
  | { type: 'catalog' }
  | { type: 'reset' };

export function initialInteraction(session: SelectionSession): SelectionInteraction {
  return { session, feedback: 'Descrivi il prodotto che cerchi: ti farò una domanda alla volta.', feedbackRevision: 0 };
}

// Stato e riscontro vengono aggiornati insieme: nessun setState dentro un updater.
// Ogni azione controlla la revisione sullo stato corrente, anche per risposte tardive.
export function selectionInteraction(state: SelectionInteraction, action: SelectionAction, catalog: CatalogAdapter): SelectionInteraction {
  try {
    if (action.type === 'choose') return { ...state, session: chooseProduct(state.session, action.productId, catalog) };
    if (action.type === 'acceptAdvice') {
      if (!adviseProducts(catalog, state.session.requirements, state.contentBrief).some(c => c.profileId === action.productId)) throw new Error('Proposta non corrente');
      const p = catalog.get(action.productId), r = state.session.requirements;
      const updated = updateRequirements(state.session, { family: 'stamp', mechanism: r.mechanism ?? p.mechanism, shape: r.shape ?? p.shape, ...(p.mechanism === 'manual' && !r.material ? { material: p.materials?.[0] ?? 'any' } : {}), sizeUnknown: r.minimumAreaMm || r.maximumAreaMm || r.diameterMm ? false : true }, catalog);
      return { ...state, session: chooseProduct(updated, action.productId, catalog) };
    }
    const feedbackRevision = state.feedbackRevision + 1;
    switch (action.type) {
      case 'catalog': return { ...state, session: updateRequirements(state.session, {}, catalog), feedbackRevision, feedback: 'Ho aggiornato i modelli disponibili. La tua bozza resta conservata.' };
      case 'patch': return {
        ...state,
        session: updateRequirements(state.session, action.patch, catalog), feedbackRevision,
        feedback: action.patch.sizeIsEstimate ? 'Usiamo questa stima per orientarci. La verificheremo nel canvas.' : action.patch.sizeUnknown ? 'Va bene, proseguiamo senza misure.' : 'Va bene, ho aggiornato la scelta.',
        clarification: null,
        clarificationBlocksSelection: false,
      };
      case 'tool': return {
        session: executeTool(action.call, state.session, catalog).session, feedbackRevision,
        contentBrief: action.call.tool === 'collectRequirements' && (!action.call.dialogueAct || action.call.dialogueAct === 'answer') ? { ...state.contentBrief, ...action.call.contentBrief } : state.contentBrief,
        feedback: action.call.tool === 'collectRequirements' ? action.call.clarification ? '' : action.call.clearFields?.length ? 'Va bene, rivediamo la scelta.' : action.call.arguments.sizeUnknown ? 'Va bene, possiamo orientarci anche senza misure precise.' : Object.keys(action.call.arguments).length ? '' : action.call.dialogueAct === 'off_topic' ? 'Torniamo al tuo timbro.' : 'Non mi è chiaro cosa vorresti. Ti aiuto con una domanda più precisa.' : '',
        clarification: action.call.tool === 'collectRequirements' ? action.call.clarification : null,
        clarificationBlocksSelection: action.call.tool === 'collectRequirements' && !!action.call.clarification && (!action.call.dialogueAct || action.call.dialogueAct === 'answer'),
      };
      case 'reset': return { session: newSession(catalog), feedback: 'Sessione azzerata. Ripartiamo dalle tue esigenze.', feedbackRevision };
      case 'error': return { ...state, feedback: action.message, feedbackRevision };
    }
  } catch {
    return { ...state, feedback: 'Risposta obsoleta o dati non validi. I requisiti sono conservati: ripeti il messaggio per continuare.', feedbackRevision: state.feedbackRevision + 1 };
  }
}
