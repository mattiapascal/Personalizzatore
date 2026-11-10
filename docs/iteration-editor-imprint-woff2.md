# Anteprima monocolore e analisi WOFF2 locale — 9 novembre 2026

## Colore dell’impronta

Nel pannello Modello del workspace, **Colore impronta (prova)** colora globalmente i segni positivi, mantenendo bianchi e trasparenze. È un’anteprima dimostrativa: la palette non è ancora l’elenco dei tamponi acquistabili per modello, né aggiorna prezzi BSS. Nessun selettore del colore del corpo montatura è stato aggiunto.

`inkColor` è una proprietà opzionale del documento v2; l’assenza equivale a nero. Manuale e simulazione AI usano il nuovo comando tipizzato `setInkColor`, con revisioni/Undo/Redo e salvataggio nel JSON e nelle bozze. I colori degli oggetti restano nero/bianco: l’anteprima non li riscrive e non introduce timbri multicolore.

Il canvas e le anteprime applicano una trasformazione di colore di sola visualizzazione. La bozza PNG applica lo stesso colore ai pixel monocromatici, senza cambiare alpha, dimensioni o metadati DPI. Lo **SVG di lavorazione rimane monocromatico**; il colore scelto è conservato nel documento/configurazione. Gli SVG non sono ancora certificati per produzione o Illustrator.

Riepilogo e carrello di prova mostrano il colore congelato della propria configurazione. I comandi/API rifiutano una nuova configurazione in cui il documento dichiara un colore diverso dalle opzioni. Modificare la bozza in rosso non cambia una configurazione già salvata in blu. Compatibilità dei tamponi, prezzi reali, casi manuale/a secco e datari bicolore richiedono ancora i profili effettivi; nel contesto catalogo un timbro a secco rifiuta un colore inchiostrato.

## Font WOFF2

L’analisi ora legge anche le tabelle non trasformate di font WOFF2 singoli, incluse `cmap`, nomi, peso e corsivo. Il renderer continua a usare il file originale con il decoder del browser. **Non viene convertito o ricostruito il font** e non sono state installate nuove dipendenze.

`scripts/woff2-tables.ts` interpreta la directory e usa Brotli di Node per il blocco dati, rispettando le lunghezze trasformate delle tabelle da saltare. Limite ingresso 1 MB, espansione 8 MB e tabelle di analisi limitate; cache limitata. Collezioni e strutture/formati non analizzabili rimangono sconosciuti, senza una falsa dichiarazione di copertura. L’analisi non è un validatore completo di ogni tabella/glyph outline o dello shaping.

Nel browser, quando serve WOFF2, il controllo invia **solo i byte del font** all’endpoint locale `/__editor-local/admin/font-coverage`, protetto come le altre API dev. Non vengono inviati testo cliente o geometrie, né viene contattato un servizio esterno. L’API di conferma configura lo stesso preflight con la lettura Node del file: i caratteri mancanti sono respinti anche con richieste dirette. Se l’analisi non è disponibile, l’interfaccia mantiene la segnalazione di copertura non verificabile.

Il backend rileva adesso nome/stile/peso dei WOFF2 supportati. Restano assi dei font variabili, copertura dei font di sistema e filiera produttiva da completare.

## Prove e origine della fixture

- Verifica dei pixel reali del canvas e delle anteprime: segni blu, bianchi conservati; PNG con bianco/alpha conservati, SVG monocromatico, documenti/oggetti invariati salvo la proprietà globale.
- Configurazioni del carrello indipendenti, Undo e recupero dopo reload conservano il colore.
- WOFF2 originale ABeeZee caricato dal decoder nativo del browser; carattere Ω assente nel subset segnalato/bloccante, testo Città presente e confermabile. Registrato che la richiesta locale contiene soltanto il file font.
- Parser con dati trasformati, directory/codifiche errate, collezioni e stream non decodificabili; conferma diretta rifiutata senza modifiche al carrello per caratteri mancanti.
- La prima fixture WOFF2 costruita appositamente non era caricabile dal decoder nativo; è stata rimossa e sostituita con il file originale. Non è dichiarata un’evidenza di compatibilità del renderer.

`fixtures/fonts/ABeeZee-subset.TEST.woff2` (4.372 byte) contiene il campione fisso **ABeeZee Aa Città 0123**, senza dati cliente. Origini e licenza originale incluse in `fixtures/fonts/README.md` e `ABeeZee-OFL.txt`. Scaricato soltanto per test offline, senza installarlo nella libreria personale. La lettura è basata sulla [specifica WOFF2 W3C](https://www.w3.org/TR/WOFF2/).

Checkpoint e limiti delle evidenze in [editor-local-status.md](editor-local-status.md). Screenshot privati `.local/previews/editor-imprint-{blue,cart-blue,cart-mobile}.png`.

Nessun deploy, chiamata AI a pagamento, modifica commerciale o collaudo Illustrator.
