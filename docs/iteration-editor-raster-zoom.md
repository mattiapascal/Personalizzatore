# Ingrandimento della foto nella cornice — 11 novembre 2026

Completamento dello [spostamento interno](iteration-editor-raster-pan.md), iniziato prima della richiesta sulla trasparenza. Cornice, posizione, rotazione e riflessioni restano ferme; l’immagine può essere ingrandita senza introdurre ulteriori deformazioni dei pixel.

Nel Ritaglio: **Ingrandimento foto (%)**, campo diretto e passo 1%. 100% è la finestra sorgente più ampia che riempie la cornice rispettando le proporzioni già presenti. Il massimo lascia almeno un pixel per asse. **Riempi cornice con foto centrata** torna al 100% e centra. Disponibile anche sull’immagine intera, prima di ritagliare un bordo; aumentando lo zoom si abilita lo spostamento interno.

Il centro visibile è conservato finché i bordi dell’originale lo consentono; riducendo lo zoom vicino a un bordo, viene corretto solo lo spostamento necessario a evitare zone vuote. Sorgente, filtri, cornice e rapporto dei pixel restano invariati. Si modificano solo origine e dimensioni del crop mediante `updateObject`, condiviso con AI, JSON e Undo/Redo. I blocchi della cornice continuano a valere.

Sei nuovi unitari e sei browser passati: percentuali/centro, rotazioni/riflessioni, scale non uniformi preesistenti, limiti, cicli ripetuti, campi errati, manuale/AI, revisioni obsolete, JSON, Undo/Redo, Redo conservato ai no-op. Prima della trasparenza: **719 unitari e 96 browser pertinenti passati**. Le prove dei due incrementi si sovrappongono e non vanno sommate. Verifica congiunta finale: **727 unitari e 478/478 browser completi**, 13 pubblici e 32 campioni passati.

Il generatore `scripts/capture-editor-raster-pan.ts` ora ingrandisce al 200% e annulla, poi compie il trascinamento, la freccia, l’AI e gli Undo/Redo precedenti. I campioni `raster-pan.source.TEST.json` → `raster-pan.TEST.json/svg` mantengono la stessa grafica finale, revisione 9; crop X 31,25/Y 19,5/100,5 × 70,25 px. Confronto Canvas2D indipendente: zero pixel oltre 24/255, errore medio 0,000237/255. Schermate desktop/mobile private; nessun errore o scrittura amministrativa. Illustrator non collaudato.

Log `.local/raster-zoom-{unit-first,unit,build-first,build-browser,browser-first,regressions,capture}.log`. Nessun import reale o modifica al negozio; no deploy. [Verifiche congiunte con la trasparenza](iteration-editor-paint-opacity.md).
