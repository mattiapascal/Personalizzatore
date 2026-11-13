# Copertura Unicode dei font legacy — 13 novembre 2026

Continuum Medium ora viene verificato dal controllo font locale. Il file personale resta identico: la correzione riguarda il lettore condiviso della mappa Unicode e vale per qualsiasi font con la stessa struttura. L’evidenziazione rossa dei soli caratteri problematici resta quella descritta nella [precedente iterazione](iteration-editor-font-support-highlight.md).

## Diagnosi e comportamento

La cmap formato 4 del file originale usa un offset FFFF nel solo segmento conclusivo, con inizio/fine entrambi FFFF. Il lettore lo rifiutava come offset dispari prima di constatare che non sarebbe stato consultato. La [specifica OpenType](https://learn.microsoft.com/en-us/typography/opentype/spec/cmap#format-4-segment-mapping-to-delta-values) descrive il segmento conclusivo; il [lettore FreeType](https://raw.githubusercontent.com/freetype/freetype/master/src/sfnt/ttcmap.c) contempla questo preciso valore legacy nella posizione conclusiva. La modifica ammette soltanto quella combinazione. I controlli dei segmenti dei caratteri, ordinamento, limiti, glifo zero e complessità restano attivi. U+FFFF non entra nella copertura.

La copia originale privata è stata confrontata con FontTools 4.63.0 su tutti i 65.536 codici BMP: **246 codici mappati, 43 intervalli, zero differenze**. HarfBuzz restituisce i glifi 36/37/38/112/227 per ABCéΩ; Chromium carica il font e la larghezza a 18 px è 56,465973 px, contro 56,466 px calcolati dagli avanzamenti. Nel vero editor lo stesso testo passa il preflight, mantiene oggetti e byte originali ed esporta testo SVG editabile. Log privati in `.local/font-continuum/`, esclusi da Git.

Non viene modificato, reinstallato o sostituito il font; non viene attivato alcun font del computer. Un glifo realmente assente continua a impedire misure, conferma ed esportazione del testo irrisolto. I sette sorgenti PitchPrint prioritari esclusi per altri glifi/file mancanti restano fuori: questa correzione non autorizza sostituzioni o importazioni automatiche.

## Prove ripetibili

- `tests/editor-font-coverage.test.ts`: sentinella legacy positiva, buchi nei glifi, esclusione U+FFFF, rifiuto degli offset dispari/fuori limite nei segmenti reali, confronto completo BMP con font OFL TEST.
- `tests/helpers/legacy-cmap.ts`: derivato del solo Arimo OFL di prova, con offset conclusivo alterato e checksum ricalcolati; contorni e metriche invariati. Nessun file personale nel repository.
- `tests/e2e/legacy-cmap.spec.ts`: TTF e WOFF con cmap realmente compressa, FontFace effettiva, zero differenze pixel e metriche rispetto al controllo, modifica manuale uguale a `updateObject` AI simulato, Undo, riapertura JSON e SVG editabile. Il carattere assente resta rosso e non provoca misure con fallback.
- `scripts/capture-editor-legacy-cmap.ts`: genera la nuova coppia [JSON](../fixtures/illustrator/legacy-cmap.TEST.json) / [SVG](../fixtures/illustrator/legacy-cmap.TEST.svg) e catture desktop/mobile, senza scritture all’archivio. Catture ispezionate; Illustrator resta da collaudare manualmente.

## Esiti

**1.194 test unitari / 169 file passati**, log `all-units.log`. **29 browser pertinenti passati**: cinque nuovi legacy, evidenziazione, ricerca, navigazione all’ispettore, menu progressivo e PDF con font compressi, log `browser-final.log`. Non è un nuovo collaudo generale dell’intera suite browser.

**71 coppie JSON/SVG riaperte/esportate** con l’editor: zero errori, richieste esterne o caricamenti di font personali; log `artifacts.log`. Build/tipi e scansioni segreti locale/pubblica passati (`final-build.log`, `public-build.log`, `secrets.log`, `public-secrets.log`). **13 browser pubblici passati**, log `public-tests.log`. JavaScript pubblico invariato: `index-BG2r_x-8.js`.

Scansione reale in sola lettura di **218 font attivi**, 28 lotti per il solo Ω, circa **1,27 s** su questa macchina: **123 compatibili, 95 non contenenti quel carattere, zero coperture sconosciute**. Non significa che i 95 file siano guasti. Continuum ora risulta compatibile; hash originale invariato. Archivio identico prima/dopo: **SQLite R638, 346 template, due composizioni, 219 font e un profilo** (`real-library.json`). Nessun riavvio o migrazione necessario.

Nessun deploy, modifica al negozio o alla chat online, nessuna scrittura a template/font personali o integrazioni Shopify/BSS/PitchPrint.
