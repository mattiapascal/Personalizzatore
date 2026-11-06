import type { AiProvider } from './contract';
import type { SelectionSession } from '../selection/schema';
import type { AiRequest } from './request';

export function httpProvider(csrfToken: string, protectedRequest: AiRequest): AiProvider {
  return {
    mode: 'server',
    async propose(_message: string, session: Readonly<SelectionSession>, signal: AbortSignal) {
      if (protectedRequest.sessionId !== session.sessionId || protectedRequest.revision !== session.revision) throw new Error('Richiesta protetta obsoleta: ripeti il messaggio');
      const response = await fetch('/api/ai/interpret', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Token': csrfToken }, signal,
        body: JSON.stringify(protectedRequest),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const error = data as { error?: unknown };
        throw new Error(typeof error.error === 'string' ? error.error : 'Servizio AI non disponibile');
      }
      return data;
    },
  };
}
