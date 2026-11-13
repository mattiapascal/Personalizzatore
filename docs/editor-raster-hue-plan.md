# Tonalità RGB — piano locale

Completare le regolazioni fotografiche con **Tonalità (°)** da −180 a +180, neutro 0. Stesso `updateObject`, parametri opzionali e nessuna migrazione o elaborazione automatica dei documenti esistenti.

Il riferimento tecnico è `HueRotation`/`ColorMatrix` della dipendenza Fabric 7.4.0 già installata. Motore numerico condiviso dal browser e dai controlli locali, senza filtri GPU o nuove dipendenze: rotazione dei canali attorno all’asse dei grigi, clipping/quantizzazione a 8 bit, poi saturazione, contrasto e luminosità già disponibili. Alpha invariato.

Verificare confronto con il filtro 2D nativo Fabric, estremi/neutri/grigi, combinazioni, schema/cache, comandi manuali/AI e Undo/Redo. Il controllo è solo nei progetti a colori, non altera sorgente/crop/misure né aggira i controlli B/N. Campione JSON/SVG, pixel incorporati nello SVG, PNG/miniature, build, regressioni foto/chat e sincronizzazione Git. Nessuna scrittura all’archivio principale, deploy, AI immagini o nuova funzione multipagina.
