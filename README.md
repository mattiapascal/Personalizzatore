# Assistente AI e personalizzatore Shopify — laboratorio locale

Progetto per Incisoria Sacchetti. Repository: [mattiapascal/Personalizzatore](https://github.com/mattiapascal/Personalizzatore).

**Prototipo locale, nessun deploy.** Chat con AI reale, selezione deterministica da catalogo Shopify aggiornabile, canvas Fabric.js collegato al prodotto e JSON/SVG. I profili grafici sono ancora TEST. BSS e PitchPrint continuano a funzionare nel negozio attuale.

Per correggere il comportamento: **[REGOLE_ASSISTENTE.md](REGOLE_ASSISTENTE.md)** è la guida per il titolare, con istruzioni realmente compilate nel prompt, esempi e mappa delle regole applicative. Modifica il testo, esegui `npm run assistant:generate` e `npm run check`, poi riavvia il server. `npm run dev` rigenera all'avvio; test e build rifiutano un artefatto obsoleto. Le modifiche locali non pubblicano nulla. Destinazione scelta per il primo pilota: [Cloudflare Workers Free](docs/cloudflare-free.md), adattamento backend ancora da realizzare.

Aggiornamento interfaccia: chat più larga ad altezza fissa con scroll, requisiti compatti (quattro colonne desktop/due mobile), risultati come schede con foto Shopify e dettagli richiudibili. Il dialogo può partire dal contenuto: testo esatto → stima indicativa → scelta del formato → prima bozza nel canvas. Ex-libris e grafica vengono raccolti come brief, senza inventare un formato dal solo numero di righe. [Dettagli e verifiche](docs/iteration-chat-layout.md).

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
- AI_ENFORCE_LOCAL_LIMITS=false rende informativo il contatore cumulativo locale e affida il limite di spesa alle impostazioni dell'account; default true per nuove installazioni. Gli avvisi di budget OpenAI sono distinti dall'opzione Enforce a hard limit. Il registro non è una fattura. La copia privata del titolare usa false su sua indicazione; nessuna impostazione OpenAI viene modificata dall'app.

Senza credenziali il pannello Collegamenti AI e catalogo spiega cosa manca. La demo a parole chiave rimane selezionabile esplicitamente; un errore dell'AI non attiva il parser di nascosto. Senza configurazione su una nuova installazione la demo è il default.

Il server è solo loopback/dev. La build genera asset frontend, non un backend produttivo: non pubblicarla come applicazione completa.

## Prova della conversazione

1. Scrivi nella chat: Voglio fare un timbro per le fatture.
2. Rispondi alla domanda sulla montatura, ad esempio Autoinchiostrante.
3. Rispondi sulla forma, ad esempio Rettangolare.
4. Indica le dimensioni, ad esempio 50 x 20 mm, oppure rispondi Non so le misure.

Il sistema raccoglie i parametri senza campi numerici o selettori esterni. Sotto la chat, Prodotto, Montatura, Forma e Dimensioni sono rossi finché manca una risposta e verdi quando viene raccolta, con valore e stato testuale. Per una montatura manuale viene chiesto anche il materiale. Una risposta ritirata torna da chiarire. Non so le misure è una risposta valida, ma non garantisce la compatibilità della grafica.

Puoi dare più informazioni insieme, correggerti e rispondere ai chiarimenti. Righe/logo sono annotati quando indicati; non vengono trasformati in capacità di un modello inventate. La chat resta in memoria, senza salvataggio del testo libero. Nel browser persistono solo requisiti e selezione per 24 ore; un catalogo nuovo rivaluta i requisiti senza cancellarli. Azzera conversazione e requisiti riparte da zero.

Prova anche «Voglio fare un timbro per le tessere abbonamento del mio bar»: l'AI riconosce lo scopo, il motore locale propone referenze la cui scheda documenta quell'uso e chiede la misura delle caselline. Il Q12 è una proposta iniziale, senza assegnare montatura/forma come preferenze già confermate. Solo la scelta esplicita del modello le adotta. Lo spazio massimo disponibile è distinto dall'ingombro minimo richiesto. Un'area nominale 12×12 non viene certificata come interamente compatibile con una casella 10×10; stampare un logo più piccolo su una montatura più grande richiede un percorso grafico ancora da completare.

Il provider riceve anche brief strutturato e tipo della domanda. «Quadrata» conserva la montatura; «10 mm» dopo una domanda sul lato completa entrambi i lati. Il normale aggiornamento non può cancellare scelte precedenti: un ritiro richiede intento distinto e una citazione nel messaggio corrente. Il titolare ha ora autorizzato il contesto catalogo: attivo nella copia privata, massimo sei riepiloghi sintetici pertinenti, senza dump completo. Nuove installazioni mantengono `AI_SHARE_CATALOG_CONTEXT=false` fino al consenso. Lo storico include domande semantiche protette; link e immagini restano costruiti dal catalogo locale. Storia dell'incremento in [iteration-comprehension.md](docs/iteration-comprehension.md).

Prima dell'invio AI, il browser cerca segnali di dati identificativi (recapiti/codici/indirizzi, nomi plausibili e dichiarazioni di identità). Una parola sconosciuta o un refuso non bastano più a bloccare la chat. Quando serve, compare una breve domanda: «Potrei aver rilevato dati personali o aziendali… puoi confermare?». Con il Sì si verifica una parte alla volta, evidenziata in rosso; con il No l'app gestisce il falso allarme senza riscrittura. Gli originali restano nel browser per il timbro in entrambi i casi; dati privati oscurati verso l'AI, testo dichiarato generico ammesso tramite eccezioni puntuali validate dal server. Recapiti/codici riconoscibili rimangono comunque locali per minimizzazione. La mappa e le classificazioni sono solo in memoria, eliminate con reset/reload; nessun dizionario globale o log clienti. Il testo da imprimere rimane opaco senza richiedere conferma se non presenta segnali di dati personali. È pseudonimizzazione locale e rilevamento euristico, non anonimizzazione irreversibile né garanzia di rilevare ogni identità. Dettagli e corpus TEST in [iteration-privacy-routing.md](docs/iteration-privacy-routing.md).

`AI_SESSION_BUDGET_USD=0.05` imposta un tetto prudenziale per conversazione, sempre attivo anche quando il contatore cumulativo è informativo. I token noti sostituiscono la riserva; errori senza usage la mantengono. Il tetto può fermare la chiamata prima del costo effettivo massimo. Non identifica una persona fra nuove chat, non cambia i limiti dell'account e non certifica fatturazione o token gratuiti.

La chat si adatta allo spazio necessario per mostrare il compositore all'apertura, mantenendo lo scroll dei messaggi. «dell'abbonamento»/«dell’abbonamento» sono gestiti come elisioni di un termine noto, mentre nomi come D’Angelo restano protetti. Casi e schermate verificate in [iteration-elisions-layout.md](docs/iteration-elisions-layout.md); `npm run capture:chat -- --opening` acquisisce l'apertura desktop/mobile senza chiamate AI.

Il campione aggiornato comprende 76 profili di variante su 66 prodotti reali, inclusi 10 manuali con metafield ora compilati. Sono supportati autoinchiostranti, manuali, tascabili e a secco, con forme rettangolari, quadrate e tonde. Prova «Timbro a secco rotondo, diametro 41 mm» oppure «Timbro manuale in legno, rotondo, diametro 35 mm». Sono filtri minimi: una misura maggiore può comparire come alternativa. Il prezzo resta sulla pagina Shopify. Il significato di No-AI è stato chiarito dal titolare: limita le funzioni generative di PitchPrint e non questo assistente.

## Catalogo aggiornabile

Il backend legge Shopify all'avvio, ogni 5 minuti mentre è aperto e con Aggiorna da Shopify. L'import è paginato e atomico, con cache locale e versione del contenuto; errori o pagine incomplete conservano l'ultima copia valida. La data dell'ultima lettura è visibile.

La UI controlla il backend ogni 10 secondi e applica automaticamente le nuove versioni quando non è in corso una richiesta AI o la scrittura nel canvas. I requisiti vengono rivalutati e la bozza aperta conserva il suo stato/versione. Puoi salvarne il JSON; lo SVG richiede la rivalidazione con un candidato corrente. Prodotti rimossi, archiviati o non pubblicati vengono esclusi. Se l'ultima lettura completa supera 10 minuti (oppure due intervalli se maggiori), nuove proposte e SVG restano sospesi fino alla rilettura riuscita.

Ogni lettura ricostruisce i profili con regole versionate: **larghezza e altezza dell'impronta vengono esclusivamente dai metafield variante `custom.larghezza` e `custom.altezza`**, verificati come `number_decimal` in millimetri. Devono essere entrambi validi e positivi. Titoli/opzioni identificano la forma e descrizioni/tag il tipo di montatura; non sostituiscono dimensioni mancanti. Dati descrittivi discordanti sono segnalati nei controlli del candidato, lasciando autorevoli i metafield. Nuove varianti con dati sufficienti diventano disponibili senza aggiornare una lista manuale. ID e link identificano la variante esatta. La cache è legata anche alla versione delle regole.

Lettura reale aggiornata: 228 prodotti letti, 214 attivi con URL pubblico; 76 profili su 66 prodotti (46 automatici, 10 manuali, 17 tascabili, 3 a secco), 74 con foto. Restano cinque varianti senza dimensioni: plastica tondo (4) e Pocket Stamp R40 (1). Nessun valore Shopify modificato da questo progetto. Datari/numeratori, diciture fisse, componibili e accessori richiedono percorsi dedicati. L'ambito è `title:timbr*`, non l'intero negozio. Il timer funziona solo a server aperto e riparte all'avvio; webhook e servizio persistente richiedono un ambiente autorizzato.

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
npm run eval:ai -- --dialogue
npm run eval:chat
npm run eval:loyalty
npm run eval:privacy
~~~

La quota persistente limita richieste e consumi stimati, anche dopo riavvio e con più processi. I report TEST sono in .local/evals, ignorati da Git. Il contatore usa una stima prudente a tariffa standard, indipendentemente da promozioni: Usage/Billing del provider è il riferimento della fatturazione effettiva.

`eval:loyalty` riproduce sette turni inventati, forza la condivisione catalogo a false e applica un tetto aggiuntivo di riserva 0,15 USD per esecuzione, anche quando il contatore della chat è informativo. Non rilanciarlo come test gratuito: effettua chiamate reali.

`eval:privacy` verifica quattro chiamate reali con catalogo autorizzato, preflight sui dati TEST oscurati e ripristino locale del contenuto. Tetto aggiuntivo per esecuzione 0,12 USD, oltre al tetto per chat; report senza testi originali o mappa in `.local/evals`. Le suite gratuite `npm test`/`test:e2e` intercettano invece il trasporto.

## Documenti e struttura

server/ contiene API, provider reale, registro quote e lettura catalogo. src/ contiene catalogo, selezione/chat, contratti AI ed editor. fixtures/ e tests/ contengono dati TEST e regressioni; docs/ contiene schemi e risultati.

Riferimenti: [specifica originale](01_Specifica_Progetto.md), [AGENTS](AGENTS.md), [architettura](docs/architecture.md), [piano backend e conferme](docs/iteration-backend.md), [risultati](docs/test-results.md), [costi](docs/costs-and-metrics.md), [integrazioni](docs/integrations.md), [collaudo Illustrator](docs/production-files.md). Il file _Codex citato in AGENTS non era presente; la specifica originale è preservata.

Per un primo rilascio della sola selezione assistita: [piano di pubblicazione, hosting e coordinamento dei due Git](docs/publication-plan.md). Le [correzioni editoriali per la prossima versione](docs/next-release.md) sono registrate separatamente. Sono proposte e attività locali: nessuna pubblicazione autorizzata.

Prima di un rilascio occorrono profili produttivi confermati, censimento dei modelli, miglioramento/valutazione del dialogo su frasi reali, collaudo umano Illustrator, accessibilità su dispositivi fisici, privacy e controlli di produzione. Nessun deploy o modifica a tema/BSS/PitchPrint, prezzi, varianti, carrello o checkout è incluso.
