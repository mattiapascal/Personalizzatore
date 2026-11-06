# Architettura del laboratorio

Una sola app React/TypeScript con API locali Node integrate nel server Vite, solo su `127.0.0.1`. Provider OpenAI e lettura Admin Shopify collegati mediante configurazione privata server. Nessun tunnel, registrazione app o deploy. Questo non è lo scaffold di un'app Shopify installabile: per l'ambiente produttivo servirà un backend persistente e autenticato, da progettare e autorizzare separatamente. La build contiene soltanto asset frontend; il backend funziona con `npm run dev`.

```text
Chat / riepilogo rosso-verde / contesto recente limitato
    → AiProvider (HTTP reale oppure demo esplicita)
    → API locale: origine + nonce + limiti + quota persistente
    → filtro privacy browser + verifica nei casi dubbi + controllo server
    → Responses / function calling strict (un tool, massimo sei fatti catalogo se autorizzato)
    → AiToolSchema + revisione sessione
    → updateRequirements → motore deterministico
    → CatalogAdapter → motivazioni + verifiche residue
    → productPage → onlineStoreUrl acquisito da Shopify

Candidato → Prova nel canvas → Product/Variant ID + versione + area nominale
UI editor / IText nel canvas / trascinamento / comando JSON simulato
    → DocumentStore.dispatch → schema + revisione + vincoli + misure Fabric
    → documento canonico in mm/pt → FabricAdapter (8 px/mm di zoom)
    → JSON sorgente oppure SVG fisico (misure del modello; 8 px/mm nel viewBox)
```

## Modelli e strumenti

Schemi Zod in `src/catalog/schema.ts`, `src/selection/schema.ts`, `src/ai/contract.ts`, `src/editor/model.ts`. Gli equivalenti JSON Schema sono in `docs/schemas/`, rigenerabili con `npm run schemas`. I controlli semantici (appartenenza al catalogo, origine URL, revisioni, ID unici e misure) restano nel motore runtime: il JSON Schema da solo non li sostituisce.

| Modello | Contenuto / confine |
|---|---|
| ProductProfile | Product/Variant GID reali, URL Admin, provenienza, versione, dimensioni nominali; vincoli ignoti null |
| Requirements | Famiglia, montatura, materiale manuale, forma, righe/logo facoltativi, ingombro minimo, spazio massimo disponibile, diametro o scelta non so |
| Recommendation | Solo ID del catalogo, versione, ruleId e spiegazioni, verifiche pendenti |
| SelectionSession | UUID pseudonimo, revisione, requisiti e candidati ricostruibili, selezione, versione catalogo, timestamp |
| GraphicDocument | UUID, revisione, area nominale mm, oggetti con ID stabili; Product/Variant ID, versione catalogo e profilo commerciale; vincoli grafici ancora TEST |
| GraphicCommand | Whitelist, ID oggetto, revisione attesa e argomenti stretti |

Whitelist selezione: `collectRequirements`, `searchProducts`, `getProductProfile`, `recommendProducts`, `askMissingInformation`. La lettura del profilo rifiuta ID estranei; le domande devono essere ancora pertinenti. Il provider reale può chiamare solo `collect_requirements`: restituisce attributi nullable (nessun aggiornamento), campi da ritirare e una domanda semantica facoltativa. Il server normalizza la proposta in `collectRequirements`, aggiunge UUID/revisione attesi e il client valida prima di eseguire. I campi non menzionati restano invariati; ritiri e assegnazioni ridondanti sono normalizzati. La raccomandazione e il link vengono sempre dal catalogo/motore, mai dalla prosa del modello.

Whitelist grafica di questo incremento: `setText`, `moveObject`, `setObjectStyle`. Nessun JavaScript, HTML, URL logo o SVG arbitrario accettato. Non sono ancora implementati `addText`, logo, gruppi, rotazione o ridimensionamento. `DocumentStore.changeProduct` è un'azione esplicita della UI: conserva oggetti, verifica ingombri, aggiorna riferimenti e area e invalida revisioni precedenti. Fallimento atomico: documento e storico immutati. Successo: storico undo ricomincia, per non ripristinare un prodotto differente. Font/colore/margine attuali appartengono esclusivamente a `TEST-stamp-v1`, distinto da `catalogProductProfileVersion`.

Prompt v8: il server trasmette anche `contentBrief` e `lastQuestionField`. Il modello restituisce delta; `clearFields` ha effetto soltanto con `changeIntent=withdraw` e `clearEvidence` presente nel messaggio corrente. Un valore unico completa il quadrato già noto; misure rettangolari parziali generano un chiarimento invece di un errore tecnico. Il contesto `targetArea` produce `maximumAreaMm`, separato dal minimo dell'impronta. L'evidenza di ritiro è un controllo del contratto, non una prova assoluta della correttezza semantica del modello.

`advisor.ts` propone fino a tre profili prima del completamento del questionario per usi loyalty/ex-libris documentati nella scheda Shopify. Lo scopo del cliente è interpretato dall'AI; le espressioni nella descrizione del commerciante servono a ricavare un'evidenza verificabile del prodotto, non a interpretare il prompt cliente con parole chiave. I candidati rispettano i criteri già confermati. `acceptAdvice` rivalida e adotta montatura/forma soltanto al clic esplicito. Il catalogo può quindi aggiornare anche queste proposte attraverso le stesse letture periodiche, con regole di profilazione v3 e versionamento della cache.

Il titolare ha autorizzato il contesto catalogo il 6 novembre 2026, condizionandolo a costi contenuti e protezione dei dati cliente. Condivisione **attiva nella copia privata** (`AI_SHARE_CATALOG_CONTEXT=true`), disattivata per default su nuove installazioni. Massimo sei fatti, titolo limitato a 160 caratteri e fino a due estratti d'uso di 120 caratteri; niente dump, ID, URL o immagini. Lo storico assistant conserva la sola domanda semantica, protetta. Il modello non può certificare un prodotto; l'adozione della proposta resta un'azione esplicita validata localmente. Il primo rifiuto automatico è storico e il consenso richiesto è ora acquisito.

## Selezione verificabile

1. Se manca la famiglia, chiederla; poi la montatura (automatico, manuale, tascabile, a secco).
2. Per i manuali chiedere materiale o nessuna preferenza; per tutte le montature chiedere forma, poi ingombro minimo/diametro o «non so». Non assumere che sei righe entrino in un determinato modello.
3. Filtrare per stato ACTIVE alla cattura, montatura, materiale pertinente, forma, logo dichiarato e dimensioni nominali in orientamento fisso. Un ingombro rettangolare deve avere diagonale non maggiore del diametro del tondo.
4. Ordinare per area crescente, spareggio per ID. Nessun prezzo, disponibilità, punteggio AI o capacità di righe inventato.
5. Mostrare dimensioni nominali e motivazioni; con misure ignote presentare possibilità esplorative. Layout e area utile richiedono conferma.

Esempio storico nella fixture dei primi tre prodotti: 50×20 mm → 4913 (58×22) e 4915 (70×25). Il catalogo ampliato può restituire più alternative, sempre ordinate per area. Esempio corrente: a secco/tondo/diametro minimo 41 mm → varianti 41 e 51 mm. Dieci profili manuali hanno ora metafield compilati; restano cinque varianti senza dimensioni. Ambiguità semantiche sospendono l'esposizione dei candidati fino alla risposta al chiarimento. Per le caselline il filtro attuale è conservativo: confronta l'intera area nominale con il massimo; una grafica ridotta su una montatura maggiore non è ancora validata da questo percorso.

## Stato e persistenza

La sessione salva solo attributi strutturati nel localStorage, con scadenza logica di ripristino a 24 ore dall'ultima modifica; il ripristino ricalcola i candidati ed esclude ID manipolati. Una versione catalogo nuova conserva i requisiti validi, aggiorna la revisione e invalida la vecchia selezione. Alla riapertura dati scaduti sono sostituiti dalla sessione vuota: il browser chiuso non può cancellarli automaticamente. È una persistenza locale sostituibile, non un database produttivo. `Azzera conversazione e requisiti` riparte da zero.

`selection/interaction.ts` gestisce insieme sessione e riscontro transitorio. `SelectionChat` conserva in memoria al massimo 40 messaggi, mostra una domanda alla volta e riporta il focus al compositore. Non esistono campi dimensionali o montatura esterni. Il riepilogo deriva dai requisiti validati: rosso/Da chiarire, verde/Risposta raccolta, valore e marcatura testuale. «Non so» sulle misure è verde come risposta ricevuta ma non certifica l'idoneità. Righe/logo facoltativi sono annotati separatamente. La conversazione non viene salvata localmente né loggata dal backend; il modello riceve messaggio, brief, domanda e ultimi sei scambi (400 caratteri ciascuno) in forma protetta, oltre ai fatti catalogo autorizzati.

`PrivacyVault` conserva in memoria browser mappa originale→segnaposto e classificazione private/generic. La rilevazione usa segnali identificativi: pattern di contatti/codici/indirizzi/dichiarazioni di identità e indizi di nomi propri (nome comune, sequenza nome/cognome, nomi con apostrofo). Il vocabolario pubblico evita allarmi su marchi/termini tecnici in maiuscolo; una parola sconosciuta da sola non è più un criterio di privacy. Non è un riconoscitore neurale universale. Gli originali vengono recuperati solo in contentBrief per editor/stima; reset/reload distruggono mappa, brief e classificazioni. Il contenuto da imprimere è opaco per default, anche in assenza di un allarme, evitando invii non necessari.

`PrivacyReview` è una breve domanda a due azioni. Solo dopo il Sì mostra una parte rossa per volta e chiede se sia riservata. Le risposte vengono instradate dall'app, senza riscrittura del cliente; dopo l'ultima scelta riprende l'invio. Il No iniziale classifica le parti come generiche. Recapiti/codici auto-identificativi rimangono comunque protetti. Le altre eccezioni sono circoscritte al frammento esatto e alla conversazione. `AiRequest.publicFragments` porta al solo server locale i frammenti dichiarati generici (massimo 24 da 480 caratteri), mai i valori privati o la mappa. Il server richiede revisione, valida i frammenti contro dati identificativi e ricontrolla messaggio/storico/brief; `makeOpenAiBody` non trasmette questo metadato al provider. Il contenuto testuale del brief rimane un segnaposto, separato dal testo pubblico eventualmente ammesso nel messaggio. Le classificazioni si ricordano nella conversazione; un nuovo contesto esplicito di nome può riaprire la verifica di un termine prima generico.

La redazione opera su intervalli, senza sostituzioni dentro altre parole o nuove mascherature dei segnaposto. Lo storico è protetto **prima** di troncarlo a 400 caratteri; il taglio evita segnaposto parziali. Testo privato lungo non deve riapparire come coda in chiaro. Il sistema resta prudenziale: nomi non marcati, omonimie con termini comuni e lingue diverse possono sfuggire; il giudizio del cliente può essere errato. Il corpus TEST misura regressioni note, non un tasso di errore produttivo o conformità legale. Il consenso del titolare non sostituisce gli adempimenti della futura messa in produzione.

Il registro consumi mantiene per UUID locale costo noto, riserve non risolte, numero richieste e scadenza 24 ore, massimo 500 sessioni attive. Nessun UUID è inviato al modello; nessun contenuto o mappa nel registro. Tetto sessione 0,05 USD indipendente dal guard cumulativo. Riserva e controllo sono atomici sotto lo stesso lock prima della rete; all'usage disponibile si sostituisce la riserva con costo noto, altrimenti resta trattenuta. Il vecchio registro migra aggiungendo sessions vuoto senza azzerare contatori globali. Le chiamate precedenti non vengono attribuite retroattivamente a una sessione. È un tetto per conversazione/24h, non un'identificazione del cliente fra chat nuove; un servizio pubblico richiede antiabuso/autenticazione appropriati.

Il documento grafico è l'unico stato autorevole. Fabric è una vista: al termine di un trascinamento emette un comando manuale; se rifiutato, il canvas viene ripristinato dal documento. Le misure browser di Fabric verificano l'ingombro prima del commit. Undo/redo/import incrementano sempre la revisione locale, invalidando i comandi precedenti. Storico di sessione in memoria; JSON contiene lo stato editabile, non lo storico completo. Cambiare sezione non azzera il documento; un reload richiede la riapertura del JSON esportato.

La scena è ristretta a testo Arial fino a 8 righe/480 caratteri e rettangolo vettoriale, senza trasformazioni. IText fornisce caret e scrittura nel canvas; all'uscita produce `setText` con revisione acquisita all'ingresso. La scrittura temporanea è una bozza del gesto: export, navigazione fra sezioni e altri comandi sono sospesi finché viene validata. Il commit è differito alla fine dell'evento Fabric; se rifiutato si ripristina la scena canonica. Le misure usano la stessa metrica FabricText/IText, verificata nei test browser. SVG viene prodotto da Fabric usando lo stesso renderer. Misure browser e unità SVG sono verificabili automaticamente, ma non certificano metrica fisica o resa in Illustrator.

Il primo canvas si apre soltanto da un candidato reale. I successivi cambi di requisiti non cancellano una composizione aperta: si cambia modello con `Prova nel canvas`. La sessione di selezione e il documento sono distinti: aprire un prodotto Shopify esterno non trasferisce la grafica. Gli import non possono sostituire associazione o dimensioni del prodotto corrente. Fixture storiche senza associazione sono adottate solo a parità di area, dopo validazione. L'associazione non certifica l'area utile o la variante di acquisto; nel campione ogni profilo contiene un riferimento variante.

## Provider reale, catalogo e sicurezza

Endpoint: `GET /api/bootstrap`, `POST /api/ai/interpret`, `POST /api/catalog/refresh`. Host e origine loopback, nonce di processo, JSON limitato a 16 KB. Il nonce è una protezione contro richieste web estranee, non un'autenticazione produttiva. Una chiamata AI alla volta, 10/minuto, quota persistente con lock inter-processo e riserva prima della rete. Chiavi esclusivamente server; risposta bootstrap priva di credenziali. Registro solo di consumi; errori sanitizzati. Nessun retry a pagamento automatico.

`AiProvider` riceve dati strutturati e restituisce `unknown`, con timeout e `AbortSignal`; ogni output è poi validato. Errori lasciano invariati i requisiti. Il client non attiva il mock quando il server/provider manca: per usarlo va selezionata esplicitamente la demo. Modello fissato, prompt versionato, budget locale 1 USD entro il tetto di collaudo utente 2 EUR. Configurazione in `.env.local`; niente chiavi `VITE_*`, credenziali copiate dagli handoff o valori segreti nel bundle. `store:false` non equivale a zero retention né revoca la condivisione dati scelta dal titolare.

`CatalogService` importa con query fissa di sola lettura Admin 2026-10, pagine da 50 prodotti, fino a 5000. Timeout completo 30 secondi, controlli cursori/errori/duplicati e sostituzione atomica. Varianti oltre la prima pagina mettono il modello in revisione, anziché usare un profilo incompleto. Cache privata locale associata all'ambito query e alla versione delle regole, hash dei dati e timestamp separato: letture identiche non invalidano le sessioni. Poll all'avvio/ogni 300 secondi e pulsante manuale; richieste concorrenti aggregate. La UI controlla novità ogni 10 secondi e le applica automaticamente fuori da richieste AI o scrittura nel canvas, conservando le bozze e bloccando SVG non rivalidati.

`deriveMountProfiles` ricostruisce i profili a ogni lettura: dimensioni esclusivamente da `ProductVariant.custom.larghezza/custom.altezza`, tipo verificato `number_decimal`, mm, positive e ≤1000. Nessun fallback a opzioni/titoli/descrizioni se manca un valore o il tipo è errato. Titoli/opzioni identificano la forma; un tondo con lati diversi viene sospeso. Meccanismo da titolo/tag, personalizzabilità da descrizioni. Descrizioni dimensionali discordanti generano `dataWarnings` sul profilo e segnalazioni di revisione, senza sostituire i metafield autorevoli. Un profilo per variante con chiave Product GID + Variant GID; il link finale usa `onlineStoreUrl?variant=ID`. Le fonti commerciali restano separate dal profilo grafico TEST. Accessori, diciture fisse e meccanismi con layout riservati sono esclusi.

Prodotti archiviati/non pubblicati/assenti vengono esclusi. Oltre `max(600, 2 × intervallo)` secondi dall'ultima lettura completa, candidati e SVG vengono sospesi, con requisiti/bozza e JSON conservati. Una lettura riuscita ripristina la freschezza anche a hash invariato. La query `title:timbr*` è un ambito configurato, non una classificazione esaustiva del negozio. Il timer non lavora a server spento: webhook, riconciliazione produttiva, autenticazione, retention e permessi di un servizio pubblico restano da sviluppare in un ambiente autorizzato.

Estensione canvas: cerchio vettoriale e `shape` nel documento; tutti gli angoli del riquadro dei testi devono entrare nel cerchio meno margine TEST. I cerchi usano centro/raggio comprensivi del tratto; Fabric imposta un clipPath circolare. Documenti piccoli partono con testo breve. Cambi di variante sullo stesso prodotto rivalidano geometrie e ID come i cambi prodotto; un conflitto consente di esportare JSON e creare esplicitamente una bozza nuova.
