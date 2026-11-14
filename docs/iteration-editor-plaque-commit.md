# Targhe: input dell’ispettore e misure tecniche coerenti

14 novembre 2026. Incremento locale successivo a `4cbc7a0`; [piano](editor-plaque-commit-plan.md).

## Problemi riprodotti

Tre casi nativi falliscono prima della correzione (`.local/plaque-commit-before.log`): cambio fissaggio consentito con una misura di gruppo incompleta; modifica valida della posizione non acquisita prima di cambiare l’area della targa; diametro impossibile respinto dal motore ma ancora visibile nel campo.

Il collaudo esteso trova inoltre un difetto preesistente: cambiando accessorio senza spostare il fuoco dal campo tecnico, il documento azzera correttamente i dati del vecchio accessorio ma la casella può mostrare il valore precedente.

## Correzione

`PlaqueConfigurationPanel` passa ora per `sceneCommand`: controllo dell’ispettore, acquisizione delle modifiche valide, poi `configurePlaque` sulla revisione risultante. Non cambia il motore geometrico e non aggiorna revisioni di comandi AI già catturati. Un campo incompleto blocca l’azione e torna in evidenza nell’ispettore, anche sul telefono. Il pannello rispetta anche i blocchi di archivio, conflitto e catalogo superato.

Il risultato booleano del comando raggiunge tutti i campi. `NullableMillimetresField` ripristina il dato canonico al rifiuto e distingue l’aggiornamento della propria digitazione da una modifica esterna, come cambio accessorio o Undo. Un valore mancante resta `null`; zero resta ammesso per il rispetto extra e vietato per il diametro. Notazione locale ed esponenti incompleti conservano il comportamento precedente durante la digitazione.

Dimensioni della pagina e posizione dei fissaggi restano fisiche in mm; il cambio area centra la composizione come prima. Famiglie fuoriporta/scatolati, permessi cliente/amministratore e azzeramento delle misure al cambio accessorio restano validati dal comando comune manuale/AI.

## Verifiche

- **13 nuovi casi browser passati** (`.local/plaque-commit-native-final.log`): blocco su sei campi, input senza blur, ripresa, rifiuto geometrico, null/zero, aggiornamento esterno, desktop/telefono, equivalenza manuale/AI e Undo/Redo distinti.
- **53 casi browser pertinenti distinti passati fra esecuzioni e ricontrolli**: i 13 nuovi, otto regressioni fissaggi, 23 acquisizioni/modello/profilo e nove percorsi locali di targhe/template/riferimenti. Log `plaque-commit-native.log`, `plaque-commit-final.log`, `plaque-commit-native-final.log` e `plaque-commit-regressions.log`. Le prime esecuzioni estese non sono interamente verdi: due casi correggono una riparazione numerica che aggiungeva legittimamente una revisione e il nome del pulsante «Ripristina»; il terzo porta alla correzione del campo tecnico obsoleto. Non una nuova suite browser generale.
- **1.399 unitari in 192 file passati** (`plaque-commit-units.log`). Build laboratorio/storefront e TypeScript Worker passati; schemi persistenti invariati e scansioni segreti passate.
- **96 campioni JSON/SVG riaperti/esportati**, zero errori browser, richieste esterne e letture di font privati (`plaque-commit-artifacts.log`). **13 test della chat pubblica locale passati** (`plaque-commit-public-tests.log`); JavaScript pubblico ancora `index-BG2r_x-8.js`.
- Archivio personale letto prima/dopo, **SQLite R638 invariato**: 346 template, due composizioni, 219 font di cui 218 attivi, un profilo; checksum dei metadati valido e identico (`plaque-commit-archive-before.json`, `plaque-commit-archive.json`). Cancellazione PDF preesistente esclusa dal commit.
- Campione reale della UI: `fixtures/illustrator/plaque-commit.TEST.json/svg`, targa TEST **160 × 100 mm**, tre oggetti, gruppo conservato, due fori da 4 mm a X 20/140 e Y 50 mm, rispetto extra 3 mm. Font Arimo OFL incorporato, nessun font del computer. Generatore `scripts/capture-editor-plaque-commit.ts`; catture desktop/telefono/errore in `.local/previews/editor-plaque-commit-*`, ispezionate. Nessun errore browser, scrittura di archivio o richiesta esterna durante la cattura.

## Limiti e seguito

Questo incremento protegge le azioni del pannello targa rispetto agli input dell’ispettore. Non dichiara una conferma globale di tutti i campi temporanei dell’interfaccia. Nessun nuovo collaudo umano in Illustrator o prova di lavorazione; diametri e rispetto restano dati da verificare sui kit reali. Nessun collegamento a prezzi/BSS/carrello, deploy, migrazione, nuova funzione multipagina o generazione immagini AI.

Prossimo controllo: applicazione/separazione del testo dal tracciato con geometria e stile ancora pendenti nell’ispettore, usando gli stessi comandi e preservando i tracciati originali.
