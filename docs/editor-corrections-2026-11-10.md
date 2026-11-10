# Correzioni dal collaudo del 10 novembre 2026

Mandato esplicito: procedere con le correzioni del report e discutere i dubbi durante il lavoro. Fonti del collaudo: JSON/Markdown del titolare sulla Scrivania; non modificarle. 5 prove superate, 6 con problemi, 4 da verificare, 3 non completate. Illustrator risulta superato nel collaudo riferito dal titolare, non è una nuova verifica dell’agente e non certifica tutti i casi produttivi.

## Sequenza autorizzata

1. Salvataggio manuale con associazione al record aperto e controllo della versione; nuovo progetto distinto da sovrascrittura. Azioni in alto a destra: ricarica originale, chiudi senza salvare, conferma e chiudi. Autosalvataggio limitato a recupero d’emergenza, mai modifica automatica del template archivio. Miniature bozze. Riapertura JSON dal formato nel documento, anche con associazione non più disponibile; nessuna associazione inventata.
2. Modalità cliente/amministratore/test distinte, sfondi #e0f4ff/#fff5e6/#e3e3e3; strumenti tecnici e amministrativi separati dagli strumenti grafici. Font in ordine alfabetico, eliminazione esplicita di font e design, risorse incorporate nei progetti conservate. Correzione gesti delle zone e controlli numerici utilizzabili.
3. Profili duplicabili, più varianti dello stesso prodotto condivise quando le regole sono comuni, eliminazione ambiguità dell’associazione TEST. Schemi fissaggi a metà dei lati e ai quattro angoli, accessori riferibili a prodotti/varianti Shopify senza prezzi inventati. Export PDF locale, amministratore sempre abilitato; cliente governato da impostazione disattiva per default.

## Confini e assunzioni

Profili fisici separati dal layout dei template. Zone multiple già consentite, da rendere più evidenti; lo strumento amministrativo non equivale ancora a vincoli produttivi del canvas. Consultazione del catalogo da cache pronta, aggiornamento separato: nessuna promessa di velocità derivante dal semplice deploy. Il passaggio cliente alla pagina prodotto con progetto allegato è ancora integrazione online futura; mostrare un riepilogo locale senza modificare il negozio. La doppia parola “backend” nel report sui pulsanti è interpretata come amministrazione→amministrazione, cliente→prodotto/riepilogo locale.

Nessun deploy, migrazione, scrittura Shopify/BSS/PitchPrint/prezzi/carrello/checkout, chiamata AI reale o acquisto. Conservare file personali, template, font e bozze; test con archivi temporanei, cancellazioni solo implementate e provate su dati TEST, mai eseguite sui dati del titolare.

## Chiarimento durante il lavoro: targhe a misura

Il titolare precisa che quasi tutte le targhe condividono regole e fissaggi a prescindere dalla dimensione. Non creare un profilo per ogni misura: il profilo definisce lavorazioni, intervalli dimensionali e fissaggi consentiti; il cliente sceglie nell’editor misure, colla senza fori, viti, distanziatori Midi/Maxi, disposizione e distanze. Distanza iniziale 15 mm dal bordo al centro, modificabile; preview dinamica di fori/viti/distanziatori. La configurazione concreta fa parte del documento salvato e degli snapshot, non è una modifica al profilo. Non inventare diametri, ingombri, limiti dimensionali reali o prezzi di accessori. La costruzione del frontend parametrico rientra nel lavoro corrente; l’integrazione commerciale online rimane separata.

Chiarimenti successivi del titolare: fuoriporta soltanto incollaggio oppure due viti; cartelli scatolati soltanto staffe, nessun foro o incollaggio. Il valore 120×60 cm nella descrizione della targa è un refuso confermato e non va usato nelle specifiche. Campi correnti osservati e dati produttivi verificati restano distinti; nessuna modifica della pagina pubblicata autorizzata. Analisi del negozio in [studio catalogo](editor-catalog-signage-study-2026-11-10.md).

Il titolare autorizza il riparto del prezzo degli accessori venduti in confezione: prezzo della variante/confezione diviso numero pezzi e moltiplicato per la quantità richiesta; arrotondare il totale finale. Non serve acquistare una confezione intera per la sola logica di costo del configuratore. Non cambia prezzi/varianti Shopify e non autorizza scritture commerciali.

## Incremento realizzato e limiti

Sessioni cliente/admin/test separate; salvataggio manuale esplicito, aggiornamento versionato del record aperto, ricarica/uscita confermate, recupero d’emergenza con miniature. Il cliente conferma una composizione indipendente: il ritorno effettivo al prodotto Shopify con progetto allegato resta futuro; oggi compare un riepilogo locale. Font/design eliminabili con conferma, ordine alfabetico e recupero dei JSON senza dipendere dal formato selezionato. Cancellazioni provate soltanto su archivi temporanei.

Zone con gesto stabile dopo scroll, copie di profili indipendenti e associazione a più/tutte le varianti dello stesso prodotto. Catalogo con risposta immediata dalla cache disponibile e aggiornamento in secondo piano. La prima lettura senza cache richiede ancora la connessione.

Targhe parametrizzate nel documento: misure, metodo e disposizione dei fissaggi, distanze dal bordo; popup dedicato **Prodotto e fissaggi** nelle modalità cliente/admin. Famiglie fuoriporta/scatolati validate. Un template di targa serve più misure mediante centratura o riduzione proporzionale confermata in anteprima; non occorre duplicarlo per ogni misura. Le regole di impaginazione responsiva e i profili reali non sono ancora applicati al canvas.

PDF locale amministrativo e opzionale cliente, pagina normalizzata alle misure fisiche con qpdf senza scalare la grafica. Marcatori fissaggi esclusi dai file grafici; presenti nel documento e nel riepilogo. Modalità dell’URL e opzione PDF non sono un sistema di autenticazione per la produzione.

Riparto confezioni realizzato come funzione deterministica verificata; resta da collegare al prezzo della variante accessorio e alle maggiorazioni BSS mediante l’adattatore commerciale. Nessun prezzo fittizio viene presentato al cliente.

Ricollaudo: [passi aggiornati](editor-retest-2026-11-10.md). Le prove del titolare sul report originale restano immutate; risultati automatici e limiti sono nello [stato locale](editor-local-status.md).

## Provenienza delle misure — precisazione del titolare

Le dimensioni possono essere quelle tipiche della variante scelta oppure misure personalizzate lette dal modulo BSS. Non ricavarle automaticamente da titolo/descrizione e non fissarle dentro un template per ogni formato. Per i timbri resta valida la fonte autorevole già concordata dei metafield variante; per targhe/cartelli il mapping delle dimensioni della variante va censito per famiglia.

Il futuro adattatore riceve prodotto/variante correnti, modalità esplicita `variante` o `personalizzata BSS`, larghezza/altezza normalizzate in millimetri e provenienza. In modalità personalizzata valori BSS mancanti, obsoleti o non validi bloccano la conferma: nessun ripiego silenzioso sulle misure della variante. Le dimensioni nominali del supporto restano distinte dall’area grafica utile e dai margini del processo.

Le misure effettive entrano nel documento e nella configurazione confermata. Se vengono cambiate nell’editor, il futuro ritorno alla pagina prodotto dovrà riallineare i campi BSS e ricontrollare il preventivo sulla stessa revisione, prima dell’acquisto. Le configurazioni già confermate non cambiano. Questa precisazione definisce il contratto: il prototipo locale usa per ora input manuali; lettura/sincronizzazione del modulo BSS reale non è ancora implementata. Nessun selettore DOM o API BSS non verificata viene introdotto.

## Risposte ai dubbi del report

- **Salvataggio e copia:** l’archivio cambia soltanto con un comando esplicito. Conferma aggiorna il record amministrativo aperto; Salva copia crea un’altra voce. Il recupero del browser non sovrascrive l’archivio. Il cliente che parte da un template salva un proprio progetto.
- **Profili e modelli del template:** il profilo raccoglie regole fisiche, il template raccoglie grafica e compatibilità. I tre modelli TEST non sono il catalogo reale; l’associazione a prodotto/varianti reali nella scheda del profilo è già disponibile, la loro applicazione al canvas è ancora da completare. Si deve condividere una politica fra misure/modelli simili, non clonare tutto per ogni misura.
- **Zone multiple:** sono consentite; il disegno e le copie di profili sono ora più espliciti e i gesti dopo scroll sono stati corretti. Zone del template e vincoli fisici del prodotto rimangono distinti.
- **Lentezza catalogo:** la copia già letta viene restituita subito; il refresh continua separatamente. La prima sincronizzazione richiede comunque la connessione. Il solo spostamento online non garantisce la velocità, che andrà misurata.
- **Dati dei font:** nome/stile/peso e file servono per una resa coerente. Provenienza, licenza e note aiutano a identificare il file e recuperarne le condizioni d’uso; restano in dettagli secondari nel backend, non nel percorso cliente. Non serve compilarli manualmente per disegnare.
