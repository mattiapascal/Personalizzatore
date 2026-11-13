# Caratteri problematici in rosso e ricerca dei font compatibili — 13 novembre 2026

## Evidenziazione richiesta dal titolare

Nel testo originale mostrato dall’ispettore e da **Font del progetto**, i soli caratteri segnalati hanno un’evidenziazione rossa al **24%**, con bordo leggero. Lo stesso simbolo, se scritto altrove con un file che lo contiene, resta senza evidenziazione. Gli stili simulati segnano soltanto il tratto in grassetto/corsivo; una copertura sconosciuta segnala il tratto da verificare, senza dichiarare che tutti quei caratteri siano assenti. La spiegazione del problema resta presente anche senza distinguere il colore.

L’evidenziazione riguarda una trascrizione del testo originale, **non una selezione geometrica sul canvas**: per i glifi mancanti non esiste una misura attendibile. Il canvas conserva il segnaposto e il blocco delle misure/output del testo irrisolto; non disegna un font del computer per indovinarne la posizione. Colori, testo, stili, selezione dei caratteri, documento e revisioni restano invariati. Nessun rosso diagnostico viene salvato nei JSON o negli SVG produttivi.

Gli indici contano punti di codice Unicode: emoji/non BMP non vengono spezzati. Per un accento memorizzato come base più segno combinante viene evidenziato il carattere completo, con lo stesso NFC del controllo dei font e rispettando i confini tra file/stili. Anche il comando di correzione ora usa questi intervalli: corregge entrambi i componenti senza normalizzare o riscrivere il testo originale. L’anteprima del candidato mostra il glifo composto, se verificato. Manuale e simulazione AI condividono `updateObject`, permessi, risorse immutabili e Undo/Redo.

## Trova font compatibili

Nella singola segnalazione di caratteri mancanti è disponibile **Trova font compatibili**. La ricerca parte solo dal clic e controlla i file incorporati nel documento e quelli attivi della libreria. Mostra avanzamento, numero di file compatibili/non verificabili, filtro per nome, Interrompi e Ripeti ricerca. Ogni risultato indica il file/stile esatto e se proviene dal documento o dalla libreria; non presume coperture identiche per tutte le varianti della famiglia.

La ricerca non carica tutti i font nel browser. Il backend locale legge al massimo **otto file per richiesta**, con revisione dell’archivio controllata prima/dopo il lotto. Il contratto rigoroso accetta al massimo 64 caratteri Unicode distinti e richieste di 8 KB; non tronca silenziosamente una richiesta più grande. Si inviano soltanto i caratteri da controllare, non il testo completo del progetto. Nessuna chiamata esterna, installazione, spesa o consumo di token AI.

La copertura deriva dalla cmap dei byte, con il medesimo criterio Unicode del preflight, anche per TTF/OTF/WOFF/WOFF2. La cache è limitata a 64 file e 32.768 intervalli complessivi; usa hash SHA-256/formato, non il nome, e non conserva i binari o esiti non verificabili. L’indice di ricerca contiene solo revisione, ID, formato e archiviazione: SQLite non carica gli altri font o progetti; il JSON non clona i progetti a ogni lotto. L’endpoint è disponibile anche nelle copie in sola lettura, mantenendo i vincoli locali, di origine e identità dell’archivio.

**Scegli** prepara soltanto quel file: ricontrolla revisione, disponibilità e hash prima di registrarlo, poi passa dalla verifica/anteprima del candidato esistente. Se i byte differiscono da quelli analizzati, il file non entra nel registro dei font. Durante la preparazione i controlli di scelta/Applica sono coerentemente sospesi; Annulla preparazione interrompe l’attesa e le risposte tardive non selezionano un altro font. Solo **Applica ai soli caratteri mancanti** modifica la grafica con il comando validato esistente.

## Apertura e pulsanti B/I

Il precedente aggiornamento all’apertura/focus scaricava in background tutti i font. Ora aggiorna soltanto i metadati; un documento incorporato prepara i propri file, un nuovo foglio mantiene il caricamento del suo font iniziale. Selezionando un testo si preparano le varianti delle sole famiglie usate da quel testo, così **B e I rimangono disponibili senza aprire menu** e senza stili sintetici. Cambi rapidi di selezione non interrompono un file condiviso già in caricamento.

Il menu dispone subito dell’indice completo dei nomi, senza binari. Le voci non caricate restano riconoscibili e non selezionabili finché il file non è pronto; l’indice non rende il font disponibile al motore grafico. Le righe mantengono altezza e posizione durante il caricamento, con nomi lunghi troncati e completi nel tooltip. L’apertura esplicita del menu Font tradizionale continua a caricare la libreria per mostrarne i nomi con i font reali. File già preparati non vengono riscaricati. Il ritorno sulla finestra aggiorna elenco/archiviazioni e le eventuali varianti del testo selezionato, non tutte le famiglie estranee.

## Prova locale e campioni

Aprire il [laboratorio](http://127.0.0.1:5173/editor?workspace=1), poi **Apri file JSON** e il [sorgente TEST](../fixtures/illustrator/font-repair.source.TEST.json). In Strumenti → Font del progetto, soltanto Ω deve risultare rosso nella trascrizione; Apri nell’ispettore mostra lo stesso carattere segnalato. Trova font compatibili include Arimo già incorporato: Scegli mostra Ω nel candidato esatto; il documento cambia soltanto con Applica. Annulla ripristina problema ed evidenziazione.

Riutilizzati il [JSON corretto](../fixtures/illustrator/font-repair.TEST.json) e lo [SVG](../fixtures/illustrator/font-repair.TEST.svg) 80×40 mm. Il generatore `node --import tsx scripts/capture-editor-font-repair.ts` verifica rosso, navigazione, ricerca e anteprima desktop/telefono, poi confronta il risultato con la coppia precedente. Nessun nuovo collaudo Illustrator.

## Verifiche

**1.191 unitari / 169 file passati**: 27 casi nuovi/estesi per evidenziazione, normalizzazione/correzione, ricerca client/server, lotti/limiti, cache, cancellazione, revisioni e backend JSON/SQLite. Il test HTTP reale usa una copia SQLite temporanea in sola lettura: endpoint consentito, origine/intestazioni/identità richieste, conflitti e limiti rifiutati, scritture bloccate e file identico dopo le prove. Log `.local/font-support-final-units.log`, `font-support-http.log`, `font-support-accent-units.log`.

Il primo gruppo browser ha concluso **110/112**: un’aspettativa dava per caricati anche font mai richiesti; il test ora controlla che arrivino dopo il menu. La seconda prova ha trovato una regressione reale dei pulsanti B/I, corretta preparando le sole famiglie selezionate e mantenendo intatte le attese sul corsivo, sui pesi misti e sullo storico. Nessun allentamento dei blocchi o delle regole sui font. Le prime prove dei nuovi casi hanno inoltre rilevato il vecchio caricamento globale in background; la prova della trasparenza aveva correttamente segnalato una X assente dal subset TEST, poi sostituita con una B effettivamente presente.

**115 browser pertinenti passati nella versione finale** (`.local/font-support-delivery-browser.log`). Comprendono tre nuovi casi dell’evidenziazione, otto della ricerca/preparazione, il menu con ottanta file sospesi, tutte le regressioni di font selezionate e la scheda persistente. Non è una nuova esecuzione della suite browser generale. Un secondo gruppo intermedio aveva concluso 113/114 per lo scorrimento mentre arrivavano i file: aggiunti indice dei nomi e righe stabili, poi ricontrollo mirato 31/31 e gruppo finale completo 115/115, mantenendo le soglie originali della rotella.

Catture desktop/telefono generate e ispezionate: `.local/previews/editor-font-target-*.png` per il rosso nell’ispettore e `.local/previews/editor-font-support-*.png` per la ricerca. Report `.local/editor-font-repair-capture.json`: evidenziazione, ricerca, navigazione e anteprima verificate; documento invariato prima di Applica, zero errori/scritture. Sorgente TEST e coppia JSON/SVG corretta byte per byte identici alla versione precedente. Log `.local/font-support-capture.log`.

**70 campioni JSON/SVG riaperti/esportati**, zero errori o richieste esterne e nessun caricamento dei font personali (`font-support-artifacts.log`). **13 browser pubblici passati** (`font-support-public.log`); build/tipi e scansioni dei segreti locale/pubblica passati. Log `font-support-delivery-build.log`, `font-support-public-final-build.log`, `font-support-secrets.log` e `font-support-public-secrets.log`. JavaScript pubblico sempre `index-BG2r_x-8.js`.

Prova in sola lettura della libreria reale: **218 font attivi**, analizzati in 28 lotti per il solo Ω in circa **1,44 s** su questa macchina; 122 file lo contengono, 95 non sono adatti a quel carattere e uno rimane non verificabile. Questi 95 non sono dichiarati font guasti o mancanti. Il file non verificabile è **Continuum Medium**: presenta cmap di formato 4, ma il lettore rigoroso non ne ricava una copertura; da diagnosticare separatamente, senza convertirlo in un esito positivo o modificare il file. Report e dettagli privati `.local/font-support-real-library.json`.

API del laboratorio principale HTTP 200, revisione prima/dopo invariata a **SQLite R638, 346 template, due composizioni, 219 font e un profilo**. Nessuna scrittura all’archivio personale. Il controllo iniziale di due file è in `.local/font-support-local-api.json`; il successivo controllo completo e la lettura dei formati cmap non hanno cambiato l’archivio.

I sette sorgenti PitchPrint prioritari esclusi non vengono sostituiti/importati automaticamente. Nessuna migrazione o modifica del negozio, tema, PitchPrint, BSS, prezzi, carrello/checkout; nessun deploy o immagine AI. Chat pubblicata preservata.
