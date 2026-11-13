# Riutilizzare i colori della pagina — 13 novembre 2026

Nei controlli di **Riempimento**, **Contorno**, **Tinta immagine**, colore del foglio e stile comune della selezione è disponibile **Altri colori della pagina**. Nero/bianco e Nessuno restano i controlli rapidi; gli altri colori già configurati si scelgono dai campioni. La palette compare soltanto nei documenti a colori e quando esistono colori aggiuntivi.

## Comportamento

La palette deriva dalla scena attiva del documento canonico. Considera oggetti visibili, stili locali dei caratteri, tinta delle immagini monocolore e colore esplicito del foglio. Esclude oggetti nascosti e riferimenti individuali/ereditati, materiali/guide non produttivi e colore dimostrativo del tampone. Non decodifica immagini o deduce colori dai pixel delle foto.

Si tratta di **attributi RGB riutilizzabili**, non di separazioni di stampa, numero di vernici o stima del prezzo. Un attributo può essere trasparente o assegnato a un contorno con spessore zero: resta un colore configurato che si può riutilizzare. Nei testi, una base interamente sovrascritta dagli stili dei caratteri non introduce colori inutilizzati; gli indici Unicode rimangono quelli del documento.

I campioni sono deduplicati e ordinati per codice RGB. La griglia mostra al massimo 24 colori per pagina; con più colori compaiono ricerca per codice e pulsanti di navigazione. L’insieme non viene troncato: il caso da 804 colori è verificato. La raccolta è memorizzata per identità del documento nei pannelli, senza un nuovo archivio o analisi dei font/pixel durante il passaggio del puntatore.

Apertura, ricerca, hover, cambio pagina e navigazione da tastiera non modificano la grafica. Frecce/Home/End spostano il fuoco; solo una scelta tramite clic, Invio o Space applica il colore. Space nei campioni non attiva Mano. Lo scorrimento porta in vista il campione soltanto durante la navigazione da tastiera, senza inseguire l’hover. Escape chiude la palette e conserva il workspace.

## Documento condiviso

La scelta usa i comandi di stile già esistenti: `updateObject`, stile dei caratteri, `styleObjects` o `setPaperColor`. Nessuna nuova operazione parallela o seconda scena. Manuale e simulazione AI producono lo stesso documento; revisioni, permessi e Undo/Redo restano quelli del motore. La normale rappresentazione dell’ispettore può esplicitare la rotazione zero già prevista dal suo comando: nessuna geometria viene ruotata o spostata.

La selezione parziale del testo si conserva anche dopo la ricerca del colore; con il solo cursore i campioni sono disabilitati. La scelta non modifica l’opacità indipendente. Tinta monocolore e colore del foglio mantengono i rispettivi significati; i documenti monocromatici non ottengono scelte RGB. Non sono state definite palette produttive per profilo, vernici o collegamenti cromatici: restano lavori distinti.

Nessuna proprietà `palette` salvata nel JSON. Riaprire il progetto ricava i campioni dagli stessi attributi già salvati; SVG/PNG/miniature continuano a rappresentare la grafica risultante. Nessuno schema, database o dato personale da migrare.

## Campione e verifiche

Aprire il [laboratorio](http://127.0.0.1:5173/editor?workspace=1), usare **Riapri progetto JSON** e il [campione TEST](../fixtures/illustrator/document-palette.TEST.json). Selezionare il rettangolo `front`, aprire Riempimento e Altri colori della pagina. Il campione conserva una piccola immagine monocolore e il font OFL TEST; [SVG produttivo](../fixtures/illustrator/document-palette.TEST.svg). Catture desktop/mobile generate e ispezionate in `.local/previews/editor-document-palette-*.png`; report `document-palette-capture.json`, nessuna richiesta esterna o scrittura amministrativa. Nessun nuovo collaudo Illustrator.

- **1.243 unitari / 178 file passati**, sette nuovi casi per ordine/deduplicazione, eredità, stili Unicode, trasparenza, foglio/tinte, assenza di analisi pixel e collezione ampia (`document-palette-all-units.log`).
- **47 browser pertinenti passati**, inclusi sette nuovi per palette desktop/mobile, hover, geometria, comandi AI, Undo/Redo, ricerca/pagine/tastiera, selezione parziale/cursore, stile comune, contorno, tinta, foglio, monocromia e trasparenza. Regressioni di font/stili, monocolore, PAN, gruppi/maschere e popup (`document-palette-browser-final.log`). I sette casi nuovi sono stati ricontrollati dopo la rifinitura della navigazione (`document-palette-browser-delivery.log`). Non è una nuova esecuzione della suite browser generale.
- **76 campioni JSON/SVG riaperti/esportati**, zero errori o richieste esterne, nessun caricamento di font personali (`document-palette-artifacts.log`). Build/tipi e generatore del campione passati (`document-palette-final-build.log`, `document-palette-capture.log`).

**13 browser pubblici passati**, build pubblica e scansioni dei segreti locale/pubblica passate (`document-palette-public-tests.log`, `document-palette-public-build.log`, `document-palette-secrets.log`, `document-palette-public-secrets.log`). JavaScript della chat invariato `index-BG2r_x-8.js`.

Archivio principale letto in sola lettura e invariato: **SQLite R638, 346 template, due composizioni, 219 font di cui 218 attivi e un profilo** (`document-palette-archive.json`). Nessuna importazione, modifica ai font o ai progetti personali. Nessun deploy o intervento sul negozio, tema, PitchPrint, BSS, prezzi, carrello o checkout. Roadmap ancora aperta.
