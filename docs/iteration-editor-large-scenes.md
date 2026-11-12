# Progetti con molti oggetti — 12 novembre 2026

## Capacità attiva

Il documento canonico ammette ora **1.000 oggetti**, prima 200. Lo stesso limite è usato da comandi manuali, simulazione AI, gruppi, appunti, applicazione template e archivi locali; non esiste una modalità speciale del solo importatore. ID, revisioni e gerarchie restano nel documento v2. L’aggiunta o duplicazione oltre il limite rifiuta tutta l’operazione e conserva scena, storico e Redo.

Gli importatori sono allineati: PitchPrint fino a 1.000 elementi grafici e 2.000 nodi sorgente inclusi i gruppi; SVG fino a 2.000 elementi elaborati, entro 4.000 nodi XML anche dopo espansione. **SVG fino a 2 MiB**, prima 256 KiB, con controllo sul file e sull’output espanso. I riferimenti locali vengono emessi in un unico output con budget UTF-8 verificato prima dei join; la ripetizione di definizioni grandi non può produrre un’espansione illimitata in memoria. Script, URL esterni, entità, cicli e profondità eccessive restano bloccati.

La conversione PDF vettoriale mantiene una sola pagina e un input massimo di 2 MiB, con SVG/XML intermedi ora fino a 2 MiB. La ricostruzione editabile non si ferma più a 30 righe: ammette fino al budget canonico di 1.000 elementi totali, mantenendo le verifiche di font, posizione e affidabilità già presenti; limite del singolo testo allineato ai 4.000 caratteri Unicode del documento. PDF raster, protetti o con font non incorporati restano rifiutati. Nessuna sostituzione dei font del computer.

Restano distinti i limiti di risorse e le regole produttive: **100 gruppi**, 32.768 comandi vettoriali per oggetto, 65.536 complessivi, quattro immagini e i limiti raster/font precedenti. I box restano entro 4.000 caratteri/100 righe e il documento entro 20.000 caratteri. Nessun nuovo limite tipografico, spessore minimo o prezzo di produzione dedotto da questi valori. Non è un supporto illimitato a qualsiasi file complesso.

Gli schemi JSON generati sono aggiornati con `npm run schemas`. I vecchi documenti restano leggibili; un editor precedente con limite 200 non può aprire i nuovi documenti più grandi. Per un eventuale ritorno al codice precedente conservare anche il backup dell’archivio fatto prima dell’importazione.

## Prove e campione

**838 unitari / 124 file**, build laboratorio/pubblico, schemi e scansioni dei segreti superati. **127 browser pertinenti** passati in 4,6 minuti: SVG/PDF/PitchPrint, gruppi, colori, importazioni e quattro nuovi casi grandi. **13 browser pubblici** passati; JavaScript pubblico invariato `index-BG2r_x-8.js`. **42 campioni JSON/SVG** riaperti e riesportati senza errori o richieste esterne.

I nuovi casi verificano il confine 1.000/1.001 con scena e Redo conservati, selezione/ispettore manuale, comando AI su tutti gli oggetti, gruppi da 1.000 membri con scala/rotazione e Undo/Redo, JSON riaperto e SVG esportato. Un SVG maggiore di 256 KiB conserva tutte le 1.000 forme e il gruppo; un PDF reale generato da dati sintetici produce più di 256 KiB di SVG e conserva 1.000 vettori. Il confronto indipendente di 600 elementi PitchPrint dà **zero pixel differenti e zero errore medio**, circa 148–155 ms per conversione/esportazione/confronto nel caso sintetico misurato, non una garanzia su tutti i progetti.

Campione portabile `fixtures/illustrator/large-scene.source.TEST.json`, `.TEST.json` e `.TEST.svg`: **110 × 70 mm**, 1.000 rettangoli con ID distinti, modifica del centro X nell’ispettore e spostamento AI/Undo/Redo attraverso gli stessi comandi. SVG produttivo di **314.745 byte**, nessun raster/font. Generatore `node --import tsx scripts/capture-editor-large-scene.ts`; screenshot ispezionato. In Illustrator verificare tavola, conteggio, colori e posizioni, soprattutto l’ultimo rettangolo modificato; **collaudo umano non eseguito**.

Le aspettative storiche ferme a 200 oggetti/256 KiB sono state aggiornate al nuovo confine mantenendo i controlli di rifiuto e atomicità. Il nuovo test UI usava inizialmente il nome inesistente «Duplica oggetto»: corretto al controllo reale «Duplica selezionato», selezionando esplicitamente l’oggetto dopo Undo. I timeout e le tolleranze grafiche non sono stati aumentati per nascondere quel fallimento. Log in `.local/capacity-*.log`.

Regressione completa dei **529 scenari conclusa**: **528 passati, uno fallito** in 18,3 minuti (`.local/capacity-full-browser.log`, processo terminale). Il vecchio caso di capacità attendeva ancora un errore duplicando 200 oggetti: ora l’operazione è correttamente consentita. Il test usa il campione effettivo da 1.000 oggetti, verifica il rifiuto atomico della duplicazione totale e mantiene esportazione/riapertura e soglia di caricamento precedenti. Ricontrollo successivo **3/3 passato** in 19,6 secondi: caso corretto, nuovo flusso manuale/AI da 1.000 oggetti e PDF grande (`.local/capacity-final-rerun.log`). Tutti i 529 scenari risultano verificati fra esecuzione e ricontrollo, senza descrivere come verde il primo comando completo. Nessuna modifica applicativa necessaria per questa correzione.

## Template reale recuperato

**Il cane è buono, mia moglie no**: originale di 301 elementi, documento completo di **304 oggetti e cinque gruppi**, 7.150 comandi vettoriali, un font incorporato, **200 × 300 mm**. Conversione ripetuta col codice effettivo, senza gli override del precedente prototipo. Confronto completo indipendente 4×: **108 pixel oltre delta 24 su 129.556 pixel grafici**, rapporto **0,000833616**, errore medio **0,0151334**; soglie invariate 0,01 / 0,25. Nessuna rasterizzazione, compattazione o rimozione delle figure per rientrare nei limiti.

Salvata una nuova bozza TEST, ID locale `e392868c-cef1-4b2b-92b4-163614a6fc72`, tag «Da verificare», nessuna associazione prodotto. Archivio a **256 template, due composizioni e 219 font**, revisione **509 → 510**. Backup verificato prima della scrittura: `.local/pitchprint-migration/large-design-local-import/backup-revision-509-9709edde5410.json`, SHA-256 `9709edde541066511ec953390fbaaec0b0b75509ce8fb93dc9e22309b9f94733`. Record precedenti, font, impostazioni, profili e priorità dei tag invariati; sorgente originale conservato. Manifest privati nella stessa cartella e in `large-design-prepared/`.

Riapertura browser: oggetti, gruppi, font, area, carta e impostazioni targa identici al record; screenshot ispezionato. Miniatura generata e riusata dopo ricaricamento senza rilettura del record. Zero errori/scritture e checksum dell’archivio invariato nelle verifiche. Non certifica produzione o Illustrator.

«Rappresentanti» supera ora la prima barriera del conteggio, ma resta correttamente fermato dai testi con contorno da preservare. Restano anche maschere, font/glifi e primi piani da classificare. Nessuna modifica a chat pubblicata, negozio, tema, PitchPrint, BSS, prezzi, acquisti o checkout; nessun deploy o chiamata AI a pagamento.
