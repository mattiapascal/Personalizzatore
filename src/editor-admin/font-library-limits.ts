/** Encoded font records, distinct from the 4 MB budget of a single design. */
export const MAX_FONT_LIBRARY_BYTES = 64 * 1024 * 1024;
export const MAX_FONT_LIBRARY_BACKUP_BYTES = MAX_FONT_LIBRARY_BYTES + 1024 * 1024;
export const MAX_FONT_LIBRARY_REQUEST_BYTES = MAX_FONT_LIBRARY_BACKUP_BYTES + 1024 * 1024;
