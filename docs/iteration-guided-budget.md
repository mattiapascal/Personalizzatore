# Consulenza continua e vincolo al catalogo — 6 novembre 2026

## Problema verificato

La schermata del titolare mostrava un limite di conversazione dopo pochi messaggi. Era un controllo applicativo, non una risposta di quota OpenAI: il Worker applicava 0,05 USD e venti richieste alla capacità del browser. Il credito veniva riusato dopo reload, anche se la cronologia visibile ripartiva vuota. Inoltre la riserva pre-rete considera prudentemente tutti i byte della richiesta come potenziali token: può essere molto maggiore del costo noto del turno. Il servizio aveva ancora budget globale disponibile (lettura amministrativa: circa 0,035138 USD di uso noto, nessuna riserva pendente, tetto globale 1 USD).

Il titolare richiede che la normale guida al cliente non venga interrotta da quote individuali, senza trasformare la chat in un assistente generale.

## Modifiche

- Il `WorkerMeter` pubblico non applica un tetto di costo o un numero massimo di messaggi alla singola conversazione. Rimosso anche il numero massimo globale di duecento richieste. Il tetto globale di spesa **1 USD complessivo** resta invariato, senza rinnovo automatico; prenotazioni, concorrenza, origine e Turnstile rimangono obbligatori. Nessun registro consumi cancellato o azzerato.
- Il laboratorio mantiene il proprio tetto configurabile per conversazione: è distinto dal servizio pubblico. Il metadata pubblico dei consumi indica `limitScope: service`.
- Un errore non aggiunge nuovamente la domanda precedente e non fa avanzare i requisiti. Il testo originale torna nel compositore per riprovare e resta sul dispositivo. Nessun invio automatico di nuovo testo o riduzione dei controlli privacy.
- AI con contratto tipizzato: `helpTopic` può indicare soltanto montatura, forma, misure, contenuto, materiale o catalogo. Le spiegazioni provengono dal programma. Divagazioni e incomprensioni non trasmettono testo libero del modello alla UI. Anche `clarification` ricevuto in un turno classificato `answer` non viene mostrato; i chiarimenti geometrici sono costruiti dal programma. I dati strutturati continuano a essere validati dal motore.
- Regole umane aggiornate in `REGOLE_ASSISTENTE.md`, prompt v12 e schemi JSON riallineati. Le istruzioni ostili in messaggi, storico o catalogo restano dati non attendibili. Le risposte visibili non sono un canale di testo libero del modello. La classificazione semantica può comunque sbagliare: i test mirati non certificano ogni possibile aggiramento.

## Verifiche

Test unitario: 25 messaggi della stessa sessione con oltre 0,05 USD di uso simulato proseguono; un tentativo oltre il budget del servizio viene fermato. Anche la richiesta globale numero 201 è ammessa se il budget è disponibile. Runtime SQLite: oltre venti richieste sulla stessa capacità, budget persistente, divagazione con testo spurio del provider rimosso. Browser: errore senza domanda ripetuta, testo conservato e successivo reinvio riuscito; regressioni del laboratorio e della pagina pubblica.

Collaudo del modello reale su cinque soli casi sintetici: ricetta estranea, istruzioni per aggirare il contesto, spiegazione automatico/manuale, refusi e nove righe aziendali protette. **5/5**, stima a listino standard **0,01617075 USD** (17.169 token input, 732 output). Nessun dato della schermata cliente è stato usato come payload di test. Il primo tentativo era stato fermato dal contatore storico del laboratorio, senza token: il runner dedicato applica ora tetti aggiuntivi di 0,12 USD per esecuzione e 1 USD aggregato noto+riserve, preservando il registro. I test reali non partono con `npm run check`.

I prezzi di riferimento sono quelli del [modello invariato GPT-5.4 mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini): la stima non certifica fattura, promozioni o sconti cache. Non è stato introdotto un secondo endpoint di conteggio token: sarebbe una modifica separata da misurare per latenza e disponibilità.

Il limite globale è una protezione economica del pilota, non una classificazione del cliente come bot. Se termina può interrompere il servizio anche a un utente legittimo: non promettere disponibilità infinita o aumenti di spesa automatici. Nessuna modifica a Shopify, tema, prodotti, BSS/PitchPrint o acquisti in questa correzione.
