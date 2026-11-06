# Primo rilascio nel tema — proposta, 6 novembre 2026

Stato: piano verificabile, non autorizzazione a pubblicare, installare app, attivare servizi a pagamento o modificare il tema. Nessuna operazione Shopify, DNS, account hosting o scrittura nel repository tema eseguita. Correzioni editoriali richieste registrate in [next-release.md](next-release.md).

## Ambito consigliato

Primo rilascio: una pagina pilota con assistente, riepilogo essenziale, anteprime e link ai prodotti attuali. Il cliente prosegue nei percorsi BSS/PitchPrint già esistenti. L'editor Fabric rimane nel laboratorio fino al collaudo produttivo di file, font, area utile e compatibilità Illustrator. Nessun trasferimento grafico/opzioni al carrello incluso. Se il titolare vuole rendere pubblico anche il canvas, serve un ambito e collaudo separato; non si presenta l'export TEST come file di produzione.

## Audit locale e repository

Personalizzatore: base pulita `9730b97` su `main`, repository `mattiapascal/Personalizzatore`. UI, motore, contratti, test, backend e futuro adattatore hosting restano qui come fonte autorevole.

Tema: `/Users/davide/Documents/Shopify/Temi/Mode mio 5.2.0`, cartella pulita su `master` a `dc11b47`. Il tracking **già presente in locale** punta a `origin/master` `e465ac6`; divergenza 0 avanti / 12 indietro. Nessun fetch nel repository tema durante questo audit, quindi non è una conferma dello stato attuale del remoto o del tema pubblicato. Tra i commit del tracking ci sono modifiche a breadcrumb/ricerca, barra annunci e recupero progetti PitchPrint: la vecchia base non va usata per copiare un intero tema online.

Letti gli aggiornamenti iniziali e le regole di `MIGRAZIONE_MODE_5_2_0_HANDOFF.md`, e consultato anche il documento nel tracking `origin/master`. Nessun `AGENTS.md` trovato nel percorso del tema o nei suoi genitori ispezionati. Regole rilevanti:

- Commit piccoli e tematici; interventi generali separati dalle funzioni specifiche di altri progetti.
- Aggiornare `MIGRAZIONE_MODE_5_2_0_PERSONALIZZAZIONI.md` per ogni nuova personalizzazione, con scopo, file e note di migrazione.
- Aggiornare l'handoff e indicare pagine, comportamento atteso e regressioni da provare.
- Validazione Liquid/Theme Check e test specifici della funzione quando si scrive codice tema.
- Nessuno ZIP o `shopify theme push` senza richiesta esplicita. L'handoff assegna normalmente i caricamenti al titolare. Push Git e pubblicazione sono fasi distinte.

Workflow proposto: nuovo fetch e verifica della base, poi ramo/worktree isolato `feature/ai-stamp-assistant` dalla base remota verificata. Non si aggiorna o sovrascrive la cartella corrente alla cieca. Nel tema entrano solo sezione/template e piccoli asset di integrazione dell'assistente, oltre ai documenti obbligatori. Non si uniscono i Git, non si copiano `server/`, chiavi, `.local/` o tutto il laboratorio nel tema.

Ogni versione pubblicabile del Personalizzatore produce un pacchetto frontend ripetibile e un manifest con commit sorgente, versione API e hash degli asset. Un commit tematico nel Git del tema adotta quella versione e registra il riferimento. Per aggiornare soltanto backend/regole compatibili non serve una modifica tema; per un nuovo frontend si aggiorna il riferimento o il pacchetto attraverso un commit controllato. Nessun deploy automatico ad ogni push su `main`/`master`.

## Architettura minima di rilascio

Il tema contiene una sezione dedicata che carica l'interfaccia pubblica solo nella pagina pilota. CSS/DOM isolati (preferenza: componente con Shadow DOM) per evitare che gli attuali selettori globali `header`, `nav`, `button` o `main` interferiscano con Mode. Niente inserimento del laboratorio completo in `theme.liquid` o modifica degli script BSS/PitchPrint.

Il backend deve essere online e autonomo: attualmente le API sono un plugin del server di sviluppo Vite, limitato a localhost. La build genera solo asset frontend. Vanno estratti un ingresso HTTP di produzione, configurazione segreti server, endpoint pubblici ridotti e persistenza affidabile. Il computer del titolare non deve rimanere acceso.

Per le richieste del tema è preferibile valutare un **app proxy Shopify** autenticato; richiede configurazione di un'app e scope `write_app_proxy`, da autorizzare separatamente. La firma identifica il negozio, non il visitatore, quindi non sostituisce sessioni, antiautomazione e limiti di spesa. Alternativa iniziale: backend HTTPS dedicato, challenge verificata dal server, sessioni e controlli origine; CORS o un nonce pubblico da soli non costituiscono autenticazione. [Proxy](https://shopify.dev/docs/apps/build/online-store/app-proxies), [autenticazione](https://shopify.dev/docs/apps/build/security/app-server/authenticate-every-request).

## Lavoro necessario prima del pubblico

1. Versione cliente dell'interfaccia e correzioni editoriali; esclusione diagnostica e pulsanti di laboratorio. Frontend/API pubblici non devono esporre gli elenchi interni di prodotti sospesi o configurazioni del titolare.
2. Servizio HTTP, segreti server e storage per catalogo/registro. Adattare la singola chiamata AI globale e i limiti oggi di processo a sessioni concorrenti controllate; limite globale oltre a quello per chat, protezione dai reset di sessione usati per aggirare la quota.
3. Aggiornamento catalogo indipendente dal laptop, tramite scheduler e riconciliazione; webhook eventuali richiedono nuova configurazione autorizzata. Conservare versioni, import atomico e gestione del catalogo obsoleto.
4. Collaudo privacy sui payload e sulle due destinazioni dei dati, controllo log/retention e testo informativo pubblico. Il filtro attuale è euristico: la promozione alla produzione non è certificata dai soli 42 esempi TEST. Verificare le impostazioni di condivisione dell'account AI prima di traffico reale, senza cambiarle automaticamente.
5. Test su copia/anteprima del tema, collisioni CSS, mobile e percorso chat→prodotto. Nessuna modifica a opzioni, varianti, prezzi, carrello o checkout. Pagina inizialmente non promossa; fallback alle pagine prodotto quando l'AI non è disponibile.
6. Consegna concreta: diff dei soli file tema, versione app/API e hash, checklist mirata, budget configurato e rollback. Pubblicazione e attivazione del canone solo dopo autorizzazione esplicita. Rollback: disattivare la sezione/pagina pilota o ripristinare la versione precedente dei soli asset introdotti.

## Hosting e costi verificati

Importi in USD, consultati il 6 novembre 2026; esclusi imposte, eventuale dominio aggiuntivo, sviluppo iniziale ed extra oltre le quote. Nessun piano attivato.

| Strada | Canone indicativo | Impatto sul codice |
|---|---:|---|
| Cloudflare Workers Free | 0 entro quote | Richiede adattare storage/lock su file e timer al runtime, non caricamento diretto dell'app Node |
| Cloudflare Workers Paid | Da 5/mese, più extra oltre le quote | Stesso adattamento; margine operativo maggiore |
| Servizio Node Render a pagamento + piccolo disco persistente | Compute da 7/mese; disco 0,25/GB-mese | Più vicino all'attuale backend Node; restano necessari servizio di produzione e controlli pubblici |

Cloudflare Free ha 100.000 richieste/giorno e 10 ms di CPU per invocazione: prima di sceglierlo serve misurare import catalogo e validazioni. Il pagamento minimo Workers è 5 USD/mese; storage/altre risorse hanno le proprie quote. [Prezzi](https://developers.cloudflare.com/workers/platform/pricing/), [limiti](https://developers.cloudflare.com/workers/platform/limits/).

Render dichiara servizi web da 7 USD/mese e dischi da 0,25 USD/GB-mese. Un servizio con 1 GB di disco porta a circa 7,25 USD/mese di base, da confermare al checkout e con carico reale. Il piano gratuito sospende dopo 15 minuti di inattività, riparte lentamente e perde le modifiche al filesystem: non è il candidato consigliato per la chat commerciale. [Servizi](https://render.com/articles/best-netlify-alternatives-in-2026), [storage/costi](https://render.com/articles/how-much-does-cloud-application-hosting-cost-for-small-businesses), [limiti free](https://render.com/docs/free).

Costi AI separati: nel precedente test tre turni sono costati circa 0,00875625 USD a tariffa standard. A parità di quel solo scenario, 100 conversazioni sono circa 0,88 USD, 1.000 circa 8,76 USD; non è una media o un preventivo produttivo. Il tetto attuale per chat è 0,05 USD, ma servono anche un tetto globale e protezioni antiabuso. Non assumere token promozionali gratuiti senza riscontro di fatturazione. Hosting a zero non implica costo AI a zero.

Raccomandazione: per il primo pilota privilegiare il percorso Node, vicino al codice attuale, se non c'è già un hosting idoneo. Valutare Cloudflare se la priorità è il canone minimo accettando l'adattamento iniziale. Il primo incremento autorizzabile è preparazione locale della versione pubblica e pacchetto tema, senza attivare ancora hosting/app o caricare nulla nello store. Scegliere definitivamente il servizio dopo la prova tecnica e un budget operativo esplicito.
