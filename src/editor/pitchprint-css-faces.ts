import { fontNameKey, type PitchprintFontRequest } from './pitchprint-fonts';

// Verified against PitchPrint's public app.js on 2026-11-11 and the exact
// downloaded WOFFs. Custom faces use nominal normal/bold descriptors regardless
// of their internal OS/2 weight. This is a closed mapping, never a nearest face.
export const PITCHPRINT_CSS_FACES = [
  { family: 'Nexa Bold', requestedWeight: 400, actualWeight: 700, file: 'nexa_bold', sha256: '6e3c65123a4a19ca5c37b268cca8c952d01feda537ac485c8c5c250aec490806' },
  { family: 'tekton', requestedWeight: 400, actualWeight: 500, file: 'tekton', sha256: '8b9bbcdbb0bea070e80027631873c99d2fcf2591c71a07d810f8f9cddeab868e' },
  { family: 'URW DIN SemiCond Black', requestedWeight: 400, actualWeight: 900, file: 'urw_din_semicond_black', sha256: '2b530397c5841f7a1b81299524effc29446def2e43c9096dd946d3b8949dffc2' },
  { family: 'Zurich Light Extra Condensed', requestedWeight: 400, actualWeight: 300, file: 'zurich_light_extra_condensed', sha256: '564529318930bc1954dbf686fe3c4eb129bb5a85e656e50973857b116ee24890' },
  { family: 'Kuenstler Script LT Std Medium', requestedWeight: 700, actualWeight: 750, file: 'kuenstler_script_lt_std_medium_b', sha256: '34ed67cec3363b0d0aa93606409bca09454416951048923d7629ee4c168e1532' },
] as const;

export function verifiedPitchprintCssFace(request: PitchprintFontRequest, sha256: string, actualWeight: number, actualItalic: boolean, sourceUrl: string | undefined) {
  if (request.italic || actualItalic) return undefined;
  return PITCHPRINT_CSS_FACES.find(face => fontNameKey(face.family) === fontNameKey(request.family)
    && request.weight === face.requestedWeight && face.sha256 === sha256 && face.actualWeight === actualWeight
    && sourceUrl === `https://pitchprint.io/fonts/woff/${face.file}.woff`);
}
