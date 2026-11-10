export const ADMIN_REVISION_CONFLICT='revision_conflict';
export class AdminRevisionConflictError extends Error{
 readonly code=ADMIN_REVISION_CONFLICT;
 constructor(){super('Archivio modificato da un’altra finestra: aggiorna prima di salvare');this.name='AdminRevisionConflictError';}
}
