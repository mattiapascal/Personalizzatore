# Dettagli su fogli grandi — 14 novembre 2026

Nello spazio di disegno espanso lo zoom arriva al **400% anche sui formati di 3 metri**. Il pulsante **Adatta alla selezione** inquadra un oggetto piccolo indipendentemente dalla dimensione del foglio; **Adatta all’area** torna al foglio intero. Rotella/pinch conservano il punto sotto il puntatore, Mano/Space spostano la vista. Il laboratorio compatto conserva il limite storico: aprire lo spazio di disegno per lavorare sui dettagli.

## Documento e rendering

Il contenitore DOM conserva l’intera pagina logica, con le misure fisiche e l’origine originali. Quando il bitmap completo supererebbe il budget, i due canvas Fabric coprono soltanto l’intersezione visibile e un margine di 128 pixel CSS. La trasformazione contiene zoom e origine del ritaglio. Le superfici rispettano ciascuna **8192 pixel per lato e 16 milioni di pixel**, anche nelle assegnazioni intermedie durante un cambio verticale/orizzontale. Su schermi eccezionalmente grandi si riduce la densità del backing, anche sotto 1, conservando tutta la vista e le coordinate del puntatore.

Il nuovo adattamento è confinato a `WindowCanvas`, con Fabric 7.4.0 fissato nel progetto. Per i fogli che rientrano nel budget rimane il rendering completo. Sui grandi fogli lo sfondo e il ritaglio rettangolare/circolare usano percorsi Canvas2D, senza una cache bitmap grande del clipPath di pagina. L’ombra del contenitore logico enorme è disattivata.

PAN e zoom notificano l’adattatore; resize e scroll hanno osservatori di recupero. Piccoli PAN riusano il margine già disegnato: il ritaglio si aggiorna prima di esporre pixel mancanti. Uno spostamento della sola origine non rialloca le superfici. Durante una trasformazione nativa la camera resta ferma e si aggiorna al rilascio o all’annullamento. I puntatori compensano anche l’arrotondamento del backing Retina frazionario.

Testo/cursore, maniglie interne/esterne, nodi, ritaglio foto, guide/griglia, zone produttive e fissaggi leggono la stessa camera. La griglia adatta il numero di linee alla zona visibile, così il passo di 1 mm resta disponibile sul dettaglio di un foglio grande. Righelli e guide DOM continuano a riferirsi alla pagina logica.

La camera non entra nel documento canonico, nello storico o negli archivi. I gesti manuali continuano a emettere i comandi validati esistenti, condivisi con la simulazione AI. SVG e miniature usano il documento completo; i limiti dell’esportazione PNG sono invariati e indipendenti dallo zoom della vista. Nessun cambiamento di schema, migrazione o modifica automatica dei progetti esistenti.

## Campione e collaudo

[JSON editabile](../fixtures/illustrator/viewport.TEST.json) e [SVG fisico](../fixtures/illustrator/viewport.TEST.svg): tavola **3000×2000 mm**, rettangolo di 20×10 mm, testo di 8 pt con Arimo OFL incorporato e linea con estremità quadrate. Generatore `node --import tsx scripts/capture-editor-viewport.ts`. Aprire il JSON, selezionare il rettangolo e premere **Adatta alla selezione**; provare spostamento, maniglie, PAN e ritorno all’area completa.

Le catture desktop/telefono sono in `.local/previews/editor-viewport-*.png`, esaminate visivamente. Il campione conserva documento e SVG prima/dopo le operazioni di vista. In Illustrator verificare le misure fisiche, la modificabilità del testo e la corrispondenza del dettaglio: **collaudo umano non eseguito**.

## Evidenze finali

- **1.356 unitari in 188 file**: 11 nuovi casi per pianificazione, margini/riuso, pagina fuori vista, dati non validi e densità da 0,5 a 10.
- **141 scenari browser pertinenti distinti passati**: 21 nuovi viewport, 10 della vista selezione, 44 su PAN/grandi formati/testi/maniglie e 66 su localizzazione, guide, fissaggi, contorni e testo su percorso. Nella prima esecuzione dei 66, 65 passavano e un test pretendeva il vecchio clamp durante il cambio formato; aggiornato a zoom conservato e budget bitmap verificato, poi **13/13** casi di localizzazione ricontrollati. Non è una nuova esecuzione generale di tutta la suite browser.
- Retina **1, 1,25, 2 e 4**: drag reale di 1×0,5 mm identico al comando AI simulato, dimensioni nominali conservate e Undo. Densità inferiore a 1 verificata su una superficie logica 12000×9000 CSS: puntatore e pittura coerenti, nessuna allocazione intermedia oltre budget durante gli scambi con il formato verticale. Strumentazione delle assegnazioni width/height anche nel laboratorio reale a Retina 2, con SVG e formati 3 m orizzontali/verticali/quadrati.
- Testo ai due estremi, nodo e crop trascinati, lato opposto fermo e maniglia esterna sopra il foglio, disegno manuale con un solo comando al rilascio, guida e griglia di 1 mm, zone tecniche e fissaggi dopo PAN. Rotella ancorata al puntatore, piccoli PAN con riuso, resize/pannelli, dettaglio mobile al 400%, pagina fuori vista e ritorno senza alterare revisioni o SVG/miniatura.
- **Quattro confronti Canvas2D indipendenti**, rettangolo interno e parzialmente esterno al foglio circolare a Retina 1/2: prima e dopo PAN, zero pixel differenti oltre la soglia di 4 unità complessive sui canali premoltiplicati, errore medio zero. Il confronto riguarda queste geometrie, non certifica ogni possibile contenuto dell’editor.
- **85 campioni JSON/SVG** riaperti ed esportati: nessun errore browser, richiesta esterna o caricamento di font dalla libreria reale. **13 test della chat pubblica**, build laboratorio/storefront e TypeScript Worker, schemi e scansioni dei segreti passati. Schemi generati invariati.
- Archivio reale letto soltanto: **SQLite R638, 346 template, due composizioni, 219 font (218 attivi), un profilo**. Campioni e test usano dati separati. La cancellazione preesistente di `output/pdf/editor-font-compressi.TEST.pdf` resta esclusa dalla consegna.

Log `.local/viewport-*.log`, censimento `.local/viewport-archive.json`, catture e riepilogo `.local/viewport-capture.json`. Safari/Firefox e Illustrator non collaudati. Il passo successivo è aggiornare la matrice funzionale storica e identificare la prossima lacuna manuale utile nell’uso quotidiano, mantenendo sospese le funzioni avanzate e commerciali.

Nessun deploy, migrazione, nuova funzione multipagina, generazione immagini AI o modifica a negozio/chat pubblicata.
