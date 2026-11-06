# Destinazione iniziale: Cloudflare Workers Free

Decisione del titolare, 6 novembre 2026: preparare il primo pilota per il piano gratuito; valutare il piano Paid soltanto se le misure ne mostrano la necessità. L'assenso al percorso non è un'autorizzazione a pubblicare, attivare canoni o creare risorse remote.

## Stato verificato

- Account Cloudflare già aperto dal titolare in Brave; accesso al pannello verificato in sola lettura. Nessun token richiesto o copiato, nessuna impostazione modificata. Identificativi account e sessioni browser non vengono salvati nel repository.
- Applicazione ancora locale: nessun Worker/backend Cloudflare implementato o distribuito in questa iterazione, nessuna risorsa o rotta creata. Il tema e il suo repository non sono stati modificati.
- Il prompt è ora compilato da `REGOLE_ASSISTENTE.md` in un modulo TypeScript senza filesystem a runtime: un primo componente riutilizzabile su Workers. Il resto del backend usa ancora file/lock e servizi del processo Node; non va presentato come già compatibile.

## Adattamento previsto

1. Separare contratto AI e trasporto HTTP da Vite e dal registro su file. Il Worker espone solo gli endpoint cliente necessari, senza i controlli amministrativi del laboratorio.
2. Configurare segreti solo lato server. Nessuna variabile segreta `VITE_*`, niente token negli asset tema o nel documento di regole.
3. Rendere persistenti catalogo e consumi. Candidato da provare: Durable Object con backend SQLite per prenotazioni atomiche dei costi e quote; snapshot catalogo separati/versionati, con storage da scegliere dopo misura di dimensioni e operazioni. Non usare memoria del Worker o cache eventualmente consistente come autorità del budget.
4. Sostituire timer di processo con aggiornamento pianificato. Import paginato, ripresa del lavoro e pubblicazione atomica dell'ultima versione completa; un errore conserva la precedente. Misurare anche le pagine più pesanti e il ricostruire i profili.
5. Provare localmente runtime Workers con trasporti finti e catalogo TEST: riavvio/persistenza, richieste concorrenti, tetti globali e per sessione, timeout, import parziale e catalogo obsoleto. Non copiare automaticamente chiavi dal laboratorio o chiamare servizi reali nei test.
6. Aggiungere verifica antiautomazione lato server e sessioni non aggirabili con un semplice reset; valutare app proxy separatamente. Le firme del negozio non identificano il cliente. Origine consentita e CORS non sostituiscono controllo del budget o autenticazione.
7. Preparare manifest frontend/API, configurazione Free, checklist, piano di ripristino e diff minimo tema. Sottoporre il pacchetto al titolare prima di qualunque creazione risorse, caricamento o attivazione online. Nessun collegamento Git→deploy automatico.

## Criteri per restare sul Free

La documentazione verificata il 6 novembre 2026 indica 100.000 richieste Worker/giorno e 10 ms di CPU per invocazione HTTP **e Cron**. Il tempo di attesa della rete non conta come CPU: una chiamata AI lenta non implica da sola il superamento, mentre validazione, import e trasformazione del catalogo vanno misurati. La misura su Node locale non certifica il consumo del runtime Cloudflare.

Durable Objects SQLite sono disponibili sul Free con quote proprie; non assumere che il totale gratuito dell'app coincida con le sole richieste Worker. Se si supera una quota del piano gratuito le operazioni possono fallire; prevedere un messaggio utile e il percorso normale ai prodotti. Il piano Paid può dare più margine di risorse, ma non rende più intelligente il modello AI. Non attivare upgrade automatici.

L'hosting gratuito non include automaticamente i token OpenAI. Conservare un tetto AI globale oltre a quello per chat. Il controllo account esistente e gli eventuali token promozionali richiedono verifica separata; nessuna gratuità AI garantita.

Prima di confermare Free come adatto al pubblico servono misure reali controllate di CPU e quote, verifica di persistenza, privacy, abusi e comportamento quando la quota termina. Il solo superamento dei test locali non è sufficiente. Il passaggio a Paid resta una decisione esplicita del titolare.

Fonti ufficiali: [limiti Workers](https://developers.cloudflare.com/workers/platform/limits/), [quote Durable Objects](https://developers.cloudflare.com/durable-objects/platform/pricing/). Architettura del rilascio e regole dei due Git: [publication-plan.md](publication-plan.md).
