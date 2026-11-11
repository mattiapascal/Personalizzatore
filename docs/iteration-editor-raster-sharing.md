# Riuso dei pixel delle immagini — 11 novembre 2026

Base `baf2f3e`. I caricamenti manuali assegnano nuovi ID anche allo stesso file. Prima ogni ID preparava una nuova immagine, ripeteva l’analisi dei pixel e manteneva bitmap filtrati separati. Ora gli ID restano distinti nel documento, mentre la preparazione riusa le risorse dal contenuto esattamente identico.

## Regole

- Ogni richiesta passa prima dallo schema della sorgente. Il riuso richiede lo stesso intero data URL, MIME e dimensioni orientate; non dipende dal nome file, dalla somiglianza dell’immagine o dalle sole dimensioni. Il caricatore manuale produce data URL canonici dai byte. Rappresentazioni base64 differenti non vengono equiparate automaticamente.
- Una risorsa condivisibile viene registrata soltanto dopo verifica strutturale, decompressione PNG se pertinente, decodifica browser, controllo dimensionale e analisi dei pixel completati. Un fallimento non pubblica una risorsa parziale.
- Gli alias concorrenti vengono ricontrollati nella coda di preparazione: dopo il primo successo gli altri non decodificano né analizzano nuovamente. La coda continua dopo gli errori e i fallimenti sono ritentabili.
- Un ID già preparato o in caricamento non può essere riutilizzato per un file differente. Nemmeno la presenza dei byte nella cache rende utilizzabile un ID non ancora preparato con successo.
- I bitmap filtrati sono indicizzati per risorsa preparata e tutti i parametri dell’elaborazione. Alias con gli stessi parametri li condividono; inversione, soglia, metodo, luminosità, contrasto, alpha e modalità rimangono indipendenti. La cache derivata mantiene il limite di otto voci/32 milioni di pixel, con una sola voce grande ammessa come prima.
- Due JPEG con dati EXIF differenti restano risorse differenti: la normalizzazione non confonde gli orientamenti. I byte originali continuano a essere conservati nel documento.

La condivisione è in memoria nella singola pagina; un ricaricamento avvia una nuova cache di risorse preparate. Non è una cache persistente dei pixel decodificati.

Non cambia alcun comando o schema JSON, né gli ID canonici. Movimento, ritaglio, stile, Undo/Redo e simulazione AI passano dagli stessi comandi validati. Non diminuisce il peso di JSON/SVG che incorporano più volte il file; il miglioramento riguarda preparazione e bitmap in memoria. I pixel e la politica delle miniature restano gli stessi, quindi non si forza una rigenerazione delle cache PNG già valide.

Questo incremento elimina le duplicazioni delle risorse identiche, **non introduce un limite globale alle sorgenti originali uniche trattenute dalla sessione**. Sessioni con molti file diversi da 24 MP e storico lungo richiedono ancora una gestione e un collaudo specifici; non dichiarare risolto ogni caso di memoria o garantire prestazioni su tutti i dispositivi.

## Campione e prove native

[Sorgente](../fixtures/illustrator/raster-sharing.source.TEST.json), [JSON dopo modifica manuale e Undo AI](../fixtures/illustrator/raster-sharing.TEST.json), [SVG](../fixtures/illustrator/raster-sharing.TEST.svg): 140 × 100 mm, quattro ID dello stesso PNG in grigio 128 × 96 px. Due viste originali e due B/N, ritagli frazionari, rotazioni e riflessioni distinti. `scripts/capture-editor-raster-sharing.ts` riapre il documento dalla UI, sposta manualmente il secondo oggetto di 0,1 mm, inverte il terzo con un comando AI simulato e annulla quest’ultimo. Gli ID e le proprietà degli altri oggetti restano invariati.

Il generatore conferma **una decodifica, un’immagine preparata e un bitmap condiviso per i due oggetti con gli stessi filtri**. Parametri diversi producono un bitmap diverso. Il confronto SVG con Canvas2D indipendente ricostruisce gradiente/soglia e trasformazioni dai dati del campione: 0,2908% di pixel con differenza superiore a 24/255, errore medio 0,0581/255. Non è un’identità di pixel. Zero errori browser o scritture amministrative; schermate desktop/mobile private ispezionate.

La prova separata di **12 MP** usa quattro ID per un PNG 4000 × 3000: una sola decodifica e un solo bitmap per i parametri uguali; parametri invertiti indipendenti, pixel estremi corretti e sorgenti inalterate. Preparazione misurata nel controllo finale a circa 203 ms sul computer di sviluppo, dato indicativo per questa immagine compressa sintetica, non un benchmark dei caricamenti di fotografie reali. Il conteggio di una sola analisi dei pixel è verificato separatamente sul PNG a quattro alias concorrenti.

## Verifiche

**707 unitari / 110 file**, tipi/build e scansione segreti passati. **63/63 casi browser immagini passati nell’esecuzione finale**, con i sei nuovi percorsi e le regressioni di ritaglio, EXIF, filtri, esportazioni, sostituzioni e snapshot. Un ulteriore caso RGB PitchPrint passato separatamente: **64 casi pertinenti distinti verificati**. **13 browser pubblici locali**, build pubblica e scansione segreti passati. **30 campioni riaperti/esportati**, zero errori browser e richieste esterne.

I nuovi percorsi controllano alias PNG concorrenti, un solo ciclo di analisi, conflitti in attesa, JPEG con EXIF diversi e pixel orientati, errori del decoder/analisi/decompressione, retry, alias creati da sostituzioni UI e AI, Undo/Redo e riapertura JSON, risorsa da 12 MP. Non è stata rieseguita l’intera suite di 437 casi. Il controllo completo precedente era 427/427 sul commit `587c44e`.

I log intermedi sono conservati. Le verifiche che importavano il modulo senza il suffisso di versione di Vite creavano una seconda istanza della cache e non vedevano le sorgenti preparate dal renderer. `tests/helpers/browser-module.ts` risolve il modulo realmente caricato; nessuna modifica all’app per aggirare il problema dei test. Corretta anche un’attesa di riapertura JSON che accedeva a `source.id` sul rettangolo iniziale prima del completamento dell’importazione: ora attende la sorgente effettiva prima del confronto completo del documento. Prima regressione: 60 passati/3 falliti per il modulo duplicato; finale: 63/63. I due primi tentativi dei sei casi erano 5/6, seguiti da 6/6 con le nuove verifiche e dal controllo finale completo del sottoinsieme.

Log: `.local/raster-sharing-{all-unit,regressions-final,color,check,build-verified,secrets-verified,public-build,public-browser,public-secrets,artifacts,capture-final}.log`. Il campione resta da collaudare in Illustrator per dimensioni, ritagli, riflessioni e resa B/N. Nessun nuovo record nell’archivio personale o importazione di template, deploy o modifica a Shopify, tema, PitchPrint, BSS, prezzi, carrello/checkout o chat pubblicata.

## Prossimo incremento manuale

Il ritaglio conserva già la finestra in coordinate sorgente e la cornice fisica. Rendere possibile spostare la fotografia dentro quella finestra senza muovere/ridimensionare la cornice: gesto esplicito distinto dal PAN del foglio, limiti dell’originale, rotazioni/riflessioni, Esc, un comando validato al rilascio e Undo/Redo. È un completamento del ritaglio e della sostituzione centrale; non richiede immagini AI, multipagina o integrazioni commerciali.
