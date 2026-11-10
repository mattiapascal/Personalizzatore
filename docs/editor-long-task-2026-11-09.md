# Task autonomo locale e collaudo del 10 novembre 2026

Mandato: proseguire a lungo sulle funzionalità definite e raccogliere le prove manuali per domani mattina. Nessun deploy, modifica commerciale, servizio a pagamento o richiesta AI reale.

## Sequenza

1. Storico dei profili, conservazione dei documenti precedenti e associazione esplicita a prodotti/varianti reali. Restano mancanti le misure non fornite; nessun profilo viene certificato automaticamente.
2. Definizione visuale delle zone nel backend: disegno rettangolo/ellisse, selezione, spostamento, maniglie, coordinate, annullamento/ripristino e salvataggio distinto. Stessa geometria/validazione per tutti i controlli.
3. Zone proprie dei template nel documento canonico, distinte dalle zone fisiche del prodotto. Template e associazioni riutilizzano i prodotti reali e i profili completi; i vecchi documenti TEST rimangono apribili.
4. Primo collegamento dei profili al workspace e controlli contestuali, con snapshot/versione conservati. Nessuna dichiarazione di lavorabilità della finezza delle incisioni senza analisi e dati reali.
5. Percorso unico di collaudo per il titolare: casi raggruppati, dati TEST separati, risultati attesi e riepilogo delle verifiche automatiche già svolte. Le prove Illustrator/fisiche rimangono esplicitamente manuali.

Assunzioni: struttura ibrida già proposta (regole fisiche per prodotto/variante, layout nel template); geometrie riservate rettangolari/ellittiche, coordinate fisiche in mm; profili parziali salvabili ma non abilitati automaticamente. Conferma dell’anteprima per cambio formato e nessuna riduzione sotto i vincoli. Priorità a procedure comprensibili; niente ulteriori strumenti avanzati di editing, multipagina, immagini AI o rimozione sfondo a colori.

Ogni incremento ha test pertinenti e documentazione; non modificare UI/runtime durante una suite browser completa. Checklist manuale finale pensata per essere eseguita in blocco il 10 novembre, senza richiedere verifiche intermedie al titolare.

## Stato degli incrementi

Completati: storico dei profili; selezione di prodotto e variante reali con verifica server in sola lettura; definizione visuale delle zone del profilo; pagina Collaudo con 18 prove, note persistenti e resoconto. Vedi [contratto e verifiche](iteration-editor-profile-zones-shop-acceptance.md). Nessuna richiesta intermedia al titolare necessaria.

Le fasi 3 e 4 restano da implementare: zone dei template nel documento e applicazione dei profili al workspace. Non vengono considerate completate dalla sola presenza del disegno amministrativo. Il canvas mantiene i tre profili TEST e i suoi limiti; il collaudo lo dichiara esplicitamente. Nessun dato utile reale è stato inventato per simulare questo collegamento.

Verifica conclusiva: 547 unitari/72 file, 319 browser laboratorio, build/scansione segreti e 13 browser pubblici locali passati; ultima build e 7 browser mirati passati. Verificato anche l’HTTP effettivo su archivio temporaneo con letture Shopify reali; archivio personale invariato. Checklist disponibile sia in pagina interattiva sia in [copia completa](editor-collaudo-2026-11-10.md), rigenerabile con `npm run editor:collaudo`. Nessun deploy, chiamata AI reale, test Illustrator o prova di produzione fisica.
