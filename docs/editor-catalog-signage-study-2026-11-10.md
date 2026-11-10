# Targhe, segnaletica e fuoriporta: osservazione del negozio e modello riutilizzabile

Lettura del negozio pubblico e del catalogo Shopify in sola lettura, 10 novembre 2026. Nessun carrello, checkout, opzione BSS, prodotto o tema modificato. Non assumere che testi descrittivi, prezzi base o limiti HTML costituiscano da soli una specifica produttiva o la formula di prezzo. Le istruzioni del titolare prevalgono sulle descrizioni eventualmente non aggiornate.

## Campione esaminato

Navigazione delle collezioni [Targhe](https://www.incisoriasacchetti.it/collections/targhe), [Segnaletica](https://www.incisoriasacchetti.it/collections/segnaletica), [Fuoriporta](https://www.incisoriasacchetti.it/collections/targhette-fuoriporta), campione Shopify con varianti e lettura browser di otto prodotti attivi con campi/opzioni. Riscontro privato in `.local/store-review/products.json`, schermate in `.local/store-review/`; non contiene credenziali. Un vecchio handle `targa-personalizzata-in-plexiglas` non è stato leggibile nel browser durante la prova: nessuna deduzione sui suoi campi.

| Caso osservato | Cosa cambia | Implicazione progettuale |
|---|---|---|
| [Plexiglass a misura](https://www.incisoriasacchetti.it/products/targa-plexiglass-dimensioni-personalizzate) | Larghezza/altezza numeriche, spessore, fissaggio/foratura, spigoli, stampa del bianco e condizioni di installazione | Dimensioni come parametri, non nuovi profili. Spessore/fissaggio e compatibilità materiale sono opzioni separate dal layout. |
| [Plexiglass orizzontale](https://www.incisoriasacchetti.it/products/targa-plexiglass-orizzontale) | Formati in variante e opzione Misura personalizzata; spessori; fissaggi e bianco | Un unico fornitore di dimensioni può usare variante o input libero. Stessa famiglia di regole, senza copiare profilo/template per ogni formato. |
| [Fuoriporta OVS](https://www.incisoriasacchetti.it/products/fuoriporta-ovs) | Dimensioni in variante, lavorazione UV/incisione e fissaggio | Geometria del supporto separata da layout e processo. Regola esplicita del titolare: incollaggio oppure sole due viti. |
| [Divieto di sosta personalizzabile](https://www.incisoriasacchetti.it/products/cartello-divieto-di-sosta-personalizzabile) | Formato e materiale: lastra di alluminio oppure lamiera scatolata | La stessa grafica può conservare il proprio template; il cambio supporto modifica la politica dei fissaggi. Regola titolare: scatolato solo staffe. |
| [Cartello viario](https://www.incisoriasacchetti.it/products/cartello-viario-con-indicazione-del-numero-civico) | Formato e impaginazione a due/tre righe; attacco laterale incluso descritto nella scheda | Attacco incluso come eccezione configurata; non proporre automaticamente acquisti di staffe duplicati. Il prodotto è bifacciale, ma l’editor multipagina resta fuori ambito. |
| [Distanziatori Fisso](https://www.incisoriasacchetti.it/products/distanziatore-fisso) | Confezione da 4, varianti di finitura; scheda con vincolo sullo spessore del pannello | Accessorio commerciale e sua compatibilità distinti dal punto geometrico. Quantità e confezionamento vanno esplicitati. Il titolare ha autorizzato il riparto del costo della confezione: prezzo confezione / pezzi confezione × pezzi richiesti, dalla variante di finitura scelta e con arrotondamento sul totale. |
| [Collare 60 mm](https://www.incisoriasacchetti.it/products/collare-metallico-60) e [collare doppio](https://www.incisoriasacchetti.it/products/collare-metallico-doppio) | Compatibilità con scatolati, palo e quantità necessaria dipendente da alcuni formati | Regola di compatibilità/quantità dell’accessorio, non un nuovo template. Non estrapolare la regola dei formati elencati a tutte le dimensioni non descritte. |
| Portatarga Crystal/Info/Click Sign e simili presenti in Targhe | Supporti commerciali con formato e ferramenta propria | Ulteriore famiglia: area dell’inserto e montaggio del supporto possono differire dall’ingombro esterno. Non assimilarli automaticamente alle targhe piane da forare. |

## Discrepanze e dati ancora da verificare

Nella targa plexiglass a misura la descrizione indica 10×10 fino a 120×60 cm e spessori da 2 a 15 mm. **Il titolare ha confermato durante il lavoro che 120×60 cm è un refuso: escluderlo dalle specifiche.** Nei campi effettivamente osservati: larghezza min/max 100/700 mm, altezza 100/500 mm, pulsanti spessore 2/3/5/8. La targa orizzontale presenta inoltre un elenco varianti diverso dal riassunto descrittivo. Conservare separati descrizione, opzioni effettive, nominale e area grafica utile; niente correzioni automatiche dello store o limiti produttivi inventati.

I selettori BSS sono stati letti per capire il flusso, non adottati come API di integrazione. Gli identificativi osservati non diventano selettori operativi del nuovo editor. Le maggiorazioni visualizzate non sono il prezzo finale verificato e non vengono copiate in un motore prezzi nuovo.

## Modello raccomandato: composizione di regole, non copie

1. **Processo condiviso**: stampa o incisione, palette consentita, minimi e controlli. Le regole della punta da 0,5 mm/vernici a 30 mm riguardano le targhe incise; non tutte le targhe.
2. **Famiglia di supporto**: targa piana, fuoriporta, scatolato, portatarga/inserto. Stabilisce sagoma e fissaggi ammissibili; eventuali eccezioni di un modello aggiungono dati, senza copiare l’intero insieme di regole.
3. **Dimensioni**: fisse, derivate da una variante, oppure personalizzate entro intervalli verificati. Larghezza, altezza, forma e spessore sono dati della configurazione o della variante, non richiedono ciascuno un profilo distinto.
4. **Pacchetto fissaggi**: metodi ammessi, schemi geometrici, distanza iniziale 15 mm dal bordo al centro per le targhe dove applicabile, diametri/ingombri/rispetto verificati, riferimenti a prodotti/varianti accessorio e regole di confezionamento. Per fuoriporta: solo incollaggio o due viti; per scatolati: solo staffe, senza fori/adesivo. Non applicare ciecamente 15 mm a sagome con attacchi fissi non misurati.
5. **Template indipendente dalle misure commerciali**: contenuti, stili e regole di adattamento entro l’area utile risultante. Un template viene associato a famiglie/compatibilità, non copiato per 200×100, 250×150, 300×200 mm. Le eccezioni sono composizioni realmente differenti, non piccole variazioni di misura.

Il profilo che l’amministratore vede può essere un’unica scheda che riunisce riferimenti a questi blocchi. Le modifiche alle regole condivise devono produrre nuove versioni; le composizioni già confermate restano snapshot immutabili.

## Template adattabili: primo incremento e completamenti

Primo incremento locale disponibile: un template di targa si riutilizza per più misure con grafica centrata alle dimensioni originali, oppure proposta di riduzione proporzionale quando necessaria e valida nei limiti TEST. Anteprima e conferma prima dell’apertura, composizione cliente nuova e fonte/versione conservata; originale immutato.

Il completamento responsivo deve andare oltre questa prima operazione. Non dilatare indiscriminatamente tutta la grafica. Mantenere logo e proporzioni; margini/spessori in mm; ancoraggi ai bordi/centri; box di testo ridistribuibili; controlli minimi della lavorazione. Per differenze importanti di rapporto larghezza/altezza si possono definire varianti di disposizione nello stesso template (orizzontale/compatto/verticale), senza duplicazioni per ogni misura. Mostrare un’anteprima prima dell’adattamento che riduce contenuti; se non entra, chiedere correzioni o un formato adatto.

Sagome fuoriporta e aperture meccaniche richiedono geometrie reali: un nome “ovale” o “sagomata” non è sufficiente a ricostruirle con precisione. La geometria può essere riutilizzabile/parametrica, distinta dal template; non va inventata.

## Stato del codice di questa iterazione

Frontend parametrico locale `/editor/plaque?workspace=1&mode=customer`: misure e fissaggi nel documento canonico, punti ricalcolati, stessi comandi manuali/AI e Undo/Redo. Primo passaggio, non collegamento completo al negozio. Il titolare ha inoltre confermato: fuoriporta solo incollaggio o due viti; cartelli scatolati solo staffe, niente fori o incollaggio. Le famiglie fuoriporta/scatolato sono validate nel motore e filtrano le scelte. I simboli indicano posizioni e non ingombri fisici non noti; grafica SVG/PDF distinta dalle istruzioni di fissaggio in JSON. Riuso dei template su misure differenti implementato come centratura/riduzione proporzionale confermata, non ancora come impaginazione responsiva. Classificazione definitiva dei prodotti, sagome reali, regole produttive applicate al canvas e collegamento commerciale sono ancora da completare: il prototipo non deve farli apparire già attivi.

Calcolo del riparto implementato in `src/editor-workflow/accessory-cost.ts`, con unità monetarie intere e arrotondamento una sola volta sul totale della quantità. È provato con dati TEST, non ancora collegato a prezzi/varianti reali o mostrato come preventivo cliente. Il kit incluso deve restare distinto dagli accessori aggiuntivi.

## Provenienza delle misure — precisazione del titolare

Le dimensioni possono essere quelle tipiche della variante scelta oppure misure personalizzate lette dal modulo BSS. Non ricavarle automaticamente da titolo/descrizione e non fissarle dentro un template per ogni formato. Per i timbri resta valida la fonte autorevole già concordata dei metafield variante; per targhe/cartelli il mapping delle dimensioni della variante va censito per famiglia.

Il futuro adattatore riceve prodotto/variante correnti, modalità esplicita `variante` o `personalizzata BSS`, larghezza/altezza normalizzate in millimetri e provenienza. In modalità personalizzata valori BSS mancanti, obsoleti o non validi bloccano la conferma: nessun ripiego silenzioso sulle misure della variante. Le dimensioni nominali del supporto restano distinte dall’area grafica utile e dai margini del processo.

Le misure effettive entrano nel documento e nella configurazione confermata. Se vengono cambiate nell’editor, il futuro ritorno alla pagina prodotto dovrà riallineare i campi BSS e ricontrollare il preventivo sulla stessa revisione, prima dell’acquisto. Le configurazioni già confermate non cambiano. Questa precisazione definisce il contratto: il prototipo locale usa per ora input manuali; lettura/sincronizzazione del modulo BSS reale non è ancora implementata. Nessun selettore DOM o API BSS non verificata viene introdotto.
