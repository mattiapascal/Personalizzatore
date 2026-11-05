# Assistente AI e personalizzatore Shopify — laboratorio locale

Progetto per Incisoria Sacchetti. Repository: [mattiapascal/Personalizzatore](https://github.com/mattiapascal/Personalizzatore).

**Prototipo locale, nessun deploy.** Chat con AI reale, selezione deterministica da catalogo Shopify aggiornabile, canvas Fabric.js collegato al prodotto e JSON/SVG. I profili grafici sono ancora TEST. BSS e PitchPrint continuano a funzionare nel negozio attuale.

## Avvio

Node 24.17.0 (fissato in .nvmrc), npm e Git:

~~~sh
nvm use
npm ci
npm run dev
~~~

Apri http://127.0.0.1:5173 e lascia il terminale aperto. Frontend e API locali partono insieme. Dopo modifiche a .env.local riavvia il server se Vite non lo ha già fatto.

Le credenziali sono **soltanto** in .env.local, ignorato da Git e privato. .env.example documenta la configurazione senza valori segreti. Per una nuova installazione copialo in .env.local e configura:

- AI_PROVIDER=openai, OPENAI_API_KEY, modello fissato e AI_BUDGET_USD positivo per AI reale.
- SHOPIFY_SHOP_DOMAIN e SHOPIFY_ADMIN_ACCESS_TOKEN con read_products per aggiornare il catalogo.
- SHOPIFY_CATALOG_QUERY definisce l'ambito della lettura; CATALOG_POLL_SECONDS vale 300 per default.

Senza credenziali il pannello Collegamenti AI e catalogo spiega cosa manca. La demo a parole chiave rimane selezionabile esplicitamente; un errore dell'AI non attiva il parser di nascosto. Senza configurazione su una nuova installazione la demo è il default.

Il server è solo loopback/dev. La build genera asset frontend, non un backend produttivo: non pubblicarla come applicazione completa.

## Prova della conversazione

1. Scrivi nella chat: Voglio fare un timbro per le fatture.
2. Rispondi alla domanda sulla montatura, ad esempio Autoinchiostrante.
3. Rispondi sulla forma, ad esempio Rettangolare.
4. Indica le dimensioni, ad esempio 50 x 20 mm, oppure rispondi Non so le misure.

Il sistema raccoglie i parametri senza campi numerici o selettori esterni. Sotto la chat, Prodotto, Montatura, Forma e Dimensioni sono rossi finché manca una risposta e verdi quando viene raccolta, con valore e stato testuale. Una risposta ritirata torna da chiarire. Non so le misure è una risposta valida, ma non garantisce la compatibilità della grafica.

Puoi dare più informazioni insieme, correggerti e rispondere ai chiarimenti. Righe/logo sono annotati quando indicati; non vengono trasformati in capacità di un modello inventate. La chat resta in memoria, senza salvataggio del testo libero. Nel browser persistono solo requisiti e selezione per 24 ore; un catalogo nuovo rivaluta i requisiti senza cancellarli. Azzera conversazione e requisiti riparte da zero.

Il campione con profili censiti contiene i Printy 4912, 4913 e 4915. Per 50×20 mm il motore propone 4913/4915, ordinati per area, con motivazioni verificabili. Il prezzo resta sulla pagina Shopify. Il significato di No-AI è stato chiarito dal titolare: limita le funzioni generative di PitchPrint e non questo assistente.

## Catalogo aggiornabile

Il backend legge Shopify all'avvio, ogni 5 minuti mentre è aperto e con Aggiorna da Shopify. L'import è paginato e atomico, con cache locale e versione del contenuto; errori o pagine incomplete conservano l'ultima copia valida. La data dell'ultima lettura è visibile.

Una nuova versione compare con Applica aggiornamento ai risultati: i requisiti vengono rivalutati e la bozza aperta conserva il suo stato/versione. Puoi salvarne il JSON; lo SVG richiede la rivalidazione con un candidato corrente. Prodotti rimossi, archiviati o non pubblicati vengono esclusi. I nuovi modelli o profili cambiati sono elencati come da verificare, senza misure/compatibilità dedotte arbitrariamente.

Lettura reale verificata: 3 modelli censiti e 211 prodotti pubblicati da profilare, nell'ambito title:timbr*. Non è ancora un assistente per l'intero catalogo. Il timer funziona solo a server aperto; webhook e servizio persistente restano lavoro per un ambiente autorizzato.

## Canvas

Da un candidato premi Prova nel canvas. Il progetto usa modello, ID/versioni Shopify e dimensioni nominali. Doppio clic sul testo per scrivere, Invio per una nuova riga, Esc o Termina modifica per validare. Testo e bordo si possono trascinare.

Modifiche manuali e comandi strutturati passano dallo stesso store revisionato. Il passaggio a un altro modello conserva gli oggetti solo se entrano; altrimenti mantiene il progetto precedente. Non riduce font o deforma automaticamente. Il cambio modello riuscito ricomincia lo storico undo.

Esporta JSON per riaprire il progetto dopo reload; la bozza rimane in memoria cambiando sezione. Esporta SVG per il collaudo Illustrator. Testo Arial fino a 8 righe e rettangolo sono il perimetro attuale; loghi, gruppi e scene complesse restano da sviluppare. Il golden storico senza prodotto è importabile sul 4913, con la stessa area nominale 58×22 mm.

## Verifiche

~~~sh
npm run check
npm run schemas
npm run fixtures:editor
~~~

check esegue unit test, build, controllo delle credenziali nel bundle e browser e2e. Per Chromium, se necessario: npx playwright install chromium. La suite automatica usa trasporti controllati e non genera costi AI.

Con server aperto, npm run capture:lab produce screenshot e un SVG campione, usando la demo e bloccando chiamate AI.

I collaudi **reali**, separati dai test automatici, richiedono chiave e budget e possono consumare credito:

~~~sh
npm run eval:ai
npm run eval:ai -- conversione-cm
npm run eval:chat
~~~

La quota persistente limita richieste e consumi stimati, anche dopo riavvio e con più processi. I report TEST sono in .local/evals, ignorati da Git. Il contatore usa una stima prudente a tariffa standard, indipendentemente da promozioni: Usage/Billing del provider è il riferimento della fatturazione effettiva.

## Documenti e struttura

server/ contiene API, provider reale, registro quote e lettura catalogo. src/ contiene catalogo, selezione/chat, contratti AI ed editor. fixtures/ e tests/ contengono dati TEST e regressioni; docs/ contiene schemi e risultati.

Riferimenti: [specifica originale](01_Specifica_Progetto.md), [AGENTS](AGENTS.md), [architettura](docs/architecture.md), [piano backend e conferme](docs/iteration-backend.md), [risultati](docs/test-results.md), [costi](docs/costs-and-metrics.md), [integrazioni](docs/integrations.md), [collaudo Illustrator](docs/production-files.md). Il file _Codex citato in AGENTS non era presente; la specifica originale è preservata.

Prima di un rilascio occorrono profili produttivi confermati, censimento dei modelli, miglioramento/valutazione del dialogo su frasi reali, collaudo umano Illustrator, accessibilità su dispositivi fisici, privacy e controlli di produzione. Nessun deploy o modifica a tema/BSS/PitchPrint, prezzi, varianti, carrello o checkout è incluso.
