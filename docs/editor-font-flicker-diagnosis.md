# Lampeggio del controllo font — 12 novembre 2026

Segnalazione del titolare: aprendo alcuni template, fra cui «Timbro aziendale - Mod. B», l’avviso del controllo font compare e scompare ripetutamente.

## Riproduzione e causa

Nell’archivio ci sono tre copie omonime. Verificate tutte in browser nuovi, solo letture e controllo dell’hash: dopo il primo rapporto positivo l’avviso è riapparso rispettivamente tre, otto e sette volte nel periodo osservato. Sono conteggi diagnostici, non un limite massimo della durata. Nessun errore browser, scrittura o cambiamento del documento.

`FabricAdapter.protectTextRendering()` ascolta il completamento delle coperture Unicode di tutta la libreria e chiama `retryTextRendering()`. Questo azzera tutte le prove del canvas, comprese quelle già valide per file immutati, e rimette i testi in `pending`. Il caricamento progressivo dei font estranei al progetto innesca quindi altri controlli e avvisi. Prova isolata: quattro coperture estranee causano quattro transizioni in `pending`.

## Correzione locale

La correzione conserva le prove valide e i difetti noti. Non riavvia le ispezioni pendenti, che stanno già aspettando i propri file. Una notifica automatica riapre soltanto un controllo precedentemente bloccato per copertura sconosciuta, quando la copertura di quel preciso file diventa disponibile. Il pulsante esplicito «Ricontrolla visualizzazione font» mantiene la sua funzione completa.

Test aggiunti: stabilità di permessi e difetti noti su notifiche ripetute, ispezione pendente unica, recupero del solo file divenuto disponibile, prova browser con quattro notifiche reali e nessun nuovo avviso. Otto unitari passati sulla copia candidata, comprendendo le cinque regressioni preesistenti su risposte obsolete, file cambiati, errori e chiusura. Nessun aggiramento dei font mancanti, degli stili simulati o del controllo SVG/PNG/PDF.

**Correzione applicata e tre template reali ricontrollati:** zero ritorni dell’avviso dopo il controllo concluso, contro tre/otto/sette prima. Una copia mostra una sola attesa iniziale, poi rimane stabile. Progetti e archivio invariati per confronto completo/checksum; zero errori o scritture. Rapporti privati `.local/font-flicker-after-*.json`.

Tutti gli **873 unitari / 129 file**, **46 browser pertinenti**, build, schemi e scansioni dei segreti passati. I controlli includono attesa WOFF2, errore temporaneo, ricontrollo esplicito, recupero dall’ispettore, testo in scrittura, glifi mancanti, stili simulati e protezione dell’output. Aggiunte le annotazioni TypeScript dei due argomenti del callback nel nuovo test; altri due ricontrolli finali (campione SVG esatto e stabilità del controllo font) passati. Anche pacchetto Worker in dry-run, runtime locale e **13 browser pubblici locali** passati. Bundle pubblico invariato: JS `index-BG2r_x-8.js`, CSS `index-L8Ls1asZ.css`.

La suite generale precedente alla correzione ha concluso **565/566 in 28,4 minuti**: unico errore il campione SVG storico, privo del nuovo attributo `preserveAspectRatio="none"`. Aggiornato il solo attributo del campione, con verifica che tutti gli altri byte siano identici; confronto esatto conservato e ricontrollato con successo. Non viene dichiarata una nuova suite completa verde. Log `.local/justify-release-check.log`, `.local/font-flicker-final-browser.log`, `.local/font-flicker-final-confirm.log` e `.local/font-flicker-public-check.log`.

Nessun deploy o intervento sul negozio. Questa correzione non modifica font/template, documento canonico o controllo rigoroso dei file produttivi. L’ulteriore importazione autorizzata è documentata separatamente nell’[incremento di giustificazione](iteration-editor-pitchprint-justification.md).
