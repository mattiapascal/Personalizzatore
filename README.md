**11 novembre — diagnosi AmoretScript e font selezionato:** [avviso direttamente nell’ispettore e retry condiviso](docs/iteration-editor-selected-font-diagnostics.md). Il file si carica ma non contiene «·» (U+00B7) del testo di prova. Nessuna sostituzione o modifica dei progetti; copertura ricavata dai byte, cache condivisa e aggiornamento di canvas/pannello dopo il nuovo controllo. 683 unitari, 81 browser pertinenti, 25 campioni e build/tipi/segreti passati. Protezione globale delle metriche ancora aperta; nessun deploy.

**11 novembre — testi piccoli e regole del prodotto:** [capacità tecnica 0,1–500 pt e minimo del timbro separati](docs/iteration-editor-text-capacity.md). Bozze e importazioni conservano i corpi originali; minimo 7 pt per i timbri inchiostrati, avviso in ispettore e rifiuto delle riduzioni/conferme non conformi. Nuovo campione JSON/SVG a 6/3 pt; 680 unitari, 92 browser verificati fra esecuzione/ricontrollo, 25 campioni e build/schemi/segreti passati. **247/370 sorgenti convertibili, 123 bloccati**, 20 recuperi senza regressioni; Q12 ora convertibile, da correggere prima di associarlo a un timbro. Nessuna nuova importazione nell’archivio o pubblicazione.

**11 novembre — recupero font aggiornato:** [associazioni CSS originali e Kuenstler recuperato](docs/iteration-editor-pitchprint-css-fonts.md). **219 file in libreria, 82/83 combinazioni risolte**, Alida più altri 17 originali installati con backup; resta Gloria Hallelujah 700. Cinque collegamenti limitati a URL/hash verificati, metadati reali e nessuno stile simulato; campioni CSS/canvas/SVG senza differenze di pixel. Nessuna nuova importazione di template o pubblicazione. I conteggi font più vecchi qui sotto sono storici.

**11 novembre — ricontrollo dei template:** [primitive senza area e cerchi legacy](docs/iteration-editor-pitchprint-primitives.md), insieme ai collegamenti CSS dei font, portano a **227/370 sorgenti convertibili, 143 bloccati**, 13 recuperi e zero regressioni. **674 unitari/104 file, sette browser mirati, build/schemi/segreti passati**. Archivio invariato durante l’analisi: restano 117 template e due composizioni. Quattro Alida convertibili, resa del rettangolare ancora da affinare; Q12 sotto il minimo globale di 7 pt. Nessuna nuova importazione o pubblicazione.

# Assistente AI e personalizzatore Shopify

**11 novembre — altri originali PitchPrint recuperati:** [resoconto e casi aperti](docs/iteration-editor-font-recovery.md). Dopo Alida, **16 file originali verificati e installati**, libreria a **218 file** con backup e dati precedenti invariati. **77/83 combinazioni** risolte; sei dichiarazioni di peso/stile da verificare, distinte dai file mancanti. Omonimi disambiguati soltanto con identità/hash originali. 667 unitari/103 file, sette regressioni browser, 16 file collaudati, build/schemi/segreti passati. **214/370 sorgenti convertibili, 156 bloccati**, due recuperi e zero regressioni; nessuna nuova importazione di template e nessun deploy.

**11 novembre — foto grandi e Alida originale:** [limiti e prove](docs/iteration-editor-high-resolution.md): PNG/JPEG fino a **20 MB e 24 MP**, JSON fino a 120 MB, SVG con JPEG originale, crop/EXIF e memoria ottimizzati. 664 unitari, foto reale di prova da 12 MP/12,18 MB riaperta con SHA invariato, 24 campioni e build/schemi/segreti passati. **212/370 sorgenti convertibili, 158 bloccati**, 23 recuperi senza regressioni; cinque «Attenti al Cane» convertibili, 18 esclusi. Nessuna nuova importazione. Alida originale recuperato da PitchPrint e verificato nella libreria locale (202 font), con backup e dati precedenti invariati. Nessun deploy; recupero degli altri font autorizzato e in corso.

**11 novembre — immagini PitchPrint recuperate:** [originali, scale e ritagli](docs/iteration-editor-pitchprint-images.md), proprietà dei segnaposto e stili di inserimento residui conservati/gestiti esplicitamente. 662 unitari, 79 casi browser verificati tra regressione e ricontrollo, 24 campioni e build/schemi/segreti passati. Analisi reale: **189/370 convertibili, 181 bloccati**, 73 recuperi e nessuna regressione; tre cartelli fotografici «Attenti al Cane» confrontati visivamente, 20 ancora esclusi. Archivio personale invariato: nessuna nuova importazione. Illustrator e collegamento dei segnaposto foto da completare; nessun deploy.

**Nuovo incremento locale:** [font prima delle misure di importazione e adattamento](docs/iteration-editor-verified-adaptation.md), recupero dei glifi con X/Y originali. 657 unitari, 112 browser verificati in regressione/ricontrollo, 23 campioni, build/segreti passati. Analisi reale 116/370 con verifica nominale; 28 sorgenti prima pronti ora segnalati per problemi di font, archivio invariato. Prossima priorità: i 23 cartelli «Attenti al Cane» esclusi dall’importazione iniziale. Nessuna nuova importazione o pubblicazione.

**Nuovo incremento locale:** [disegno dei testi protetto nel canvas](docs/iteration-editor-canvas-font-guard.md). Font non verificati rappresentati da riquadri arancioni, anche durante la digitazione; testo originale, correzione e Undo/Redo conservati. 653 unitari, 99 regressioni browser e 8 controlli finali, 23 campioni, build/segreti passati. Metriche dei testi irrisolti ancora da proteggere. Nessuna modifica alle bozze personali o deploy.

**Avvio e zoom ricontrollati:** il primo canvas contiene il progetto richiesto, senza bozza TEST transitoria; vista a tutto schermo centrata con circa 24 px di margine e adattamento a pannelli/formati diversi. Cinque browser mirati e controllo in sola lettura del template reale passati. [Dettagli](docs/iteration-editor-preview-cache-startup.md#ricontrollo-della-segnalazione-su-apertura-e-centratura).

**Incremento precedente:** [font verificati prima di anteprime e output](docs/iteration-editor-output-font-gate.md): SVG/PNG/PDF/miniature rifiutano glifi assenti, stili simulati e copertura sconosciuta; JSON e correzione esplicita restano disponibili. 648 unitari, cinque nuovi browser e 23 campioni passati; build/tipi/segreti verificati. Il disegno del canvas è stato poi protetto nell’incremento successivo; le metriche irrisolte restano aperte. Nessuna modifica ai progetti personali o deploy.

**Incremento precedente:** [correzione guidata dei caratteri mancanti](docs/iteration-editor-font-repair.md), con file scelto esplicitamente e verificato, stili/centro/storico conservati. 645 unitari, 59 browser più due percorsi desktop/mobile e 23 campioni passati. Nessuna correzione alle bozze personali o deploy.

**Incremento precedente:** [testi PitchPrint e interlinea](docs/iteration-editor-pitchprint-text-styles.md): stili per carattere con file font esatti, interlinea compatta e altezza automatica. 642 unitari, 183 browser pertinenti e 22 campioni passati. 144 sorgenti tecnicamente convertibili, 21 in più; nessuna nuova importazione nell’archivio. Nessun deploy.

**Incremento precedente:** [contorni e template reali](docs/iteration-editor-wide-strokes.md): spessori fino a 100 mm, ispettori e import coerenti, campione JSON/SVG 300 × 180 mm. 639 unitari, 113 browser mirati e 21 campioni passati. Analisi in sola lettura: 123 sorgenti convertibili, sei in più; archivio personale invariato. Nessun deploy.

**Ultimo incremento — 11 novembre:** [foro PitchPrint, miniature PNG persistenti e avvio/zoom](docs/iteration-editor-preview-cache-startup.md). Corretto «Oltre i 100a»; controllo automatico su tutti i 117 sorgenti. Cache delle immagini nel browser, apertura senza bozza TEST transitoria e canvas intero centrato con margine. **635 unitari, build/segreti e 76 browser mirati passati**, senza ripetere l’intera suite. Tutto locale.

**11 novembre — 117 template PitchPrint importati nell’archivio locale**, con colori originali, tag «Da verificare» e nessuna associazione prodotto. Copia di sicurezza verificata; due composizioni preesistenti e font conservati. [Apri i template](http://127.0.0.1:5173/editor/admin?section=template), [comportamento e prove](docs/iteration-editor-pitchprint-colors.md). 633 unitari, 376 casi browser, build/segreti, 13 regressioni pubbliche e 20 campioni passati. Il commit b4e5af4 è sincronizzato su GitHub; nessun deploy.

**Font dell’editor: solo file incorporati.** [Stili misti, scelta delle famiglie e collaudi portabili](docs/iteration-editor-font-regressions.md): B/I preservano le porzioni del testo, il menu segue libreria e documento corrente, i vecchi progetti richiedono una scelta esplicita dei file. Controllo completo: **616 unitari e 363 browser**, più 13 regressioni pubbliche e 19 campioni. [Editor locale](http://127.0.0.1:5173/editor?workspace=1).

**Nuovo incremento locale:** [importazione PitchPrint](docs/iteration-editor-pitchprint-import.md) da copie native, 473 sorgenti acquisiti in sola lettura; 39 varianti Google installate esatte e [font manuali](.local/pitchprint-migration/font-audit/font-da-installare.md), senza fallback. [Proprietà degli oggetti](docs/iteration-editor-object-properties.md) e modulo cliente con ordine crescente. [Apri importatore](http://127.0.0.1:5173/editor/import-pitchprint?workspace=1&mode=admin).

**Correzioni del collaudo del 10 novembre:** [targa a misura cliente](http://127.0.0.1:5173/editor/plaque?workspace=1&mode=customer), [editor amministrativo](http://127.0.0.1:5173/editor?workspace=1&mode=admin), [ricollaudo aggiornato](docs/editor-retest-2026-11-10.md). Salvataggio esplicito, recupero JSON, PDF locale, fissaggi e template riutilizzabili su misure diverse. L’export PDF usa Chromium di Playwright e `qpdf`; il relativo test strumentale usa anche `pdftotext` (Poppler), già disponibili su questo computer. [Stato e limiti](docs/editor-local-status.md); nessun deploy o modifica al negozio.

Per il collaudo locale del 10 novembre: <http://127.0.0.1:5173/editor/admin?section=acceptance> — 18 prove raggruppate con note, esiti ed esportazione. [Checklist completa](docs/editor-collaudo-2026-11-10.md), [nuovi profili/zone/varianti](docs/iteration-editor-profile-zones-shop-acceptance.md) e [stato verificato](docs/editor-local-status.md). `npm run editor:collaudo` rigenera la copia della checklist dagli stessi casi della pagina interattiva.

Progetto per Incisoria Sacchetti. Repository: [mattiapascal/Personalizzatore](https://github.com/mattiapascal/Personalizzatore).

**Editor grafico locale:** [funzioni, prove e limiti aggiornati](docs/editor-local-status.md). Accesso diretto `http://127.0.0.1:5173/editor?workspace=1`; nessuna pubblicazione dell’editor. Ultimi incrementi: [livelli/selezione/alpha](docs/iteration-editor-layers-selection-alpha.md), [crenatura](docs/iteration-editor-kerning.md) e [dilatazione testo sui due assi](docs/iteration-editor-text-stretch.md), [allineamenti per riga/interlinea](docs/iteration-editor-line-alignment.md) e [maniglie Bézier](docs/iteration-editor-bezier-handles.md).

**Prova configurazioni indipendenti:** <http://127.0.0.1:5173/editor?workspace=1&configurations=1>. Modifica la grafica → **Controlla e aggiungi** → controlla l’anteprima → **Aggiungi al carrello di prova**. Nel riepilogo, **Crea una copia da aggiungere** serve per un altro articolo; **Modifica questo articolo nel carrello** prepara la sostituzione della sola riga, con confronto prima/dopo e conferma distinta. [Guida e limiti](docs/iteration-editor-configurations-font-variants.md). Tutto locale, senza prezzi o acquisti Shopify.

**Controllo font:** caratteri mancanti e stili simulati dei font incorporati sono segnalati nella bozza e bloccano la conferma locale, anche attraverso l’API. [Formati analizzati, limiti ed evidenze](docs/iteration-editor-font-preflight.md).

**Archivio visuale e catalogo reale:** [Template](http://127.0.0.1:5173/editor/admin?section=template) e [Composizioni clienti](http://127.0.0.1:5173/editor/admin?section=composition) con miniature, tag multipli riutilizzabili, filtri AND/OR e priorità dei tag trascinabile/salvabile. Tag anche nel salvataggio dall’editor; copia cliente→template indipendente. [Prodotti del negozio](http://127.0.0.1:5173/editor/admin?section=products) in sola lettura per collezione/tag, con il catalogo reale completo: non equivale ad avere tutti i prodotti già configurati nel canvas. [Font](http://127.0.0.1:5173/editor/admin?section=fonts) con anteprime automatiche e informazioni facoltative richiudibili. [Guida e limiti](docs/iteration-editor-archive-tags-shop.md).

**[Prova guidata per il titolare](docs/editor-collaudo-locale.md):** bozze, cambio modello, template, caso 13/15 e font, con indicazione di cosa succede a ogni conferma.

**Nuovi percorsi locali:** [galleria template](http://127.0.0.1:5173/editor/templates), associazioni a più modelli nel backend, cambio modello con confronto prima/dopo e autosalvataggio delle bozze su questo browser. Nel backend è disponibile anche la preparazione dei profili produttivi e degli schemi di sola foratura/fissaggi. [Guida e limiti](docs/iteration-editor-drafts-templates-products.md): il canvas usa ancora i vincoli TEST; i profili tecnici raccolti non sono ancora applicati alla grafica.

**Pagina pilota pubblicata:** [Crea il tuo timbro](https://www.incisoriasacchetti.it/pages/crea-timbro-online), con chat e selezione dei prodotti reali, backend Cloudflare Workers Free e catalogo aggiornato automaticamente. Il laboratorio locale comprende anche canvas Fabric.js e JSON/SVG con profili grafici TEST. Il percorso di personalizzazione e acquisto esistente continua sulle pagine prodotto. [Registro, verifiche e ripristino](docs/release-cloudflare.md).

Per correggere il comportamento: **[REGOLE_ASSISTENTE.md](REGOLE_ASSISTENTE.md)** è la guida per il titolare, con istruzioni realmente compilate nel prompt, esempi e mappa delle regole applicative. Modifica il testo, esegui `npm run assistant:generate` e `npm run check`, poi riavvia il server. `npm run dev` rigenera all'avvio; test e build rifiutano un artefatto obsoleto. Le modifiche locali non pubblicano nulla. Il servizio pubblico usa [Cloudflare Workers Free](docs/cloudflare-free.md). **Per aggiornare il sito serve anche un deploy Cloudflare autorizzato**: i comandi locali e il push Git non pubblicano.

Interfaccia pubblica: chat con fumetti bianchi/verdi su sfondo beige e altezza adattata alla viewport, senza crescita con i messaggi. Invio invia, Maiusc+Invio va a capo; la freccia è dentro al campo di scrittura. Riepilogo e informazioni seguono sotto la conversazione.

Aggiornamento interfaccia: chat più larga ad altezza fissa con scroll, requisiti compatti (quattro colonne desktop/due mobile), risultati come schede con foto Shopify e dettagli richiudibili. Il dialogo può partire dal contenuto: testo esatto → stima indicativa → scelta del formato → prima bozza nel canvas. Ex-libris e grafica vengono raccolti come brief, senza inventare un formato dal solo numero di righe. [Dettagli e verifiche](docs/iteration-chat-layout.md).

## Domande su prodotti, FAQ e informazioni del negozio

La chat può cercare informazioni in tutti i prodotti pubblicati, nelle FAQ effettivamente mostrate sulle schede/collezioni e nel documento **[CONOSCENZE_ASSISTENTE.md](CONOSCENZE_ASSISTENTE.md)**, nella stessa cartella delle regole. Il selettore di montature resta dedicato ai timbri. Risposte informative con estratti e fonti, senza cambiare le scelte già raccolte; informazioni mancanti dichiarate senza inventarle.

`npm run assistant:generate` compila sia regole sia conoscenze. Per il laboratorio attivare `AI_SHARE_CATALOG_CONTEXT=true`; `read_products` serve all’indice dell’intero catalogo. Il documento entra nel rilascio Workers; non viene letto dal filesystem remoto. I comandi locali e il push Git non pubblicano le modifiche. Il sito viene riletto automaticamente ogni cinque minuti, mentre le FAQ delle schede pertinenti vengono consultate con cache breve.

[Architettura, limiti e verifiche](docs/knowledge-assistant.md). `npm run eval:knowledge` è il collaudo AI reale separato, a pagamento e con tetto esplicito; i normali test non consumano token.

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

Il server `npm run dev` è solo loopback/dev. `npm run build` genera il laboratorio frontend. Il rilascio pubblico ha un ingresso separato Workers e una build cliente: `npm run check:release` li verifica senza pubblicare; `npm run worker:deploy` esegue invece un upload reale autorizzato.

**Gestione font:** nel [backend locale](http://127.0.0.1:5173/editor/admin), ricerca e filtri, campioni personalizzati, download originali, dati descrittivi/licenze e [backup/ripristino della libreria](docs/iteration-editor-font-backup.md) con confronto e conferma. [Guida](docs/iteration-editor-font-administration.md).

**Ultimi incrementi dell’editor:** [anteprima monocolore e analisi WOFF2 locale](docs/iteration-editor-imprint-woff2.md), [capacità estesa](docs/iteration-editor-capacity.md) a 200 oggetti, 100 righe/4.000 caratteri Unicode per box e corpo fino a 500 pt. I limiti delle risorse e i vincoli TEST rimangono espliciti. [Stato e verifiche](docs/editor-local-status.md).

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

**Solo nel laboratorio:** `AI_SESSION_BUDGET_USD=0.05` imposta un tetto prudenziale per conversazione, sempre attivo anche quando il contatore cumulativo è informativo. I token noti sostituiscono la riserva; errori senza usage la mantengono. Il tetto può fermare la chiamata prima del costo effettivo massimo. Non identifica una persona fra nuove chat, non cambia i limiti dell'account e non certifica fatturazione o token gratuiti.

Nel servizio pubblico non sono applicati limiti per IP, per numero di messaggi o per spesa della singola chat. Restano Turnstile, concorrenza e budget complessivo del servizio (1 USD nel pilota). Le richieste estranee non diventano risposte generali: il modello produce dati tipizzati e le spiegazioni visibili sono costruite dal programma.

La chat si adatta allo spazio necessario per mostrare il compositore all'apertura, mantenendo lo scroll dei messaggi. «dell'abbonamento»/«dell’abbonamento» sono gestiti come elisioni di un termine noto, mentre nomi come D’Angelo restano protetti. Casi e schermate verificate in [iteration-elisions-layout.md](docs/iteration-elisions-layout.md); `npm run capture:chat -- --opening` acquisisce l'apertura desktop/mobile senza chiamate AI.

Il campione aggiornato comprende 76 profili di variante su 66 prodotti reali, inclusi 10 manuali con metafield ora compilati. Sono supportati autoinchiostranti, manuali, tascabili e a secco, con forme rettangolari, quadrate e tonde. Prova «Timbro a secco rotondo, diametro 41 mm» oppure «Timbro manuale in legno, rotondo, diametro 35 mm». Sono filtri minimi: una misura maggiore può comparire come alternativa. Il prezzo resta sulla pagina Shopify. Il significato di No-AI è stato chiarito dal titolare: limita le funzioni generative di PitchPrint e non questo assistente.

## Catalogo aggiornabile

Il backend legge Shopify all'avvio, ogni 5 minuti mentre è aperto e con Aggiorna da Shopify. L'import è paginato e atomico, con cache locale e versione del contenuto; errori o pagine incomplete conservano l'ultima copia valida. La data dell'ultima lettura è visibile.

La UI controlla il backend ogni 10 secondi e applica automaticamente le nuove versioni quando non è in corso una richiesta AI o la scrittura nel canvas. I requisiti vengono rivalutati e la bozza aperta conserva il suo stato/versione. Puoi salvarne il JSON; lo SVG richiede la rivalidazione con un candidato corrente. Prodotti rimossi, archiviati o non pubblicati vengono esclusi. Se l'ultima lettura completa supera 10 minuti (oppure due intervalli se maggiori), nuove proposte e SVG restano sospesi fino alla rilettura riuscita.

Ogni lettura ricostruisce i profili con regole versionate: **larghezza e altezza dell'impronta vengono esclusivamente dai metafield variante `custom.larghezza` e `custom.altezza`**, verificati come `number_decimal` in millimetri. Devono essere entrambi validi e positivi. Titoli/opzioni identificano la forma e descrizioni/tag il tipo di montatura; non sostituiscono dimensioni mancanti. Dati descrittivi discordanti sono segnalati nei controlli del candidato, lasciando autorevoli i metafield. Nuove varianti con dati sufficienti diventano disponibili senza aggiornare una lista manuale. ID e link identificano la variante esatta. La cache è legata anche alla versione delle regole.

Lettura reale aggiornata: 228 prodotti letti, 214 attivi con URL pubblico; 76 profili su 66 prodotti (46 automatici, 10 manuali, 17 tascabili, 3 a secco), 74 con foto. Restano cinque varianti senza dimensioni: plastica tondo (4) e Pocket Stamp R40 (1). Nessun valore Shopify modificato da questo progetto. Datari/numeratori, diciture fisse, componibili e accessori richiedono percorsi dedicati. L'ambito è `title:timbr*`, non l'intero negozio. Nel laboratorio il timer funziona solo a server aperto e riparte all’avvio. Nel servizio pubblico il Cron Cloudflare ogni cinque minuti aggiorna SQLite indipendentemente dal laptop; la UI controlla le versioni ogni minuto. Nessun webhook configurato.

## Canvas

**[Apri direttamente l’editor grafico locale](http://127.0.0.1:5173/editor)** con il server avviato: formato TEST 58×22 mm, strumenti manuali e selezione del formato, senza passare dalla chat. [Trasformazioni, livelli e allineamenti](docs/iteration-editor-transforms.md).

**[Area di disegno a tutto schermo](http://127.0.0.1:5173/editor?workspace=1)**: canvas centrale, pannelli laterali richiudibili, zoom e adattamento all’area; fullscreen nativo opzionale. Si può passare dalla vista normale a quella espansa conservando la stessa bozza. [Dettagli e prove](docs/iteration-editor-workspace.md).

Gli strumenti dell’editor usano pulsanti a icona, con descrizione al passaggio del mouse e nomi accessibili. Le icone dei pannelli in alto permettono di mostrare oggetti/file e proprietà/livelli; le proprietà si aggiornano in tempo reale.

Per iniziare una nuova chat sul futuro sostituto locale di PitchPrint: [handoff aggiornato del configuratore grafico](docs/HANDOFF_EDITOR_GRAFICO.md).

Sviluppo locale dell’8 novembre: [piano incrementale](docs/editor-roadmap.md), [inventario delle capacità PitchPrint con fonti](docs/pitchprint-capabilities.md) e [risultati/prova dell’incremento oggetti](docs/iteration-editor-objects.md). Priorità agli strumenti manuali; multipagina escluso e generazione immagini AI rinviata.

Da un candidato premi Prova nel canvas. Il progetto usa modello, ID/versioni Shopify e dimensioni nominali. Doppio clic sul testo per scrivere, Invio per una nuova riga, Esc o Termina modifica per validare. Testo e forme si possono trascinare. Puoi aggiungere testo/rettangolo/cerchio, selezionare anche dall’elenco, duplicare ed eliminare; Annulla/Ripristina conservano gli ID. Le copie partono sovrapposte: trascinale per spostarle. Anche un progetto vuoto è salvabile e riapribile.

Selezionando un oggetto puoi impostare posizione e dimensioni numeriche e rotazione, usare le maniglie, cambiare ordine livelli e allineare all’area. Il testo cambia corpo in pt senza deformazione; i cerchi mantengono il diametro. JSON grafico v2 con import automatico dei v1; margini verificati anche dopo rotazione. `npm run capture:editor -- --transforms` genera i campioni per Illustrator, che rimane da collaudare.

Modifiche manuali e comandi strutturati passano dallo stesso store revisionato. Il passaggio a un altro modello o variante conserva gli oggetti solo se entrano; altrimenti mantiene il progetto precedente, con possibilità di salvarlo in JSON e creare una nuova bozza per il formato scelto. Non riduce font o deforma automaticamente. Il cambio modello riuscito ricomincia lo storico undo. Nei formati tondi la validazione usa il cerchio reale e il renderer esporta un ritaglio circolare.

**Ispettore contestuale:** modifiche in tempo reale, posizione centrale, riempimento/contorno e strumenti di testo. Box a larghezza fissa o automatica, con altezza sempre automatica; maniglie con lato opposto fermo. Il box selezionato modifica tutto il testo, i caratteri evidenziati ricevono soltanto la modifica locale. [Uso, limiti e verifiche](docs/iteration-editor-inspector.md). Gli oggetti parzialmente esterni sono ammessi; trascinare completamente fuori mostra il cestino e il rilascio elimina, con Annulla disponibile.

**Selezione e gruppi:** Maiusc o riquadro, gruppi semplici, spostamento/copia/eliminazione atomici, allineamenti e distribuzione a spazi uguali nell’ispettore multiplo. Nuovi testi centrati e doppio clic contestuale. Le forme vuote sono agganciabili sul contorno. [Comandi, uso e stato dei test](docs/iteration-editor-selection.md): contorni ora verificati nel browser. [Scala e rotazione dell’insieme](docs/iteration-editor-group-transforms.md) con maniglie e dimensioni collegate; freccine del contorno a 0,05 mm.

Nel pannello Strumenti sono disponibili [griglia e agganci](docs/iteration-editor-guides.md), con Alt per sospenderli, e le [scorciatoie da tastiera](docs/iteration-editor-keyboard.md) per spostamenti fini e operazioni della selezione. Le guide sono soltanto vista e non entrano nei file.

**Disegno diretto:** quattro icone permettono di tracciare linee, rettangoli, cerchi ed ellissi nel canvas. Maiusc vincola le linee a 45° e i rettangoli a quadrati; il cerchio parte dal centro. Esc annulla e al rilascio si torna alla selezione. Disponibile anche Aggiungi linea con lunghezza/rotazione/contorno nell’ispettore. [Uso e verifiche](docs/iteration-editor-lines.md). [Ellissi](docs/iteration-editor-ellipses.md) con assi indipendenti, proporzioni e rotazione.

**[Pennello vettoriale](docs/iteration-editor-freehand.md):** disegno a mano libera, tracciato selezionato al rilascio, Esc annulla, chiusura/riempimento e trasformazioni nell’ispettore. Aggiunti [triangolo, pentagono e stella](docs/iteration-editor-polygons.md) come tracciati modificabili. [Penna per punti](docs/iteration-editor-pen.md): clic aggiunge vertici, Invio/doppio clic termina, primo punto o Maiusc+Invio chiude, Backspace rimuove ed Esc annulla. Sono disponibili anche pulsanti grafici di completamento nella barra. I progetti JSON locali si riaprono fino a 10 MB. [Nodi dei tracciati](docs/iteration-editor-path-nodes.md): seleziona un vertice nell’ispettore, modifica X/Y o trascina il punto azzurro; inserisci/elimina nodi con gli stessi comandi e storico.

**[Curve Bézier](docs/iteration-editor-bezier.md):** penna per nodi angolosi o curvi con trascinamento delle maniglie; curve aperte/chiuse, ispettore live e controlli sul foglio, divisione esatta del segmento, inversione e riflessioni. Un solo comando al completamento o al rilascio; Esc annulla. JSON conserva nodi/maniglie, SVG conserva cubiche vettoriali.

**[Tipografia](docs/iteration-editor-text-decoration.md):** barrato e sopralineato sul box o sui caratteri scelti; testo giustificato nei box a larghezza fissa, altezza sempre automatica.

**[Stile e livelli multipli](docs/iteration-editor-selection-style.md):** riempimento/contorno comuni per selezioni e gruppi, valori misti e [ordine dei livelli](docs/iteration-editor-selection-order.md) e [allineamento dell’insieme all’area](docs/iteration-editor-selection-area.md) senza separare i membri. [Operazioni sui tracciati](docs/iteration-editor-path-operations.md): riflessione, inversione nodi e apertura con contorno conservato.

**[Appunti dell’editor](docs/iteration-editor-clipboard.md):** copia/taglia/incolla di oggetti e gruppi tramite icone o Cmd/Ctrl+C/X/V, con stili e immagini conservati. Restano in memoria fino alla chiusura della pagina.

**[Export PNG](docs/iteration-editor-png-export.md):** bozza a 150/300/600 dpi, sfondo bianco o trasparente; dimensioni e risoluzione nel file, indipendenti da zoom e Retina.

**[PNG](docs/iteration-editor-raster.md) e [JPEG locali](docs/iteration-editor-jpeg.md):** originale incorporato nel progetto e conversione bianco/nero modificabile nell’ispettore (soglia, inversione e bianco trasparente). [Luminosità, contrasto e mezzitoni](docs/iteration-editor-raster-filters.md) locali e non distruttivi. JPEG baseline/progressivi a 8 bit, grigi o tre componenti; EXIF 1–8 normalizzato prima di filtri/crop, originale preservato. CMYK escluso. Nessuna rete o generazione AI; SVG con raster derivato. Limiti TEST iniziali: 256 KB, 1 MP, quattro immagini. [Ritaglio e riflessione](docs/iteration-editor-raster-crop.md) non distruttivi nell’ispettore: coordinate in pixel, centro e scala conservati, ripristino dell’intera sorgente.

**Font incorporati:** famiglia sul box o sui soli caratteri selezionati, pulsanti B/I e stili aggiuntivi, file conservati nel JSON/SVG. I font del computer non sono utilizzabili. La [prima implementazione dei font locali](docs/iteration-editor-fonts.md) è storica e superata dalla politica corrente; Illustrator resta da collaudare.

Esporta JSON per riaprire il progetto dopo reload; la bozza rimane in memoria cambiando sezione. Esporta SVG per il collaudo Illustrator. Le capacità correnti e i limiti sono nello [stato locale](docs/editor-local-status.md). Il nuovo golden `stamp-embedded.TEST.json/svg` contiene il proprio font; i campioni storici con nomi di font del computer richiedono una scelta esplicita dei file prima dell’apertura.

## Verifiche

~~~sh
npm run check
npm run schemas
# Con il server locale già avviato:
node --import tsx scripts/verify-editor-artifacts.ts
node --import tsx scripts/capture-editor-font-styles.ts
~~~

check esegue unit test, build, controllo delle credenziali nel bundle e browser e2e. Per Chromium, se necessario: npx playwright install chromium. La suite automatica usa trasporti controllati e non genera costi AI.

I generatori storici, compreso `capture:lab`, vanno adattati alla nuova politica dei font prima del riuso. I due comandi sopra producono copie TEST portabili e una cattura verificata, senza chiamate AI o modifiche all’archivio personale.

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

**Ultimi incrementi locali:** [Mano/PAN](docs/iteration-editor-pan.md) accanto alla freccia e temporaneo con Space; [testo su tracciato](docs/iteration-editor-text-on-path.md) con allineamento, maniglia di scorrimento e riferimento verticale. [Funzioni ancora mancanti e ordine proposto](docs/editor-gap-review.md). Nessuna integrazione o pubblicazione online.

Importazioni SVG/PDF, scelta testo/contorni, backend locale e font personali: [guida e limiti](docs/iteration-editor-import-font-library.md).

Operazioni massive locali: [guida importazione/associazioni/font](docs/iteration-editor-bulk-operations.md). [Classificazione, lista amministrativa e menu font](docs/iteration-editor-font-usability.md). Lo stato effettivo e i limiti sono in [editor locale](docs/editor-local-status.md).
