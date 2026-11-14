# Trasformazioni e input dell’ispettore — 14 novembre 2026

Riflessione, inclinazione, allineamento alla pagina/selezione/master, distribuzione e distanza verificano ora gli input dell’ispettore prima del comando. Una misura incompleta o uno stile non valido non vengono scartati dalla trasformazione: l’operazione si ferma, l’ispettore viene riaperto e il campo da correggere riceve il fuoco. Se i valori sono validi ma ancora in attesa, vengono applicati prima della trasformazione; il comando usa quindi la revisione aggiornata del documento.

## Riproduzione e correzione

Sul commit `5bfc6eb`, svuotare la larghezza di un gruppo e premere Rifletti modificava comunque la scena e ripristinava il campo precedente. Lo stesso accadeva allineando alla pagina un oggetto con altezza vuota. Entrambe le prove sono fallite prima della correzione (`.local/transform-commit-before.log`).

Il punto di ingresso `selectionCommand` richiama il controller condiviso dell’ispettore e legge la revisione dallo store dopo la sua applicazione. Anche l’allineamento del singolo elemento passa da questo percorso, eliminando l’uso della revisione rimasta nel render precedente. L’ambito del membro diretto resta esplicito nel comando; allineare un membro non muove i suoi fratelli.

Il percorso condiviso serve anche raggruppa/separa e i pulsanti dell’ordine dei livelli. Gli spostamenti con frecce dal canvas applicano il medesimo controllo prima di calcolare la nuova posizione sul documento corrente; le frecce nei campi mantengono il proprio funzionamento. Elimina e Undo restano operazioni di scarto disponibili, senza un controllo globale ricorsivo dentro `act`.

I pulsanti che eseguono queste azioni conservano il fuoco fino al proprio controllo, come già salvataggio e appunti. Per i comandi immediati, `NumberField` ammette un rifiuto esplicito `false`: l’inclinazione rifiutata torna al valore effettivo anziché lasciare un numero mai applicato. I callback esistenti che restituiscono `void` mantengono il comportamento precedente. Nessun rimontaggio del campo: durante l’inserimento accettato il fuoco resta nella casella e le frecce continuano con passo 0,1°.

Durante il collaudo visivo è emerso un altro effetto: il messaggio d’errore aggiungeva altezza alla zona inferiore e traslava il canvas. Nell’area di lavoro l’avviso è ora in sovrimpressione, con altezza limitata e scorrimento per i messaggi lunghi. Ruolo accessibile e contenuto restano invariati. Posizione/dimensioni del canvas e zoom sono verificati identici prima/dopo l’errore, su desktop e telefono.

Geometria, stile e trasformazione rimangono comandi separati, validati e annullabili. Non è una nuova transazione composta: una modifica valida già applicata rimane disponibile anche se il comando successivo viene rifiutato. Non vengono aggiornate arbitrariamente revisioni di comandi AI o trascinamenti già catturati.

## Verifiche

- **1.399 unitari in 192 file passati** (`.local/transform-commit-units.log`); nessun cambiamento ai comandi o agli schemi di dominio.
- **126 browser pertinenti distinti passati**: 17 nuovi, 44 regressioni locali e 65 su ispettori/appunti/distanza/QR/trasparenza immagini (`transform-commit-accepted.log`, `transform-commit-regressions.log`, `transform-commit-related.log`). Comprendono campi vuoti/errati, rifiuto e nuovo tentativo, correzione prima del timer, singolo membro, master, confronto integrale manuale/AI, Undo/Redo distinti, tastiera, proporzioni, popup mobili, SQLite temporaneo e output reali. Non è una nuova esecuzione della suite browser generale.
- **90 campioni JSON/SVG riaperti ed esportati**, senza errori browser, richieste esterne o letture di font personali (`.local/transform-commit-artifacts.log`).
- **13 browser pubblici locali passati**; build laboratorio/storefront, TypeScript Worker, generazione schemi invariata e scansioni segreti passati (`transform-commit-build.log`, `transform-commit-public-build.log`, `transform-commit-public-tests.log`, `transform-commit-schemas.log`, `transform-commit-secrets.log`, `transform-commit-public-secrets.log`). JavaScript della chat ancora `index-BG2r_x-8.js`.

## Campione

[JSON](../fixtures/illustrator/transform-commit.TEST.json) e [SVG](../fixtures/illustrator/transform-commit.TEST.svg), 120×80 mm: due rettangoli in un gruppo e una didascalia con Arimo OFL incorporato. Il generatore `node --import tsx scripts/capture-editor-transform-commit.ts` verifica il rifiuto con larghezza vuota, corregge a 85 mm, riflette e centra il gruppo sulla pagina, poi scarica lo SVG. Gruppo, font e oggetto non selezionato sono conservati.

Screenshot dell’errore senza spostamento, desktop e telefono in `.local/previews/editor-transform-commit-*.png`, ispezionati visivamente; rapporto `.local/transform-commit-capture.json`. Il collaudo iniziale è stato corretto per seguire la chiusura reale dei popup: Escape chiude prima Trasforma e il pannello Livelli si chiude quando il fuoco torna all’ispettore. Nessuna modifica applicativa per eludere queste interazioni e nessuna tolleranza geometrica aumentata.

## Ambito e prosecuzione

Nessuna modifica al modello persistente, renderer, font o unità mm/pt. JSON editabile e SVG produttivo restano distinti. I test usano risorse TEST e API simulate, oppure salvataggi su SQLite temporaneo; nessuna modifica all’archivio personale. Principale verificato in sola lettura: SQLite R638, 346 template, due composizioni, 219 font (218 attivi), un profilo, checksum dei metadati invariato (`.local/transform-commit-archive.json`).

Nessun nuovo multipagina, generazione immagini AI, deploy o intervento su negozio, tema, PitchPrint, BSS, prezzi, carrello, checkout o chat pubblicata. La cancellazione PDF preesistente è esclusa dal commit. Nessun nuovo collaudo umano Illustrator o prova di lavorazione dichiarati.

Prossimo controllo: input in attesa durante gesti sul canvas e riordino tramite trascinamento. Questi percorsi catturano una revisione all’inizio del gesto: non basta applicare il controllo al rilascio e aggiornare quel numero.
