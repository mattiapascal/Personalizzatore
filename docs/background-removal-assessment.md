# Rimozione sfondo a colori / AI — valutazione, 9 novembre 2026

**Decisione successiva del titolare: rimozione sfondo dalle immagini a colori in sospeso.** Non implementare né attivare modelli/API per tale funzione finché il titolare non la riapre. Il riconoscimento dei grigi e la rimozione locale del bianco restano autorizzati e implementati.

Il titolare autorizza la valutazione; vuole scegliere se procedere prima di implementare la rimozione degli sfondi realmente colorati. La generazione di nuove immagini resta esclusa. Nessun account, upload, modello scaricato, abbonamento o chiamata AI attivato durante questa ricerca.

## Cosa sappiamo di PitchPrint

La [pagina ufficiale Remove Background](https://pitchprint.com/docs/tutorial/remove-background) descrive esplicitamente un sistema AI ancora indicato come beta e in addestramento. Non identifica in quella pagina il modello, il fornitore o un costo per operazione: non dedurre che usi OpenAI o remove.bg, né promettere la stessa qualità senza confronto.

## Opzioni concrete

| Strada | Costo dell’operazione | Lavoro e limiti |
| --- | --- | --- |
| Bianco/nero o grigi | Zero token e nessun servizio: implementato localmente con alpha proporzionale | RGB neutri riconosciuti dai pixel originali, non dal nome/MIME del file. Non separa un soggetto fotografico dallo sfondo |
| Colore uniforme campionato, con tolleranza e aree connesse ai bordi | Zero token, solo calcolo locale | Sviluppo contenuto; anteprima, regolazione e maschera non distruttiva. Scarsa separazione se soggetto e sfondo hanno colori simili. Proposta, non implementata |
| Modello di segmentazione nel browser | Zero token API; calcolo sul dispositivo | Download iniziale del modello/runtime, memoria e tempi da misurare su Mac e mobile; licenza codice/pesi da verificare prima di adottare una dipendenza |
| Servizio AI specializzato | Tipicamente prezzo per immagine, non token della chat | Upload esplicito al fornitore, backend con chiave privata, limiti di spesa e caching; qualità da confrontare sui propri casi |

Esempio per il calcolo locale: il [repository ufficiale IMG.LY](https://github.com/imgly/background-removal-js) offre rimozione nel browser/Node e indica AGPL con altre opzioni di licenza da richiedere al fornitore. Non è stato aggiunto al progetto. Non assumere che una libreria gratuita sia automaticamente adatta alla futura distribuzione commerciale; verificare separatamente codice e pesi scelti.

Esempio di servizio: [Photoroom API](https://www.photoroom.com/api/pricing) indica un prezzo Basic di **0,02 USD per immagine** per Remove Background, con esempio di piano **20 USD per 1.000 immagini**. È un listino di servizio, non il costo di token della chat. La stessa pagina indica 10 chiamate di produzione gratuite alla creazione dell’account e un sandbox dell’Image Editing API con watermark; sono offerte diverse. Nessun account o test effettuato. Prezzi/condizioni da ricontrollare prima di un’attivazione.

Non proporre ora una nuova integrazione remove.bg come scelta predefinita: il [comunicato ufficiale Leonardo](https://leonardo.ai/news/removebg-api-leonardo) annuncia la migrazione delle API a Leonardo, con account/chiavi e prezzi da valutare separatamente. Non riguarda le credenziali del progetto attuale.

Fonti tecniche per l’alternativa senza AI: [OpenCV floodFill](https://docs.opencv.org/4.x/d7/d1b/group__imgproc__misc.html), regioni connesse con tolleranza; [OpenCV GrabCut](https://docs.opencv.org/4.12.0/d8/d83/tutorial_py_grabcut.html), estrazione interattiva con eventuali ritocchi. Questi strumenti non sono installati né usati dall’editor.

## Proposta per una prova autorizzabile

Prima confrontare su 10–20 campioni concordati: loghi con bianco e grigi, oggetti colorati su sfondo uniforme, immagini con fori e dettagli fini, fotografie con sfondo complesso. Separare la qualità della maschera dalla conversione binaria del profilo TEST. Per ogni candidato registrare tempo iniziale/successivo, memoria su desktop/mobile, qualità dei bordi, trasparenze, errori e costo nominale.

Prima scelta da valutare: modello locale compatibile con la destinazione commerciale, per eliminare il consumo di token/API. Un servizio a pagamento rimane l’alternativa se qualità o prestazioni non bastano. Nessuna affermazione di parità con PitchPrint finché il confronto non è eseguito.

L’eventuale integrazione dovrà aggiungere una maschera derivata e versionata alla sorgente immutabile, applicata tramite lo stesso comando e revisione del documento. Il risultato di una richiesta obsoleta deve essere scartato; ripristino e Undo devono ricostruire l’originale. Il semplice riempimento alpha del grigio non viene rietichettato come rimozione AI.
