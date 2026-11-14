# Progetto Shopify: assistente AI e personalizzatore grafico

**Documento di avvio tecnico per Codex**  
**Versione:** 1.0 — 5 novembre 2026  
**Negozio:** https://www.incisoriasacchetti.it  
**Stato:** pianificazione e prototipo; nessuna sostituzione delle app in produzione autorizzata

> **Principio guida:** creare ora componenti riutilizzabili del futuro personalizzatore, senza compromettere il negozio attuale. Per il momento BSS Product Options rimane il sistema di opzioni e sovrapprezzi, e PitchPrint rimane l'editor di produzione.

## 1. Sintesi esecutiva

Il progetto mira a creare un sistema di vendita assistita e personalizzazione grafica per uno store Shopify di prodotti artigianali su misura: timbri, targhe, cartelli e adesivi. L'assistente AI dovrà comprendere in linguaggio naturale la richiesta del cliente, identificare un prodotto realmente presente nel catalogo e suggerirne la personalizzazione. Nella versione completa guiderà anche un editor a oggetti, lasciando sempre al cliente la possibilità di intervenire manualmente.

La strategia concordata è incrementale:

1. **Subito:** prototipo locale di assistente per la scelta del prodotto, più prova tecnica della sincronizzazione AI/editor e dell'esportazione produttiva; obiettivo indicativo 2–4 settimane di lavoro continuativo.
2. **Primo rilascio utile:** landing page interattive che indirizzano alla corretta pagina Shopify, mantenendo BSS e PitchPrint attuali; pubblicazione solo dopo collaudo.
3. **Successivamente:** editor grafico autonomo basato su Fabric.js, con regole produttive verificabili, file SVG apribili in Illustrator e progetti JSON riapribili nell'editor.
4. **BSS:** non sostituire ora. Valutare l'aggiornamento Storefront V2 con il supporto BSS e decidere in futuro, senza fretta, se realizzare anche un sostituto proprietario.

**Decisione tecnica centrale:** il modello AI interpreta le intenzioni e propone comandi; un motore deterministico valida vincoli, esegue operazioni grafiche, seleziona prodotti e verifica la produzione. Nessuna decisione critica su geometria, prezzo o idoneità produttiva deve basarsi soltanto sulla risposta dell'AI.

## 2. Decisioni prese, risultati verificati e questioni aperte

### 2.1 Decisioni concordate

- Iniziare con **un assistente di selezione prodotti generico**, sperimentato inizialmente sulla famiglia «timbri», non con un chatbot monouso.
- Riutilizzare lo stesso motore su landing page dedicate anche a targhe, adesivi e cartelli, cambiando solamente profili prodotti e contesto.
- In questa prima fase, l'assistente **propone la pagina prodotto Shopify esistente**; il cliente continua a usare PitchPrint e BSS.
- Progettare fin dall'inizio API, schemi dati e componenti in modo che la futura connessione al nuovo editor sostituisca soltanto l'adattatore finale.
- Conservare BSS Product Options come possibile componente stabile a lungo termine; la sua sostituzione è **opzionale e non pianificata per il prototipo**.
- Sviluppare prevalentemente in locale; pubblicare un ambiente online soltanto quando necessario per prove reali e poi per la messa in produzione.
- Ridurre il rischio di manutenzione: contratti interni tipizzati e versionati, adattatore per il fornitore AI, test di regressione, versioni delle dipendenze fissate.
- Rendere il futuro editor **utilizzabile anche senza AI**.

### 2.2 Verifiche già effettuate / riferite dall'utente

- È stato creato ed eseguito un piccolo test Fabric.js → SVG → Adobe Illustrator.
- **Esito riferito dall'utente:** la resa del file in Illustrator corrisponde a quanto visualizzato nell'editor web. L'esempio iniziale aveva oggetti disposti male già nel canvas; il difetto non è stato introdotto dall'esportazione.
- Di conseguenza **Fabric.js è il candidato principale** per l'editor a oggetti.
- Non dare per conclusi senza evidenza separata i test su modificabilità dei testi in Illustrator, forme vettoriali, precisione delle misure fisiche, font particolari, gruppi, tracciati importati e casi complessi.
- Il supporto BSS ha già riferito che **non è possibile avere V1 e V2 installate contemporaneamente**. Non ripetere questa domanda. Chiedere se sia possibile **tornare dalla V2 alla V1** e con quali salvaguardie.

### 2.3 Decisioni / verifiche ancora aperte

- Quali parti del codice del tema attualmente dipendono da BSS V1, da DOM non documentato o da eventi applicativi.
- Compatibilità di Storefront V2 con i flussi PitchPrint e JavaScript personalizzati; risposta tecnica BSS ancora da acquisire.
- Possibilità di rollback V2 → V1 e conservazione di set di opzioni e formule: da confermare con BSS.
- Reale modificabilità in Illustrator dei testi esportati e compatibilità completa della filiera produttiva.
- Disponibilità e modalità di accesso al catalogo Shopify nell'ambiente di sviluppo, permessi app e compatibilità del tema con app blocks.
- Tecnologia definitiva del backend e hosting: decidere dopo misure realistiche, non in anticipo.
- Confronto delle opzioni per prezzi personalizzati senza BSS: **ricerca futura**, non attività bloccante per la prima landing page.

## 3. Situazione attuale dello store (inventario iniziale, da verificare nel codice)

- Store pubblico: **www.incisoriasacchetti.it**; piano Shopify **Basic** (dato storico da ricontrollare prima di agire su funzioni soggette a piano).
- Editor grafico corrente: **PitchPrint**, con UI di personalizzazione integrata nelle pagine prodotto.
- Opzioni prodotto, campi extra e sovrapprezzi: **BSS Product Options / OPTIS**.
- Alcuni prodotti con prezzo variabile usano la combinazione di variante Shopify e sovrapprezzi BSS (incluse misure personalizzate).
- Campi di larghezza/altezza noti da precedenti interventi: `po_number_field926202` (larghezza mm) e `po_number_field926203` (altezza mm). **Non assumere che siano API stabili; verificare dove siano effettivamente usati.**
- Sono presenti script personalizzati per sincronizzazione variante/prezzo/immagine, opzioni di prodotto, verifiche di campi e pulsanti di acquisto.
- In precedenti lavori sono stati indicati picker personalizzati («A», «C», «D»); verificare se e dove siano tuttora attivi: non dedurne la presenza senza ispezionare la versione corrente del tema.
- Esistono metafield Shopify per descrivere materiali, spessori e altre regole di alcuni prodotti. Recuperare le definizioni reali prima di progettare qualsiasi migrazione.
- Landing esistente di riferimento: https://www.incisoriasacchetti.it/pages/crea-timbro-online . Non alterarla durante il prototipo senza un'autorizzazione esplicita.
- Al momento non è stata autorizzata alcuna modifica dell'app BSS, delle sue impostazioni, dei prezzi, dei temi pubblicati o del checkout.

**Nota su accessi:** non mettere credenziali, token Shopify o chiavi AI nel repository o nelle conversazioni. Usare variabili d'ambiente, permessi minimi e un ambiente di sviluppo isolato. Le informazioni storiche sopra non sostituiscono la verifica sul negozio attuale.

## 4. Esperienza cliente: oggi e destinazione finale

### 4.1 Fase intermedia: landing page con assistente e app esistenti

1. Il cliente apre una landing page, ad esempio «Crea il tuo timbro».
2. L'assistente chiede soltanto le informazioni mancanti; accetta anche una richiesta libera (es. «timbro per azienda con logo e sei righe»).
3. Un motore di catalogo filtra le referenze reali in base ai vincoli e rende una breve classifica con motivazioni verificabili.
4. L'AI mostra un prodotto candidato (eventualmente alternative) e chiarisce se la compatibilità dei contenuti è ancora da verificare graficamente.
5. Il cliente seleziona «Personalizza» e viene indirizzato alla pagina prodotto Shopify esistente; **PitchPrint + BSS continuano a funzionare come oggi**.
6. La sessione conserva richiesta, prodotto proposto e motivazioni, senza inventare prezzo o disponibilità. Un eventuale trasferimento di parametri a BSS/PitchPrint richiede integrazione documentata e un test dedicato; non è incluso inizialmente.

### 4.2 Versione completa: personalizzazione assistita

1. L'AI identifica il prodotto reale tramite catalogo e regole.
2. Viene aperto il canvas con area di lavorazione, dimensioni e limiti specifici per il prodotto.
3. L'assistente manipola gli oggetti mediante **comandi JSON tipizzati** e il motore li esegue solo se validi.
4. Il cliente modifica manualmente testi, loghi, posizioni, dimensioni, colori, forme, elementi di fissaggio; AI e UI condividono **lo stesso stato**.
5. Se i contenuti non entrano senza violare i limiti, il sistema propone un modello alternativo e conserva, ove possibile, la composizione.
6. Il motore valida il file finale, il cliente approva la bozza e l'app salva una versione congelata.
7. Il prodotto e il riferimento alla configurazione approvata passano alla pagina Shopify/carrello secondo una procedura da validare; la produzione recupera progetto sorgente e file definitivo.

## 5. Architettura tecnica proposta

### 5.1 Blocchi logici

```
Landing page Shopify (app block) / UI React
        |
        v
API applicativa (autenticazione, sessioni, limiti, logging)
        |
        +--> Assistente AI (provider adapter, tool calling, prompt versionati)
        |
        +--> Catalogo normalizzato (lettura Shopify + cache/profili)
        |
        +--> Motore di regole deterministico (vincoli e raccomandazioni)
        |
        +--> Documento progetto + eventi (stato e cronologia)
                    |
                    +--> OGGI: link/redirect alla pagina prodotto con BSS+PitchPrint
                    |
                    +--> FUTURO: editor Fabric.js <--> validazione --> SVG/JSON
                                                |
                                                +--> approvazione --> Shopify --> produzione
```

### 5.2 Stack indicativo

- **Frontend:** React + TypeScript, componenti accessibili e responsive. Preferire lo scaffold Shopify ufficialmente supportato al momento dell'avvio (non inventare versioni o template).
- **Canvas:** Fabric.js, versionato e isolato dietro adapter/modulo dedicato.
- **Backend:** TypeScript/Node.js all'interno del template app scelto, oppure servizio separato se la complessità lo richiederà; non duplicare inutilmente gli stack.
- **Dati di prototipo:** SQLite o persistenza locale equivalente con schema migrabile; sostituibile in produzione senza cambiare il modello di dominio.
- **Storage:** file locali nello sviluppo; object storage in produzione per sorgenti, loghi, bozza approvata e SVG finali; mai esporre file privati mediante URL pubblici permanenti.
- **Shopify:** app custom, Theme App Extension per UI in tema; App Proxy solo se realmente utile, con autenticazione corretta lato server.
- **AI:** adattatore vendor-neutral per chiamate a modelli con output strutturati; non legare il motore grafico a una specifica API/modello.
- **Qualità:** unit test per regole e comandi, test UI, golden fixtures SVG, e2e su ambiente di sviluppo, logging privacy-aware.

### 5.3 Regola architetturale obbligatoria

**Una sola fonte di verità per il documento grafico.** Ogni operazione manuale o AI deve produrre lo stesso evento/aggiornamento applicativo (ID oggetto, proprietà, versione, timestamp/logica di ordine) e deve poter essere rieseguita o annullata. Non ricostruire la scena dagli screenshot, non lasciare che l'AI emetta codice JavaScript arbitrario da eseguire nel browser e non applicare comandi a una revisione non aggiornata.

## 6. Modelli dati e interfacce (contratti iniziali, non definitivi)

### 6.1 Catalogo e profili tecnici

Ogni profilo deve fare riferimento a un **product ID/variant ID Shopify reale**, non a un nome allucinato dall'AI. È raccomandato separare:

- **Dati commerciali Shopify:** ID, handle, titolo, stato, varianti, URL, immagini, disponibilità/prezzo di partenza se accessibili.
- **Profilo tecnico:** famiglia, lavorazione, area utile, limiti, compatibilità materiali/spessori, fissaggi, alternative e regole di impaginazione.
- **Regole selettive:** criteri obbligatori, preferenze, dati mancanti e spiegazioni comprensibili al cliente.

Esempio puramente schematico (numeri NON validati per produzione):

```json
{
  "profileVersion": 1,
  "shopifyProductId": "gid://shopify/Product/REAL_ID_TO_FILL",
  "shopifyVariantIds": ["gid://shopify/ProductVariant/REAL_ID_TO_FILL"],
  "family": "stamp",
  "name": "ESEMPIO — modello da associare al catalogo",
  "printAreaMm": { "width": 58, "height": 22 },
  "constraints": {
    "minFontSizePt": 7,
    "allowedInkColors": ["#000000"],
    "allowGrayscale": false,
    "safeMarginMm": null
  },
  "alternatives": [],
  "source": "catalogue+admin_verified",
  "validatedForProduction": false
}
```

Non generalizzare la regola «7 pt, nero e bianco puri» a tutte le famiglie: appartiene all'esempio dei timbri e va parametrizzata per modello. «Logo binario» significa pixel neri/bianchi senza grigi, ma vettorializzazione e semplificazione sono operazioni ulteriori.

### 6.2 Sessione di selezione

Salvare un identificativo pseudonimo di sessione, tipologia richiesta, attributi raccolti, domande/risposte essenziali, proposte, motivazioni, prodotto selezionato, versione del profilo. Non conservare dati personali superflui o l'intero contenuto della chat senza una politica di retention.

### 6.3 Documento grafico (futuro)

- `documentId`, `revision`, `schemaVersion`, `productProfileVersion`, `productId`, `variantId`.
- Unità fisica canonica: **millimetri** per area/posizioni/dimensioni, punti tipografici per font. Conversione verso pixel solo nel renderer; attenzione a zoom e device pixel ratio.
- Oggetti con `id` stabile, tipo (`text`, `path`, `image`, `shape`, `hole`, `fixture`), trasformazioni, proprietà di stile, z-index, vincoli, riferimenti a file originali.
- `undo/redo` o storico comandi, stato di validazione, note di avviso, riferimento al pacchetto approvato.
- Conservare sia il **JSON progetto** riapribile nell'editor sia lo **SVG di produzione**; SVG e JSON non sono intercambiabili.

### 6.4 Contratto strumenti dell'AI

Il modello può invocare esclusivamente capacità definite e validate, per esempio:

- `searchProducts(criteria)` → candidati del catalogo reale.
- `getProductProfile(productId)` → profilo tecnico versionato.
- `recommendProducts(requirements)` → candidati e motivazioni prodotte dal motore di regole.
- `askMissingInformation(fields)` → domande rilevanti, senza interrogatori inutili.
- **In fase editor:** `addText`, `moveObject`, `resizeObject`, `setObjectStyle`, `importLogo`, `suggestAlternativeProduct`, `requestValidation`.

Ogni comando di modifica grafica deve riferirsi a un ID oggetto e a una revisione della scena; il server/client verifica schema, permessi, limiti dimensionali e coerenza. L'AI non è autorità per il prezzo finale né per l'approvazione di produzione.

## 7. Shopify e BSS: confini operativi

### 7.1 Prima landing page

- Inserire l'assistente in un blocco gestito dall'app, preferibilmente con **Theme App Extension** se il tema corrente supporta gli app blocks; verificare prima la compatibilità.
- Per la navigazione iniziale utilizzare l'URL reale della pagina prodotto, senza tentare di forzare i campi BSS o aprire PitchPrint via selettori DOM non documentati.
- La scelta effettuata deve essere spiegabile, rivedibile e non creare un ordine/cart item autonomamente.
- Misurare eventi semplici: ingresso landing, avvio, raccomandazione, click prodotto, eventuale conversione attribuibile con metodo esplicito.

### 7.2 BSS Storefront V2

- BSS V1/V2 **non possono coesistere** (informazione già fornita dal supporto all'utente).
- Esiste una bozza di mail tecnica per BSS che descrive la convivenza di BSS, PitchPrint e script custom, e chiede: differenze DOM/API/eventi, gestione delle varianti, calcolo prezzo, supporto migrazione, **rollback V2→V1**, preservazione delle impostazioni e procedura di test.
- La guida pubblica OPTIS Developer Integration menziona `BSS_PO.currentSelectedOptions` ed eventi come `BSSOptionSelectionChanged` (da verificare sulla versione effettiva del negozio). Non dedurre automaticamente che supporti scrittura programmatica dei valori.
- **Nessun aggiornamento BSS finché non c'è un piano verificato con il loro supporto.** Codex può censire e documentare script e dipendenze; non deve effettuare la migrazione.

### 7.3 Prezzi, checkout e futuro eventuale senza BSS

- BSS rimane **fonte operativa dei sovrapprezzi attuali**; mantenere prezzo corretto fino al checkout è vincolo inderogabile.
- Shopify Basic non permette di usare `lineUpdate` della Cart Transform API per cambiare liberamente il prezzo di un item (funzione riservata a Plus/development store, secondo documentazione Shopify consultata al 05/11/2026).
- Una futura alternativa a BSS dovrà valutare varianti, articoli accessori, altre integrazioni compatibili col piano, o draft orders, considerando effetti su UX, carrello, fiscalità e ordine. **Non scegliere ora workaround.**
- Una futura integrazione completa può salvare un `configurationId` nelle line item properties, ma il riferimento va associato al prodotto giusto e al contenuto approvato; prevedere lookup autorizzato in backoffice.

## 8. Editor Fabric.js e specifiche di produzione

### 8.1 Requisiti non negoziabili

- Lo stesso progetto deve essere modificabile via interfaccia e comandi dell'assistente.
- Elementi distinti: testo, loghi, tracciati, rettangoli, forme, e per targhe fori/viti/distanziatori con misure in mm.
- Movimenti, scala, rotazione, z-order, snap/allineamenti, selezione, copia, undo/redo, salvataggio e recupero.
- Il motore deve impedire o segnalare violazioni di margini, dimensioni, colori consentiti, dimensione minima del font e lavorabilità.
- Per i timbri: font **non inferiore a 7 pt** (valore iniziale indicato dall'utente, da trasformare in regola di profilo); loghi finali rigorosamente in bianco/nero puro dove richiesto; niente grigi e nessun colore residuo.
- Se una composizione non entra, proporre un prodotto più adeguato; trasferire la struttura senza ridurre caratteri sotto il minimo né deformare i loghi.

### 8.2 Qualità dei file

- **SVG vettoriale** in dimensione fisica coerente (width/height in mm e viewBox coerente), senza rasterizzare testo e forme se originalmente vettoriali.
- **Testi editabili in Adobe Illustrator**, con font installati o gestione esplicita della sostituzione; controllare eventuale frammentazione in più oggetti e la tenuta dell'impaginazione.
- **Geometrie vettoriali preservate** per gli oggetti vettoriali importati; le immagini raster rimangono raster, salvo processo di vettorializzazione separato.
- Fedeltà visiva canvas ↔ Illustrator: verificata nel primo esempio; costruire fixture per casi complessi.
- Misure reali e spessori/linee di taglio: test strumentali e convenzioni di esportazione; mai dedurre misura fisica dai pixel mostrati sullo schermo.
- **JSON progetto** come sorgente riapribile e **SVG di produzione** come output verificabile. Prevedere, se necessario, un esportatore SVG dedicato al posto di `toSVG()` standard.
- Una volta approvato, generare snapshot immutabile del file e riferirlo all'ordine.

### 8.3 Test da eseguire prima dell'adozione definitiva

1. Timbro: 3–8 righe, caratteri accentati, font reali, logo vettoriale, 7 pt, margini; import in Illustrator, modifica del testo e confronto dimensionale.
2. Targa: diversi colori/materiali, fori/viti/distanziatori, rettangoli e linee; misure e coordinate verificate.
3. Caso complesso: gruppi, testo ruotato, un logo SVG e uno PNG, più font; verificarne la riapertura e le proprietà in Illustrator.
4. Verifica di salvataggio/riapertura JSON, undo/redo, modifica manuale seguita da comando AI su uno stesso oggetto.

## 9. Sicurezza, affidabilità, privacy e sostenibilità

- Gestire prompt injection: testo cliente e dati di catalogo sono input non attendibili, non istruzioni amministrative.
- Tool AI limitati a operazioni con whitelist e argomenti validati; no modifiche amministrative o di prezzo dall'AI.
- Chiavi API solo lato server; log essenziali e con redazione dei dati personali; politiche di conservazione file e GDPR.
- Consentire interruzioni dell'AI: l'editor futuro rimane usabile manualmente e la landing page può offrire un percorso tradizionale.
- Versionare profili, schema del documento, prompt e modello AI; fissare le dipendenze e prevedere test golden.
- Prevedere limite token/richieste per sessione, blocchi anti-abuso, massimale di spesa e dashboard dei costi.
- All'inizio non servono server costosi: sviluppo locale, poi infrastruttura a consumo o piccolo servizio persistente, scelta tramite misure di carico reale.
- Costi precedentemente discussi: budget operativo **indicativo** 15–60 €/mese per il sistema completo con traffico ridotto, senza garanzia né preventivo; oggi BSS e PitchPrint continuano a essere pagati durante la transizione. Effettivi consumi AI, storage e hosting vanno misurati.
- Stima di impegno totale emersa nelle discussioni: 440–910 ore per una soluzione completa, solo orientativa e dipendente dall'ambito. Il prototipo 2–4 settimane **non equivale al sistema produttivo**.

## 10. Piano operativo del prototipo (2–4 settimane indicative)

### Settimana 1 — Inventario e fondazioni

**Attività Codex:**

- Esaminare la struttura locale del repository esistente (se fornito); se non esiste, creare una nuova cartella di progetto isolata.
- Scrivere `README.md`, `docs/architecture.md`, `docs/decisions.md`, `docs/integrations.md` e un file `.env.example` privo di segreti.
- Verificare strumenti disponibili (Node, package manager, Git, Docker facoltativo, Shopify CLI) e proporre l'uso del template Shopify ufficiale appropriato.
- Inventariare prodotti di test dal catalogo usando API autorizzate o un fixture locale; non fare scraping sistematico o modifiche allo shop senza permessi.
- Definire schemi tipizzati per `ProductProfile`, `Requirements`, `Recommendation`, `SelectionSession`.
- Preparare 10–20 scenari realistici di richieste per timbri, con risultati attesi verificabili manualmente.

**Uscita:** repository eseguibile localmente, schema dei dati e test iniziali.

### Settimana 2 — Assistente selezione prodotti

- Realizzare semplice chat/flow guidato responsive e accessibile, con persistenza sessione.
- Costruire catalog adapter con fixture e futura interfaccia Shopify; creare motore di filtri deterministico e spiegazioni.
- Integrare un singolo provider AI via adapter e output strutturati, senza credenziali nel frontend.
- Gestire «non so», richieste fuori catalogo, dati insufficienti, alternative, errore AI.
- Mostrare prodotto e collegamento alla pagina vera, ma **non** alterare carrello/opzioni BSS.

**Uscita:** percorso completo in locale: richiesta libera → chiarimenti → prodotto reale → link alla pagina Shopify.

### Settimana 3 — Spike editor e controlli di qualità

- Integrare Fabric.js in una pagina di prova separata (non nel tema live) con stato documento tipizzato.
- Creare forme e testi, applicare modifiche manuali e comandi JSON simulati, testare conflitti/revisioni.
- Esportare JSON e SVG con unità fisiche, e aggiungere un set di fixture produttive.
- Eseguire/registrare test Illustrator richiesti; elencare differenze e possibili mitigazioni.
- Misurare uso API/token e verificare sicurezza, limiti e logging.

**Uscita:** dimostrazione tecnica indipendente dall'AI e checklist di compatibilità Illustrator.

### Settimana 4 — Validazione e decisione

- Provare l'assistente su almeno 10–20 casi preparati e correggere le regole di selezione.
- Dimostrare un cambio di raccomandazione in seguito a nuovi requisiti senza perdere lo stato della sessione.
- Preparare mock/Theme App Extension su ambiente di sviluppo, se disponibile, senza pubblicare sul tema attivo.
- Registrare i punti di integrazione futuri con BSS e PitchPrint senza modificare le loro impostazioni.
- Produrre report: cosa funziona, cosa manca, rischi, stima ragionata per la landing page e fase editor.

**Gate:** prima landing pubblicabile soltanto dopo autorizzazione, test su tema duplicato/dev store e conferma che i flussi attuali restano invariati.

Le settimane sono una sequenza indicativa, non impegni di consegna. Se i test fanno emergere problemi gravi di Illustrator, catalogo o BSS, non mascherarli con soluzioni provvisorie: documentarli e proporre alternative.

## 11. Criteri di accettazione del prototipo

- [ ] Assistente utilizzabile in locale senza pubblicazione sullo store reale.
- [ ] Selezione limitata a prodotti realmente presenti nei fixture/catalogo; nessun URL o ID Shopify inventato.
- [ ] Ogni raccomandazione contiene almeno motivazione e requisiti ancora da verificare.
- [ ] Almeno 10 scenari di selezione automatizzati, con comportamento affidabile su richieste incomplete.
- [ ] Nessuna modifica a Shopify live, PitchPrint, BSS, checkout e prezzi.
- [ ] Chiamate AI validate tramite schema; errore o indisponibilità provider gestiti.
- [ ] Stato della conversazione separato dalle risposte testuali del modello.
- [ ] Mini-editor Fabric.js con un oggetto modificabile sia via UI sia con comando strutturato.
- [ ] Esportazione JSON e SVG; verifica documentata di font, testo editabile, vettori e dimensioni in Illustrator.
- [ ] Test di sicurezza di base, nessuna chiave API nel client, logging senza dati sensibili non necessari.
- [ ] Stima di costo AI per sessione misurata, con metodo replicabile.
- [ ] `README` completo e comandi di avvio/test ripetibili.
- [ ] Elenco dei blocker prima di qualsiasi deploy, con decisioni richieste all'utente.

## 12. Backlog successivo al prototipo

**Priorità 1 — Landing page realmente pubblicabile:** blocco Shopify configurabile, analytics adeguate, mobile, accessibilità, catalogo sincronizzato, meccanismo di rollback del solo assistente, osservazione dei risultati.

**Priorità 2 — Editor grafico:** pannello strumenti, import loghi, gestione livelli/undo, profili di lavorazione, vincoli e layout responsive, versioni del documento, approvazione cliente.

**Priorità 3 — Produzione:** qualità e controllo file, conversione binaria dei loghi dei timbri, eventuale vettorializzazione, recupero file per ordine e archivio/versioni.

**Priorità 4 — Integrazione prodotto/carrello:** solo dopo verifica end-to-end di prezzi, BSS, varianti e file approvati.

**Opzionale — Sostituire BSS:** analisi economica e tecnica separata, non prerequisito per completare l'editor. Evitare di implementare in parallelo un motore prezzi custom e un editor completo.

## 13. Rischi principali e mitigazioni

| Rischio | Gravità | Mitigazione |
|---|---|---|
| V2 BSS incompatibile con script/integrazioni esistenti | Alta | Richiedere revisione supporto, censire dipendenze, rollback documentato prima di migrare |
| AI suggerisce prodotto non adatto | Alta | Candidate set reale, filtri di catalogo e regole deterministiche, con incertezza esplicita |
| File Illustrator diverso o non editabile | Alta | SVG/JSON separati, fixture di test, esportatore dedicato se necessario |
| Differenza fra prezzo mostrato e checkout | Critica | BSS autorità iniziale; e2e test; non cambiare logiche prezzo nel prototipo |
| Cliente modifica grafica mentre l'AI usa stato vecchio | Alta | Unico documento, ID e revisioni, rifiuto comandi obsoleti |
| Dipendenza da provider AI | Media | Adapter, strumenti tipizzati, version pinning, test e fallback |
| Accesso non autorizzato ai file caricati | Alta | Storage riservato, URL firmate/temporanee, permessi e retention |
| Costi API imprevedibili | Media | Telemetria, quote, throttling e limiti mensili |

## 14. Regole di lavoro per Codex

1. **Leggi prima questo documento** e crea un registro delle assunzioni non verificate. Non inventare lo stato dello store.
2. **Prima documentare, poi modificare.** Se trovi un repository o script di tema, mappali senza effettuare scritture sul negozio.
3. **Nessuna operazione sullo store pubblicato** (theme deploy, installazioni, modifica prodotti/metafield, prezzi, carrello, impostazioni BSS/PitchPrint) senza richiesta e conferma esplicita dell'utente.
4. Usa TypeScript rigoroso, moduli piccoli, test automatici, lockfile e API documentate; evitare dipendenze inutili.
5. Separare **catalogo, regole, modello AI, UI, editor e adattatori Shopify**.
6. Progettare con prodotti/varianti reali e config versionata; dati di esempio ben marcati `TEST`.
7. Mai prendere testo libero dell'AI come comando eseguibile. Tutte le modifiche passano per funzioni tipizzate e validazione.
8. Dopo ogni iterazione: test, riepilogo file cambiati, decisioni aperte e prossima attività concreta.
9. Se manca accesso Shopify/Illustrator, usare fixture e reportare ciò che resta da verificare; non dichiarare superati test non eseguiti.
10. Per ogni scelta architetturale non reversibile, presentare alternative, compromessi e raccomandazione prima dell'implementazione.

## 15. Struttura di progetto consigliata (indicativa)

```text
shopify-ai-customizer/
├── AGENTS.md                     # regole permanenti per Codex
├── README.md                     # avvio locale, test e panoramica
├── .env.example                  # soli nomi delle variabili
├── docs/
│   ├── project-brief.md          # questo documento, copia versione repo
│   ├── architecture.md
│   ├── decisions.md               # log decisioni e versioni
│   ├── integrations.md            # stato Shopify, BSS, PitchPrint
│   ├── production-files.md        # Illustrator/SVG/JSON
│   ├── costs-and-metrics.md
│   └── test-plan.md
├── app/ o apps/                   # struttura scaffold ufficiale Shopify
├── packages/                      # solo se serve davvero separare moduli
│   ├── catalog/
│   ├── recommendation-rules/
│   ├── ai-adapter/
│   ├── document-model/
│   └── editor-fabric/
├── fixtures/
│   ├── products/
│   └── illustrator/
└── tests/
```

La directory esatta deve adattarsi allo scaffold ufficiale scelto. Non adottare prematuramente un monorepo complesso se una singola app strutturata soddisfa il prototipo.

## 16. Primo incarico da dare a Codex (pronto da copiare)

> Stiamo avviando il progetto «Assistente AI e personalizzatore grafico Shopify» per www.incisoriasacchetti.it. Leggi integralmente `01_Specifica_Progetto_Codex.md` e `AGENTS.md`. L'obiettivo immediato è un prototipo locale (2–4 settimane indicative): assistente per scegliere prodotti Shopify reali, con primo test sulla famiglia timbri, e prova separata di Fabric.js con stato condiviso ed esportazione SVG/JSON. Per adesso BSS Product Options e PitchPrint **rimangono attivi e non vanno modificati**. Non aggiornare BSS V1→V2, non scrivere sul tema pubblicato, non cambiare prezzi, varianti, carrello o checkout.
>
> Prima di programmare: (1) esamina ambiente/repository disponibile; (2) elenca dati mancanti e ipotesi; (3) proponi struttura minima, contratti tipizzati, milestone e criteri di test; (4) verifica le versioni correnti delle dipendenze tramite documentazione ufficiale quando possibile. Poi realizza soltanto lo scheletro locale e un primo flusso con catalogo fixture: richiesta cliente → eventuali domande → raccomandazione di un prodotto reale di test → URL pagina prodotto. Regole deterministiche, AI dietro adapter, nessun risultato inventato. In parallelo prepara un mini-test Fabric.js che permetta modifiche manuali e comandi strutturati allo stesso oggetto e generi JSON/SVG. Esegui i test disponibili e riporta un resoconto con prove, limiti, rischi e prossimi passi. Chiedi approvazione prima di ogni intervento esterno o irreversibile.

## 17. Fonti tecniche di riferimento (consultate al 5 novembre 2026)

- Shopify Theme App Extensions: https://shopify.dev/docs/apps/build/online-store/theme-app-extensions
- Shopify CLI e preview delle estensioni: https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/build
- Shopify App Proxy: https://shopify.dev/docs/apps/build/online-store/app-proxies
- Shopify Ajax Cart API / line item properties: https://shopify.dev/docs/api/ajax/reference/cart
- Shopify Cart Transform API e limite `lineUpdate`: https://shopify.dev/docs/api/functions/latest/cart-transform
- Fabric.js — concetti di Canvas/oggetti e esportazione JSON/SVG: https://www.fabricjs.com/docs/core-concepts/
- OPTIS / BSS — Developer Integration Guide: https://help.optis.me/en/article/optis-product-options-developer-integration-guide-26h3ax/
- OPTIS / BSS — Storefront V2: https://help.optis.me/en/article/optis-storefront-v2-faster-smarter-more-stable-1aq43jn/
- Pagina negozio attuale: https://www.incisoriasacchetti.it/pages/crea-timbro-online

---

**Nota finale:** questo documento è il riferimento iniziale, non un'affermazione che lo stato del negozio sia già stato ispezionato. Codex deve trasformare ipotesi e requisiti in verifiche, registrare ogni scelta e preservare la reversibilità delle modifiche. Qualsiasi intervento sul negozio reale richiede autorizzazione esplicita.

**14 novembre — conversazione grafica locale:** [Pannello e prove](docs/iteration-editor-graphical-conversation.md). Richieste successive e modifiche manuali sullo stesso documento, memoria breve protetta e interruzioni propagate, anteprima/conferma/Undo conservati. 1.520 test, 106 browser pertinenti distinti fra esecuzioni/ricontrolli, 13 pubblici e 106 campioni passati. Principale R639 invariato; chat commerciale e mini-editor incorporato ancora distinti, nessun deploy.

**14 novembre — ingresso conversazionale locale:** [Percorso e prove](docs/iteration-editor-selection-graphic.md). Selezione → prodotto verificato → contenuto opaco → bozza su foglio o template, vista compatta/completa e conversazione conservate; stessa quota di sessione. 1.523 test, 80 browser pertinenti distinti fra esecuzioni/ricontrolli, 13 pubblici e 107 campioni passati. Principale R639 invariato, nessun deploy; dati tecnici reali e unificazione completa delle conversazioni ancora da completare.
