# Segnalazioni font e anteprime stabili — 13 novembre 2026

L’evidenziazione rossa nell’ispettore e l’anteprima del font candidato restano visibili durante gli aggiornamenti della libreria che non riguardano il testo. La correzione è soltanto diagnostica: non cambia font, grafica, selezione dei caratteri, comandi o revisioni.

## Difetto riprodotto e modifica

La prova precedente alla modifica osserva il DOM durante sei aggiornamenti di nomi estranei al testo: l’avviso e l’anteprima vengono rimossi e ricreati (`.local/font-diagnostics/before.log`). Entrambi usavano la versione globale del catalogo per invalidare il risultato, anche se testo e file interessati erano identici.

Ora la chiave dell’avviso dipende da identità/contenuto del testo, font e stili locali, file effettivamente usati e disponibilità della loro copertura. Per il candidato contano revisione sorgente, segnalazione, file scelto e caricamento/copertura di quel file. I menu mantengono la sottoscrizione alla libreria, ma i suoi aggiornamenti estranei non azzerano più il risultato.

Le identità sono locali e debolmente referenziate: nessun binario enorme nelle chiavi React, hash approssimativo o informazione salvata nel JSON. Cambiamenti di byte/formato anche sulla stessa istanza invalidano la chiave. Non è una nuova autorizzazione a usare il font: preflight, misure protette e controllo sul comando Applica restano gli stessi. Nuovo testo/file, retry esplicito e completamento pertinente aggiornano ancora la diagnosi; le risposte obsolete restano ignorate.

## Prove

- `tests/editor-font-diagnostic-key.test.ts`: geometria/colore/file estranei irrilevanti, contenuto e stili pertinenti rilevanti, identità dell’oggetto distinta, cambi di byte/formato/metadati, copertura WOFF preparata successivamente.
- `tests/e2e/font-highlight.spec.ts`: osservazione dell’avviso e dell’anteprima durante sei aggiornamenti di menu, caricamento di un vero WOFF estraneo e decompressione della sua cmap. Zero rimozioni, elementi originali ancora connessi, nessuna modifica al progetto prima di Applica. Correzione del solo membro del gruppo con `targetScope: object`, stesso `updateObject` manuale/AI simulato, Undo e font incorporati conservati.
- Regressioni esistenti: caratteri assenti, accenti decomposti, retry WOFF2 nell’ispettore, candidato senza glifi rifiutato, candidato tardivo ignorato, scelta esplicita e controlli delle metriche native. La stabilità non viene ottenuta congelando gli avvisi.
- `scripts/capture-editor-font-repair.ts`: percorso desktop/mobile con catture ispezionate; sorgente e coppia JSON/SVG [font-repair](../fixtures/illustrator/font-repair.TEST.json) identici alla versione precedente. Nessun nuovo diagnostico salvato o esportato. Illustrator non ricollaudato.

**1.198 unitari / 170 file passati** (`all-units.log`); **38 browser pertinenti distinti passati**, 24 fra i file dedicati e 14 regressioni in `local.spec.ts` (`browser.log`, `browser-regressions.log`). Non è una nuova esecuzione della suite browser generale. **71 coppie JSON/SVG riaperte/esportate**, senza errori, rete esterna o richieste dei font personali (`artifacts.log`). Build/tipi, build pubblica e scansioni dei segreti passati; **13 browser pubblici passati** (`public-tests.log`); JavaScript pubblico sempre `index-BG2r_x-8.js`. Log di questa iterazione in `.local/font-diagnostics/`.

Archivio principale in sola lettura: **SQLite R638, 346 template, due composizioni, 219 font di cui 218 attivi, un profilo**, invariato (`archive.json`). Le prove browser usano risorse TEST e non salvano nell’archivio personale. Nessuna importazione, migrazione, immagine AI o modifica alle integrazioni commerciali; nessun deploy. La roadmap resta aperta.
