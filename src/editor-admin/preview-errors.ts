export const ADMIN_PREVIEW_OUTDATED_EVENT='incisoria-admin-preview-outdated';
export function archivePreviewError(cause:unknown):{message:string;outdated:boolean}{
 const raw=cause instanceof Error?cause.message:'Miniatura non disponibile';
 const issues=cause&&typeof cause==='object'&&'issues' in cause?cause.issues:undefined;
 const outdated=/does not provide an export named|Failed to fetch dynamically imported module|Importing a module script failed/i.test(raw)||Array.isArray(issues)&&issues.some(issue=>issue?.code==='unrecognized_keys');
 return{message:outdated?'Ricarica l’amministrazione per aggiornare l’anteprima.':raw,outdated};
}
