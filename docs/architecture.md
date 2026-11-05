# Architettura del laboratorio

Una sola app React/TypeScript con API locali Node integrate nel server Vite, solo su `127.0.0.1`. Provider OpenAI e lettura Admin Shopify collegati mediante configurazione privata server. Nessun tunnel, registrazione app o deploy. Questo non è lo scaffold di un'app Shopify installabile: per l'ambiente produttivo servirà un backend persistente e autenticato, da progettare e autorizzare separatamente. La build contiene soltanto asset frontend; il backend funziona con `npm run dev`.

```text
Chat / riepilogo rosso-verde / contesto recente limitato
    → AiProvider (HTTP reale oppure demo esplicita)
    → API locale: origine + nonce + limiti + quota persistente
    → Responses / function calling strict (un tool, nessun catalogo inviato)
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
| Requirements | Famiglia, montatura, materiale manuale, forma, righe/logo facoltativi, ingombro minimo o diametro o scelta non so |
| Recommendation | Solo ID del catalogo, versione, ruleId e spiegazioni, verifiche pendenti |
| SelectionSession | UUID pseudonimo, revisione, requisiti e candidati ricostruibili, selezione, versione catalogo, timestamp |
| GraphicDocument | UUID, revisione, area nominale mm, oggetti con ID stabili; Product/Variant ID, versione catalogo e profilo commerciale; vincoli grafici ancora TEST |
| GraphicCommand | Whitelist, ID oggetto, revisione attesa e argomenti stretti |

Whitelist selezione: `collectRequirements`, `searchProducts`, `getProductProfile`, `recommendProducts`, `askMissingInformation`. La lettura del profilo rifiuta ID estranei; le domande devono essere ancora pertinenti. Il provider reale può chiamare solo `collect_requirements`: restituisce attributi nullable (nessun aggiornamento), campi da ritirare e una domanda semantica facoltativa. Il server normalizza la proposta in `collectRequirements`, aggiunge UUID/revisione attesi e il client valida prima di eseguire. I campi non menzionati restano invariati; ritiri e assegnazioni ridondanti sono normalizzati. La raccomandazione e il link vengono sempre dal catalogo/motore, mai dalla prosa del modello.

Whitelist grafica di questo incremento: `setText`, `moveObject`, `setObjectStyle`. Nessun JavaScript, HTML, URL logo o SVG arbitrario accettato. Non sono ancora implementati `addText`, logo, gruppi, rotazione o ridimensionamento. `DocumentStore.changeProduct` è un'azione esplicita della UI: conserva oggetti, verifica ingombri, aggiorna riferimenti e area e invalida revisioni precedenti. Fallimento atomico: documento e storico immutati. Successo: storico undo ricomincia, per non ripristinare un prodotto differente. Font/colore/margine attuali appartengono esclusivamente a `TEST-stamp-v1`, distinto da `catalogProductProfileVersion`.

## Selezione verificabile

1. Se manca la famiglia, chiederla; poi la montatura (automatico, manuale, tascabile, a secco).
2. Per i manuali chiedere materiale o nessuna preferenza; per tutte le montature chiedere forma, poi ingombro minimo/diametro o «non so». Non assumere che sei righe entrino in un determinato modello.
3. Filtrare per stato ACTIVE alla cattura, montatura, materiale pertinente, forma, logo dichiarato e dimensioni nominali in orientamento fisso. Un ingombro rettangolare deve avere diagonale non maggiore del diametro del tondo.
4. Ordinare per area crescente, spareggio per ID. Nessun prezzo, disponibilità, punteggio AI o capacità di righe inventato.
5. Mostrare dimensioni nominali e motivazioni; con misure ignote presentare possibilità esplorative. Layout e area utile richiedono conferma.

Esempio storico nella fixture dei primi tre prodotti: 50×20 mm → 4913 (58×22) e 4915 (70×25). Il catalogo ampliato può restituire più alternative, sempre ordinate per area. Esempio nuovo: manuale/legno/tondo/diametro minimo 35 mm → varianti in legno da 35 e 40 mm, con ID distinti. Ambiguità semantiche sospendono l'esposizione dei candidati fino alla risposta al chiarimento.

## Stato e persistenza

La sessione salva solo attributi strutturati nel localStorage, con scadenza logica di ripristino a 24 ore dall'ultima modifica; il ripristino ricalcola i candidati ed esclude ID manipolati. Una versione catalogo nuova conserva i requisiti validi, aggiorna la revisione e invalida la vecchia selezione. Alla riapertura dati scaduti sono sostituiti dalla sessione vuota: il browser chiuso non può cancellarli automaticamente. È una persistenza locale sostituibile, non un database produttivo. `Azzera conversazione e requisiti` riparte da zero.

`selection/interaction.ts` gestisce insieme sessione e riscontro transitorio. `SelectionChat` conserva in memoria al massimo 40 messaggi, mostra una domanda alla volta e riporta il focus al compositore. Non esistono più campi dimensionali o montatura esterni. Il riepilogo deriva dai requisiti validati: rosso/Da chiarire, verde/Risposta raccolta, valore e marcatura testuale. «Non so» sulle misure è verde come risposta ricevuta ma non certifica l'idoneità. Righe/logo facoltativi sono annotati separatamente. La conversazione non viene salvata localmente né loggata dal backend; il modello riceve messaggio, requisiti, ultima domanda ed estratti degli ultimi sei scambi (400 caratteri ciascuno). Nessun elenco o profilo del catalogo viene inviato al provider.

Il documento grafico è l'unico stato autorevole. Fabric è una vista: al termine di un trascinamento emette un comando manuale; se rifiutato, il canvas viene ripristinato dal documento. Le misure browser di Fabric verificano l'ingombro prima del commit. Undo/redo/import incrementano sempre la revisione locale, invalidando i comandi precedenti. Storico di sessione in memoria; JSON contiene lo stato editabile, non lo storico completo. Cambiare sezione non azzera il documento; un reload richiede la riapertura del JSON esportato.

La scena è ristretta a testo Arial fino a 8 righe/480 caratteri e rettangolo vettoriale, senza trasformazioni. IText fornisce caret e scrittura nel canvas; all'uscita produce `setText` con revisione acquisita all'ingresso. La scrittura temporanea è una bozza del gesto: export, navigazione fra sezioni e altri comandi sono sospesi finché viene validata. Il commit è differito alla fine dell'evento Fabric; se rifiutato si ripristina la scena canonica. Le misure usano la stessa metrica FabricText/IText, verificata nei test browser. SVG viene prodotto da Fabric usando lo stesso renderer. Misure browser e unità SVG sono verificabili automaticamente, ma non certificano metrica fisica o resa in Illustrator.

Il primo canvas si apre soltanto da un candidato reale. I successivi cambi di requisiti non cancellano una composizione aperta: si cambia modello con `Prova nel canvas`. La sessione di selezione e il documento sono distinti: aprire un prodotto Shopify esterno non trasferisce la grafica. Gli import non possono sostituire associazione o dimensioni del prodotto corrente. Fixture storiche senza associazione sono adottate solo a parità di area, dopo validazione. L'associazione non certifica l'area utile o la variante di acquisto; nel campione ogni profilo contiene un riferimento variante.

## Provider reale, catalogo e sicurezza

Endpoint: `GET /api/bootstrap`, `POST /api/ai/interpret`, `POST /api/catalog/refresh`. Host e origine loopback, nonce di processo, JSON limitato a 16 KB. Il nonce è una protezione contro richieste web estranee, non un'autenticazione produttiva. Una chiamata AI alla volta, 10/minuto, quota persistente con lock inter-processo e riserva prima della rete. Chiavi esclusivamente server; risposta bootstrap priva di credenziali. Registro solo di consumi; errori sanitizzati. Nessun retry a pagamento automatico.

`AiProvider` riceve dati strutturati e restituisce `unknown`, con timeout e `AbortSignal`; ogni output è poi validato. Errori lasciano invariati i requisiti. Il client non attiva il mock quando il server/provider manca: per usarlo va selezionata esplicitamente la demo. Modello fissato, prompt versionato, budget locale 1 USD entro il tetto di collaudo utente 2 EUR. Configurazione in `.env.local`; niente chiavi `VITE_*`, credenziali copiate dagli handoff o valori segreti nel bundle. `store:false` non equivale a zero retention né revoca la condivisione dati scelta dal titolare.

`CatalogService` importa con query fissa di sola lettura Admin 2026-10, pagine da 50 prodotti, fino a 5000. Timeout completo 30 secondi, controlli cursori/errori/duplicati e sostituzione atomica. Varianti oltre la prima pagina mettono il modello in revisione, anziché usare un profilo incompleto. Cache privata locale associata all'ambito query e alla versione delle regole, hash dei dati e timestamp separato: letture identiche non invalidano le sessioni. Poll all'avvio/ogni 300 secondi e pulsante manuale; richieste concorrenti aggregate. La UI controlla novità ogni 10 secondi e le applica automaticamente fuori da richieste AI o scrittura nel canvas, conservando le bozze e bloccando SVG non rivalidati.

`deriveMountProfiles` ricostruisce i profili a ogni lettura da dati espliciti: meccanismo da titolo/tag, formato da opzione diametro con unità, titolo variante o prodotto; descrizione breve come controllo di coerenza, mai codici modello/handle. Un profilo per variante con chiave Product GID + Variant GID; il link finale usa `onlineStoreUrl?variant=ID`. Le fonti commerciali restano separate dal profilo grafico TEST. Nuovi modelli coerenti entrano automaticamente; dati discordanti o incompleti restano in revisione. Accessori, diciture fisse e meccanismi con layout riservati sono esclusi.

Prodotti archiviati/non pubblicati/assenti vengono esclusi. Oltre `max(600, 2 × intervallo)` secondi dall'ultima lettura completa, candidati e SVG vengono sospesi, con requisiti/bozza e JSON conservati. Una lettura riuscita ripristina la freschezza anche a hash invariato. La query `title:timbr*` è un ambito configurato, non una classificazione esaustiva del negozio. Il timer non lavora a server spento: webhook, riconciliazione produttiva, autenticazione, retention e permessi di un servizio pubblico restano da sviluppare in un ambiente autorizzato.

Estensione canvas: cerchio vettoriale e `shape` nel documento; tutti gli angoli del riquadro dei testi devono entrare nel cerchio meno margine TEST. I cerchi usano centro/raggio comprensivi del tratto; Fabric imposta un clipPath circolare. Documenti piccoli partono con testo breve. Cambi di variante sullo stesso prodotto rivalidano geometrie e ID come i cambi prodotto; un conflitto consente di esportare JSON e creare esplicitamente una bozza nuova.
