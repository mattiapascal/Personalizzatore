# Registro decisioni

## 2026-11-05 — Primo incremento

- Fonte autorevole: specifica MD effettivamente presente; riferimento `_Codex` in AGENTS non trovato. Conservata specifica originale.
- Repository isolato dalla cartella padre; remoto GitHub vuoto fornito dall'utente. Sincronizzazione del codice richiesta, nessun deploy.
- Singola app Vite locale per non registrare un'app Shopify o attivare tunnel. Futuro scaffold ufficiale React Router dopo disponibilità dev store e consenso. Nessun monorepo o framework backend prematuro.
- TypeScript rigoroso e Zod, versioni npm esatte e package-lock. Node locale 24.17.0 fissato. Fabric 7.4.0, React 19.3.1; renderer separato dal dominio. Fabric caricato solo aprendo il laboratorio.
- Dati fixture veri acquisiti in sola lettura; URL da `onlineStoreUrl`; prezzi/inventario esclusi dalla logica. Profili tecnici non certificati e vincoli ignoti null.
- Parser simulato esplicito, senza invio di richieste a provider a pagamento; contratto runtime e fallback pronti. LLM reale e misure di costo rinviati al prossimo incremento con budget/dati confermati.
- Documento editor indipendente TEST: non attribuire 7 pt/margine/nero a uno dei prodotti reali senza conferma. SVG Fabric separato dal JSON; nessun import di codice/grafiche non attendibili.
- Handoff tema/Preventivometro: riuso futuro delle fonti canoniche; non duplicare prezzi o bridge, non confondere Preventivometro V2 con BSS V2. La copia locale del tema non è prova dello stato attuale pubblicato.

## Questioni aperte

Conferma tag No-AI, profili produttivi e area utile; verifica umana Illustrator; backend/provider e budget; catalogo server/cache; accessibilità su dispositivi reali; supporto rollback BSS. Dettagli in `integrations.md`, `production-files.md` e `audit-and-plan.md`.

## 2026-11-05 — Riscontro visibile per ogni azione di selezione

La prova dell'utente ha evidenziato che un aggiornamento dei requisiti senza conferma sembra un pulsante non funzionante. Il prototipo deve confermare dati riconosciuti e scelte, spiegare quale criterio manca e rendere raggiungibili i risultati. Una UI con reducer aggiorna insieme stato e messaggio, mantenendo il controllo delle revisioni. Le misure ignote possono essere indicate prima della montatura e non vanno perse; nessuna montatura o idoneità per fatture viene presunta. La correzione resta locale e senza costi AI.
