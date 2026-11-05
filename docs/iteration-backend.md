# Incremento backend locale — 5 novembre 2026

## Piano prima delle modifiche

Autorizzato il proseguimento dopo il collaudo del canvas. Repository pulito e allineato a GitHub. Nel processo di sviluppo non sono presenti `OPENAI_API_KEY` o credenziali Admin Shopify; non cercare o copiare segreti dagli altri progetti. Il connettore Shopify della conversazione non fornisce automaticamente credenziali al server locale.

1. Aggiungere API locali nel server Vite: configurazione solo server, stato collegamenti, richieste JSON limitate, controllo origine/host e token di sessione locale, timeout, quote e registro dei consumi senza prompt.
2. Collegare un provider OpenAI sostituibile via Responses/function calling strict. Un solo tool di raccolta requisiti, contesto strutturato e ultima domanda, supporto correzioni/cancellazione attributi e domanda di chiarimento. Nessun prodotto, prezzo o dato del catalogo inviato al modello. Revisioni applicate e controllate dal server/client.
3. Registrare modello e prompt versionati. Modello iniziale configurabile `gpt-5.4-mini-2026-03-17`, verificato su documentazione ufficiale; chiave, abilitazione esplicita e budget necessari per attivare chiamate reali. Nessun costo attivato solo creando i file.
4. Aggiungere lettura Admin GraphQL paginata, limitata ai timbri dalla query configurata; import completo atomico con hash versione. Riutilizzare solo profili tecnici già censiti; nuovi prodotti e variazioni delle dimensioni nominali richiedono revisione, senza inferenze dal titolo. Escludere prodotti assenti/archiviati/non pubblicati e varianti non più valide. Aggiornamento manuale e periodico a server aperto; nessuna sottoscrizione webhook o deploy.
5. Collegare la UI a stato backend/catalogo. Distinguere modalità AI reale, demo esplicita e servizio non disponibile. Applicare aggiornamenti catalogo con conferma per conservare i progetti aperti e rivalutare requisiti, senza azzerare bozze silenziosamente.
6. Test con trasporti HTTP controllati, inclusi paginazione, errori, rate limit, quota persistente, output AI malformati, refusi/negazioni come casi per valutazione reale, revisioni e UI completa. Separare risultati di contratto da qualità linguistica non ancora misurata su un LLM.

Conferme richieste in parallelo allo sviluppo: budget di collaudo e significato del tag No-AI. Quest'ultimo non richiede inviare il catalogo al provider: il modello non riceverà titoli, tag, ID o descrizioni prodotto in questo incremento. Il consenso all'uso pubblico e i vincoli produttivi restano gate distinti.

Rischi e confini: API solo loopback/dev, non un servizio pubblicabile; `store:false` non equivale a zero retention del provider; import parziali non sostituiscono un catalogo valido; in assenza di aggiornamento il dato ha una data visibile, non viene dichiarato attuale. Webhook e servizio persistente per produzione richiedono il successivo ambiente autorizzato.

Riferimenti: [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling), [modello e prezzi](https://developers.openai.com/api/docs/models/gpt-5.4-mini), [Shopify products](https://shopify.dev/docs/api/admin-graphql/2026-10/queries/products), [Product.onlineStoreUrl](https://shopify.dev/docs/api/admin-graphql/2026-10/objects/Product#field-Product.fields.onlineStoreUrl).

## Conferme e ampliamento durante il lavoro

Il titolare ha autorizzato **massimo 2 EUR** per i test e ha chiarito che **No-AI riguarda esclusivamente le funzioni generative PitchPrint**, non questo assistente. Ha configurato personalmente chiave OpenAI e token Admin in `.env.local`; accessi verificati senza mostrare valori segreti. Le richieste reali di collaudo usano solo esempi inventati.

Ulteriori richieste: chat che continui a fare domande fino ai criteri necessari, eliminazione dei form esterni e schema rosso/verde sotto la chat. Implementati in `SelectionChat`: prodotto, montatura, forma e misure. Righe/logo annotati se forniti; le misure ignote restano da verificare graficamente. Al modello sono stati aggiunti brevi estratti degli ultimi sei scambi per gestire risposte di chiarimento come «millimetri» riferite a numeri già indicati. Questa evoluzione supera il punto iniziale che prevedeva solo l'ultima domanda.

## Esito

Backend e provider reali collegati; lettura catalogo riuscita, 3 modelli con profilo TEST e 211 pubblicati da censire. Nessuna app registrata o scrittura Shopify. Collaudo reale del dialogo completato (quattro risposte fino ai candidati 4913/4915) e regressioni automatiche documentate in `test-results.md`.

Resta lavoro produttivo: profili tecnici/varianti, copertura di richieste reali e errori statistici del modello, Illustrator, import loghi e comandi grafici AI naturali, servizio persistente/webhook, accessibilità e privacy. Non dichiarare questo incremento un editor completo o un assistente per tutti i 214 prodotti individuati.
