# Foto ad alta risoluzione e recupero Alida — 11 novembre 2026

Il limite raster di 256 KB era una protezione del primo prototipo, inadatta alle foto reali. Il titolare ne richiede l’estensione. Sono ora accettati **20.000.000 byte per PNG/JPEG, 24.000.000 pixel e 12000 pixel per lato**, mantenendo quattro immagini per documento. Il progetto conserva tutti i byte originali: nessun ridimensionamento automatico viene presentato come sorgente originale.

## Documento e memoria

`raster-limits.ts` governa parser, dati incorporati e recupero degli asset PitchPrint. Il limite della stringa base64 deriva dal volume massimo dei byte. Anche i ritagli ammettono coordinate oltre 4095, fino al lato massimo della sorgente verificata.

`project-limits.ts` riserva **120 MB** al JSON editabile: quattro originali da 20 MB codificati in base64, font e metadati. Riapertura normale e recupero iniziale, import amministrativo, richieste di archivio locale e ingresso PDF condividono il nuovo limite. Bozze IndexedDB: stesso limite per documento, 256 MiB aggregati. Le prove di configurazione locali ammettono documento e SVG separati fino a 120 MB ciascuno e una richiesta complessiva limitata; archivio delle sole prove fino a 512 MiB. Questo allineamento evita che una foto accettata dal canvas venga poi respinta dal precedente limite della bozza. Nessuna modifica al carrello Shopify o a integrazioni commerciali.

La classificazione grigio/colore legge tutti i pixel originali in strisce di 128 righe, evitando un ulteriore buffer RGBA a dimensione intera. Le decodifiche sono serializzate, anche quando un progetto prepara più immagini. La modalità originale non copia inutilmente tutti i pixel in un secondo array. La cache dei derivati conserva al massimo otto elementi e, salvo il singolo elemento corrente, 32 milioni di pixel complessivi. Questo non costituisce un collaudo della memoria massima su ogni telefono: prima del rilascio online restano necessari test su dispositivi reali e gestione dei file separata dal JSON monolitico dell’archivio locale.

## SVG senza espansione JPEG → PNG

Per immagini in modalità originale, lo SVG incorpora il PNG/JPEG compresso di origine. Un viewport conserva il ritaglio; il trasformatore Fabric conserva posizione, scala, rotazione e riflessioni. Per JPEG l’orientamento EXIF è espresso geometricamente e i segmenti APP1 vengono tolti dalla copia di esportazione per evitare la doppia applicazione dell’orientamento. I dati JPEG dell’immagine non vengono ricompressi; il JSON conserva il file completo iniziale. La preparazione della stringa avviene soltanto durante l’esportazione, non a ogni modifica del canvas. Le elaborazioni B/N continuano a esportare il derivato PNG.

Il validatore passivo delle configurazioni locali ammette le immagini JPEG incorporate; URL remoti, script ed eventi restano vietati. Importazioni e output continuano a richiedere i file tipografici incorporati. La protezione globale delle metriche dei testi irrisolti resta da completare, come negli incrementi precedenti.

## Verifiche

- **667 test unitari in 103 file** (con i controlli finali del recupero font). Nuove prove reali di PNG 12000 × 2000 px (24 MP), crop oltre la vecchia coordinata massima, originale oltre 8 MB e archivio temporaneo/bozza oltre 10 MB, senza riduzione dei byte.
- Browser: limiti atomici di JSON e immagini, PNG, orientamenti JPEG 1–8 e ritaglio; foto sintetica **4000 × 3000 px, 12.184.370 byte**, caricata dall’interfaccia, salvata/riletta da IndexedDB, esportata e riaperta come JSON. Documento di 16.246.546 byte, SHA-256 del JPEG originale invariato. SVG con tutti i 4000 × 3000 pixel: **16.246.593 byte**, rispetto ai 54.473.192 della precedente conversione in PNG. Importazione e salvataggio della bozza misurati in circa 7,7 secondi nella prova locale; non un benchmark universale.
- Confronto dello SVG JPEG nativo con il PNG del renderer per gli otto orientamenti EXIF, crop, rotazione e riflessioni: campioni interni in zone uniformi con differenza massima di canale 1/255; errore medio massimo sull’intera pagina 0,158/255. Le transizioni del piccolo JPEG possono differire per ricampionatura: le prove iniziali con un’unica soglia sulla percentuale dei pixel sono state conservate come fallite, poi la misura è stata separata tra zone uniformi, griglia fisica allineata e pagina completa. Non viene dichiarata identità pixel per pixel.
- **24 campioni JSON riaperti ed esportati**, senza errori browser o richieste esterne; campione `pitchprint-images` aggiornato. Confronto indipendente Canvas2D del nuovo campione: 0,41% dei pixel dell’inchiostro oltre la soglia 24/255, errore medio massimo di canale 0,054/255. Migliora il precedente ritaglio tramite bitmap derivata. Build, schemi e scansione segreti passati.
- I primi comandi browser comprendono un errore di selettore del test fotografico e una lettura da un’istanza di cache separata dal ricaricamento Vite; ricontrolli completati sul percorso UI/IndexedDB. Le evidenze rimangono distinte in `.local/highres-*`.

Nessun nuovo collaudo Illustrator. Il viewport SVG e gli orientamenti delle immagini vanno verificati anche lì prima della produzione.

## Template recuperati

Analisi in sola lettura dei 370 sorgenti a pagina singola: **212 convertibili**, 23 in più rispetto ai 189; nessuna regressione. **158 restano bloccati**. Tra i 23 «Attenti al Cane», sono ora convertibili cinque: i tre fotografici dell’incremento precedente e «Morde e Sbrana»/«Morde e Sbrana 2». Questi due nuovi recuperi richiedono ancora verifica visiva completa; 18 restano esclusi. Conversione riuscita non equivale a importazione approvata.

Rapporto privato `.local/pitchprint-migration/highres-analysis.report.json`: archivio invariato per hash, zero scritture amministrative o errori browser durante l’analisi. L’archivio contiene ancora 117 template PitchPrint e due composizioni; nessuna nuova bozza salvata.

## Font Alida originale

Dopo aver autorizzato una sostituzione perché Alida era ritenuto introvabile, il titolare chiede di recuperare il file dal browser/PitchPrint. Il file originale è stato scaricato in sola lettura da `https://pitchprint.io/fonts/woff/alida.woff`: 26516 byte, identico alla copia del catalogo tecnico, SHA-256 `619e38075ae6a89af724eeda70dea82dc6e4438d590797b0aef587316701b0db`. Nomi interni Alida/Alida-Regular, normale 400, senza corsivo; copertura verificata di tutti i caratteri dei cinque sorgenti.

Installato **Alida originale** nella libreria locale: 201 → 202 font, revisione 367 → 368. Backup verificato prima della scrittura; tutti i font precedenti, record, impostazioni, profili e ordine tag invariati. Il successivo collaudo browser ha caricato il file esatto, verificato zero problemi di glifi, generato SVG e riaperto la prova nell’editor; nessuna ulteriore scrittura. La libreria usa l’originale: nessuna sostituzione Allura applicata. File, backup, manifest e prova sono privati in `.local/font-recovery-alida`; il font non viene pubblicato nel repository.

I cinque sorgenti che dichiarano Alida sono Q12, Modello vuoto, Circolare 51×51 mm, Circolare 41×41 mm e Rettangolare 51×25 mm, nelle scritte segnaposto. Non erano tra i 117 importati; restano bloccati prima del testo da elementi SVG invisibili. Il recupero del font è distinto dal recupero di tali scene.

Il titolare autorizza poi di estendere il recupero agli altri font mancanti. Inventario e verifiche proseguono separatamente, prima di una nuova installazione massiva. Nessuna modifica ai template PitchPrint, al negozio, alla chat pubblicata, al tema, a BSS, prezzi, checkout o ordini; nessun deploy.

Seguito: [altri 16 originali recuperati](iteration-editor-font-recovery.md), libreria a 218 file e ricontrollo delle combinazioni effettive.
