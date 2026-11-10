# Operazioni massive locali — 10 novembre 2026

Richieste del titolare: importare i template senza doverli associare subito, associare più template/prodotti in un secondo momento, caricare più font con una selezione e organizzare graficamente serif/sans-serif/calligrafici. Chiarimento: categorie grafiche e famiglie tipografiche sono concetti distinti; le varianti dello stesso carattere vanno comunque riunite sotto un solo nome. Ulteriore richiesta: recuperare anche le associazioni originali PitchPrint.

## Importazione massiva PitchPrint

Ingresso [importatore locale](http://127.0.0.1:5173/editor/import-pitchprint?workspace=1&mode=admin), sezione **Importazione massiva dei template**. Le opzioni comuni di conversione sono in alto; nessuna conversione colore o esclusione di materiale avviene senza una scelta esplicita.

1. Filtrare per origine, categoria PitchPrint e ricerca. Quando disponibili, si parte dalle versioni acquisite dall’account; i sette snapshot storici sono separati per evitare di elaborare copie vecchie come nuovi template. Le copie a più pagine sono escluse.
2. Selezionare uno o tutti i sorgenti filtrati e premere **Analizza … sorgenti selezionati**. Ogni sorgente conserva il proprio esito; appaiono anteprima, differenze e blocchi. L’analisi non scrive template nell’archivio.
3. **Importa … bozze convertibili** salva soltanto i candidati riusciti, con tag PitchPrint, Da verificare e categoria originale. Nessun prodotto associato e nessuna validazione produttiva automatica. I progetti sono subito apribili dall’archivio.
4. **Interrompi dopo il template corrente** conserva i salvataggi già conclusi. L’analisi può essere rifatta, anche dopo aver installato un font mancante; la ripresa salta gli ID già importati. Il resoconto JSON contiene stati, errori e avvisi, senza duplicare file grafici o credenziali.

Provenienza persistente `pitchprintSource`: ID originale, SHA-256 del sorgente, versione del convertitore e avvisi. Importazione ripetuta dello stesso ID/hash: nessun duplicato, sovrascrittura o nuova revisione. Sorgente cambiato: richiede una revisione esplicita dell’esistente. Riconoscimento valido anche dopo reload e per template archiviati. Duplicare volontariamente un record crea una copia indipendente senza la chiave di deduplicazione. Un cambiamento del file tra elenco e analisi è rilevato tramite hash.

Gli stili testuali vuoti non causano un falso blocco. Tracking/crenatura arrivano ora da −20 a 100 pt, con lo stesso passo 0,1 e gli stessi comandi/controlli di scala; il vecchio minimo −2 pt escludeva testi grandi legittimi. I formati dei font vengono riconosciuti dalla firma dei byte anche quando un vecchio file ha un’estensione inesatta; famiglia/peso/stile restano verificati, senza fallback. Il documento risultante è sempre in millimetri: centimetri × 10, pollici × 25,4, con valori numerici anche serializzati come stringhe. I sorgenti originali restano immutati. Restano i limiti del [convertitore nativo](iteration-editor-pitchprint-import.md): pagina singola, palette TEST, font esatti, strutture supportate. Non significa che tutti i 473 sorgenti siano convertibili. Font mancanti, pesi errati e strutture non rappresentabili bloccano il singolo sorgente, senza salvataggi parziali o fallback.

## Associazioni massive successive

In [Template](http://127.0.0.1:5173/editor/admin?section=template), usare le spunte oppure **Seleziona tutti i template filtrati**. Selezione distinta dall’apertura del dettaglio; cambiare filtro azzera la selezione. Elenco paginato a 50 record, selezione globale su tutti i risultati filtrati.

**Scegli prodotti da associare** riusa il vero navigatore commerciale, con collezione/tag/stato/ricerca e pagina da 24 prodotti. Si può scegliere un prodotto o tutti i prodotti filtrati, anche sulle altre pagine: massimo 200 per operazione, da restringere esplicitamente se superato. Per ciascuno: tutte le varianti oppure varianti specifiche, lette per ID dal server.

Modalità Aggiungi, Sostituisci tutte le associazioni commerciali, Rimuovi i prodotti scelti. La sostituzione con elenco vuoto elimina tutte le sole associazioni commerciali dei template selezionati. **Controlla associazioni** mostra template/versioni, prodotti e azione; solo la conferma applica il comando. Documenti grafici, associazioni tecniche TEST e progetti cliente restano indipendenti.

`shopProducts` conserva prodotto/varianti effettivi, titoli ricontrollati, origine e data. Il server verifica revisioni/versioni di tutti i record e l’appartenenza delle varianti, una lettura per prodotto con massimo tre letture concorrenti. Errore o conflitto: nessuna modifica parziale. Nuovi comandi `bulkTemplateAssociations` e `bulkTemplateAssociationMap`. Il secondo permette collegamenti differenti per ciascun template, necessari al recupero originale.

Queste sono **associazioni commerciali locali**. Non certificano misure utili, regole produttive, compatibilità geometrica o l’apertura dell’intero catalogo nel canvas; il collegamento dei profili reali resta da sviluppare. Nessuna scrittura Shopify o attivazione sul sito.

## Recupero delle associazioni PitchPrint originali

Fonte individuata nel tema locale e riscontrata nell’[SDK Shopify ufficiale PitchPrint](https://github.com/pitchprint/pitchprint/blob/master/client/shopify.js): metafield prodotto `global.pprint`. La configurazione usa `designId` diretto oppure `*ID_CATEGORIA`; l’espansione della categoria usa gli ID del censimento Runtime, senza corrispondenze per somiglianza dei nomi.

Lettura reale del 10 novembre: **1.597 prodotti, 141 configurazioni, 85 riferimenti diretti e 53 a categorie**. Risultano **425 coppie prodotto–design per 308 design distinti**; tre configurazioni senza riferimento effettivo (vuote o solo caricamento) sono segnalate. Il campo stringa designId è presente in 140 configurazioni, due con valore vuoto. Non sono state trovate chiavi per regole di variante specifiche nei dati acquisiti: il recupero è a livello prodotto, senza dedurre regole assenti.

Nell’importatore aprire **Recupera associazioni originali PitchPrint**. La copia privata è già disponibile; **Rileggi associazioni originali da Shopify** la aggiorna in sola lettura. **Aggiorna piano dall’archivio locale** trova i nuovi template importati per ID. Selezionare i candidati, scegliere aggiunta/sostituzione e controllare il piano; la conferma salva solo nel nuovo archivio. Un progetto cliente o una voce senza provenienza originale non viene agganciato tramite il titolo. I design ancora bloccati o non importati rimangono fuori dal piano.

Query Admin **2026-10** con il solo scope read_products e [lettura di un metafield per namespace/key](https://shopify.dev/docs/apps/build/metafields/manage-metafields); operazione validata. Nessuna definizione o valore di metafield scritto. Origine fissa, limiti, timeout, paginazione controllata, credenziali solo server; snapshot sostituito solo dopo una lettura completa. Configurazioni sconosciute o riferimenti assenti nel censimento sono segnalati, senza inventare associazioni. La query non legge prezzi, clienti, ordini o carrelli. Copie in `.local/pitchprint-migration/`, non pubblicate.

## Font multipli, varianti e categorie grafiche

In [Font](http://127.0.0.1:5173/editor/admin?section=fonts), **File font** accetta più TTF/OTF/WOFF/WOFF2 nella stessa selezione. Un solo **Carica font nell’archivio** elabora i file in sequenza con esito individuale. Famiglia tipografica, peso e corsivo vengono letti dalle tabelle interne, controllati nel browser e sul server; non si indovinano dal nome del file. Duplicati byte per byte saltati, compresi gli archiviati. Un file errato non impedisce gli altri; interruzione tra file, revisione attesa prima di ogni salvataggio. Il comando `uploadFonts` valida atomicamente ogni gruppo ricevuto; il pannello usa un gruppo per file per rendere gli errori indipendenti.

Il nome descrittivo facoltativo e i controlli di peso/stile sono disponibili per un file singolo; un peso/stile dichiarato che contraddice il file viene rifiutato. Per più file restano automatici. Le varianti con lo stesso nome di famiglia, anche con differenze di maiuscole/spazi/separatori, compaiono sotto un nome nel menu frontend; ogni variante conserva il proprio ID e file. I font di sistema e i file incorporati restano distinguibili.

La vista iniziale **Matrice categorie** mostra le famiglie (con il loro carattere reale) sulle righe e le categorie sulle colonne; **Elenco con anteprime** mantiene il dettaglio e le azioni precedenti. Le spunte **Serif, Sans-serif, Calligrafici, Decorativi, Monospaziati, Simboli** della matrice agiscono su tutti i file della famiglia; il dettaglio mantiene la classificazione del singolo file. Si possono selezionare più font e aggiungere, sostituire o rimuovere categorie; una categoria personalizzata entra nell’elenco riutilizzabile. Filtro per categoria o Da classificare. **Rileva categorie dai file** usa sFamilyClass/PANOSE e post.isFixedPitch quando informativi, conserva le classificazioni manuali e lascia incerti i casi non deducibili. Nuove installazioni Google usano anche la categoria dichiarata nel catalogo ufficiale, normalizzando maiuscole/spazi/trattini. Su richiesta del titolare classificati tutti i 123 file caricati, conservando le spunte presenti: [classificazione e usabilità](iteration-editor-font-usability.md). I font già presenti mostrano i suggerimenti senza una riscrittura automatica dei dati personali.

Il dettaglio **Raggruppamento delle varianti sotto un solo nome** corregge separatamente la famiglia tipografica o la rilegge dai file. Non modifica byte, peso/corsivo effettivi o progetti già salvati. Raggruppamenti che creerebbero due file differenti per lo stesso peso/stile sono rifiutati per evitare ambiguità. Nessun fallback a un altro carattere o peso.

## Capacità, dati e verifiche

Per il censimento reale: massimo **2.000 record locali**, archivio fino a **256 MB**; libreria font sempre fino a 500 file e **32 MB complessivi**, 1 MB per file. Progetti canonici conservano risorse incorporate e limiti precedenti. Persistenza ancora JSON locale monolitico, non un database/storage di produzione: il limite evita di far fallire il catalogo reale per il vecchio massimo di 200 record, ma non certifica archivi arbitrariamente grandi. Interfacce paginate, richieste e scritture limitate/serializzate.

Test motore e browser usano archivi temporanei. Letture reali del catalogo e delle associazioni non modificano store o template PitchPrint. Libreria personale e record preesistenti preservati. Nessun deploy, dipendenza nuova, test Illustrator o AI a pagamento. Numeri finali ed evidenze nello [stato locale](editor-local-status.md).
