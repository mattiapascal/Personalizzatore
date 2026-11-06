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

Il sistema raccoglie i parametri senza campi numerici o selettori esterni. Sotto la chat, Prodotto, Montatura, Forma e Dimensioni sono rossi finché manca una risposta e verdi quando viene raccolta, con valore e stato testuale. Per una montatura manuale viene chiesto anche il materiale. Una risposta ritirata torna da chiarire. Non so le misure è una risposta valida, ma non garantisce la compatibilità della grafica.

Puoi dare più informazioni insieme, correggerti e rispondere ai chiarimenti. Righe/logo sono annotati quando indicati; non vengono trasformati in capacità di un modello inventate. La chat resta in memoria, senza salvataggio del testo libero. Nel browser persistono solo requisiti e selezione per 24 ore; un catalogo nuovo rivaluta i requisiti senza cancellarli. Azzera conversazione e requisiti riparte da zero.

Il campione aggiornato comprende 66 profili di variante su 64 prodotti reali: autoinchiostranti, tascabili e a secco, con forme rettangolari, quadrate e tonde. Le montature manuali restano supportate dal dialogo e dall'editor, ma quelle attuali hanno i metafield dimensionali vuoti e sono sospese finché compilati. Prova «Timbro a secco rotondo, diametro 41 mm». Sono filtri minimi: una misura maggiore può comparire come alternativa. Il prezzo resta sulla pagina Shopify. Il significato di No-AI è stato chiarito dal titolare: limita le funzioni generative di PitchPrint e non questo assistente.

## Catalogo aggiornabile

Il backend legge Shopify all'avvio, ogni 5 minuti mentre è aperto e con Aggiorna da Shopify. L'import è paginato e atomico, con cache locale e versione del contenuto; errori o pagine incomplete conservano l'ultima copia valida. La data dell'ultima lettura è visibile.

La UI controlla il backend ogni 10 secondi e applica automaticamente le nuove versioni quando non è in corso una richiesta AI o la scrittura nel canvas. I requisiti vengono rivalutati e la bozza aperta conserva il suo stato/versione. Puoi salvarne il JSON; lo SVG richiede la rivalidazione con un candidato corrente. Prodotti rimossi, archiviati o non pubblicati vengono esclusi. Se l'ultima lettura completa supera 10 minuti (oppure due intervalli se maggiori), nuove proposte e SVG restano sospesi fino alla rilettura riuscita.

Ogni lettura ricostruisce i profili con regole versionate: **larghezza e altezza dell'impronta vengono esclusivamente dai metafield variante `custom.larghezza` e `custom.altezza`**, verificati come `number_decimal` in millimetri. Devono essere entrambi validi e positivi. Titoli/opzioni identificano la forma e descrizioni/tag il tipo di montatura; non sostituiscono dimensioni mancanti. Dati descrittivi discordanti sono segnalati nei controlli del candidato, lasciando autorevoli i metafield. Nuove varianti con dati sufficienti diventano disponibili senza aggiornare una lista manuale. ID e link identificano la variante esatta. La cache è legata anche alla versione delle regole.

Lettura reale verificata: 228 prodotti letti, 214 attivi con URL pubblico; 66 profili su 64 prodotti (46 automatici, 17 tascabili, 3 a secco). 166 prodotti hanno esclusioni o segnalazioni, inclusi 16 prodotti utilizzabili con descrizioni discordanti. Su quattro prodotti mancano i metafield per 15 varianti: legno/ottone (7), legno tondo (3), plastica tondo (4), Pocket Stamp R40 (1). Nessun valore Shopify modificato. Datari/numeratori, diciture fisse, componibili e accessori richiedono percorsi dedicati. L'ambito è `title:timbr*`, non l'intero negozio. Il timer funziona solo a server aperto e riparte all'avvio; webhook e servizio persistente richiedono un ambiente autorizzato.

## Canvas

Da un candidato premi Prova nel canvas. Il progetto usa modello, ID/versioni Shopify e dimensioni nominali. Doppio clic sul testo per scrivere, Invio per una nuova riga, Esc o Termina modifica per validare. Testo e bordo si possono trascinare.

Modifiche manuali e comandi strutturati passano dallo stesso store revisionato. Il passaggio a un altro modello o variante conserva gli oggetti solo se entrano; altrimenti mantiene il progetto precedente, con possibilità di salvarlo in JSON e creare una nuova bozza per il formato scelto. Non riduce font o deforma automaticamente. Il cambio modello riuscito ricomincia lo storico undo. Nei formati tondi la validazione usa il cerchio reale e il renderer esporta un ritaglio circolare.

Esporta JSON per riaprire il progetto dopo reload; la bozza rimane in memoria cambiando sezione. Esporta SVG per il collaudo Illustrator. Testo Arial fino a 8 righe, rettangolo e cerchio sono il perimetro attuale; loghi, gruppi e scene complesse restano da sviluppare. Il golden storico senza prodotto è importabile sul 4913, con la stessa area nominale 58×22 mm.

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
npm run eval:ai -- --mounts
npm run eval:chat
~~~

La quota persistente limita richieste e consumi stimati, anche dopo riavvio e con più processi. I report TEST sono in .local/evals, ignorati da Git. Il contatore usa una stima prudente a tariffa standard, indipendentemente da promozioni: Usage/Billing del provider è il riferimento della fatturazione effettiva.

## Documenti e struttura

server/ contiene API, provider reale, registro quote e lettura catalogo. src/ contiene catalogo, selezione/chat, contratti AI ed editor. fixtures/ e tests/ contengono dati TEST e regressioni; docs/ contiene schemi e risultati.

Riferimenti: [specifica originale](01_Specifica_Progetto.md), [AGENTS](AGENTS.md), [architettura](docs/architecture.md), [piano backend e conferme](docs/iteration-backend.md), [risultati](docs/test-results.md), [costi](docs/costs-and-metrics.md), [integrazioni](docs/integrations.md), [collaudo Illustrator](docs/production-files.md). Il file _Codex citato in AGENTS non era presente; la specifica originale è preservata.

Prima di un rilascio occorrono profili produttivi confermati, censimento dei modelli, miglioramento/valutazione del dialogo su frasi reali, collaudo umano Illustrator, accessibilità su dispositivi fisici, privacy e controlli di produzione. Nessun deploy o modifica a tema/BSS/PitchPrint, prezzi, varianti, carrello o checkout è incluso.
