# Risultati — primo incremento locale, 5 novembre 2026

## Chat, contenuti, anteprime e contatore informativo — 6 novembre 2026

`npm run check`: **82 unit test e 22 browser e2e superati**, build e controllo credenziali nel bundle superati. Schemi rigenerati. Verificati layout stabile con scroll, riepilogo su colonne, foto e fallback esplicito, contenuto effettivo→stima→candidato→testo nel canvas, assenza del testo nel localStorage, messaggi fuori tema senza perdita dati, guard locale disattivabile senza rinunciare a validazione/frequenza/timeout. Corretti i primi tentativi falliti su attesa dell'avvio, resize e ripresa della domanda dopo ritiro della scelta.

AI reale prompt v6: due frasi inventate **2/2 passate**, 4.705 input/240 output, stima standard 0,00460875 USD. Registro osservato: 84 chiamate complessive, 91.546 input/7.212 output noti, circa 0,1011135 USD a tariffa standard; riserve cumulative 0,98840325 USD, che avevano causato il blocco locale da 1 USD. Su indicazione del titolare il contatore ora è informativo (`AI_ENFORCE_LOCAL_LIMITS=false` nella copia privata), registro conservato e nessuna modifica ai limiti OpenAI. I collaudi dell'agente mantengono il guard prudenziale.

Lettura reale: 76 profili, 66 prodotti, 74 con foto; 10 manuali rientrati grazie ai metafield ora compilati. Cinque varianti ancora senza dimensioni. Query immagini validata e lettura riuscita. `capture:chat` superato senza chiamate AI: desktop/mobile e foto prodotto ispezionati. Nessun test umano Illustrator. Apprendimento amministrativo discusso come proposta, nessun archivio clienti o addestramento attivato. [Resoconto completo](iteration-chat-layout.md).

## Metafield variante — 6 novembre 2026

73/73 test unitari, 19/19 browser e2e e build TypeScript/Vite superati. Test nuovi: metafield autorevoli anche contro titoli discordanti, cambio misure→nuova versione/selezione, rifiuto campi mancanti/zero/negativi/testuali o tipo errato, assenza di fallback, tondo con larghezza≠altezza sospeso. I manuali senza campi non producono candidati; supporto dopo compilazione verificato con dati sintetici TEST esplicitamente distinti dalle letture reali. Tutti i 66 profili attuali aprono documenti validi con metriche Fabric browser. Percorso reale a secco Ø41→canvas→SVG41mm e conflitto/reset su variante Ø51 verificato. Golden storico preservato.

Query aggiornata **VALID**, Admin 2026-10/read_products. Definizioni confermate: PRODUCTVARIANT, `custom.larghezza/custom.altezza`, number_decimal, mm. Lettura reale completa e bootstrap locale: 66 profili su 64 prodotti, regole v2, fonte dimensionale esplicita e catalogo fresco. Quindici varianti su quattro prodotti restano senza campi; nessun valore Shopify modificato. Nessuna chiamata AI a pagamento in questa iterazione. Gli esiti storici sotto restano riferiti ai rispettivi incrementi.

Schemi e tre esempi Fabric rigenerati con `capture:mounts` (automatico Ø30, tascabile 12×12, a secco Ø41). Il vecchio esempio legno Ø35 resta storico e non prova la presenza attuale dei metafield. Collaudo umano Illustrator non eseguito. Resoconto in [iteration-variant-dimensions.md](iteration-variant-dimensions.md).

## Montature e aggiornamento automatico — ultimo incremento

`npm run check`: **69/69 unit test**, **18/18 browser e2e**, build TypeScript/Vite e controllo credenziali nel bundle superati. Nuovi casi: profilazione da fonti reali, conflitti/varianti, nuovi ID coerenti senza registro statico, link alla variante, cerchio geometrico, scrittura diretta nel tondo, cambio variante sullo stesso prodotto, tascabile 12×12, a secco e reset bozza, cache incompatibile e catalogo obsoleto. Nel browser tutti i **62 profili** aprono documenti validi con metriche Fabric reali. Golden SVG storico invariato. Nessuna chiamata AI a pagamento nei test automatici.

Lettura Shopify reale e query validata Admin 2026-10/read_products: 228 prodotti letti, 214 attivi con URL, **62 profili su 50 prodotti**. 165 prodotti esclusi/da verificare; uno ha anche tre varianti utilizzabili. Aggiornamento automatico ogni cinque minuti a server aperto, applicazione UI entro il poll di dieci secondi fuori da richieste/gesti, conservazione bozze e blocco proposte/SVG su catalogo obsoleto. I numeri dell'incremento precedente riportati sotto sono storici.

`npm run eval:ai -- --mounts`: **4/4 prove reali** superate con prompt v5 e frasi inventate (manuale/diametro cm, tascabile quadrato, a secco, materiale con refuso/contesto). 6.367 token input/300 output; stima standard 0,00612525 USD, riserva 0,05445 USD. Il corpus storico completo non è stato ripetuto con v5. Registro dopo la prova: 82 richieste, 86.841 input/6.972 output noti, stima standard totale 0,09650475 USD e riserva 0,95626725 USD su 1 USD. Non è fattura né verifica della promozione.

`npm run schemas` e `npm run capture:mounts` superati. Esempi JSON/SVG in `fixtures/illustrator/`: legno Ø35, tascabile 12×12, a secco Ø41. Anteprime tondo desktop/mobile ispezionate. Nessun test umano Illustrator o dispositivo fisico. Profili sempre TEST, altri dati discordanti e meccanismi speciali restano in revisione; dettagli e prossimi passi in [iteration-mounts.md](iteration-mounts.md).

## Backend, AI reale, catalogo e chat con riepilogo — 5 novembre 2026

Consegna successiva autorizzata dall'utente: API locali, provider OpenAI reale, catalogo Shopify in sola lettura aggiornabile e dialogo senza form esterni. Sotto la chat il riepilogo Prodotto/Montatura/Forma/Dimensioni passa da rosso a verde con le risposte; un campo ritirato torna rosso. Testo/stato e valori accompagnano i colori. «Non so le misure» è risposta ricevuta, non idoneità produttiva.

### Controlli automatici

- `npm run check`: **56/56 unit test**, **14/14 browser e2e**, build TypeScript/Vite e controllo credenziali nel bundle **superati**. Nessuna chiamata AI a pagamento nella suite automatica; trasporti controllati e API HTTP locale.
- Copertura server nuova: tool strict, campi nullable/correzioni, quote atomiche persistenti anche fra processi, errori/provider malformato, nessuna rete senza configurazione, origine/host/nonce/body limit, endpoint non autorizzati, file `.env.local` non servito, bootstrap privo di credenziali.
- Copertura catalogo: paginazione/cursori, duplicati, import atomico, conservazione cache su errore, query solo lettura, tag/URL aggiornati, prodotti ritirati/non pubblicati esclusi e nuovi modelli/varianti/titoli in revisione.
- Browser: conversazione una domanda alla volta; niente input dimensionali/montatura; riepilogo rosso/verde e ritiro risposta; correzioni e sessione preservate dopo reload; nessun fallback nascosto; aggiornamento catalogo senza perdita bozza e blocco SVG obsoleto. Regressioni Fabric, drag, multilinea, JSON e golden SVG mantenute.
- `npm run schemas`: contratti pubblici rigenerati, incluse API/Runtime. `capture:lab`: screenshot desktop/mobile e SVG; riepilogo misto rosso/verde ispezionato su mobile. Nessuna sovrapposizione rilevata.

### Prove reali separate

- Provider: `gpt-5.4-mini-2026-03-17`, Responses/function calling strict. La chiave è stata configurata dal titolare nel file privato; non mostrata o pubblicata.
- Corpus inventato di 20 richieste: prima revisione **16/20**, poi **18/20** (incluso un errore di contratto/trasporto), poi **19/20** con prompt v3. Ultimo insuccesso: richiesta di riscrivere in mm misure già esplicite in cm, anziché convertirle. Prompt v4 e descrizioni degli argomenti chiariti; il caso mirato `conversione-cm` è poi passato. Non è stata dichiarata una nuova regressione completa 20/20 del prompt v4.
- **Due dialoghi reali di quattro risposte superati**, incluso quello finale con prompt v4, contesto recente e catalogo collegato: richiesta per fatture → autoinchiostrante → rettangolare → 50×20 mm → riepilogo verde e candidati 4913/4915. Nessun dato cliente reale.
- Registro locale dopo i collaudi: **71 richieste riservate, 70.698 token input noti e 6.159 output noti**, stima standard conservativa sui token noti **0,080739 USD**, riserva **0,81033075 USD** su massimo locale 1 USD. La stima non è la fattura, non include usage non restituito da errori e non presume lo sconto promozionale. Budget utente autorizzato: massimo 2 EUR. Dettagli in `costs-and-metrics.md`.
- Shopify: dominio riconfermato, query API 2026-10 validata dal connettore e dal validatore della skill (**VALID**, `read_products`); lettura completa dal backend riuscita. **3 modelli con profilo TEST e 211 attivi/pubblicati da profilare** nell'ambito `title:timbr*`. Poll ogni 300 secondi, attivo solo a server aperto. Nessuna scrittura sul negozio.

### Limiti e prossimi passi

L'AI resta statistica: i risultati sono un campione di sviluppo, non una garanzia su frasi reali. Censire i 211 prodotti in revisione con fonti tecniche, estendere gli scenari e continuare il collaudo di ambiguità/correzioni. I tre profili e i vincoli grafici restano TEST; nessuna prova umana Illustrator eseguita. Loghi, scene complesse e comandi grafici AI in linguaggio naturale non sono ancora implementati.

La promozione token è stata riferita dal titolare; API funzionante verificata, sconto effettivo in Usage/Billing non verificato. No-AI chiarito dal titolare: riguarda solo funzioni generative PitchPrint. Nessuna modifica BSS/PitchPrint, tema, prezzo, variante, carrello/checkout, app o deploy.

## Collegamento selezione/canvas e testo diretto — 5 novembre 2026

Implementato il percorso candidato → `Prova nel canvas`: ID prodotto/variante e versioni nel JSON, dimensioni nominali del modello nel canvas e nello SVG. Il testo ora si modifica dentro il canvas con IText (doppio clic, Invio per nuova riga, Esc per validare), con gli stessi comandi/store del pannello sviluppatore. Rimosso il campo di testo esterno. Il cambio modello conserva oggetti e ID se entrano; altrimenti conserva il documento precedente e sospende editor/export finché si risolve il conflitto. Import di un prodotto/versione/area differente rifiutato. Profilo tecnico sempre TEST, area utile non certificata.

Verifiche effettive:

- `npm test`: **38/38 superati**. Nuovi casi: associazione completa al catalogo, cambio prodotto atomico, conservazione oggetti/revisioni, confine undo e import coerente.
- `npm run build`: **superato**, TypeScript strict e Vite.
- `npm run test:e2e`: **9/9 superati**. Richiesta/chiarimenti e test precedenti mantenuti; scrittura diretta su una/due righe, blocco export durante la scrittura, validazione/ripristino per testo fuori area, cambio 4912→4913 senza perdere la composizione e rifiuto 4913→4912 se non entra. SVG del 4912: 47mm×18mm, viewBox 376×144, due righe vettoriali; golden SVG 58×22 invariato.
- `npm run schemas`, `npm run fixtures:editor`: **superati**; contratti rigenerati e metadati nullable aggiunti alla fixture storica.
- `npm run capture:lab`: **superato**, screenshot desktop/mobile e SVG Fabric; anteprima editor desktop ispezionata visivamente, senza sovrapposizioni rilevate.

Una prima esecuzione browser ha rilevato un'attesa insufficiente nel test di cambio prodotto: cercava le dimensioni anche nel testo del modello richiesto prima del commit. Corretto il test per attendere area effettiva e revisione, poi ripetuta la suite. Il server/browser richiedono esecuzione fuori sandbox per accesso al loopback; nessuna destinazione esterna visitata dai test.

Limiti invariati: **nessun LLM reale e nessuna sincronizzazione Shopify**. La UI ora lo dichiara esplicitamente. Provider server/quote e catalogo notificato/riconciliato sono il seguito descritto in `iteration-canvas.md`. Nessun nuovo accesso allo store, costo AI, modifica BSS/PitchPrint o deploy. Il multilinea richiede un nuovo collaudo umano Illustrator, non eseguito. Le prove mobile sono Chromium emulato, non tastiere di dispositivi fisici.

## Correzione del riscontro delle azioni — 5 novembre 2026

Segnalazione riprodotta: `Voglio fare un timbro per le fatture` registrava famiglia `stamp`, senza conferma esplicita; `Non so le misure` registrava `sizeUnknown`, ma prima della scelta montatura non spiegava il motivo dell'assenza di candidati. La richiesta non era ignorata dal motore: il riscontro UI era insufficiente.

Correzione in `src/App.tsx`, `src/selection/interaction.ts` e CSS: aggiornamento atomico di sessione/riscontro, conferma delle informazioni riconosciute, domanda successiva oppure numero di candidati, focus sul riquadro dopo ogni azione e pulsante per raggiungere i risultati. Con misure ignote gli input dimensionali sono vuoti; il criterio resta conservato scegliendo successivamente la montatura. Nessuna nuova deduzione su uso fatture, capacità righe, dimensioni o idoneità produttiva.

Verifiche effettive successive alla correzione:

- `npm test`: **35/35 superati**, inclusi risposta tardiva e argomenti invalidi senza perdita dello stato.
- `npm run build`: **superato**, TypeScript strict e Vite.
- `npm run test:e2e`: **7/7 superati**, ultima esecuzione 7,2 s. Nuovi casi: frase esatta dell'utente a 390×844, misure ignote prima/dopo montatura, domanda ancora mancante, tre candidati e navigazione ai risultati; riscontri per input sconosciuti e campione senza candidati. Tutti i cinque e2e precedenti superati.
- `git diff --check`: superato sui file modificati.

L'assistente rimane simulato; nessun provider reale, accesso allo store o deploy aggiunto. I limiti Illustrator e i gate del primo incremento riportati sotto rimangono aperti.

## Evidenze del primo incremento

Esecuzione effettiva su macOS, Node 24.17.0, npm e dipendenze fissate dal lockfile. Nessun test sul carrello o checkout reale.

| Comando / controllo | Risultato |
|---|---|
| `npm run check` → `npm test` | **33/33 superati**, tre file; include 14 scenari tabellari di selezione |
| `npm run check` → `npm run build` | **Superato**, TypeScript strict + Vite; nessun avviso sui chunk dopo caricamento differito del laboratorio |
| `npm run check` → `npm run test:e2e` | **5/5 superati**, Chromium, durata ultima esecuzione 6,2 s |
| `npm run schemas` | **Superato**, otto JSON Schema generati da Zod |
| `npm run fixtures:editor` | **Superato**, JSON canonico TEST generato |
| `npm run capture:lab` | **Superato**, SVG effettivo Fabric e tre screenshot locali |
| QA visiva screenshot | Desktop selettore/editor e mobile 390 px ispezionati; nessuna sovrapposizione o testo tagliato rilevato |
| `npm audit --omit=dev --json` | **0 vulnerabilità note runtime** al momento della verifica; non è un audit completo di sicurezza |
| Scansione sorgenti, documenti, fixture e DOCX iniziale | **0 corrispondenze** per pattern di token/chiavi private cercati; non una garanzia assoluta |
| Validatore Shopify sulla query URL, senza prompt privato | **VALID**, schema Admin 2026-10, scope richiesto `read_products` |

## Evidenze funzionali

- Richiesta iniziale con logo e sei righe → chiarimento montatura → ingombro 50×20 → candidati 4913/4915 con ID reali e motivazioni. Link del primo candidato uguale all'`onlineStoreUrl` restituito dall'Admin API.
- Ricaricamento conserva requisiti; nuovo ingombro 60×23 lascia solo 4915 conservando il logo. Nessuna richiesta verso servizi esterni nel test del selettore.
- UI manuale cambia text-1; comando simulato sposta lo stesso ID. Revisione vecchia rifiutata; export JSON uguale allo stato; riapertura incrementa revisione e cambio sezione conserva il documento.
- Trascinamento con mouse Chromium aggiorna posizione canonica: testo da x=5 mm a x=7 mm. La prima prova ha identificato rientro nel completamento del gesto Fabric: corretto differendo il commit fino al termine dell'evento e acquisendo la revisione all'inizio del gesto. Test mirato e regressione completa successivi superati.
- SVG reale contiene testo e rettangoli vettoriali, entità XML escapate, niente immagini raster; width/height 58mm/22mm e viewBox 464×176. Il nuovo export del JSON canonico coincide col riferimento `fixtures/illustrator/stamp.TEST.svg`.
- Profilo editor solo TEST: rifiuto font sotto 7 pt, colori fuori bianco/nero, ID sconosciuti, oggetti fuori area e comandi obsoleti; undo/redo/import mantengono revisione monotona.
- Input HTML non interpretato, tool amministrativi e argomenti estranei rifiutati, provider offline/malformato/timeout gestibile con scelte guidate.

## Esiti iniziali risolti / limiti degli strumenti

- I primi controlli hanno segnalato dichiarazione CSS e uso asincrono del percorso download: corretti prima della build finale.
- Avvio iniziale e2e prima del completamento download Chromium: test non eseguibili, poi ripetuti dopo installazione completa.
- Generatori tsx CLI richiedevano una pipe IPC non consentita dalla sandbox: script aggiornati a `node --import tsx`, ora eseguibili.
- Controllo versione Shopify CLI ha tentato autoaggiornamento, interrotto. Nessuna CLI usata per installare app o modificare lo store.
- Validazione aggiuntiva dello schema Shopify inizialmente bloccata dal controllo automatico perché il comando includeva il prompt con percorsi locali. Quel comando non è stato eseguito; ripetuto senza prompt e con telemetria disattivata, risultato VALID su Admin 2026-10. Le query eseguite dal connettore sono inoltre validate dal suo schema.

## Accettazione e limiti residui

**Completato per il primo incremento:** audit, piano, schemi dati, fixture con dati reali, regole spiegabili, percorso locale completo fino al link, contratto AI sostituibile, demo Fabric con stato condiviso e export, checklist e documentazione.

**Non completato / non dichiarato verificato:** provider LLM reale e qualità dialogo, costo AI per sessione misurato, catalogo aggiornabile, profili produttivi certificati, accessibilità completa, SVG complessi, loghi/gruppi/testi multilinea e collaudo umano Illustrator. Nessun test Illustrator effettuato; compatibilità/editabilità/font/misure fisiche sono ancora da registrare in `production-files.md`.

BSS V1/V2 e rollback, stato tema live e significato dei tag No-AI richiedono conferme documentate. Nessuna modifica o migrazione Shopify/BSS/PitchPrint eseguita. Per la prima landing pubblicabile occorrono gate della specifica e autorizzazione esplicita.

Prossima azione: confermare profili e tag dei tre timbri e aprire il campione SVG in Illustrator; poi concordare backend/provider e budget per un incremento AI reale. Fonti di integrazione e handoff documentati in `integrations.md` e `handoff-review.md`.
