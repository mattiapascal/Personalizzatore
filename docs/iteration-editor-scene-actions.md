# AI simulata, visibilità e guide — 14 novembre 2026

Le azioni AI simulate, gli occhi dei livelli e le guide verificano ora gli input dell’ispettore degli oggetti prima di modificare la scena. Un campo incompleto non viene scartato da un nuovo render: l’azione si ferma e il campo da correggere riceve il fuoco, anche quando l’ispettore era chiuso sul telefono.

## Problemi riprodotti e contratto

Sul commit `e64b91d`, eseguire un comando JSON, nascondere un gruppo o aggiungere una guida con la larghezza del gruppo vuota modificava il documento e faceva sparire l’input incompleto. Tutte e tre le prove sono fallite prima della correzione (`.local/scene-actions-before.log`).

Il controllo `inspectorAction` verifica la revisione mostrata prima di applicare l’ispettore, poi conserva l’identità del documento e della pagina. Le azioni manuali immediate costruiscono il proprio comando sulla revisione prodotta da quella sola applicazione. La visibilità mantiene l’ambito del singolo oggetto: nascondere un membro non nasconde i suoi fratelli. Geometria e visibilità/guide restano comandi distinti, con Undo separati e gli stessi validatori della simulazione AI.

Per un comando AI il controllo è più restrittivo: la revisione originale deve coincidere sia prima sia dopo l’applicazione dell’ispettore. Se vengono applicate nuove modifiche manuali, queste rimangono nel documento e il vecchio comando viene rifiutato, senza riscriverne il JSON o iniziare la preparazione delle risorse. Anche una revisione futura viene rifiutata prima di applicare implicitamente altri input. Il parsing precede il controllo: un JSON malformato non acquisisce né scarta il campo manuale in attesa.

Il pulsante **Prepara comando aggiornato** verifica gli input prima di leggere la revisione corrente. Rimane un esempio di comando nel pannello sviluppatore, disponibile in modalità TEST; non è una nuova connessione a un modello reale. I pulsanti interessati conservano il fuoco fino al controllo, evitando che il blur anticipi o interrompa il primo clic.

## Guide e menu

Il pannello passa la revisione visibile al controllo. Se una coordinata viene rifiutata perché l’ispettore dell’oggetto è incompleto, il campo numerico torna al valore effettivo, senza mostrare una posizione mai applicata.

Righelli, trascinamento, tastiera e apertura del menu acquisiscono il documento dopo il controllo iniziale. Il gesto e il menu conservano poi quella revisione, oltre all’identità di pagina/documento. Il menu riconosce la revisione appena prodotta dal proprio controllo iniziale, evitando una chiusura immediata all’apertura.

Prima del comando finale vengono verificati anche eventuali nuovi input. Un valore incompleto annulla l’azione della guida; una modifica valida viene conservata ma rende obsoleta la revisione già catturata. La guida non viene quindi aggiornata o cancellata su una scena diversa. L’annullamento rimuove preview e menu, senza sacrificare la modifica manuale. Nessun aggiornamento arbitrario della revisione al rilascio.

## Verifiche

- **1.399 unitari in 192 file passati** (`.local/scene-actions-units.log`); schemi e comandi di dominio invariati.
- **264 casi browser pertinenti distinti verificati tra esecuzioni e ricontrolli**: 129 regressioni locali e 135 su scena, visibilità, guide, bozze, gesti, trasformazioni, ispettori, appunti e viewport. Inclusi **24 nuovi casi**, passati integralmente nel ricontrollo finale (`scene-actions-clock-final.log`). La prima esecuzione dei due gruppi ha concluso rispettivamente 128/129 e 134/135: un vecchio selettore del pannello foglio e una pausa dell’orologio nel passato, entrambi corretti e ricontrollati. Non è una nuova esecuzione della suite browser generale.
- Il selettore del colore del foglio ora individua il solo titolo principale, distinto dalla palette interna; il relativo caso completo AI/storico/JSON passa (`scene-actions-paper-final.log`). Anche il generatore storico usa il selettore preciso. Il nuovo collaudo usa un’epoca esplicita e una pausa successiva, evitando la corsa di pochi millisecondi tra orologio Node e browser. Nessuna modifica alle regole o ai tempi dell’applicazione per ottenere questi risultati.
- I casi sul comando catturato del menu usano eventi sui veri input controllati senza spostare il fuoco, simulando un aggiornamento asincrono. La chiusura del menu allo scorrimento è conservata; il collaudo iniziale tentava erroneamente di cliccare dopo quella chiusura. Gli altri casi comprendono click, tastiera, drag, mobile, input prima del timer, riferimenti diretti, confronto integrale manuale/AI e Undo separati.
- **92 campioni JSON/SVG riaperti ed esportati**, senza errori browser, richieste esterne o letture di font personali (`scene-actions-artifacts.log`). **13 browser pubblici locali passati**; build laboratorio/storefront, TypeScript Worker, generazione schemi invariata e scansioni segreti passati (`scene-actions-build.log`, `scene-actions-types-final.log`, `scene-actions-public-build.log`, `scene-actions-public-tests.log`, `scene-actions-schemas.log`, `scene-actions-secrets.log`, `scene-actions-public-secrets.log`). JavaScript della chat ancora `index-BG2r_x-8.js`.

## Campione e ambito

[JSON](../fixtures/illustrator/scene-actions.TEST.json) e [SVG](../fixtures/illustrator/scene-actions.TEST.svg), 120×80 mm: tre oggetti, gruppo conservato, livello rosso nascosto e tre guide. Il JSON conserva oggetto nascosto e guide; lo SVG produttivo li esclude. Didascalia Arimo OFL incorporata. Il generatore `node --import tsx scripts/capture-editor-scene-actions.ts` riproduce il rifiuto dell’input incompleto, applica lo spostamento manuale, rifiuta il comando AI precedente e lo esegue soltanto dopo aggiornamento esplicito, poi modifica guide e visibilità.

Screenshot desktop, mobile e revisione obsoleta in `.local/previews/editor-scene-actions-*.png`, ispezionati. Per la cattura mobile si attendono dimensioni e pittura effettive dopo il resize, evitando una schermata intermedia vuota. Rapporti privati `.local/scene-actions-capture.json` e `scene-actions-archive.json`.

Il controllo riguarda gli input dell’ispettore degli oggetti; non certifica tutti i campi provvisori degli altri pannelli. Nessun nuovo schema persistente, migrazione, funzione multipagina, generazione immagini AI, deploy o intervento su negozio/tema/PitchPrint/BSS/prezzi/carrello/checkout/chat pubblicata. Test con API simulate e archivi temporanei. Principale verificato in sola lettura: **SQLite R638, 346 template, due composizioni, 219 font (218 attivi), un profilo**, checksum dei metadati invariato. Cancellazione PDF preesistente esclusa dal commit. Nessun nuovo collaudo umano Illustrator o prova di lavorazione dichiarati.

Prossimo controllo: creazione di oggetti e inserimento manuale di risorse con input dell’ispettore ancora in attesa, mantenendo distinte le azioni esplicite di sostituzione o scarto del documento.
