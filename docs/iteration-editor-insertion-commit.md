# Inserimento di oggetti e risorse — 14 novembre 2026

La creazione di oggetti e l’importazione manuale controllano gli input dell’ispettore prima di cambiare la scena o aprire un dialogo. Un campo incompleto rimane disponibile e riceve il fuoco; una modifica valida viene applicata prima di acquisire la revisione del nuovo comando.

## Difetto e correzione

Sul commit `23f51c2`, aggiungere un rettangolo, importare uno SVG o caricare un PNG con la larghezza del gruppo vuota aggiungeva contenuti e faceva sparire l’input incompleto. Tutte e tre le riproduzioni sono fallite prima della correzione (`.local/insertion-before.log`).

Testo, primitive, poligoni, stelle, Bézier e QR usano il controllo comune `inspectorAction`. Anche l’apertura dei dialoghi QR/immagini/sfondi verifica l’ispettore: un dialogo modale non può sottrarre il fuoco al campo da correggere. I pulsanti conservano il fuoco fino al controllo, mantenendo l’attivazione da tastiera. Geometria e inserimento rimangono comandi distinti con Undo separati, stessi schemi e validatori della simulazione AI; nessuna protezione ricorsiva dentro `act`.

L’inserimento asincrono di PNG/JPEG, SVG, PDF e risorse della libreria passa da `prepareInsertion`, anche per l’immagine sostituita dal modulo. Il controllo precede lettura del file, decodifica o richiesta della risorsa. La revisione acquisita viene conservata fino al commit: un taglio già avviato che cambia la composizione durante il download annulla l’inserimento, senza sacrificare il taglio. Store, documento e pagina sono controllati oltre alla revisione. Nessun aggiornamento arbitrario dei comandi catturati.

`InsertionFileControl` conserva la destinazione e la funzione d’importazione quando viene aperto il selettore nativo. Se nel frattempo cambia il documento o la sua revisione, il file scelto non viene inserito. Rimangono anche le opzioni d’importazione scelte all’apertura, per esempio contorni/testo editabile nel PDF. Annullare il selettore elimina la richiesta catturata; riprovare con lo stesso file resta possibile. Un input file alimentato direttamente passa comunque dalla verifica prima dell’inserimento.

L’apertura esplicita di un altro progetto JSON resta un’operazione di sostituzione: non viene bloccata dall’input incompleto che si sta intenzionalmente scartando. La sostituzione dell’immagine dall’ispettore conserva i propri controlli precedenti su file, revisione e cornice. Nessuna modifica al convertitore PDF o ai limiti degli originali.

## Campione

[JSON](../fixtures/illustrator/insertion-commit.TEST.json) e [SVG](../fixtures/illustrator/insertion-commit.TEST.svg), 120×80 mm: otto oggetti con rettangoli raggruppati, testo Arimo OFL incorporato, stella, Bézier, vettore SVG, PNG originale e QR. Le guide restano nel JSON e sono escluse dallo SVG. `node --import tsx scripts/capture-editor-insertion-commit.ts` riproduce il rifiuto dell’input incompleto e la misura applicata prima del nuovo oggetto, usa import e comandi AI simulati, controlla Undo/Redo ed esporta attraverso l’interfaccia reale.

Screenshot desktop, telefono e campo incompleto in `.local/previews/editor-insertion-commit-*.png`, ispezionati. Il campione distingue l’originale raster dai suoi pixel interpolati nell’anteprima. Rapporto `.local/insertion-capture.json`: otto oggetti, sette tipi, nessun errore browser, richiesta esterna o scrittura amministrativa.

## Verifiche

- **1.399 unitari in 192 file passati** (`.local/insertion-units.log`). Schemi e comandi di dominio invariati dopo `npm run schemas`.
- **166 casi browser pertinenti distinti passati**: 120 su inserimento, ispettori, appunti, QR, immagini e azioni di scena (`insertion-related.log`), 42 regressioni locali di import/librerie/sostituzione (`insertion-regressions.log`) e quattro casi aggiuntivi su destinazione/opzioni PDF/modulo (`insertion-extra.log`). Comprendono **41 nuovi casi**. Sono esecuzioni mirate, non una nuova suite browser generale.
- L’esecuzione iniziale estesa ha mostrato due errori dei nuovi selettori di collaudo: il ruolo dialogo comprendeva anche l’area di disegno, e l’ispettore mobile doveva essere aperto dopo la selezione. Successivamente le due attese sugli sfondi sono state corrette per cercare gli oggetti originali tramite ID, dato che lo sfondo viene correttamente inserito sotto di essi. Tutti questi casi passano nella successiva esecuzione da 120; nessuna modifica alle regole dell’app per adattarle alle attese errate.
- Le prove includono input prima del timer con orologio esplicito, nove tipi di creazione, manuale/AI e Undo/Redo, selettori nativi, cambio di documento e di revisione durante la scelta, annullamento/riprova, PDF con modalità catturata e PNG originale. Gallerie raster/vettori e sfondi con integrità SHA-256, concorrenza reale con un taglio IndexedDB già avviato, schermo piccolo e tastiera. Nel nuovo gruppo le risposte della conversione PDF sono simulate; le regressioni comprendono anche conversioni PDF locali reali e 1.000 oggetti. Nessun risultato Illustrator dedotto da questi controlli.
- **93 campioni JSON/SVG riaperti ed esportati**, senza errori browser, richieste esterne o letture di font personali (`insertion-artifacts.log`). **13 test della chat pubblica locale passati** (`insertion-public-tests.log`). Build laboratorio e storefront, TypeScript Worker e scansioni segreti passati (`insertion-build.log`, `insertion-public-build.log`, `insertion-secrets.log`, `insertion-public-secrets.log`); JavaScript della chat ancora `index-BG2r_x-8.js`.
- Archivio principale controllato in sola lettura prima e dopo i collaudi: **SQLite R638, 346 template, due composizioni, 219 font (218 attivi), un profilo**. Checksum dei metadati verificato e invariato (`insertion-archive.json`). Test di salvataggio su copie SQLite temporanee; cancellazione PDF preesistente esclusa dal commit.

Il controllo riguarda gli input dell’ispettore degli oggetti; non certifica tutti i campi provvisori degli altri pannelli. Nessuna nuova funzione multipagina, migrazione, generazione immagini AI, deploy o modifica a negozio/tema/PitchPrint/BSS/prezzi/carrello/checkout/chat pubblicata. Nessun nuovo collaudo umano Illustrator o prova di lavorazione dichiarati.

Prossimo controllo: azioni sullo sfondo/foglio, proprietà e modulo che cambiano la scena senza aggiungere un oggetto, con la stessa distinzione tra conferma degli input e scarto intenzionale.
