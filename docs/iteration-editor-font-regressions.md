# Varianti reali, testo misto e collaudi portabili — 10 novembre 2026

## Comportamento dell’editor

B e I devono funzionare anche quando un box o una selezione contiene stili diversi. Il corsivo applicato all’intero box mantiene le porzioni già in grassetto; togliendolo ripristina le rispettive varianti normali. Una selezione mista viene prima uniformata allo stile richiesto e il clic successivo lo disattiva. Senza caratteri selezionati non viene applicata una modifica.

Anche il cambio della famiglia mantiene grassetto e corsivo di ogni porzione, oltre a corpo, sottolineatura e crenatura. I pulsanti B/I sono disabilitati quando manca una variante reale necessaria. La scelta diretta di una famiglia resta invece possibile anche con un unico stile: se non può conservare uno stile precedente, applica esattamente il file scelto e mostra un avviso. Nessun grassetto/corsivo simulato o sostituzione con altre famiglie. Il menu Font mostra la famiglia comune anche se le porzioni usano file normale/grassetto della stessa famiglia; «Misto» resta per famiglie diverse. «Altri stili» permette ancora una scelta esplicita della singola variante.

`text-font-toggle.ts` prepara un oggetto, senza modificare documento o registro. L’ispettore passa dal normale `updateObject`, con i file mancanti aggiunti atomicamente tramite `fontAssetArguments`; restano centro, selezione in editing e undo/redo. Il motore usa gli stessi comandi anche per la simulazione AI. I controlli di disponibilità, ingombro e conferma produttiva rimangono attivi.

Con libreria priva di Arial, la scelta iniziale preferisce la variante normale 400 della prima famiglia, anche se il catalogo elenca prima il corsivo. Il caricamento in primo piano resta limitato ai file necessari; gli altri sono caricati in sottofondo.

## Dati di prova indipendenti dalla postazione

Dodici font originali Google: Arimo, Tinos e Cousine, ciascuno con normale/grassetto/corsivo/grassetto corsivo. I file sono dedicati ai test, con hash, nome interno, peso, corsivo e licenze OFL verificati. Non sono installati nella libreria personale e non sono fallback dell’applicazione. [Fonti e attribuzioni](../fixtures/fonts/README.md).

Gli helper separati in `tests/helpers` costruiscono documenti TEST che dichiarano i file. Le copie di campioni storici vengono convertite esplicitamente nei test, preservando originali, dimensioni, coordinate e struttura. Questa conversione non è usata dall’applicazione sui progetti reali. Nuovo golden `stamp-embedded.TEST.json/svg`; il vecchio `stamp.TEST` resta conservato con le sue dipendenze storiche.

Il PDF di test ora incorpora davvero Arimo; quello con sole geometrie non contiene font inutilizzati. Il confronto pixel SVG usa lo stesso file incorporato anche nell’immagine di riferimento, quindi non dipende da un font del computer. Restano prove separate che rifiutano PDF con font non incorporati, sorgenti senza font disponibili e caratteri non supportati.

Il verificatore dei 19 campioni genera copie portabili solo in `.local/verified-fixtures`, poi riapre/esporta e confronta oggetti, gruppi e FontAsset. Non sovrascrive i campioni sorgente né l’archivio personale. I nuovi file richiedono comunque il collaudo umano Illustrator.

## Prove

- **616 unitari / 91 file** passati, inclusi metadati/hash dei dodici font e trasformazioni per varianti reali, intervalli Unicode, famiglie miste, varianti mancanti/ambigue e cursore senza selezione.
- **14 browser mirati** passati per B/I, cambio famiglia, selezione, menu, PDF/SVG e conservazione della cronologia.
- **19 campioni** riaperti/riesportati con risorse identiche dopo la conversione TEST; zero errori browser e richieste esterne.
- **13 regressioni della chat pubblica** passate separatamente in locale, senza modificare sorgenti pubblici o il servizio online.
- **`npm run check` completo superato: 616 unitari / 91 file, build, segreti e 363 browser.** Nessun caso escluso o saltato. Le prove pertinenti sono state rieseguite durante le correzioni delle fixture e delle famiglie a stile unico.

## Risultato esplorativo per l’importatore

`node --import tsx scripts/verify-font-css-aliases.ts` confronta file aperti sotto alias CSS con peso/stile dichiarato diverso dai metadati interni. In Chromium, tre casi controllati hanno metriche e pixel identici al medesimo file normalizzato: 6139/7800/6139 pixel di inchiostro, zero byte pixel differenti. Questa evidenza permette di studiare una futura gestione delle dichiarazioni storiche PitchPrint senza cambiare file o simulare stili.

Confrontati in sola lettura anche i 140 punti Unicode del font recuperato con i 211 file leggibili del catalogo: nessuna corrispondenza esatta di contorni e avanzamenti. Il nome originale resta non identificato; nessun font rinominato o sostituito.

La libreria personale ispezionata contiene un solo file variabile, Dancing Script Regular, con default wght=400: non è stato modificato. La prova degli alias riguarda i file statici; eventuali eccezioni future devono distinguere gli assi variabili e non cambiarne la resa. Censimento privato del catalogo storico: 211 file leggibili, 7 non disponibili e 19 differenze fra dichiarazioni e metadati.

**La politica dell’importatore non è stata rilassata in questo incremento.** Un futuro collegamento deve provare la dichiarazione del catalogo originale, l’hash del file effettivamente servito e la resa; la sola somiglianza del nome non basta.

## Disponibilità dei font per progetto

Le scelte del menu ora sono l’unione della libreria attiva, dei file del documento corrente e dei file in preparazione nel dialogo di importazione. Le altre risorse già caricate restano in cache, senza essere offerte nel nuovo progetto. Undo/redo ripristina anche questa disponibilità; annullando il dialogo vengono tolte le risorse temporanee. Un aggiornamento asincrono della libreria non ripristina il documento precedente.

Il font archiviato rimane disponibile nel progetto che lo incorpora. Aprendo un foglio privo di quel file, una libreria vuota impedisce di aggiungere testi: nessun recupero implicito del font precedente e nessun font del computer. Verificati due casi browser completi e due unitari del confine fra libreria, documento e preparazioni sovrapposte.

Campione visuale riproducibile: `node --import tsx scripts/capture-editor-font-styles.ts`, screenshot in `.local/previews/editor-font-styles.png`, JSON/SVG in `.local/verified-fixtures/font-styles.TEST.*`. Due oggetti, quattro file originali, “Impresa” in grassetto corsivo e “TEST” in corsivo, tutti i caratteri presenti, zero scritture all’archivio. Anteprima ispezionata; nessun collaudo Illustrator.

Nessun deploy, chiamata AI reale, modifica a Shopify/BSS/PitchPrint, prezzo, acquisto o archivio personale.
