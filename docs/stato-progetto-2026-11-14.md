# Stato del progetto — 14 novembre 2026

Resoconto richiesto dal titolare. Stato ricavato dal codice, dall’archivio SQLite in sola lettura e dagli ultimi collaudi. Le sezioni cronologiche dei vecchi documenti contengono limiti superati e non prevalgono su questo riepilogo.

## Progetto generale

La chat di selezione prodotti è la parte già pubblicata. Editor e amministrazione sono un’applicazione locale avanzata, utilizzabile per prove reali; la sostituzione commerciale di PitchPrint non è attiva. Per editor e archivi mancano backend remoto autenticato, associazione dei progetti agli account, filiera produttiva approvata e integrazione Shopify/BSS/carrello/ordini. Nessuno di questi collegamenti viene attivato con il push del codice.

## Editor

Operativi testi e stili parziali, font propri, forme e Bézier, immagini/filtri/crop, testo su tracciato, gruppi annidati e livelli, trasformazioni, PAN/zoom, righelli/guide magnetiche, appunti tra progetti, Undo/Redo, risorse di libreria, import SVG/PDF e output JSON/SVG/PNG/PDF locale. Il supporto multipagina già implementato è conservato; non è un nuovo sviluppo di questa fase.

I controlli produttivi sono parziali: timbri con minimo testo e B/N, profilo tecnico collegabile alla pagina e diagnostica di margini/zone/fissaggi. L’incisione, le distanze fra colori e la stima dei tempi/costi non sono ancora una certificazione automatica di lavorabilità. Esportazioni complesse e Illustrator richiedono ancora il collaudo umano. Le funzioni avanzate mancanti, come booleane e vettorializzazione, non sono la priorità concordata.

Gli ultimi incrementi consolidano input dell’ispettore, revisioni, salvataggio/import e anteprime: una modifica incompleta non deve sparire e una vecchia operazione asincrona non deve sovrascrivere il progetto corrente.

## Amministrazione

SQLite locale R638: **346 template attivi, tutti importati da PitchPrint; due composizioni; 219 file font, 218 attivi; un profilo produttivo**. Operativi miniature/cache, tag combinati e priorità, import e operazioni massive, copia cliente→template, libreria font con categorie/anteprime/varianti e backup, immagini/sfondi per categoria, impostazioni, pulizia bozze e gestione profili. Restano permessi/accessi online, storage remoto, storico completo recuperabile e distribuzione dei file. Il contatore di versione non equivale a uno storico completo.

## Chat e Fabric

La chat commerciale usa il modello reale per raccogliere la richiesta e il motore deterministico per proporre prodotti. Nel laboratorio può trasferire prodotto e testo raccolto al canvas. Le modifiche grafiche manuali e i comandi AI simulati condividono già documento, ID, revisioni, validatori e Undo. **Il modello reale non è ancora collegato ai comandi grafici**: chiedere in linguaggio naturale di impaginare o modificare il disegno non è ancora un flusso completo disponibile al cliente. Mini-editor integrato nella chat e passaggio continuo chat/editor restano da completare. Generazione immagini AI esclusa; rimozione sfondo a colori sospesa.

## Prodotti Shopify reali

L’amministrazione consulta il catalogo commerciale reale per collezioni/tag e dispone di strumenti per associazioni massive prodotto/varianti e ricostruzione delle associazioni PitchPrint. Le associazioni archivistiche non forniscono automaticamente misure utili, profili produttivi o prezzi.

La verifica dell’archivio attuale trova **zero template con associazioni commerciali salvate** e zero con associazioni ai modelli TEST. La galleria/cambio montatura usa ancora tre modelli tecnici fixture; il collegamento chat→canvas è un percorso locale distinto. Le targhe parametriche sono provabili con misure e fissaggi, ma varianti reali, misure BSS, supporti/accessori e prezzi non sono ancora collegati al flusso completo.

## Priorità proposta

Completare in locale un percorso reale per una famiglia di timbri e una di targhe: associazioni, misure/varianti, profili e zone, scelta template, salvataggio/riapertura e collaudo del file produttivo. Collegare poi l’AI grafica al motore già validato. Pubblicazione e sostituzione online richiedono una fase autorizzata separata, con prova e rollback.

Ultimo incremento: **1.399 unitari, 53 casi browser pertinenti verificati tra esecuzioni/ricontrolli, 13 test della chat pubblica locale e 96 campioni JSON/SVG**. Dettagli e limiti in [misure e fissaggi protetti](iteration-editor-plaque-commit.md). Questi numeri non certificano una nuova suite browser generale o la produzione fisica.
