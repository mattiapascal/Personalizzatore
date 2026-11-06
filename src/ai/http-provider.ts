import type { AiProvider } from './contract';
import type { SelectionSession } from '../selection/schema';
import type { AiRequest } from './request';

export function httpProvider(csrfToken: string, protectedRequest: AiRequest, publicMode = false): AiProvider {
  return {
    mode: 'server',
    async propose(_message: string, session: Readonly<SelectionSession>, signal: AbortSignal) {
      if (protectedRequest.sessionId !== session.sessionId || protectedRequest.revision !== session.revision) throw new Error('Richiesta protetta obsoleta: ripeti il messaggio');
      const response = await fetch(publicMode ? '/api/public/interpret' : '/api/ai/interpret', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(publicMode ? { Authorization: 'Bearer ' + csrfToken } : { 'X-Lab-Token': csrfToken }) }, signal,
        body: JSON.stringify(protectedRequest),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        if (publicMode && response.status === 401) { try { sessionStorage.removeItem('is.assistant.capability'); } catch { /* sessione solo in memoria */ } }
        const error = data as { error?: unknown };
        throw new Error(typeof error.error === 'string' ? error.error : 'Servizio AI non disponibile');
      }
      return data;
    },
  };
}
