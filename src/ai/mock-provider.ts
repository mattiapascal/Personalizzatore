import type { AiProvider } from './contract';
import type { Requirements } from '../selection/schema';

// Parser limitato e riproducibile, NON un modello AI. Nessuna chiamata di rete.
export const mockProvider: AiProvider = {
  mode: 'mock',
  async propose(message, session) {
    const m = message.toLocaleLowerCase('it');
    const patch: Requirements = {};
    if (/targ[ah]|adesiv|cartell/.test(m)) patch.family = 'other';
    else if (/timbr/.test(m)) patch.family = 'stamp';
    if (/autoinchiostr|automatic/.test(m)) patch.mechanism = 'automatic';
    else if (/manual/.test(m)) patch.mechanism = 'manual';
    else if (/tascabil/.test(m)) patch.mechanism = 'pocket';
    if (/rotond|circolar/.test(m)) patch.shape = 'round';
    else if (/rettangolar/.test(m)) patch.shape = 'rectangle';
    if (/senza logo|solo testo/.test(m)) patch.hasLogo = false;
    else if (/logo/.test(m)) patch.hasLogo = true;
    const lineMatch = m.match(/\b(\d+|una|due|tre|quattro|cinque|sei|sette|otto)\s+rig(?:he|a)\b/);
    const numbers: Record<string, number> = { una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8 };
    if (lineMatch?.[1]) patch.lines = numbers[lineMatch[1]] ?? Number(lineMatch[1]);
    const size = m.match(/\b(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*mm\b/);
    if (size?.[1] && size[2]) { patch.minimumAreaMm = { width: Number(size[1].replace(',', '.')), height: Number(size[2].replace(',', '.')) }; patch.sizeUnknown = false; }
    else if (/non so|non conosco/.test(m)) { patch.minimumAreaMm = null; patch.sizeUnknown = true; }
    return { schemaVersion: 1, tool: 'collectRequirements', expectedRevision: session.revision, arguments: patch };
  },
};
