# Incremento — selezione e canvas, 5 novembre 2026

## Piano e assunzioni prima delle modifiche

La prova dell'utente richiede un percorso continuo fra scelta del timbro e composizione. Il codice attuale contiene due prove indipendenti, un parser a parole chiave e uno snapshot statico: nessun LLM o aggiornamento Shopify automatico è attivo.

1. Aprire il canvas dal candidato reale, associando Product/Variant ID, versione catalogo e dimensioni nominali. La variante del campione è un riferimento, non una selezione di acquisto. Area utile e vincoli produttivi restano da confermare.
2. Modificare il testo direttamente nel canvas tramite IText, anche su più righe. Il gesto produce `setText` nello stesso store usato dai comandi strutturati. Validare alla fine della scrittura; rifiuti ripristinano la scena precedente. Durante la scrittura non esportare uno stato intermedio.
3. Cambiare prodotto conservando oggetti e ID soltanto se entrano nella nuova area TEST; in caso contrario conservare il documento precedente e spiegare il conflitto. Non rimpicciolire font o deformare oggetti per forzare il passaggio. Dopo un cambio prodotto riuscito ricomincia lo storico undo, per non ripristinare un prodotto diverso da quello mostrato.
4. Impedire import JSON associati a un prodotto differente. Le fixture storiche senza associazione possono essere adottate nel prodotto corrente solo con la stessa area nominale e nuova validazione.
5. Verificare integrazione, input diretto, rollback, comandi obsoleti, cambio modello e SVG fisico con test automatici. Illustrator rimane un collaudo umano aperto.

Rischi: dimensioni nominali diverse da area utile; tag No-AI non chiarito; metriche testo/font; tastiere mobili da provare su dispositivi reali. Nessun trasferimento di grafica alla pagina Shopify in questo incremento.

## AI e catalogo: comportamento richiesto per il seguito

L'interpretazione a parole chiave serve esclusivamente per esercitare il contratto e non soddisfa il requisito conversazionale. Il prossimo incremento deve collegare un LLM lato server con output strutturati, contesto dei requisiti e domande mirate, quindi eseguire gli stessi tool validati. Un LLM deve gestire errori e ambiguità chiedendo conferma, senza inventare specifiche. Preparare un insieme di frasi reali, refusi, negazioni, richieste contraddittorie e cambi di idea con esiti attesi. Chiavi solo server, limiti di consumo, modello/provider e budget da configurare; non attivare chiamate a pagamento implicitamente.

Il catalogo attuale NON si aggiorna da Shopify. Per sviluppo: lettura autenticata esplicita e snapshot versionato, con differenze verificabili. Per servizio futuro: import iniziale, notifiche di creazione/modifica/eliminazione dei prodotti, coda e rilettura canonica, cache aggiornata atomicamente; verifica firma, deduplicazione e riconciliazione periodica. Un prodotto eliminato, archiviato o non più pubblicato va escluso dalle nuove proposte. I profili tecnici non devono essere dedotti dal nome: nuovi modelli senza dati sufficienti rimangono da revisionare. Un progetto aperto conserva la versione usata e segnala variazioni incompatibili prima di continuare.

Non tutti i cambi di pubblicazione sul canale Online Store producono notifiche di pubblicazione verso un'app terza: non basare la validità dei candidati solo su quelle notifiche. La riconciliazione deve verificare nuovamente la pubblicazione effettiva. Gli aggiornamenti del prodotto stesso sono notificabili tramite `products/create`, `products/update`, `products/delete` con accesso `read_products`.

Riferimenti ufficiali consultati: [IText Fabric](https://www.fabricjs.com/api/classes/itext/), [sottoscrizioni webhook Shopify](https://shopify.dev/docs/apps/build/webhooks/subscribe), [topic e limitazioni dei canali](https://shopify.dev/docs/api/admin-graphql/2026-10/enums/WebhookSubscriptionTopic), [verifica e duplicati](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries). Nessuna sottoscrizione o app registrata durante questo incremento.

## Consegna dell'incremento

Implementati i punti canvas 1–4. Il JSON include l'associazione commerciale conservando il profilo grafico TEST distinto; import del golden storico ancora supportato sul 4913. Il testo si scrive nel canvas e i tool simulati sono in un pannello sviluppatore. AI reale e sincronizzazione rimangono da implementare, con stato esplicito anche nell'interfaccia. Verifiche effettive in [test-results.md](test-results.md).
