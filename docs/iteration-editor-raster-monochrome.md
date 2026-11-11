# Immagine monocolore, bianco trasparente e tinta — 11 novembre 2026

L’ispettore Immagine offre **Immagine monocolore (scala di grigi)** anche per fotografie RGB. Attivandolo compaiono **Bianco trasparente (alpha dai grigi)** e **Tinta immagine**, oltre a luminosità, contrasto e inversione. L’originale non cambia; crop, EXIF, rotazione, riflessioni e cornice restano indipendenti. Il selettore di colore personalizzato ha ora un’area utilizzabile di 44 × 44 px.

I grigi usano luminanza RGB ponderata. Con bianco trasparente, nero opaco, bianco trasparente e grigi proporzionali; l’opacità derivata moltiplica quella originale. La tinta scelta sostituisce il nero. Senza rimozione del bianco si interpola dalla tinta al bianco, conservando l’alpha originale. Questa è una trasformazione esplicita, non la segmentazione AI dello sfondo a colori, tuttora sospesa.

Parametri canonici `raster.mode='grayscale'`, `backgroundRemoval='luminance'` e `tintColor`; UI e AI simulata usano `updateObject`. La cache distingue modalità/tinta e continua a condividere le decodifiche degli originali identici. La precedente rimozione del bianco dai soli grigi mantiene la sua protezione: un RGB non viene trattato automaticamente come grigio senza il nuovo switch. L’archivio e lo SVG conservano le risorse necessarie al riuso. I timbri monocromatici non accettano tinte colorate; la conferma produttiva dei timbri inchiostrati rifiuta grigi continui non convertiti in B/N.

Verifiche iniziali: **733 unitari / 114 file**, **108 browser pertinenti**, build/schemi/segreti, 13 browser pubblici locali e 33 campioni. Dopo la correzione del selettore colore, altri 10 browser monocolore/trasparenza superati. Il nuovo incremento librerie comprende ulteriori regressioni, documentate separatamente. Non attribuire al monocolore il vecchio controllo completo di 478 browser, precedente a questa funzione.

Campioni `fixtures/illustrator/raster-monochrome.source.TEST.json`, `.TEST.json/.TEST.svg`; generatore `scripts/capture-editor-raster-monochrome.ts`. Originale RGB, grigio e tinta/alpha sullo stesso foglio, stesso file sorgente, comandi manuali/AI/Undo. Confronto Canvas2D indipendente: zero pixel con delta >24, errore medio 0,00521/255; nessuna scrittura amministrativa o errore browser. Illustrator e dispositivi fisici non collaudati.

Azienda Agricola 99 × 139: il solo testo curvo autorizzato è stato escluso dalla copia privata, originale conservato. La trasformazione monocolore dell’immagine produce esattamente i pixel indipendenti attesi (870 × 1148, zero differenze), ma il confronto SVG ricampionato mostra ancora differenze; sfondo/colore del foglio e primo piano richiedono inoltre conversione esplicita. Il template non è ancora dichiarato pronto o aggiunto all’archivio. Non attribuire una equivalenza ai filtri originari Kodachrome/HueRotation/Saturation.

Nessuna sostituzione dei progetti personali, deploy o modifica commerciale.
