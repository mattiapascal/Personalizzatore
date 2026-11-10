# Importazione vettoriale, testi e libreria font — 9 novembre 2026

Solo sviluppo locale. Editor: <http://127.0.0.1:5173/editor?workspace=1>; gestione: <http://127.0.0.1:5173/editor/admin>. Nessuna pubblicazione o modifica alla chat pubblicata, al negozio o al percorso di acquisto.

## Importazione SVG e PDF

Nel pannello Strumenti scegliere **Importa testi SVG/PDF come** prima di caricare il file:

- **Contorni vettoriali**, predefinito: conserva i caratteri come geometrie, senza possibilità di cambiarne il contenuto. Gli SVG che contengono testo reale vengono convertiti localmente tramite Chromium/Poppler, con il font disponibile. Nessuna rasterizzazione intenzionale o chiamata AI; PDF con raster rifiutati dal convertitore.
- **Testo editabile**: gli SVG con testo semplice diventano box a larghezza e altezza automatiche, nello stesso documento e con gli stessi comandi di quelli creati a mano. Font, corpo, stile, spaziatura, dilatazione e posizioni vengono trasferiti nei casi rappresentabili. Stili parziali/posizioni dei tspan, textPath SVG, riflessioni, skew, ritagli e contorni del testo non sono supportati in questa modalità: il file viene rifiutato, senza modificare il progetto.

Per i PDF la modalità editabile è una **ricostruzione conservativa di righe orizzontali Unicode**, non il recupero del documento originale. Poppler estrae contenuto, font e geometria; le righe sostituiscono i glifi di Cairo nel loro ordine, con baseline e larghezza ricostruite. Alcune spaziature e metriche possono differire: controllare l’anteprima. Testi ruotati, verticali, ambigui, non decodificabili e con ritagli effettivi sono esclusi; i ritagli rettangolari ridondanti dei singoli glifi possono essere ignorati solo dopo confronto geometrico. Non viene effettuato OCR. Le lettere già disegnate come tracciati rimangono vettori.

Il font deve essere disponibile: nessuna sostituzione silenziosa. È possibile caricare il font nel backend; alcune denominazioni PostScript comuni vengono riconosciute esplicitamente come famiglie di sistema. I font incorporati nei PDF non sono estratti o installati automaticamente. I limiti tipografici 7–48 pt appartengono al profilo TEST e valgono anche dopo l’adattamento: l’importazione editabile si ferma se li viola.

Gli elementi vengono inseriti con un solo `insertObjects` validato e un solo undo, raggruppati se sono più di uno. Separare il gruppo per modificare i singoli testi. Scegliendo un formato di prova più grande si riduce l’eventuale riduzione automatica all’area disponibile.

SVG: massimo 256 KB, 1000 nodi XML/32 livelli, 500 oggetti sorgente, 4096 comandi per vettore e 8192 complessivi. Supportati forme, curve, trasformazioni rappresentabili, riferimenti locali, classi CSS semplici, riempimenti con fori e ritagli rettangolari. Stili attivi, font remoti, script, URL esterni, gradienti, filtri e maschere non entrano nel renderer. La conversione colori in nero/bianco è una scelta visibile, attiva inizialmente per i timbri TEST. I glifi vuoti sono ignorati; oltre 30 elementi, i contorni di glifi compatibili senza sovrapposizione possono essere compattati senza perdere fori o cambiare ordine di pittura.

PDF: solo una pagina, massimo 2 MB, non protetto, senza raster; `pdfinfo`, `pdffonts`, `pdfimages`, `pdftocairo` e `pdftohtml` di Poppler disponibili localmente. Input temporanei eliminati a fine elaborazione. Le route `/__editor-local/pdf` e `/__editor-local/svg-outlines` esistono solo in sviluppo, con controlli loopback/origine/header, limiti e una conversione contemporanea. La conversione SVG usa Chromium di Playwright già presente nelle dipendenze di sviluppo, blocca tutte le richieste di rete della pagina e non invia il file a servizi esterni.

## Backend locale e font

Gestione di impostazioni iniziali (griglia/agganci), template e composizioni con import/export JSON, metadati, ricerca, anteprima, copia, versioni e archiviazione reversibile. Archivio privato `.local/editor-admin/state.json`, non servito dal dev server. Revisioni ottimistiche e scritture serializzate/atomiche. Nessuna associazione commerciale dei template ancora definita.

I font caricati e attivi ora compaiono nel menu del frontend, con il nome rappresentato nel font stesso. Aggiornamento all’apertura, al ritorno alla finestra e all’apertura del menu. Il caricamento non modifica il documento; applicare il font allega la risorsa e cambia il testo nello stesso comando validato, anche con undo/redo. Gli ID font sono distinti dai nomi CSS. Il solo cursore continua a non applicare cambi di font.

Il JSON incorpora i file dei font usati e si riapre anche senza l’archivio disponibile. L’SVG incorpora `@font-face` e metadati, con denominazione originale come fallback per i programmi esterni. Il caricamento di font tramite CSS incorporato nello SVG importato resta escluso: usare il JSON per la riapertura del progetto. Non è certificata l’incorporazione/modificabilità dei font in Illustrator.

Limiti: 50 font in archivio, 1 MB ciascuno; massimo 16 font/4 MB nel progetto. Le licenze e gli URL sorgente, se presenti, sono conservati nei dati. Il catalogo Google Fonts è disponibile nella sezione Font: aprire «Sfoglia Google Fonts», cercare una famiglia e usare «Aggiungi alla libreria». Anteprime caricate solo quando visibili, ricerca e paginazione; un font già installato non viene duplicato e uno archiviato viene riattivato. L’installazione salva lo stile normale predefinito e la licenza recuperata dal repository ufficiale Google Fonts. Se licenza o file non sono recuperabili entro i limiti, il font non viene installato. Le altre varianti/pesi vanno ancora gestiti esplicitamente.

Il catalogo e i file sono scaricati su richiesta dal backend locale; il frontend dell’editor usa poi la copia in archivio. Per le anteprime viene inviato soltanto il nome della famiglia con un campione fisso, mai testo del progetto. [CSS API ufficiale](https://developers.google.com/fonts/docs/css2); [repository font/licenze](https://github.com/google/fonts). Il catalogo usa l’endpoint di metadati del sito Google Fonts, non versionato: schema verificato e cache 24 ore; gestire eventuali cambi prima della fase online. Download con origini fissate, niente URL arbitrari, limiti, timeout e redirect rifiutati.

## Evidenze

- File reali forniti dal titolare `Asset-1.svg`, `Asset-1.pdf` e `Asset-2.pdf` importati come vettori; `Asset-2.pdf` importato anche con tre righe editabili e logo vettoriale. Anteprime originali/importate ispezionate; nessun collaudo Illustrator. I file reali e gli artefatti con dati del cliente restano soltanto in `.local`, non nelle fixture versionate.
- Catalogo Google Fonts e installazione reale ABeeZee/licenza provati in archivio temporaneo poi eliminato; anteprima reale verificata nel browser senza installare nulla nella libreria personale. Test automatici con provider sostituito e dati TEST, senza dipendere dalla rete.
- Font personale presente nell’archivio reale visibile e applicabile nel frontend, senza errori del browser e senza scritture all’archivio durante la prova.
- Regressioni sintetiche: CSS/monocromia, riferimenti e clip, molti glifi/fori, testo Unicode, posizioni ambigue, font mancanti, importazione editabile/contorni, undo, risorsa font atomica e riapertura del JSON in un contesto browser nuovo con backend indisponibile.
- Campioni sintetici `svg-import.TEST` e `pdf-import.TEST` in `fixtures/illustrator`; gli originali TEST sono conservati separatamente dai JSON e SVG esportati.

Verifiche: `editor-local-status.md` riporta i checkpoint e i log, distinguendo suite completa e controlli finali mirati. Nessun collaudo Illustrator.
