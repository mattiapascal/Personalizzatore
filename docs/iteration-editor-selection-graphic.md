# Dalla selezione alla bozza grafica locale

14 novembre 2026, dopo `87a1584`. Progresso sul percorso cliente, senza nuovi strumenti avanzati o modifiche alla chat pubblicata. Il nuovo ingresso riutilizza prodotto reale, profilo/versione, template associati e assistente grafico già esistenti.

## Percorso disponibile

Nel [laboratorio locale](http://127.0.0.1:5173/), dopo la raccolta dei dati, i candidati del catalogo reale hanno **Personalizza nel nuovo editor**. Il contenuto viene trasferito tramite stato React: nessun testo cliente in URL, localStorage, sessionStorage, log server o chiamate amministrative. Il precedente percorso **Prova nel canvas** rimane per i cataloghi TEST e per una bozza TEST già aperta durante l’aggiornamento del catalogo; non è un ripiego del nuovo percorso reale.

La scelta apre il prodotto con lettura corrente Shopify e archivio locale. Si usano soltanto profili compatibili con lavorazione e varianti del candidato. Per i timbri la primaria della montatura rimane quella impostata dal laboratorio; se non è consentita dal candidato non si sceglie un’altra variante per tentativi. La forma e l’area utile vengono dal profilo, senza trasferire misure nominali, margini storici o prezzi dalla selezione. Un profilo mancante, una provenienza incoerente, un prodotto inattivo o dati cambiati durante l’apertura impediscono la creazione della bozza.

Il cliente può partire dal foglio vuoto o da un template associato. Il testo raccolto viene offerto all’assistente come contenuto locale da rivedere; non è inserito automaticamente nella composizione. La richiesta iniziale è diversa per foglio vuoto e template esistente. **Proponi una bozza** invia la richiesta; anteprima e **Applica la proposta AI** restano due passi distinti. Nei template valgono label e protezioni, inclusi i campi non selezionabili ma compilabili. L’originale e la sua associazione non cambiano.

Nella vista compatta il cliente ha canvas, chat grafica e controlli essenziali; gli strumenti e l’ispettore completi sono disponibili espandendo l’editor. La vista compatta adatta il foglio allo spazio, con scorrimento della chat separato. L’apertura completa mantiene nodo Canvas, documento, font, cronologia e allegati. Un input incompleto dell’ispettore non scompare tornando alla vista compatta: la successiva azione che lo richiede riapre il campo nel completo, mantenendo la digitazione.

**Torna alla conversazione** conserva bozza e stato del pannello, interrompendo l’eventuale richiesta grafica in corso. **Riprendi la bozza** torna alla stessa istanza. Finché esiste un documento aperto, le schede dei candidati non ne aprono uno sostitutivo: il cambio prodotto si effettua dall’editor con la funzione già validata; per iniziare un altro progetto si chiude prima quello corrente. La normale chiusura senza salvataggio resta esplicita. Questa fase non ritorna ancora sulla pagina Shopify e non modifica acquisti.

## Privacy, quota e comandi

`selectionGraphicHandoff` valida prodotto attivo, contenuto e identificativo pseudonimo della sessione, copiando soltanto ID/varianti, lavorazione, testo e soggetto grafico locale. Non trasferisce il transcript o un documento derivato dalla chat. Il soggetto dell’immagine è una descrizione per il cliente; il file va allegato al pannello grafico. Le immagini non vengono generate o inviate al modello come pixel.

Il testo della selezione è protetto come blocco opaco intero, anche se contiene a capo, virgolette annidate, email o istruzioni apparenti. Al modello passano segnaposto e quantità di caratteri/righe. I segnaposto letterali nel testo sorgente sono distinti dai riferimenti della tabella di ripristino: non possono richiamare un altro testo per collisione. La correzione è nel solo adattatore compositivo; il filtro commerciale pubblico non cambia.

Il pannello si apre automaticamente soltanto dopo l’inizializzazione del motore grafico. Il codice non effettua chiamate AI automatiche. Il passaggio mantiene lo stesso `sessionId` economico della selezione: stessa quota e contatore server, senza creare una seconda disponibilità di spesa. L’identificativo non entra nel JSON del progetto o nel contesto inviato al modello. Nuova conversazione grafica e cambio di vista non azzerano il budget. Le azioni restano tradotte nei comandi canonici e confermate atomicamente, con un solo Undo.

## Evidenze

- **1.523 test / 212 file**; controlli di handoff minimizzato, privacy del blocco opaco, limite 480 caratteri, identificativo di sessione e segnaposto letterali.
- **80 browser pertinenti distinti tra esecuzioni/ricontrolli**: assistente precedente, prodotto/template, dieci nuovi casi conversazionali e venti percorsi preesistenti del laboratorio. I primi problemi di apertura prima dell’inizializzazione e i tentativi intermedi sono conservati nei log privati; non è una nuova esecuzione dell’intera suite browser.
- **13 browser pubblici**; build pubblica invariata `index-BG2r_x-8.js`, TypeScript/Worker e controlli dei segreti. Nessun deploy.
- **107 campioni JSON/SVG** riaperti ed esportati: zero errori e richieste esterne, nessuna lettura dei file font personali. Nuovo [JSON](../fixtures/illustrator/selection-graphic.TEST.json) e [SVG](../fixtures/illustrator/selection-graphic.TEST.svg), con font pubblico TEST incorporato, testo sintetico e profilo TEST. Il caso ha area utile 100 × 60 mm e candidato nominale 58 × 22 mm: il documento usa i dati tecnici confermati del profilo, non il nominale.
- Archivio principale **R639** ricontrollato in sola lettura: grafica, miniature, font, profili e risorse invariati. Nessuna scrittura a Shopify, BSS, PitchPrint, prezzi o carrello.

Generatore `scripts/capture-editor-selection-graphic.ts`; `--screenshots-only` aggiorna le schermate senza rigenerare identità e file del campione già verificato. Log `.local/selection-graphic-*`, immagini `.local/previews/selection-graphic-*`.

## Limiti e prossimo passo

I test AI usano trasporti simulati; la comprensione del modello reale e Illustrator richiedono collaudi distinti. La selezione conversazionale commerciale resta dedicata ai timbri: questo incremento non introduce una selezione AI di targhe o nuovi prodotti. Il server pubblico non contiene il nuovo editor.

Nell’archivio reale esiste ancora un solo profilo tecnico: il completamento di aree utili, primaria delle montature e regole è necessario per aprire gli altri prodotti. I collegamenti commerciali recuperati non vengono convertiti automaticamente in certificazioni tecniche. Materiali/fissaggi delle targhe continuano nel percorso prodotto già disponibile; BSS, prezzi, account clienti, carrello e backend remoto restano fasi separate. Proseguire con compilazione e collaudo dei profili reali e con il percorso cliente, senza aggiungere strumenti avanzati.
