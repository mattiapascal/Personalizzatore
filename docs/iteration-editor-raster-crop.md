**Aggiornamento 11 novembre:** [ritagli frazionari e griglia filtri stabile](iteration-editor-fractional-crop.md) supera i riferimenti storici ai bordi interi e al filtraggio della sola porzione tagliata. I quattro bordi sono ora in mm; i filtri operano sui pixel originali completi, conservati sotto un clip SVG.

# Ritaglio e riflessione raster — 9 novembre 2026

Ritaglio rettangolare non distruttivo in pixel della sorgente originale, con scheda dedicata nell’ispettore: sinistra, alto, larghezza e altezza intere; ripristino dell’intera sorgente. Il ritaglio conserva centro e scala fisica dei pixel, quindi cambia le dimensioni mm secondo la porzione visibile; spostare la finestra mantenendone le dimensioni cambia il contenuto nel medesimo riquadro. Nessuna deformazione.

Il documento conserva soltanto sorgente, finestra e parametri; PNG originale immutato. Lo SVG contiene il PNG dei pixel effettivamente ritagliati e convertiti, senza nascondere porzioni del raster dietro una clip. Aggiornare DPI effettivi, proporzioni nel validatore, cache e JSON. Immagini precedenti senza finestra esplicita equivalgono alla sorgente intera. Aggiungere riflessione orizzontale/verticale del risultato, con due pulsanti grafici e flag nel documento.

Prove: ritaglio dentro i bordi e minimi, parametri illegali via AI respinti, centro/scala conservati, pixel effettivi e dimensioni del PNG nello SVG, riflessioni con rotazione, restore/undo e sorgente recuperabile. Primo controllo numerico del ritaglio; maniglie di crop e maschere seguono in altri incrementi.

## Implementazione

Aggiunti `raster-geometry.ts`, `RasterCropInspector.tsx` e campi opzionali `crop`, `flipX`, `flipY` per le immagini. La scheda Ritaglio applica i valori live; spostare sinistra/alto oltre l’estensione corrente riduce la finestra residua, mentre dimensioni esplicite fuori sorgente sono respinte. Cache e canvas derivati operano sui pixel visibili prima della conversione binaria. La scala uniforme e la rotazione dei gruppi conservano sorgente, finestra e riflessioni.

Il campione `raster-crop.TEST.json/svg` è generato con `node --import tsx scripts/capture-editor-raster.ts --crop`: sorgente originale 160×80, finestra 120×80 da X 40, risultato 18×12 mm, riflesso orizzontalmente. Anteprime desktop/mobile in `.local/previews`; desktop e mobile ispezionate, interfaccia e risultato coerenti. Nessuna maniglia di crop ancora: controlli numerici e ripristino completo disponibili.

## Verifiche

Quattro test unitari aggiuntivi su geometria, proporzioni, bordi, comandi e storico; suite unitaria completa **327 passati**. Due browser mirati già superati: pixel reali del PNG nello SVG, dimensioni 1×2, centro/scala e reset/undo; riflessioni a 30°, JSON riaperto e parametri AI illegali respinti. Anche il browser aggiuntivo su scala nativa e rotazione del gruppo è passato. Nella suite completa: 118/119 browser passati, compresi tutti i nove raster; un test chat ha richiesto una correzione dell’attesa documentata nell’incremento clipboard. Regressione completa successiva in esecuzione.

Schemi JSON rigenerati. Illustrator resta da collaudare: misure fisiche, riflessione/rotazione del raster, assenza dei pixel esclusi dal crop e recupero dell’originale riaprendo il JSON. Nessun deploy o modifica commerciale.


Regressione completa dopo clipboard: `npm run check` superato con **332 unitari, 122 browser laboratorio, build e controllo segreti**. Il test chat con attesa corretta è passato anche nella suite completa.
