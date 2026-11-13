# Tonalità delle immagini RGB — 13 novembre 2026

La scheda **Immagine** offre **Tonalità (°)** da −180 a +180, con passo di un grado e possibilità di inserire valori frazionari. Zero mantiene la tonalità originale. Il controllo ruota i colori, mentre i grigi e l’alpha rimangono invariati; non è la tinta monocolore che sostituisce il nero con un colore fisso. Si combina con luminosità, contrasto e saturazione già disponibili. **Ripristina colori originali** rimuove tutte le regolazioni.

Il parametro opzionale `hueDeg` è accettato solo nella modalità raster `color`; se assente equivale a zero. Le vecchie modalità e i vecchi progetti non cambiano resa. Il riferimento è il filtro `HueRotation`/`ColorMatrix` della dipendenza Fabric **7.4.0** installata: rotazione RGB attorno all’asse dei grigi e quantizzazione/clipping a 8 bit. Il calcolo è numerico, condiviso dal renderer e dal controllo locale; non dipende da filtri GPU. La matrice deriva dal sorgente Fabric e mantiene l’attribuzione in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).

Ordine dei filtri: tonalità, clipping/quantizzazione RGB, saturazione, contrasto e luminosità. Ogni aggiornamento riparte dai pixel originali, senza sommare nuove degradazioni alla modifica precedente. La cache comprende anche l’angolo. Nessuna modifica a file sorgente, crop, ID, misure, posizione, rotazioni o riflessioni. Stesso `updateObject` revisionato per UI e simulazione AI, con Undo/Redo e riapertura JSON. SVG, PNG e miniature usano lo stesso risultato; i controlli B/N continuano a ispezionare i pixel elaborati, senza considerare una rotazione della tonalità una conversione binaria.

## Campione e prove

- **1.296 unitari / 184 file passati** (`.local/raster-hue-all-units.log`), compresi sei nuovi casi. Confronto diretto con il filtro 2D Fabric su **15 angoli e 257 campioni RGBA per angolo**, byte coincidenti. Verificati primari a ±120°, grigi, valori neutri/estremi/frazionari, alpha, combinazione dei filtri, schema, stesso comando manuale/AI, JSON, Undo/Redo e controllo B/N.
- **Dieci browser nuovi/pertinenti passati** (`.local/raster-hue-browser.log`): quattro sulla tonalità e sei regressioni del precedente incremento RGB. Desktop/telefono, valori invalidi e passi numerici, reset, comandi equivalenti, cache separata, output PNG/miniatura ripristinati da Undo e riapertura JSON. Lo SVG incorpora gli stessi PNG derivati dal motore, senza un filtro SVG differente dal canvas.
- **24 regressioni aggiuntive passate**, per **34 browser pertinenti distinti**: 19 su foto/cache/monocolore/EXIF/import RGB/controlli timbro (`.local/raster-hue-regression.log`) e cinque sul controllo B/N nel crop (`raster-hue-crop-regression.log`). Non è una nuova esecuzione della suite browser generale.
- [JSON](../fixtures/illustrator/raster-hue.TEST.json) e [SVG](../fixtures/illustrator/raster-hue.TEST.svg), **120 × 65 mm**, tre oggetti con Arimo OFL e immagini generate TEST. A sinistra l’originale, a destra tonalità 75° con crop, rotazione/riflessione e trasparenza. Generatore `scripts/capture-editor-raster-hue.ts`, rapporto `.local/raster-hue-capture.json`: nessun errore, richiesta esterna o scrittura amministrativa; sorgente/crop/trasformazioni invariati. Schermate desktop/mobile ispezionate visivamente.

- **81 campioni JSON/SVG riaperti ed esportati**, senza errori, richieste esterne o font personali (`.local/raster-hue-artifacts.log`).
- Build locale/pubblica, schemi e scansioni dei segreti passati; **13 browser pubblici passati** (`.local/raster-hue-public-tests.log`). JavaScript della chat invariato: `index-BG2r_x-8.js`.

Archivio principale letto senza scritture: **SQLite R638, 346 template, due composizioni, 219 font e un profilo** (`.local/raster-hue-archive.json`). Nessuna migrazione, deploy o intervento sul negozio, tema, PitchPrint, BSS, prezzi, carrello o checkout.

Illustrator non collaudato: verificare dimensioni fisiche, resa dei pixel, trasparenza/crop e modificabilità del testo con il file di produzione. Nessuna nuova funzione multipagina o generazione immagini AI.
