# Prossimo incremento: fondi vettoriali PitchPrint

Analisi locale dell’11 novembre 2026, successiva al riconoscimento dei descrittori inattivi. Questa nota è un piano, non una funzione già disponibile o un’autorizzazione commerciale.

## Perimetro osservato

Diciannove sorgenti a pagina singola hanno uno sfondo realmente vettoriale nel canvas: diciassette gruppi con due elementi e due rettangoli singoli. Le foglie sono path e rettangoli. In tutti e diciannove l’URL dichiarato dal descrittore coincide con quello del livello serializzato. Non sono stati rilevati ombre, clip, skew o opacità parziale nel fondo; gli oggetti del corpo possono comunque avere altri blocchi. Il censimento completo con hash resta privato in `.local/pitchprint-migration/native-page-vector-audit.json`.

Il vettore serializzato descrive la geometria effettivamente scelta nel design. Non ricollocare il file SVG originale basandosi soltanto sul suo ingombro: perderemmo posizione, scala, parti fuori pagina e possibili personalizzazioni. Non trasformare il vettore in una miniatura raster e non trattare un materiale come grafica stampata.

## Prova preliminare del 12 novembre

Eseguito un prototipo **in sola lettura sui soli fondi** dei diciannove sorgenti. Ogni fondo nativo è stato collocato come unico oggetto nella copia di lavoro del corpo, riutilizzando il convertitore esistente, senza cambiare coordinate, scala, clip del foglio, geometria o sorgente originale. Il riferimento indipendente ricostruisce il livello nativo con Fabric e conserva gli assi fisici separati del foglio. Colori conservati, 53 oggetti canonici complessivi.

**19/19 confronti superati**, con le soglie già fissate a rapporto <0,01 e media <0,25/255, campionamento 4× e lato massimo 1.000 px. Massimo rapporto osservato 0,003873; massima media 0,006851/255. Zero errori browser, zero scritture amministrative e checksum dell’archivio personale invariato. SVG, riferimenti e rapporto privati in `.local/pitchprint-migration/native-page-vector-probe/`.

La prova dimostra il riuso della conversione geometrica dei fondi osservati. **Non è ancora un’importazione completa dei diciannove template**: corpo, testi/font, primi piani, classificazione produttiva, collegamento canonico al fondo e comandi di sostituzione non sono coperti da questa prova. Nessun nuovo record salvato. Non occorre rasterizzare i fondi per aggirare il blocco attuale.

## Diagnosi del corpo e dei record esistenti

Seconda prova locale su copie di lavoro: fondo nativo inserito sotto il corpo, stessi originali e font esatti, riferimento produttivo che esclude soltanto gli elementi con `isReference: true`. **Nove confronti completi della grafica su diciannove superano le soglie**; la gestione canonica dello sfondo rimane da implementare, quindi non sono ancora nove template dichiarati pronti al salvataggio. Dieci arresti: un Gloria Hallelujah 700 irrisolto, un’immagine su CDN non ancora ammessa, due primi piani fuori dal perimetro del prototipo, tre effetti/maschere, due limiti di 200 elementi e un PNG con orientamento EXIF. La prima prova includeva erroneamente una foto di riferimento nel confronto e segnalava un falso scostamento; il riferimento è stato corretto secondo la politica già adottata, senza eliminare la foto dal documento convertito. Rapporti separati conservati in `.local/pitchprint-migration/native-page-vector-full-probe/`.

Nei due sorgenti oltre capacità il corpo contiene rispettivamente 542 e 301 foglie, tutte con area non nulla: non sono centinaia di primitive vuote eliminabili. Occorre collaudare la capacità su composizioni reali prima di aumentarne il tetto. L’URL non ammesso appartiene a una distribuzione CloudFront specifica; non autorizzare genericamente qualsiasi host CloudFront o ricostruire percorsi presunti. Il PNG richiede conservazione dell’originale e normalizzazione esplicita dell’orientamento.

Controllato l’incrocio con l’archivio attuale: diciotto sorgenti non presenti e un «Retro bottiglia classico» già importato, versione 1 e hash sorgente coincidente. Il record preesistente non viene sovrascritto da questa indagine; un eventuale recupero del suo fondo/primo piano dovrà seguire una revisione separata che conservi le modifiche dell’utente. Nessuna scrittura negli archivi.

## Sequenza concreta

1. Estendere il riconoscimento delle risorse di pagina ai gruppi/primitive vettoriali già serializzati. URL e descrittori devono restare coerenti; scelta del ruolo ancora obbligatoria, nessuna inferenza dal nome del file.
2. Riutilizzare la conversione delle primitive e dei gruppi del corpo: stessa matrice fisica indipendente per asse, espansione dei contorni quando necessaria, stessa validazione di riempimenti, font, effetti, ID e capacità. Non eseguire il campo `svg` o altro codice incorporato nel sorgente.
3. Conservare il fondo come gruppo canonico distinto, sotto il corpo. Il primo piano resta sopra. Prevedere un collegamento al gruppo di sfondo distinto dal vecchio `backgroundImageId`, senza cambiare significato ai progetti esistenti. Conservare etichette e blocchi originali nella gerarchia.
4. Estendere sostituzione/rimozione dello sfondo, applicazione template, adattamento del formato e proiezione produttiva. Manuale e AI simulata devono usare gli stessi comandi. La sostituzione deve rimuovere l’intero vecchio fondo, rispettare i blocchi e non lasciare gruppi o collegamenti invalidi; Undo deve ripristinarlo integralmente.
5. Il ruolo «Riferimento materiale» deve mantenere vettori e gerarchia nel JSON, escludendoli da SVG/PNG/miniature produttive. Non basta nasconderli nel solo canvas.
6. Prima sintetici, poi sorgenti reali: confronto indipendente con il livello nativo originale inserito prima/dopo il corpo, senza richiamare la geometria dell’importatore nel riferimento. Stesse soglie già prefissate; nessuna cancellazione di dettagli per superarle.
7. Salvare soltanto copie complete che superano il confronto, con backup, provenienza, colori, millimetri, tag «Da verificare» e nessuna associazione prodotto. Preservare eventuali bozze preesistenti e i loro aggiornamenti manuali.

## Casi di accettazione

- Gruppo con riempimenti e foro composto, scala diversa per asse, rotazione, riflessioni e parte oltre il bordo; SVG interamente vettoriale e JSON autonomo.
- Ordine fondo/corpo/primo piano e proprietà del gruppo conservati; selezione/trasformazioni nei due ruoli cliente e amministratore.
- Manuale e AI: sostituzione con raster/vettore, rimozione, Undo/Redo, salvataggio/riapertura e template su targa con misura differente.
- Materiale escluso dalle tre esportazioni ma presente nel JSON; nessun collegamento al fondo eliminato nella proiezione produttiva.
- Policy iniziale e politica cambiata dopo analisi: nessun salvataggio con risultati obsoleti. Effetti o geometrie mancanti devono fermare la conversione intera.
- Campione sintetico JSON/SVG con controllo browser e checklist Illustrator. Illustrator richiede ispezione umana e non va dichiarato collaudato dal confronto pixel.

Restano separati i futuri casi con solo descrittore SVG e senza geometria del canvas, gradienti, maschere complesse e multipagina. Il primo incremento deve dichiarare esplicitamente quali casi tratta, senza presentarli come parità completa con PitchPrint.
