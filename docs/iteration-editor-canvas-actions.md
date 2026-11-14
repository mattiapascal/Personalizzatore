# Foglio, proprietà e modulo — 14 novembre 2026

Colore del foglio, rimozione dello sfondo, proprietà di oggetti/gruppi e testo del modulo verificano ora gli input dell’ispettore prima di modificare la scena. Una misura incompleta rimane disponibile; una modifica valida precede il nuovo comando e mantiene un Undo distinto.

## Comandi e proprietà

La revisione dei callback di `8d73c2d` ha individuato questi percorsi ancora diretti a `act`, senza il controllo dell’ispettore. Il nuovo `sceneCommand` usa `inspectorAction`, poi costruisce il comando sulla revisione prodotta da quella sola applicazione. La rimozione dello sfondo acquisisce nello stesso modo il documento corrente, distinguendo immagine e gruppo vettoriale. Nessuna guardia ricorsiva dentro `act`, nessuna modifica agli schemi o ai validatori di dominio.

Proprietà e geometria rimangono separate: cambiare label, ordine o blocchi non sovrascrive gli oggetti appena trasformati. Il rifiuto passa attraverso i pannelli delle proprietà fino al campo numerico, che ripristina il valore effettivo. I pulsanti per rimuovere lo sfondo e i campioni base del colore foglio conservano il fuoco fino al controllo. Palette della pagina e colore personalizzato passano dallo stesso comando.

Il confronto manuale/AI usa lo stesso ruolo amministrativo per le proprietà del template. Il ruolo cliente continua a non poterle configurare; nessun permesso è stato allargato per far passare il collaudo.

## Schede dell’ispettore

Passare a un’altra scheda del singolo oggetto verifica la scheda attiva prima di smontarne i controlli. Un numero vuoto non sparisce passando da Geometria a Proprietà o viceversa. Mouse e tastiera conservano la scheda e portano il fuoco al vero input invalido; un fieldset invalido non è un bersaglio di fuoco utile. Una misura valida ancora in attesa viene applicata prima del cambio. Memoria della scheda tra oggetti e fallback Geometria concordati sono conservati.

## Popup e conferma cliente

La regressione del flusso completo delle proprietà ha esposto un difetto reale: quando la barra superiore va su più righe, il pannello del modulo si ancorava sotto il solo pulsante e poteva coprire **Conferma design** sulla riga successiva. Il collaudo tentava di premere il vero pulsante, intercettato dalla X del pannello; non è stato risolto forzando il click o chiudendo artificialmente il popup nel test.

Modifica, Trasforma, Livelli e Compila i dati calcolano ora l’ancoraggio iniziale usando l’intera barra. Un osservatore del suo ingombro aggiorna la posizione anche se cambia il ritorno a capo senza un resize della finestra. L’altezza disponibile viene rispettata invece di spostare Trasforma sopra i pulsanti. Trascinamento libero, Home e doppio clic per ripristinare l’ancoraggio rimangono disponibili; un pannello spostato volontariamente può ancora sovrapporsi alla barra. Il flusso originale passa dopo la correzione, senza modifiche al suo comportamento atteso. Screenshot aggiuntivo `editor-canvas-actions-popup.png`, ispezionato.

## Testo del modulo

Un valore digitato ma rifiutato perché l’ispettore è incompleto rimane visibile come pendente. Una revisione estranea di geometria o colore non lo sostituisce con il vecchio testo salvato e non lo considera applicato. Dopo la correzione si può riprendere la modifica o rientrare e uscire dal campo: il testo viene nuovamente proposto allo stesso comando `setText` validato.

Il pannello è distinto per documento/pagina. L’apertura esplicita di un altro documento azzera i vecchi campi locali; una vera modifica al testo canonico aggiorna il campo, mentre un semplice cambio di revisione non elimina l’input pendente. La conferma cliente resta disabilitata finché il testo rifiutato non è applicato, anche dopo aver corretto la misura dell’oggetto. Le regole precedenti su formati e limiti dei campi sono conservate; non è una nuova politica generale di salvataggio dei template amministrativi incompleti.

## Campione e verifiche

[JSON](../fixtures/illustrator/canvas-actions.TEST.json) e [SVG](../fixtures/illustrator/canvas-actions.TEST.svg), 120×80 mm: foglio azzurro, due rettangoli raggruppati, label/ordine conservati e testo Arimo OFL incorporato dopo la ripresa del modulo. Lo sfondo iniziale è stato rimosso con un comando annullabile; le guide restano nel JSON ed escluse dallo SVG. Generatore `node --import tsx scripts/capture-editor-canvas-actions.ts`, screenshot desktop/telefono/valore incompleto in `.local/previews/editor-canvas-actions-*.png`, ispezionati; rapporto privato `canvas-actions-capture.json`.

- **1.399 unitari in 192 file passati** (`.local/canvas-actions-units.log`). Schemi persistenti e comandi di dominio invariati dopo `npm run schemas`.
- **208 casi browser pertinenti distinti verificati fra esecuzioni e ricontrolli**: 136 su azioni/ispettori/gesti/import/trasformazioni (`canvas-actions-related.log`), 52 regressioni locali, un nuovo caso del modulo aggiuntivo e 19 casi ulteriori su popup/distanze. La regressione locale iniziale è terminata **51/52**; il flusso completo proprietà/conferma cliente passa dopo la correzione del popup (`canvas-actions-template-final.log`). L’ultima esecuzione passa **57/57**, comprendendo tutti i **34 nuovi casi**, trasformazioni e distanze (`canvas-actions-popup-final.log`). Non è una nuova suite browser generale.
- Coperti mouse e tastiera, input prima del timer, gruppi/membri, rifiuti numerici, sfondi raster/vettoriali, palette/colore personalizzato, confronto manuale/AI con ruolo corretto, Undo/Redo, campi locali e documento successivo. Un cliente con testo rifiutato resta bloccato su Conferma dopo una modifica geometrica estranea; il collaudo usa SQLite isolato e verifica l’assenza di POST e il record originale invariato. I popup sono verificati a 1440/900/390 px, dopo resize e ritorno a capo da contenitore, con drag/Home e documento immutato.
- Le prime tre prove sono state inizialmente respinte prima del loro scenario a causa di proporzioni incoerenti nell’immagine TEST: non sono considerate riproduzioni del difetto originale. Corretto soltanto il campione in 3:2, senza indebolire i validatori. L’esecuzione estesa ha poi trovato un altro errore del campione vettoriale (spessore nullo), un ruolo errato nel confronto AI e il vero problema di fuoco sul fieldset invalido. Tutti ricontrollati. Le tre prime prove sui popup Trasforma hanno inoltre esposto il suo calcolo separato: corretto con lo stesso ancoraggio e con l’altezza realmente disponibile.
- **94 campioni JSON/SVG riaperti ed esportati** sul codice finale, senza errori browser, richieste esterne o letture di font personali (`canvas-actions-artifacts-final.log`). **13 test della chat pubblica locale passati** (`canvas-actions-public-tests-final.log`). Build laboratorio/storefront e TypeScript Worker passati (`canvas-actions-build-final.log`, `canvas-actions-public-build-final.log`); JavaScript pubblico ancora `index-BG2r_x-8.js`. Scansioni segreti passate (`canvas-actions-secrets-final.log`, `canvas-actions-public-secrets-final.log`).
- Archivio principale controllato in sola lettura prima e dopo: **SQLite R638, 346 template, due composizioni, 219 font (218 attivi), un profilo**. Checksum dei metadati verificato e invariato (`canvas-actions-archive.json`). Cancellazione PDF preesistente esclusa dal commit.

Il controllo riguarda i percorsi indicati, non tutti i campi provvisori dell’interfaccia. Nessuna nuova funzione multipagina, migrazione, generazione immagini AI, deploy o modifica a negozio/tema/PitchPrint/BSS/prezzi/carrello/checkout/chat pubblicata. Nessun nuovo collaudo umano Illustrator o prova di lavorazione dichiarati.

Prossimo controllo: acquisizione dei progetti nei flussi di profilo/formato e operazioni asincrone, conservando le revisioni catturate e gli input non applicati. L’apertura o lo scarto intenzionale di un documento restano azioni distinte.
