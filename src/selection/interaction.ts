import type { CatalogAdapter } from '../catalog/adapter';
import { executeTool, type AiTool } from '../ai/contract';
import { chooseProduct, newSession, updateRequirements } from './session';
import type { Requirements, SelectionSession } from './schema';

export interface SelectionInteraction {
  session: SelectionSession;
  feedback: string;
  feedbackRevision: number;
  clarification?: string | null;
}
export type SelectionAction =
  | { type: 'patch'; patch: Requirements }
  | { type: 'tool'; call: AiTool }
  | { type: 'error'; message: string }
  | { type: 'choose'; productId: string }
  | { type: 'catalog' }
  | { type: 'reset' };

export function initialInteraction(session: SelectionSession): SelectionInteraction {
  return { session, feedback: 'Descrivi il prodotto che cerchi: ti farò una domanda alla volta.', feedbackRevision: 0 };
}

function recognizedInformation(requirements: Requirements): string {
  const parts: string[] = [];
  if (requirements.family) parts.push(requirements.family === 'stamp' ? 'un timbro' : 'un prodotto diverso dai timbri');
  if (requirements.mechanism) parts.push({ automatic: 'autoinchiostrante', manual: 'manuale', pocket: 'tascabile', emboss: 'a secco' }[requirements.mechanism]);
  if (requirements.shape) parts.push({ rectangle: 'forma rettangolare', square: 'forma quadrata', round: 'forma rotonda' }[requirements.shape]);
  if (requirements.diameterMm) parts.push(`diametro minimo ${requirements.diameterMm} mm`);
  if (requirements.material) parts.push({ wood: 'legno', plastic: 'plastica', metal: 'metallo', any: 'materiale indifferente' }[requirements.material]);
  if (requirements.lines) parts.push(`${requirements.lines} righe`);
  if (requirements.hasLogo !== undefined) parts.push(requirements.hasLogo ? 'con logo' : 'senza logo');
  if (requirements.minimumAreaMm) parts.push(`ingombro minimo ${requirements.minimumAreaMm.width} × ${requirements.minimumAreaMm.height} mm`);
  if (requirements.sizeUnknown) parts.push('misure non note');
  return parts.length
    ? `Richiesta ricevuta. Ho riconosciuto: ${parts.join(', ')}.`
    : 'Non ho riconosciuto nuove informazioni nella richiesta. Puoi rispondere alla domanda o riformulare il messaggio.';
}

// Stato e riscontro vengono aggiornati insieme: nessun setState dentro un updater.
// Ogni azione controlla la revisione sullo stato corrente, anche per risposte tardive.
export function selectionInteraction(state: SelectionInteraction, action: SelectionAction, catalog: CatalogAdapter): SelectionInteraction {
  try {
    if (action.type === 'choose') return { ...state, session: chooseProduct(state.session, action.productId, catalog) };
    const feedbackRevision = state.feedbackRevision + 1;
    switch (action.type) {
      case 'catalog': return { session: updateRequirements(state.session, {}, catalog), feedbackRevision, feedback: 'Catalogo aggiornato. Ho rivalutato i requisiti; la bozza grafica aperta conserva la propria versione.' };
      case 'patch': return {
        session: updateRequirements(state.session, action.patch, catalog), feedbackRevision,
        feedback: action.patch.sizeUnknown ? 'Va bene, proseguiamo senza misure.' : 'Scelta registrata. Ho aggiornato i requisiti.',
      };
      case 'tool': return {
        session: executeTool(action.call, state.session, catalog).session, feedbackRevision,
        feedback: action.call.tool === 'collectRequirements' ? action.call.clearFields?.length ? 'Ho aggiornato i dati e ritirato le risposte che non vuoi più mantenere.' : action.call.clarification && !Object.keys(action.call.arguments).length ? 'Richiesta ricevuta. Mi serve un chiarimento.' : recognizedInformation(action.call.arguments) : 'Richiesta elaborata.',
        clarification: action.call.tool === 'collectRequirements' ? action.call.clarification : null,
      };
      case 'reset': return { session: newSession(catalog), feedback: 'Sessione azzerata. Ripartiamo dalle tue esigenze.', feedbackRevision };
      case 'error': return { ...state, feedback: action.message, feedbackRevision };
    }
  } catch {
    return { ...state, feedback: 'Risposta obsoleta o dati non validi. I requisiti sono conservati: ripeti il messaggio per continuare.', feedbackRevision: state.feedbackRevision + 1 };
  }
}
