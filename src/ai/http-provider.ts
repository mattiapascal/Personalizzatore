import type { AiProvider } from './contract';
import type { SelectionSession } from '../selection/schema';

export function httpProvider(csrfToken: string, lastQuestion: string | null, recentMessages: { role: 'user' | 'assistant'; text: string }[] = []): AiProvider {
  return {
    mode: 'server',
    async propose(message: string, session: Readonly<SelectionSession>, signal: AbortSignal) {
      const response = await fetch('/api/ai/interpret', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lab-Token': csrfToken }, signal,
        body: JSON.stringify({ message, sessionId: session.sessionId, revision: session.revision, requirements: session.requirements, lastQuestion, recentMessages }),
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
