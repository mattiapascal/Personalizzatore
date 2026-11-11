# Diagnosi del font selezionato — 11 novembre 2026

Base `389b57f`. Il titolare segnala problemi con AmoretScript-Regular. L’analisi del file originale in libreria e la prova browser confermano che il font si carica: manca invece il punto mediano «·» (U+00B7), presente nel testo TEST · Città. TEST Città e TEST - Città superano il controllo nominale. Nessun file è stato riparato o sostituito e nessun progetto personale è stato modificato.

## Comportamento

La scheda Testo dell’ispettore mostra ora la causa del blocco per il box selezionato, usando lo stesso `inspectDocumentFonts` del pannello Font del progetto e degli output. Indica file, caratteri mancanti e codice Unicode; invita a correggere il box o soltanto i caratteri interessati. Non misura il testo, non cambia font, geometria, comandi o revisioni.

Un errore temporaneo del controllo WOFF2 espone il pulsante Ricontrolla caratteri del testo. Il risultato positivo aggiorna anche il segnaposto nel canvas e il pannello del progetto. La copertura è derivata dai byte e condivisa; richieste contemporanee usano la stessa promessa, risultati sconosciuti restano ritentabili e un cambio dei byte a parità di ID non eredita la prova precedente. Le risposte obsolete non aggiornano il nuovo testo selezionato. Posizione, dimensioni e colore non fanno riesaminare lo stesso contenuto.

`font-coverage-cache.ts` raccoglie il parser già esistente e offre anche una lettura sincrona delle sole coperture disponibili, senza rete o decompressione. **Non è ancora una protezione globale delle metriche**: costruzione dei box e misure native non sono state modificate in questo incremento. Copertura nominale non significa collaudo dello shaping o Illustrator.

## Verifiche

683 unitari / 106 file, tipi, build e scansione segreti passati. Due nuovi percorsi browser verificano il messaggio sul simbolo mancante, la scomparsa dopo correzione/riapertura, il retry WOFF2 condiviso da ispettore/canvas/pannello e il documento invariato. **81/81 browser di regressione passati**, inclusi i due nuovi percorsi già verificati separatamente. **25 campioni JSON riaperti e riesportati in SVG**, zero errori browser e richieste esterne. Non è stata rieseguita l’intera suite browser; Illustrator non collaudato.

Prova privata con AmoretScript reale: avviso U+00B7 visualizzato nell’ispettore e ispezionato; zero errori browser, zero scritture amministrative e hash dell’archivio invariato. Report e schermata in `.local/amoret-script-check/`, non pubblicati. Test usano risorse portabili e archivi isolati, non il font privato nel repository.

Log: `.local/font-notice-all-unit.log`, `font-notice-build.log`, `font-notice-secrets.log`, `font-notice-cache-final.log`, `font-notice-browser.log`, `font-notice-regressions.log`, `font-notice-artifacts.log`, `amoret-script-ui-check.log`. Nessun deploy o intervento su Shopify, tema, PitchPrint, BSS, prezzi, carrello, checkout o chat pubblicata.
