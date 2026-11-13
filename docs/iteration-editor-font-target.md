# Dal controllo font al testo da correggere — 13 novembre 2026

Le segnalazioni in **Strumenti → Font del progetto** hanno ora il pulsante **Apri nell’ispettore**, preceduto dalla stessa identificazione dell’oggetto presente nei livelli e nell’ispettore, con anteprima del testo. Il pulsante compare una sola volta per oggetto/pagina anche quando sono segnalati più font dello stesso testo.

Il collegamento seleziona il testo esatto, apre l’ispettore e porta il focus alla scheda attiva. Non sceglie un font, non modifica la composizione e non misura un glifo usando un sostituto. Se il testo non ha ancora geometria verificata, resta il modulo di recupero già presente, con contenuto originale e diagnosi dei caratteri, senza dimensioni inventate.

## Gruppi e vista

- Un testo raggruppato viene selezionato come singolo membro: la correzione manuale e Annulla usano i comandi e lo storico esistenti; fratelli e struttura del gruppo restano conservati.
- Su schermi sotto 900 px si apre Ispettore e si richiude Strumenti, evitando la sovrapposizione dei due pannelli. Su desktop viene riaperto anche un ispettore chiuso dall’utente. Mano/disegno/nodi/ritaglio lasciano posto alla selezione normale.
- Se il problema appartiene a un’altra pagina già esistente si usa il normale `selectPage`: formato e oggetti di quella pagina, ID omonimi distinti. Cambia la revisione di navigazione, non il contenuto della grafica. Non viene aggiunta alcuna capacità multipagina.
- La richiesta di apertura viene consumata una volta sola: chiudere l’ispettore e poi sfogliare manualmente le pagine non lo riapre. Un nuovo clic sul collegamento lo apre nuovamente.
- I blocchi propri/ereditati del template sono rispettati nel ruolo cliente; il collegamento disabilitato ne spiega il motivo. Il ruolo amministrativo resta distinto. Anche i menu nascosti del template restano nascosti.

La verifica di ID, pagina, tipo oggetto e permessi usa il documento corrente. Il callback controlla documento/revisione prima della navigazione. Nessun nuovo comando grafico, schema, salvataggio automatico nell’archivio o selezione implicita dei caratteri. La memoria della scheda conserva il comportamento già concordato: dopo il fallback Geometria resta attiva; il modulo di recupero dei font rimane distinto dall’ispettore geometrico.

## Prova locale riproducibile

Aprire il [laboratorio](http://127.0.0.1:5173/editor?workspace=1) e caricare il [sorgente TEST](../fixtures/illustrator/font-repair.source.TEST.json) tramite **Apri file JSON**. In Strumenti, trovare la segnalazione per `repair-text` e premere **Apri nell’ispettore**. Il contenuto `ABC Ω` rimane identico: si può correggere il testo dal modulo di recupero oppure tornare a Strumenti e scegliere esplicitamente Arimo per il solo Ω mancante.

Riutilizzati il [JSON corretto](../fixtures/illustrator/font-repair.TEST.json) e lo [SVG](../fixtures/illustrator/font-repair.TEST.svg) 80×40 mm con font incorporati, senza cambiare i byte del progetto per aggiungere una funzione di navigazione. Il generatore `node --import tsx scripts/capture-editor-font-repair.ts` include le prove desktop/mobile del collegamento e verifica che il documento non cambi prima di Applica. Nessun nuovo collaudo Illustrator.

## Verifiche

Tre nuovi unitari: navigazione con font non misurabile senza mutazioni; corrispondenza esatta pagina/ID/tipo; blocchi propri ed ereditati nei ruoli cliente/amministratore. **1.164 unitari / 164 file passati**, con due worker; build/TypeScript passati.

Sei nuovi browser passati: gruppo e Mano, correzione manuale/Annulla a 390 px, pagina esistente e apertura consumata, blocco cliente, amministrazione e menu nascosti. Il primo tentativo aveva tre errori nella preparazione delle prove: Annulla cercato nel pannello chiuso su telefono e import JSON cercato nel ruolo cliente. Le prove ora seguono l’interfaccia effettiva: riapertura Strumenti per Annulla e caricamento cliente da un record TEST intercettato. Nessuna modifica ai permessi o ai timeout applicativi per farle passare.

Log `.local/font-target-all-units.log`, `font-target-build.log`, `font-target-browser.log` e `font-target-browser-recheck.log`. I ricontrolli della scheda richiesti dal titolare sono passati anche separatamente in `.local/inspector-fallback-recheck.log`.

**97 scenari browser distinti passati** nelle due esecuzioni di regressione (85 + 12), fra cui tutti i sei nuovi casi, scheda dell’ispettore, correzione dei font, gruppi, PAN/zoom, ridimensionamenti e tutti i tredici casi del mirino geometrico. Dopo il solo adeguamento del pulsante al blu #08c e gradazioni, i sei nuovi casi sono stati ricontrollati e passati. Non è una nuova suite browser generale. Log `.local/font-target-browser-regressions.log`, `font-target-browser-complement.log` e `font-target-final-browser.log`.

Catture desktop/mobile aggiornate e ispezionate in `.local/previews/editor-font-target-*.png`; report `.local/editor-font-repair-capture.json`: navigazione e anteprima verificate, documento invariato fino ad Applica, zero errori e scritture amministrative. Il generatore inizialmente cercava il pannello Strumenti ancora chiuso al ritorno dal telefono: corretta la sola sequenza dello script, poi due generazioni complete passate. Sorgente TEST e coppia JSON/SVG corretta rimangono byte per byte identici alla versione precedente.

**70 campioni JSON/SVG riaperti ed esportati**, zero errori/richieste esterne e nessun caricamento dei font personali. Log `.local/font-target-artifacts.log`. Build/TypeScript finale e scansione dei segreti locale passati (`font-target-final-build.log`, `font-target-final-secrets.log`); anche build pubblica e scansione segreti pubblica passate, JavaScript pubblico sempre `index-BG2r_x-8.js`. **13 browser pubblici passati** nel laboratorio (`.local/font-target-public.log`), senza pubblicazioni.

Archivio principale riletto tramite API: **HTTP 200, SQLite R638, 346 template, due composizioni, 219 font e un profilo**, invariato. Report `.local/font-target-archive-check.json`. I sette sorgenti PitchPrint prioritari ancora esclusi non sono modificati da questo collegamento: restano necessari file/glifi esatti o una scelta esplicita del titolare.

Solo sviluppo locale: nessun deploy, scrittura Shopify/tema/PitchPrint/BSS/prezzi/carrello/checkout, immagine AI o nuova migrazione. Chat pubblicata preservata.
