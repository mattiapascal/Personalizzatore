# Formati grafici fino a tre metri — 12 novembre 2026

## Comportamento

Il laboratorio accetta tavole fino a **3000 × 3000 mm**. Il limite locale precedente di un metro impediva l’apertura del vero «Cartello viario monofacciale» da 1100 × 400 mm. Il suo titolo usa inoltre 553,49 pt: la capacità dei testi è ora **0,1–2000 pt**, con controllo degli stili locali e dell’ingombro massimo di 10 m conservato.

Lo schema dell’area grafica è distinto da quello del catalogo/selettore pubblico: **nessuna modifica dei contratti della chat pubblicata**. Millimetri e punti rimangono canonici; nessun formato ridotto implicitamente per aggirare i limiti.

## Geometria e comandi

`GRAPHIC_GEOMETRY_LIMITS` centralizza lato pagina/oggetto 3000 mm, coordinate ±10000 mm e capacità della selezione. Forme, immagini, box di testo, guide testo, trasformazioni, appunti e comandi manuali/AI condividono gli stessi validatori. Ispettori di oggetto, selezione, nodi/Bézier, targhe a misura, profili e zone riservate usano i limiti coerenti. Raggi dei cerchi/ellissi/poligoni fino a 1500 mm; font e stili reali obbligatori come prima. Il corpo massimo tecnico non modifica il minimo produttivo dei timbri o le altre regole di lavorazione.

I vecchi test che usavano 1001 mm come valore vietato verificano ora il confine di 10001 mm; gli offset normali al percorso usano il nuovo confine di 3001 mm. Aggiunte prove positive oltre il metro e rifiuto atomico oltre i nuovi limiti, conservando anche Redo. Una prova sugli stili locali rifiuta un corpo base consentito quando la scala porterebbe uno stile locale oltre 2000 pt.

## Bitmap, zoom ed esportazione

Ogni superficie del canvas rimane entro **8192 px per lato e 16 milioni di pixel**, considerando il DPR. Lo zoom massimo disponibile dipende quindi da formato e schermo. Per 1100 × 400 mm è 75% a DPR 1 e 37% a DPR 2; per 3000 × 3000 mm 16% e 8%. Le piccole tavole conservano il 400%. Restano zoom attorno al puntatore, gesture e PAN. Il limite usa il DPR effettivo della configurazione Fabric, come il bitmap: riprodotto un cambio del DPR della finestra da 2 a 1 con Fabric ancora a 2; ora slider e renderer concordano al 37%, prima lo slider mostrava 75%. Questo incremento conserva l’attuale canvas dell’intera tavola: per ingrandimenti ulteriori sui formati grandi servirà in futuro un renderer limitato al viewport.

Anche l’allocazione intermedia è protetta: passando da una tavola alta a una larga si azzera prima la superficie, evitando di combinare temporaneamente larghezza nuova e altezza precedente. Test Retina osserva direttamente i setter dei bitmap, oltre alle dimensioni finali.

L’esportazione SVG usa le dimensioni logiche della tavola senza allocare il corrispondente bitmap completo. Il ripristino della vista conserva selezione/documento e torna al budget normale. Tavola e geometrie del vettore rimangono nelle misure originali; anche il renderer PDF usa questa serializzazione. **Illustrator non collaudato.**

PNG mantiene il limite già esistente: il cartello 1100 × 400 è esportabile a **150 dpi, 6496 × 2362 px**; 300 dpi è disabilitato perché supera il budget. Nessuna riduzione silenziosa della risoluzione. Miniature già limitate indipendentemente dal formato.

Due vere esportazioni PDF locali hanno superato `qpdf --check`: cartello reale 1100 × 400 mm e tavola 3000 × 3000 mm. MediaBox/CropBox confrontati con la conversione esatta mm→pt; testo «UFFICI» ancora estraibile dal PDF reale. Rapporto privato `.local/large-format-pdf/report.json`. Non è un collaudo della modificabilità in Illustrator.

## Campione e verifiche

`fixtures/illustrator/large-format.TEST.json/svg`, 1100 × 400 mm, quattro oggetti e font Arimo incorporato. Generatore `node --import tsx scripts/capture-editor-large-format.ts`; schermate desktop e mobile ispezionate, zero scritture all’archivio personale o rete esterna. Il verificatore dei campioni include ora anche questo file.

**934 unitari / 140 file** passati. Cinque nuovi browser passati: geometria e nodi oltre il metro, AI/Undo, PNG fisico, SVG e PAN; Retina su tavole alte/larghe/tre metri; mobile con adattamento e cambio del budget; profilo con zona oltre il metro disegnata, modificata, salvata e riaperta su archivio isolato; coerenza del DPR fra controllo zoom e bitmap. Le prime prove hanno corretto due errori del test: scheda Geometria invece di Nodi e un’aspettativa sullo zoom percentuale arrotondato; nessun timeout o soglia grafica aumentato. Il controllo generale ha inoltre ritrovato attese precedenti alle direttive del 12 novembre su oggetti esterni e proporzioni: nei casi di rifiuto si verifica ora il limite tecnico delle coordinate; il caso di geometria indipendente sgancia esplicitamente larghezza/altezza; gli ancoraggi verificano il comportamento proporzionale e la normalizzazione verticale del testo già implementati. Nessun cambiamento all’applicazione per risolvere queste attese storiche.

Build locale/pubblica, Worker e scansioni segreti passati. **13 browser pubblici** passati, bundle sempre `index-BG2r_x-8.js`. Schemi rigenerati. **55 campioni JSON/SVG** riaperti ed esportati senza errori o rete esterna, nessun file font richiesto all’archivio personale. La prima esecuzione generale termina con 608/615: sette attese storiche poi corrette e ricontrollate. Due casi di validazione e tutti i 28 ancoraggi passati; **68 browser finali pertinenti passati** dopo la correzione DPR. Riepilogo per titolo: **616 casi distinti, 616 verificati, zero irrisolti**, fra esecuzione generale e ricontrolli; non una seconda esecuzione generale interamente verde. Rapporto `.local/large-format-browser-summary.json`.

Un tentativo del ricontrollo finale è stato fermato per un import non pubblico di Fabric introdotto nella correzione DPR. Corretto usando `config.devicePixelRatio`, ricompilato e riprovato; il tentativo interrotto è conservato e non viene contato come esito positivo.

Il collaudo HTTP ha rilevato anche una corsa nella sola pulizia delle directory temporanee di Vite (`ENOTEMPTY`): aggiunti i retry limitati di `fs.rm`, senza cambiare asserzioni o percorsi dei dati. Esecuzione finale **934/934 unitari** passata.

Log privati `.local/large-format-*.log`; campioni e schermate in `.local/large-format-capture/`.

## Sorgente reale

«Cartello viario monofacciale» convertito integralmente con Open Sans esatto, quattro oggetti, colori e formato 1100 × 400 mm. Confronto indipendente con la resa nativa PitchPrint su file tecnico e produttivo: **zero pixel classificati differenti**, errore medio di canale 0,047621/255. Soglie esistenti conservate. Originale e archivio invariati durante la preparazione; rapporto `.local/pitchprint-migration/large-format-prepared/report.json`.

**Salvato il solo nuovo template nell’archivio JSON principale**, dopo confronto e preflight capacità. Revisione **616 → 617**, **327 template attivi, due composizioni e 219 font**. Record precedenti, font, impostazioni, profili e priorità dei tag conservati; nessuna associazione prodotto o sovrascrittura, tag «Da verificare».

Backup verificato `.local/pitchprint-migration/large-format-local-import/backup-revision-616-ef57cdb7a673.json`, SHA-256 `ef57cdb7a67345286810521fc3a6c949e32111cabf8fc4380d1f2e32d1945c56`. Nuovo archivio di 526.230.403 byte, SHA-256 `f745282d5a995ce8768d91d2e9fa2c65d3ee8bdf840cb94f5d2c78795a6866d2`.

ID locale `fa65dd2a-9786-4273-89a7-5679dcc1db5f`, v1: riaperto con geometria/font pronti e quattro oggetti identici. Miniatura 512 px verificata e riutilizzata dopo ricarica con zero riletture del record. Zero errori o scritture durante il controllo; schermate ispezionate. Manifest, verifiche e immagini in `.local/pitchprint-migration/large-format-local-import/`.

La copia SQLite rimane congelata alla revisione 616, separata e non attivata. Nuovo audit completo dei 473 sorgenti in `remaining-current-after-large-format.json`: **26 prioritari rimasti**, 18 monopagina e 94 multipagina a priorità bassa, otto esclusi Templates PitchPrint.

## Prossimo lavoro

I due casi «Esiste la morte dopo la vita?» hanno maschere sui testi con rotazione, skew e riflessioni: il ritaglio delle immagini già presente non li rappresenta. Restano in coda senza eliminare i clip. Continuare con i blocchi dei template prioritari, distinguendo problemi grafici, font/glifi, ruoli delle risorse e originali assenti.

Nessun deploy o modifica Shopify/tema/PitchPrint/BSS/prezzi/carrello/checkout, nessuna generazione immagini AI. Le pagine multiple precedentemente autorizzate rimangono supportate.
