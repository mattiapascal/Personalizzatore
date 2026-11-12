# Opacità a singolo riempimento e tredici bozze — 12 novembre 2026

## Capacità aggiunta

L’importatore PitchPrint conserva l’opacità oggetto di rettangoli non arrotondati, cerchi interi ed ellissi con un solo riempimento e nessun contorno effettivo o sfondo proprio. La trasferisce a `fillOpacity`, già presente nel documento canonico e nell’ispettore. Nessuna nuova scena parallela, rasterizzazione o sostituzione dei font.

Il trasferimento è equivalente perché non esistono due pitture sovrapposte. Restano bloccanti alpha di gruppi, testo, immagini, forme con contorno effettivo, sfondo proprio, angoli arrotondati e trasformazioni affini non rappresentabili dalla primitiva canonica. I colori RGBA con alpha proprio parziale richiedono ancora la rispettiva conversione: questa capacità riguarda l’alpha dell’oggetto. Nessuna moltiplicazione arbitraria di alpha per simulare il compositing di un gruppo.

Campione `single-paint.TEST.json/svg`, generatore `scripts/capture-editor-single-paint.ts`: rettangolo grigio al 90% sopra il blu, cerchio riflesso e dilatato, ellisse invisibile, segnaposto e gruppo opaco con figlio traslucido. Confronto nativo indipendente, modifica manuale dall’ispettore e comando AI simulato `updateObject`, Undo/Redo. La copia riaperta conserva gli stessi campi.

## Targhette metalliche

Sei bozze monopagina confrontate e importate:

- 200 × 100, 120 × 30, 150 × 40, 110 × 70 e 180 × 80 mm con fori;
- Targhetta metallica rettangolare.

Supporto classificato come riferimento inferiore. Le cinque coppie di viti diventano riferimenti superiori tramite `setGroupProperties` in modalità amministrativa, conservando geometria, originali e blocchi. Anche la coppia senza etichetta della 110 × 70 usa esattamente il file delle viti già identificate: dieci immagini con SHA-256 `9bc403eef7f27c1c11d13683c075309b1e34f1f6bf623fb18ff2d5db33901c41`. A quel gruppo è stata aggiunta l’etichetta «Viti».

Confrontati separatamente tavola tecnica completa e contenuto produttivo: **zero pixel oltre soglia** in tutte le dodici comparazioni, errore medio massimo inferiore a 0,000405. La tavola tecnica conserva il supporto e le viti; il file produttivo li esclude. Gli originali di tutte le immagini sono confrontati tramite byte/hash.

La targhetta generica contiene soltanto il riferimento del materiale: il contenuto produttivo è inizialmente vuoto, il supporto resta visibile nell’editor. La sua miniatura produttiva vuota è coerente con il documento; rendere più utile l’anteprima amministrativa di questo caso è un prossimo intervento di usabilità.

## Datari

Sette bozze monopagina, prima bloccate dal rettangolo grigio con opacità 0,9:

Colop 2660, Datario Mod. B, Trodat 5440, Datario Mod. A, Trodat 5460, Colop S226-P e Datario generico.

Tutte confrontate con la pagina nativa completa: **zero pixel oltre soglia**, errore medio massimo inferiore a 0,09. Oggetti, testi, font e blocchi del sorgente conservati; nessuna nuova classificazione automatica delle aree datario o associazione a una montatura. Restano bozze «Da verificare», prive di approvazione produttiva. Le regole timbro continuano a rifiutare trasparenze parziali nel contenuto produttivo quando applicabili: l’importazione di una bozza colorata non certifica una gomma pronta da incidere.

## Archivio e integrità

Due lotti con backup preventivo:

- targhette: revisione 590 → 596, backup privato `.local/pitchprint-migration/metal-complete-local-import/backup-revision-590-0554c74d2760.json`, SHA-256 `0554c74d27600def0f6d6e6f8933495e39a117c13ec9e57ec7bb956fab1501ae`;
- datari: revisione 596 → 603, backup privato `.local/pitchprint-migration/single-paint-local-import/backup-revision-596-b694303328b9.json`, SHA-256 `b694303328b9bfb573067c03f4744588f151d59ae822becc4f112e8080333e67`.

**313 template attivi, due composizioni, 219 font; revisione 603.** Nessuna sovrascrittura di record esistenti, associazione prodotto o modifica a profili/impostazioni/font. Copie precedenti e sorgenti originali confrontati tramite impronte. Tutte le 13 nuove copie riaperte in sola lettura con font verificati; supporti/viti separati nei livelli attesi. Tredici miniature generate e riusate dalla cache: zero riletture dei documenti durante il secondo passaggio, zero scritture durante i controlli.

Rapporti privati di confronto: `metal-complete-prepared/`, `single-paint-prepared/`, `single-paint-verified/`; rapporti di salvataggio e riapertura nelle directory dei lotti. Cache: `single-paint-and-metal-check/thumbnails-report.json`. Percorsi relativi a `.local/pitchprint-migration/`.

Audit corrente sui 473 sorgenti acquisiti: 313 presenti, **40 prioritari ancora da analizzare**, tutti monopagina; 18 monopagina e 94 multipagina a bassa priorità; otto esclusi del gruppo Templates PitchPrint, sette monopagina e uno multipagina. La precedente categoria «25 a bassa priorità» comprendeva anche i sette monopagina ora classificati esplicitamente come esclusi. Non sono nuove esclusioni decise autonomamente.

## Evidenze

- **904 unitari / 136 file** passati: `.local/single-paint-all-unit.log`.
- **55 browser pertinenti completi** passati: `.local/single-paint-pertinent-browser.log`, inclusi opacità, gruppi, geometrie riflesse, rifiuto del compositing non equivalente, proprietà, riferimenti e importazioni atomiche.
- **53 campioni** riaperti/esportati senza errori browser o rete esterna: `.local/single-paint-artifacts.log`. Schermata del campione ispezionata.
- **13 test pubblici**, Worker locale, build e controlli segreti passati. Bundle pubblico sempre `index-BG2r_x-8.js`.

Non una nuova suite browser generale. Illustrator non collaudato. Nessun deploy, scrittura commerciale, nuova capacità multipagina o generazione immagini AI.

## Prossimo lavoro

Migliorare la miniatura amministrativa dei template con solo materiale di riferimento, mantenendo distinta la grafica produttiva e preservando le chiavi cache esistenti dove possibile. Poi riesaminare i 16 confronti visivi ancora oltre soglia con il riferimento completo delle immagini di pagina; non abbassare le soglie per promuovere copie. Tra gli altri 24 casi: classificazioni di primi piani, originali mancanti, glifi/font, formato viario 1.100 × 400 mm, PNG e maschere ruotate. Per questi ultimi due cartelli servono maschere conservate, non cancellazioni per forzare il risultato.
