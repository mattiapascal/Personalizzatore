# Prossimo incremento: PNG con metadati e copie concatenate

Diagnosi in sola lettura del 12 novembre 2026, successiva ai fondi vettoriali. Questa nota descrive prove e lavoro da implementare; il PNG non è stato corretto, importato o dichiarato pronto.

## Caso reale verificato

L’originale del cartello «Corrieri: Cane onnivoro» contiene due datastream PNG consecutivi, non pixel corrotti. Dimensione complessiva 2.934.705 byte; i flussi misurano 1.081.340 e 1.853.365 byte, entrambi 1.024 × 1.024 pixel. Tutti i CRC dei 58/82 chunk sono validi. Entrambi contengono un profilo eXIf con Orientation SHORT, count 1 e valore 0. Il primo messaggio di checksum errato del prototipo diagnostico derivava dall’aver trattato la firma del secondo PNG come un ulteriore chunk; l’analisi per datastream separati corregge quella diagnosi, senza cambiare un byte dell’originale.

Decodifica browser del file intero e dei due flussi separati: stesse dimensioni, zero canali differenti e delta massimo zero. Ciò dimostra l’equivalenza dei pixel di questo caso, non l’innocuità di qualsiasi dato dopo IEND. Copia originale, hash, flussi e rapporti privati in `.local/pitchprint-migration/png-exif-analysis/`. Nessuna scrittura negli archivi.

## Vincoli per la soluzione

Il [formato PNG W3C, terza edizione](https://www.w3.org/TR/png-3/#11eXIf) definisce un solo eXIf per datastream e ricorda che i metadati possono riferirsi all’immagine prima di modifiche successive. IEND termina il datastream. Il profilo non giustifica quindi una rotazione automatica basata sulla sola presenza del chunk. I valori ordinari di Orientation sono 1–8 nel [riferimento CIPA](https://www.cipa.jp/std/documents/e/DC-X008-Translation-2019-E.pdf); zero richiede una gestione esplicita.

Un esperimento diagnostico su PNG sintetici 2 × 1, orientamenti 0–8 e chunk prima/dopo IDAT mostra che Chromium applica gli orientamenti non banali prima di IDAT, mentre non li applica dopo IDAT. Non estendere questa osservazione a tutti i browser. Il campione 2 × 1 distingue posizione e dimensioni, ma non tutte le riflessioni: per il collaudo servono immagini asimmetriche almeno 3 × 2 con colori/alpha distinti.

1. Parser PNG/Exif limitato e condiviso dove possibile, mantenendo controlli di dimensioni, CRC, struttura, decompressione e numero dei chunk. Non accettare dati finali arbitrari, metadati duplicati o APNG come effetto collaterale.
2. Definire nel documento/decoder un criterio canonico esplicito per orientamento e pixel, senza dipendere dal browser che riapre il progetto e senza ruotare due volte. Conservare tutti i byte originali nel JSON; usare un flusso derivato controllato soltanto per decodifica ed esportazione.
3. Per più PNG concatenati, ammettere automaticamente soltanto copie verificate equivalenti nei pixel, entro budget complessivi di byte/pixel e numero di flussi. Immagini differenti o coda sconosciuta devono fermarsi, senza scegliere o scartare contenuti. Questa non è una modalità multipagina.
4. Applicare prima l’orientamento canonico, poi crop/filtri; verificare SVG originale, SVG elaborato, PNG, canvas, miniature, sostituzione immagine, Undo/Redo e JSON riaperto. Aggiornare la versione delle sole cache interessate quando cambia il disegno effettivo.
5. Prima sintetici per tutti gli otto orientamenti e per dati malformati; poi confronto completo del cartello con il riferimento nativo e le soglie già fissate. Importare una nuova bozza soltanto dopo il confronto, con backup e senza sostituzioni dei record esistenti.

Non allentare globalmente IEND/Exif per far passare il solo caso osservato. Nessuna modifica a Shopify, PitchPrint, BSS, prezzi, acquisti o chat pubblicata.
