# Codici QR locali — 14 novembre 2026

In **Strumenti**, l’icona QR apre un dialogo per inserire un indirizzo web o testo libero. Selezionando il nuovo oggetto, la scheda **Codice QR** dell’ispettore modifica il contenuto e la tolleranza ai danni L/M/Q/H in tempo reale. La geometria mostra il lato in mm; il pannello indica anche il numero di moduli e la loro misura fisica. Nessun servizio esterno, generazione AI o costo per la creazione del codice.

Il codice mantiene proporzioni quadrate, nero e bianco opachi e quattro moduli di bordo bianco, anche sopra uno sfondo colorato. Le maniglie agli angoli mantengono l’ancoraggio opposto; le misure numeriche mantengono il centro. Anche Shift mantiene il quadrato per questo oggetto tecnico. Spostamento, rotazione, gruppi, livelli, appunti fra documenti e Undo/Redo usano i comandi comuni. Deformazioni, riflessioni e stili incompatibili vengono rifiutati atomicamente: nessun membro di una selezione viene saltato per far passare il comando.

## Documento ed encoder

Nuovo oggetto canonico `qr`, con contenuto, tipo, livello ECC e codifica versionata `qr-v1`. JSON e SQLite conservano i parametri; SVG conserva il disegno vettoriale, senza immagini raster. Il JSON serve per riaprire il contenuto modificabile: reimportare lo SVG produce geometrie e non ricostruisce automaticamente il payload originale.

La codifica usa byte UTF-8 e indicazione ECI 26, il livello ECC richiesto senza aumento automatico e una maschera scelta dall’encoder. Il contenuto è limitato a 1.024 byte; URL HTTP/HTTPS completi e senza credenziali, testi non vuoti, caratteri di controllo e Unicode malformato verificati. Il motore derivato usa una cache immutabile limitata a 32 voci; il costo dei vettori generati rientra nei budget per oggetto/documento/pagine esistenti. Payload e disegno non possono essere modificati separatamente.

Encoder [Nayuki, sorgente ufficiale](https://github.com/nayuki/QR-Code-generator), fissato al commit `8329a7108fc22be3e1eec0a9f9318978579e3621`; impronta SHA-256 e adattamenti ESM documentati in `src/vendor/qrcodegen.source.json`. Il test ricostruisce il sorgente originale e ne verifica l’impronta. Avviso MIT integrale nel sorgente e nel file `third-party/qrcodegen.LICENSE.txt` delle build che includono l’encoder. Il lettore indipendente [jsQR](https://github.com/cozmo/jsQR) 1.4.0 è soltanto una dipendenza di sviluppo/test.

Il salvataggio e le esportazioni chiedono al singolo ispettore di applicare le modifiche ancora in attesa prima di acquisire il documento. Un contenuto QR non valido blocca l’operazione con un messaggio: non si salva silenziosamente il codice precedente. Esc ripristina l’ultimo valore valido. Lo stesso controllo precede JSON, SVG, PNG, PDF e acquisizione del riepilogo prodotto.

## Correzione del posizionamento dei popup

Il collaudo ha riprodotto un difetto del pannello Trasforma: al primo avvio il pannello entrava temporaneamente nel flusso della barra, spostava il proprio pulsante e veniva ancorato a coordinate errate. Home, dopo uno spostamento, lo riportava invece sotto il pulsante nella posizione corretta. La regola CSS del popup è ora `position: fixed` anche prima della prima misura, come negli altri pannelli. Trascinamento, chiusura/riapertura, Home e riduzione della finestra sono ricontrollati per Livelli, Modifica e Trasforma.

## Campione e collaudi

[JSON](../fixtures/illustrator/qr.TEST.json) e [SVG](../fixtures/illustrator/qr.TEST.svg), 100×70 mm: due QR da 28 mm, un URL e un testo con accenti, greco, emoji e ritorno a capo, sopra un rettangolo azzurro; didascalia Arimo OFL incorporata. Generatore `node --import tsx scripts/capture-editor-qr.ts`; catture desktop e telefono in `.local/previews/editor-qr-*.png`, verificate visivamente.

- **1.389 unitari in 190 file**, 24 casi QR: lettore indipendente su quattro ECC e payload numerici/URL/Unicode/multiriga, validazione, impronta del sorgente, cache/budget, rifiuti atomici, ruoli, JSON e manuale/AI/Undo. La suite completa finale usa due worker; un’esecuzione contemporanea ai browser aveva raggiunto il limite applicativo di dieci secondi nell’unione dei contorni. Il limite non è stato aumentato.
- **98 browser pertinenti distinti**: 15 QR, 43 regressioni del laboratorio e 40 per immagini/guide/tracciati. Desktop e telefono, inserimento/modifica/errori/ECC, misure dal centro, ancoraggio opposto e rotazione tramite maniglie reali, gruppi, copia fra documenti, Undo/JSON e salvataggio/riapertura SQLite temporaneo. Un campo numerico vuoto e un contenuto QR errato bloccano il salvataggio/esportazione. L’ultimo carattere valido compare nello SVG realmente scaricato. Il difetto del popup Trasforma è stato riprodotto e corretto; i tre popup sono stati ricontrollati anche separatamente. Le trace parallele usano cartelle distinte dopo un conflitto di file del collaudo iniziale. Non una nuova esecuzione generale di tutti i test browser.
- jsQR legge contenuto e byte UTF-8 esatti dal Canvas, SVG, PNG a 150/300 dpi, miniatura da 512 px e tile produttivo sopra lo sfondo blu; anche rotazioni di 35°, 90° e 180°. Un PDF realmente esportato, verificato da qpdf e rasterizzato a 150 dpi con Poppler, restituisce entrambi i payload corretti. Nessuna scrittura nell’archivio reale durante questi test.
- **87 campioni JSON/SVG** riaperti/esportati, zero errori browser/richieste esterne/font della libreria reale. **13 browser della chat pubblica**, build laboratorio/storefront, TypeScript Worker, sei schemi generati e scansioni segreti passati. Licenza completa dell’encoder presente nell’artefatto della build locale.

Log `.local/qr-*.log`; catture e letture del campione in `.local/qr-capture.json`.

La lettura digitale non certifica ogni scanner, la stampa o l’incisione: lato minimo, supporto, contrasto della lavorazione e risoluzione effettiva richiedono un collaudo fisico. Nessun limite universale di produzione inventato. Illustrator resta un controllo umano non eseguito. QR multicolore/deformati, loghi sovrapposti, formati guidati vCard/Wi-Fi e recupero automatico di QR da SVG non fanno parte di questo incremento.

Archivio reale SQLite letto soltanto, ancora R638 con 346 template, due composizioni, 219 font (218 attivi) e un profilo. Nessuna migrazione, importazione reale, nuovo multipagina, generazione immagini AI, deploy o modifica a Shopify/tema/PitchPrint/BSS/prezzi/carrello/checkout/chat pubblicata. La cancellazione PDF preesistente non fa parte dell’incremento.
