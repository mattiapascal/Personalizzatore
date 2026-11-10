# Esportazione PNG della bozza — 9 novembre 2026

## Piano iniziale

Aggiungere output raster dell’intera area di lavoro a risoluzione scelta (150/300/600 dpi), con dimensioni pixel calcolate in mm e limite esplicito di memoria. Lo zoom, device pixel ratio, selezioni e guide non devono influenzare il file. Default sfondo bianco; opzione trasparente per conservare le parti vuote e l’esterno delle sagome tonde.

È un file di anteprima distinto dal JSON editabile e dallo SVG fisico. Non aumenta la risoluzione reale dei PNG importati, non produce vettori e non certifica la produzione. Dimensioni pixel esplicite nel pannello e nel nome file; DPI nominale dichiarato nel PNG con chunk pHYs, senza cambiare dimensioni o ricampionare di nuovo. Nessuna chiamata esterna o modifica della revisione grafica.

Riutilizzare il renderer Fabric canonico su canvas temporaneo, evitando di toccare vista/zoom/selezione del canvas dell’utente. Prove su immagine, testo, forme, gruppi, sagoma tonda/overflow, alpha, pixel e metadati; immagine indipendente da zoom e guide, scena e selezione conservate. Limite TEST massimo 16 milioni di pixel e lato 8192 px; rifiuto prima di allocare il canvas.

## Implementazione

Aggiunti `png-export.ts`, `PngExportPanel.tsx` e `exportDocumentPng` nell’adapter. Il renderer comune costruisce un `StaticCanvas` temporaneo con retina disattivata e fattore uniforme dpi/mm. Le dimensioni sono arrotondate al pixel più vicino (minimo 1): il formato fisico nominale resta quello del progetto, con il normale arrotondamento raster. Gli oggetti sono disegnati nell’ordine canonico; i gruppi, senza effetti propri, conservano lo stesso ordine. Clip circolare e crop al bordo del canvas applicati al risultato. In modalità bianca si compone un fondo bianco anche all’esterno della sagoma tonda.

Blob PNG con chunk `pHYs` prima di IDAT, pixel/metro e CRC ricalcolato; eventuale pHYs del browser viene sostituito. Nome file con revisione, pixel e DPI. La preparazione cattura il documento corrente senza modificarlo; il file rimane riferito alla revisione nel nome anche se si continua a lavorare durante la codifica. Limiti verificati prima di creare il canvas.

## Prove mirate

Cinque unitari su dimensioni, limiti, CRC e metadati, sostituzione pHYs e dati compressi intatti. Quattro browser superati: immagine/gruppi/overflow, pixel e DPI reali, PNG identico anche cambiando griglia e zoom, vista/selezione/stato conservati; sagoma tonda bianca/trasparente; scena vuota e sospensione dei comandi durante scrittura/disegno; devicePixelRatio 2 con dimensioni identiche. TypeScript superato. Regressione completa in esecuzione.

Il raster finale può contenere antialiasing sulle geometrie e sui bordi scalati; non è un nuovo file produttivo binario certificato. La conversione delle immagini sorgenti rimane separata. Illustrator e lavorazione richiedono ancora collaudo umano.


Campioni `preview-raster-300dpi.TEST.png` (685×260, fondo bianco) e `preview-raster-transparent-150dpi.TEST.png` (343×130), ottenuti da `raster-filters.TEST.json` con `node --import tsx scripts/capture-editor-png-export.ts`. Sono bozze raster, separate dagli originali riapribili.

Regressione completa: `npm run check` superato con **344 unitari, 129 browser laboratorio, build e controllo segreti**. Anche le 13 regressioni pubbliche locali sono passate nella stessa sessione.
