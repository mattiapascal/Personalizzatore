# Confronti affidabili e PNG con bordi uniformi — 12 novembre 2026

## Miglioramento generale

Aggiunto `boxSampleRgba`: media esatta di tutti i campioni dell’area, con canali premoltiplicati per alpha. Pixel trasparenti con colori nascosti non introducono aloni; la copertura resta separata dal colore. Fattori 1/2/4/8, dimensioni intere e buffer coerenti verificati. I pixel sorgente non vengono modificati.

Il renderer dei PNG e delle miniature con maschere usa questa riduzione al posto di `drawImage` fra due canvas. Conservati DPI, dimensioni finali, selezione del fattore e limite di 8192 px/16 MP per superficie. La lettura RGBA aggiunge un buffer CPU proporzionale alla superficie alta, non un nuovo limite di dimensione. I documenti senza maschere continuano lungo il precedente percorso. SVG, documento canonico e motore dei contorni non sono stati alterati.

Le miniature con maschere hanno una nuova chiave di politica `box-premultiplied-1`. Le altre mantengono la chiave precedente; metadati senza effetti visivi e pagine non iniziali non rigenerano l’anteprima della prima pagina. I comandi manuali e AI restano gli stessi, con revisioni, Undo e JSON portabile.

## Diagnosi delle tre cornici

I sorgenti «20x30», «Modello» e «30x20» della categoria Cartello metallico personalizzabile erano rimasti esclusi per il confronto delle immagini: 1,43%, 1,43% e 2,37% dei pixel di grafica classificati differenti. L’errore medio era già basso. Non sono state aumentate le soglie né aggiunte condizioni sul titolo o sull’ID del template.

La diagnosi ha confrontato:

- SVG nativo con il contorno espanso, a campionamento 1/2/4/8.
- Contorno analitico indipendente, calcolato con le normali della Bézier originale, senza importatore, Ghostscript o unione di poligoni.
- Distanze fisiche in entrambe le direzioni fra bordo analitico campionato e segmenti del risultato.
- Forme SVG matematicamente equivalenti e pulizia minima dei vertici, che non hanno risolto il problema. Nessuna di queste modifiche è stata introdotta nel convertitore.

Sui due orientamenti, massimo scarto misurato dai campioni analitici circa **0,000450 e 0,000440 mm**; nella direzione opposta meno di 0,000254 mm. Il campionamento automatico a 4× produceva differenze più grandi di 1×, 2× e 8×. La riduzione del browser non era una media uniforme dei sedici campioni: il controllo stava amplificando differenze di rasterizzazione.

Con la media esplicita, mantenendo campionamento **4×**, classificazione a **24/255**, rapporto massimo **1%** ed errore medio massimo **0,25/255**, i tre confronti completi hanno **zero pixel classificati differenti**. Errore medio 0,014510/255 per i due verticali e 0,021781/255 per l’orizzontale. Il file produttivo e quello tecnico sono verificati separatamente. Il metodo non è stato scelto dopo aver allargato una tolleranza: test numerici dimostrano il contributo di ogni campione e il corretto trattamento dell’alpha.

Il campione sintetico verifica inoltre che uno spostamento introdotto di **0,1 mm** e la perdita del foro vengano rilevati come errori. La prova fisica verifica i bordi entro il budget nominale preesistente di 0,005 mm. Queste misure campionate non sostituiscono il collaudo produttivo umano.

## Cosa resta specifico dell’importazione

Interpretazione di unità, origini e trasformazioni appartiene all’adattatore PitchPrint. Le regole sono strutturali e riutilizzabili; l’editor manuale non dipende dai nomi dei template. La cornice deformata resta un contorno espanso dal convertitore già esistente: conserva la geometria, ma lo spessore originario non torna un parametro di tratto editabile. Un’eventuale rappresentazione parametrica dei tratti affini richiederebbe un incremento distinto.

Le eccezioni sui contenuti dei singoli template restano separate dal renderer e richiedono una direttiva esplicita, come la rimozione del solo testo curvo da Azienda Agricola. Font mancanti, glifi assenti, asset non recuperati e strutture non rappresentabili continuano a essere bloccanti; nessun fallback automatico.

## Campione e verifiche

[Documento JSON](../fixtures/illustrator/large-contours.TEST.json), [pagina verticale SVG](../fixtures/illustrator/large-contours.TEST.svg), [pagina orizzontale SVG](../fixtures/illustrator/large-contours.page2.TEST.svg), [sorgente sintetico](../fixtures/illustrator/large-contours.source.TEST.json). Due pagine da **200 × 300** e **300 × 200 mm**, cornici blu senza font o immagini. Generatore `node --import tsx scripts/capture-editor-large-contours.ts`; schermate dei due orientamenti ispezionate, zero scritture personali o richieste esterne. Riapertura, modifica numerica proporzionale attorno al centro, comando AI/Undo, JSON e indipendenza delle pagine verificati.

**953 test unitari in 143 file, 260 browser pertinenti completi, 13 pubblici e 57 campioni** passati. Build TypeScript/laboratorio, pacchetto Worker dry-run, runtime locale e controlli segreti verdi. Non una nuova suite generale completa dell’editor. Il primo test del nuovo PNG aveva un ID sorgente TEST non valido; corretto il dato. La prima prova manuale cercava i controlli AI nella modalità amministrativa che non li espone; ripetuta nella modalità test prevista. Nessuna modifica del prodotto per soddisfare questi errori di prova.

I nuovi casi coprono media di tutti i campioni, canali e blocchi indipendenti, alpha premoltiplicato, input invalidi, cache selettiva, precisione analitica e rilevamento di difetti inseriti deliberatamente. Le catture dei due orientamenti sono state ispezionate. Il bundle pubblico resta `index-BG2r_x-8.js`. Il confronto PNG del template con maschere già importato è stato ripetuto in sola lettura: zero pixel classificati differenti, errore medio 0,106701/255; rapporti del nuovo renderer conservati separatamente. Nessun deploy, modifica commerciale o attivazione SQLite. Illustrator da collaudare.


## Importazione effettiva e stato locale

Le tre cornici sono state aggiunte dopo preparazione completa e copia di sicurezza verificata: **revisione 618 → 621**, **331 template attivi, due composizioni e 219 font**. Sorgenti e colori conservati, tag originali e «Da verificare», nessuna associazione prodotto o sovrascrittura. Tutti i record preesistenti, font, profili, impostazioni e priorità tag confrontati: invariati. Tre riaperture dal loro ID e miniature/cache passate con zero letture dei record al secondo passaggio, zero errori e zero scritture durante la verifica; schermata reale verticale ispezionata.

Backup e manifest privati: `.local/pitchprint-migration/metal-frame-final-local-import/`; confronti: `metal-frame-final-prepared/`. SHA del backup `4197c537d02961531000741f2805dc0ca8f08350616efc69a0785d5e4063d343`, archivio finale `711ce25f5df88d179f9c7866ccd02a8fbfed880cfefaa47ff1766b51adb9d27f`. JSON circa **503,2 MiB**, entro il limite esistente. Server locale a heap massimo 4 GiB, nessun arresto durante le tre scritture. SQLite resta sulla copia separata a revisione 616.

Audit aggiornato: **22 sorgenti prioritari rimasti**, 112 a bassa priorità e otto Templates PitchPrint esclusi. Nessun deploy o modifica al negozio, tema, PitchPrint, BSS, prezzi, carrello o checkout.
