/** Up to 80 MB of originals across all embedded placements, plus fonts/metadata. */
export const MAX_PROJECT_BYTES = 120_000_000;
export const PROJECT_LIMIT_LABEL = '120 MB';
/** Editable document plus productive SVG, bounded independently. Local simulator only. */
export const MAX_CONFIGURATION_BYTES = 2 * MAX_PROJECT_BYTES + 1_000_000;
