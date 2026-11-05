import type { CatalogAdapter } from '../catalog/adapter';
import { executeTool, type AiTool } from '../ai/contract';
import { chooseProduct, newSession, updateRequirements } from './session';
import type { Requirements, SelectionSession } from './schema';

export interface SelectionInteraction {
  session: SelectionSession;
  feedback: string;
  feedbackRevision: number;
}
export type SelectionAction =
  | { type: 'patch'; patch: Requirements }
  | { type: 'tool'; call: AiTool }
  | { type: 'error'; message: string }
  | { type: 'choose'; productId: string }
  | { type: 'reset' };

export function initialInteraction(session: SelectionSession): SelectionInteraction {
  return { session, feedback: 'Descrivi il prodotto che cerchi o usa le scelte guidate.', feedbackRevision: 0 };
}

function recognizedInformation(requirements: Requirements): string {
  const parts: string[] = [];
  if (requirements.family) parts.push(requirements.family === 'stamp' ? 'un timbro' : 'un prodotto diverso dai timbri');
  if (requirements.mechanism) parts.push({ automatic: 'autoinchiostrante', manual: 'manuale', pocket: 'tascabile' }[requirements.mechanism]);
  if (requirements.shape) parts.push(requirements.shape === 'rectangle' ? 'forma rettangolare' : 'forma rotonda');
  if (requirements.lines) parts.push(`${requirements.lines} righe`);
  if (requirements.hasLogo !== undefined) parts.push(requirements.hasLogo ? 'con logo' : 'senza logo');
  if (requirements.minimumAreaMm) parts.push(`ingombro minimo ${requirements.minimumAreaMm.width} × ${requirements.minimumAreaMm.height} mm`);
  if (requirements.sizeUnknown) parts.push('misure non note');
  return parts.length
    ? `Richiesta ricevuta. Ho riconosciuto: ${parts.join(', ')}.`
    : 'Non ho riconosciuto nuove informazioni nella richiesta. Usa le scelte guidate qui sotto.';
}

// Stato e riscontro vengono aggiornati insieme: nessun setState dentro un updater.
// Ogni azione controlla la revisione sullo stato corrente, anche per risposte tardive.
export function selectionInteraction(state: SelectionInteraction, action: SelectionAction, catalog: CatalogAdapter): SelectionInteraction {
  try {
    if (action.type === 'choose') return { ...state, session: chooseProduct(state.session, action.productId, catalog) };
    const feedbackRevision = state.feedbackRevision + 1;
    switch (action.type) {
      case 'patch': return {
        session: updateRequirements(state.session, action.patch, catalog), feedbackRevision,
        feedback: action.patch.sizeUnknown ? 'Va bene, proseguiamo senza misure.' : 'Scelta registrata. Ho aggiornato i requisiti.',
      };
      case 'tool': return {
        session: executeTool(action.call, state.session, catalog).session, feedbackRevision,
        feedback: action.call.tool === 'collectRequirements' ? recognizedInformation(action.call.arguments) : 'Richiesta elaborata.',
      };
      case 'reset': return { session: newSession(catalog), feedback: 'Sessione azzerata. Ripartiamo dalle tue esigenze.', feedbackRevision };
      case 'error': return { ...state, feedback: action.message, feedbackRevision };
    }
  } catch {
    return { ...state, feedback: 'Risposta obsoleta o dati non validi. Usa le scelte guidate per continuare.', feedbackRevision: state.feedbackRevision + 1 };
  }
}
