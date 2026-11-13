# Controllo B/N dei pixel nel ritaglio — 13 novembre 2026

Aggiornare il controllo delle immagini B/N: verificare tutti i campioni originali elaborati che intersecano il ritaglio rettangolare, non i pixel completamente rimossi. Nessun ridimensionamento o screenshot a zoom corrente; un pixel toccato anche parzialmente da un bordo frazionario resta incluso. Le maschere arbitrarie, le occlusioni di altri oggetti e il clip della pagina non eliminano campioni dal controllo: il contratto riguarda la finestra sorgente prima di interpolazione/maschere, non certifica la sola pittura finale composta.

Riutilizzare il crop canonico, i filtri sulla griglia originale e gli adattatori browser/backend. PNG e JPEG devono mantenere l’orientamento EXIF 1–8; sul server ricondurre la finestra logica alla griglia raw senza ricampionare o allocare una seconda immagine intera. Convalidare comunque l’intero file e i parametri: un crop piccolo non nasconde file corrotti, metadati incoerenti o filtri non applicabili alla sorgente completa. La rimozione del bianco ammette anche una sorgente completamente trasparente, come già previsto dal motore dei pixel.

Cache della verifica per contenuto, metadati, parametri e finestra di pixel, senza confondere ID o ritagli differenti. Le conversioni che garantiscono campioni binari possono riutilizzare l’esito fra finestre già validate. Stesso gate per manuale e simulazione AI, stessa atomicità nei consumatori locali; nessuna modifica al codice commerciale, all’originale, al progetto, alle revisioni o alla cronologia durante il controllo.

Prove: bordi interi/frazionari, ultima striscia, dimensioni invalide, tutti gli orientamenti PNG/JPEG, trasparenza e filtri, cache fra alias/crop, originale corrotto fuori crop, confronto browser/backend, comandi/Undo/Redo e rifiuto atomico di conferma. Campione JSON/SVG TEST, riapertura/esportazione e regressioni di raster/produzione. Nessuna nuova migrazione, modifica dell’archivio personale, acquisto, integrazione online o deploy.

**Completato:** [implementazione, campione e prove](iteration-editor-binary-crop.md).
