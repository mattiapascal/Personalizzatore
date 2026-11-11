**Campione aggiornato successivamente:** [zoom interno](iteration-editor-raster-zoom.md), stesso risultato grafico con zoom 200%/Undo aggiuntivi; revisione finale attuale 9. I numeri delle revisioni nel resoconto storico sotto si riferiscono alla versione precedente del generatore.

# Posizione della foto da tastiera — 11 novembre 2026

Base `a0ef2fc`. Completa lo [spostamento interno alla cornice](iteration-editor-raster-pan.md) usando le stesse frecce già presenti per gli oggetti. Con **Sposta foto nella cornice** attivo, Frecce = 0,1 mm; Maiusc = 1 mm; Alt = 0,01 mm. Le direzioni seguono gli assi del foglio, quindi un particolare si muove nella direzione della freccia anche quando la cornice è ruotata/riflessa. Gli input dell’ispettore restano riferiti agli assi locali della cornice e conservano il loro comportamento nativo.

Il solo nuovo stato UI è l’ID dell’immagine per cui è attivo il modo contenuto, aggiornato dalla stessa selezione usata dall’adapter. Nessun secondo documento. Ogni pressione legge l’oggetto e la revisione correnti dallo store, calcola il crop con `panRasterContents` e invia il consueto `updateObject` manuale. Posizione, misure, sorgente e filtri rimangono invariati; i blocchi sono validati dal motore. Nessun dispatch quando il bordo impedisce lo spostamento: non viene cancellato il Redo.

Disattivando il modo, cambiando scheda o selezione, le frecce riprendono lo spostamento degli oggetti. Restano esclusi input, testi in editing, select/listbox, IME, gesture in corso, documenti in conflitto, editor nascosto/inert e focus esterno. Le scorciatoie di Undo/Redo rimangono condivise; nessun trattamento speciale dei file esportati.

## Campione

Il generatore `scripts/capture-editor-raster-pan.ts` ora inserisce anche ArrowRight e Undo fra il trascinamento manuale e l’AI simulata. Verifica il delta del crop con una formula indipendente, la cornice invariata e il ritorno al crop precedente; poi AI/Undo/Redo e download JSON/SVG. Il campione finale rimane a X 31,25 / Y 19,5 / 100,5 × 70,25 px, revisione 7. Misure, sorgente e resa dello SVG sono invariati rispetto al campione precedente. Il confronto testuale rileva soltanto l’ID interno del clip (`imageCrop_8` → `imageCrop_10`); nel JSON cambia la revisione (5 → 7).

Confronto Canvas2D indipendente: zero pixel oltre 24/255, errore medio 0,000237/255, zero errori browser o scritture amministrative. Nuove schermate desktop/mobile in `.local/previews/editor-raster-pan-*`; nessun dato personale o font privato nei campioni. Illustrator e dispositivi fisici non collaudati.

## Prove

Sei nuovi test browser: quattro combinazioni di rotazione/riflessione con cornice bloccata, verifica analitica di tutti e tre i passi, Undo/Redo e JSON a freddo; limiti e asse senza margine, no-op con Redo conservato; focus degli input e fuori editor, ritorno alle frecce normali dopo modo/scheda/selezione.

Log privati: `.local/raster-pan-keyboard-{browser-first,regressions,unit,build-final,secrets-final,public-build,public-browser,public-secrets,capture,artifacts}.log`. **713 unitari / 111 file**, tipi/build e scansione segreti passati. **90/90 browser pertinenti passati** nell’esecuzione finale, inclusi i sei nuovi casi e le regressioni di tastiera, crop, EXIF, immagini, PAN e spostamento interno. Il primo controllo separato dei sei nuovi casi era già passato; i conteggi si sovrappongono e non vanno sommati.

**13/13 browser pubblici locali**, build pubblica e scansione segreti passati. **31 campioni riaperti/riesportati**, zero errori browser o richieste esterne. Intera suite attuale: 465 casi censiti, non rieseguiti tutti in questo incremento. Ultimo controllo completo documentato: 427/427 su `587c44e`.

Nessuna modifica dell’archivio personale o importazione, nessun deploy o intervento su Shopify, tema, PitchPrint, BSS, prezzi, carrello/checkout o chat pubblicata.
