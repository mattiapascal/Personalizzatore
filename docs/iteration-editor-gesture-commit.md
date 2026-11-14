# Input dell’ispettore e inizio dei gesti — 14 novembre 2026

I gesti sul canvas e il trascinamento dei livelli verificano ora l’ispettore prima di iniziare. Un campo incompleto resta disponibile, il gesto viene fermato e il fuoco torna al valore da correggere. Le misure valide ancora in attesa vengono applicate prima di acquisire la revisione del gesto. Il rilascio conserva quella revisione: non viene aggiornato implicitamente dopo un’altra modifica.

## Difetti riprodotti

Su `4cb0331`, trascinare un gruppo con larghezza vuota modificava comunque il documento, facendo sparire il valore incompleto. Anche riordinare un livello non selezionato scartava il campo della selezione corrente. Entrambe le prove sono fallite prima della correzione (`.local/gesture-commit-before.log`).

Un secondo caso è emerso nel collaudo: scegliere uno strumento di disegno cancella subito la selezione Fabric. Il controllo va quindi eseguito anche prima dell’attivazione dello strumento, non soltanto al primo punto. Gli strumenti di disegno ora rispettano questo passaggio, con i pulsanti che conservano il fuoco fino al controllo.

## Canvas e livelli

`FabricAdapter` espone un controllo iniziale opzionale per le scene interattive. I listener nativi in cattura sul contenitore precedono sia Fabric sia le maniglie esterne; gestiscono mouse e touch e vengono rimossi alla chiusura. Il renderer viene aggiornato sincronicamente dal documento canonico prima che Fabric acquisisca la revisione del gesto. Le scene di output non attivano questo controllo.

Quando l’applicazione di una misura cambia il bersaglio o la maniglia sotto il puntatore, quel gesto viene fermato con **Le misure sono state applicate. Riprendi il gesto dalla posizione aggiornata.** La misura valida rimane applicata e annullabile. Un vecchio angolo non diventa così uno spostamento del corpo, né si trascina un altro oggetto appena finito sotto il puntatore. Se il bersaglio resta lo stesso, il gesto può proseguire immediatamente.

Il controllo preserva il PAN e la scrittura già attiva del testo; click destro, cursore e selezione dei caratteri mantengono i rispettivi percorsi. Il disegno viene controllato prima dell’attivazione e al primo punto; i punti successivi conservano la revisione acquisita dal controller. Non viene introdotto un controllo ricorsivo al rilascio.

Nei livelli, `onBeginDrag` restituisce il documento aggiornato dopo il controllo. Il pannello verifica identità della pagina/documento e ID prima di memorizzare la revisione. Mouse, pointer/touch e percorso HTML alternativo condividono lo stesso avvio. Membri, gruppi interi ed elementi non selezionati mantengono i propri ambiti. Una nuova pagina/documento annulla il gesto; un comando concorrente mantiene il conflitto di revisione. Esc annulla il trascinamento senza annullare una misura valida già applicata prima dell’avvio.

Tutte le modifiche restano `moveObjects`, `transformObjects`, `placeObjects`, `placeGroupMember`, `addObject` o gli altri comandi già esistenti, con ruoli e blocchi nel validatore. Geometria e gesto restano due operazioni indipendenti nello storico, anche nella simulazione AI.

## Coordinate frazionarie del puntatore

Il confronto fisico del nuovo test ha isolato una deriva nella conversione del puntatore sui canvas piccoli: con una larghezza CSS di **589,5 px**, la superficie bitmap viene arrotondata a **589 px**. La conversione Fabric incorporava quel rapporto anche nel movimento fisico. Nell’esempio, 32 pixel sullo schermo producevano uno spostamento orizzontale di circa 6,50847 mm invece di 6,51399 mm; l’asse verticale, non frazionario, non presentava lo scarto.

`WindowCanvas` ora compensa la quantizzazione della bitmap prima della camera anche quando la tavola non usa il rendering a finestra, come già nel percorso a finestra. La correzione riguarda le coordinate del puntatore; non riscrive oggetti, misure, font o output. I test indipendenti verificano coordinate viewport/scena a DPR 1, 2 e 3, con dimensioni frazionarie, camera traslata e entrambe le modalità. Il test del gesto usa punti schermo interi e conversione fisica esplicita; nessuna tolleranza geometrica aumentata per nascondere lo scarto.

## Verifiche

- **1.399 unitari in 192 file passati** (`.local/gesture-commit-units.log`), con i comandi e gli schemi di dominio invariati.
- **275 casi browser pertinenti distinti passati**: 144 regressioni locali e 131 su gesti/viewport/trasformazioni/ispettori/appunti/guide/distanza/QR/immagini (`gesture-commit-regressions.log`, `gesture-commit-related.log`). Sono inclusi i **19 nuovi casi**: due difetti riprodotti prima della correzione, misura valida prima del timer, confronto manuale/AI integrale, due Undo/Redo, cambio del bersaglio sotto il puntatore, maniglia esterna, disegno da pulsante reale, mouse e touch, HTML drag iniziale rifiutato, Esc, comandi concorrenti e riapertura di un altro documento con gli stessi ID. DPR 1/2/3 su coordinate frazionarie e camera traslata, grandi zoom e confronti pixel indipendenti del viewport. Non è una nuova esecuzione della suite browser generale.
- **91 campioni JSON/SVG riaperti ed esportati**, senza errori browser, richieste esterne o letture di font personali (`.local/gesture-commit-artifacts.log`).
- **13 browser pubblici locali passati**; build laboratorio/storefront, TypeScript Worker, generazione schemi invariata e scansioni segreti passati (`gesture-commit-build.log`, `gesture-commit-public-build.log`, `gesture-commit-public-tests.log`, `gesture-commit-schemas.log`, `gesture-commit-secrets.log`, `gesture-commit-public-secrets.log`). JavaScript della chat ancora `index-BG2r_x-8.js`.

## Campione e ambito

[JSON](../fixtures/illustrator/gesture-commit.TEST.json) e [SVG](../fixtures/illustrator/gesture-commit.TEST.svg), 120×80 mm: due rettangoli raggruppati e didascalia Arimo OFL incorporata. Il generatore `node --import tsx scripts/capture-editor-gesture-commit.ts` verifica il rifiuto con larghezza vuota, applica una larghezza di 85 mm prima del gesto, trascina il gruppo e ne cambia l’ordine dai livelli. Preservati font, gruppo e didascalia. Screenshot desktop/telefono/errore in `.local/previews/editor-gesture-commit-*.png`, ispezionati; rapporto `.local/gesture-commit-capture.json`.

Nessun nuovo schema persistente o migrazione; stesse unità mm/pt e separazione JSON/SVG. Test con fixture, API simulate e SQLite temporaneo. Principale letto soltanto: **SQLite R638, 346 template, due composizioni, 219 font (218 attivi), un profilo**, checksum dei metadati invariato (`.local/gesture-commit-archive.json`). Nessun nuovo multipagina, generazione immagini AI, deploy o intervento su negozio, tema, PitchPrint, BSS, prezzi, carrello, checkout o chat pubblicata. La cancellazione PDF preesistente è esclusa dal commit. Nessun nuovo collaudo umano Illustrator o prova di lavorazione dichiarati.

Prossimo controllo: comandi AI simulati, visibilità e guide quando sono presenti input manuali ancora in attesa. Non considerare questa verifica dei gesti una certificazione di tutte le azioni dell’interfaccia.
