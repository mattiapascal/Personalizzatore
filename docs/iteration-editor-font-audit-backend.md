# Censimento font coordinato con l’archivio — 13 novembre 2026

## Problema risolto

Il comando storico leggeva sempre il JSON e inviava le installazioni a un’origine HTTP scelta separatamente. Poteva quindi confrontare un archivio e chiedere un salvataggio a un altro. Inoltre il backup usava `JSON.stringify` dell’intero stato, inadatto al volume futuro SQLite.

Il censimento sceglie ora esplicitamente JSON oppure SQLite e verifica il server prima delle installazioni. **Il principale rimane sul JSON R627; nessuna migrazione attivata.** Non sono stati installati o modificati font personali in questo incremento.

## Identità e comandi

Ogni runtime calcola un’identità opaca dal backend e dal percorso canonico del file. L’intestazione locale `X-Editor-Archive-Id` permette al CLI di distinguerlo da una copia con gli stessi dati e la stessa revisione. I percorsi non vengono inviati al frontend né salvati nel documento grafico. Per JSON l’identità rimane stabile alla prima creazione e quando il salvataggio sostituisce atomicamente il file; gli alias della cartella vengono normalizzati anche se il percorso finale non esiste ancora.

Le API locali restituiscono l’identità e accettano la stessa intestazione come precondizione opzionale. Se non corrisponde, rispondono **409 `archive_mismatch` prima della mutazione**. I client esistenti continuano a usare il contratto precedente; il CLI invia sempre la precondizione e richiede che il server la supporti. È un controllo di coordinamento locale, non un nuovo sistema di autenticazione.

Prima di ogni installazione il CLI controlla identità, revisione e snapshot del server selezionato. L’origine deve essere HTTP locale; copie in sola lettura, origini esterne e configurazioni ambigue sono rifiutate. Gli aggiornamenti usano sempre `uploadFont` validato del server, senza scritture dirette del CLI nella libreria. Conflitti e risposte perse/non verificabili interrompono il lavoro senza retry automatici o rollback delle modifiche concorrenti.

## Uso e backup

Con Node della `.nvmrc`:

```sh
# Analisi senza rete sull’archivio JSON attuale:
npm run pitchprint:fonts -- --offline

# Analisi senza rete di una copia SQLite dichiarata:
npm run pitchprint:fonts -- --offline --sqlite-file .local/copia/archive.sqlite --output-dir .local/copia-font-audit

# Soltanto quando è richiesta l’installazione Google, sul server della stessa copia:
npm run pitchprint:fonts -- --sqlite-file .local/copia/archive.sqlite --origin http://127.0.0.1:5177 --install-google --output-dir .local/copia-font-install
```

`--library-dir` seleziona la directory JSON; non può essere combinato con `--sqlite-file`. In assenza delle due opzioni resta il JSON storico `.local/editor-admin`, senza scoperta automatica di un database. La modalità `--offline` non consulta Google e non può essere combinata con `--install-google`. Il rapporto distingue esplicitamente la disponibilità locale dalla disponibilità Google non controllata. Il comando usa heap massimo 4 GiB per il volume JSON attuale, coerentemente con il laboratorio.

Il backup è creato solo prima della prima vera installazione, in una destinazione nuova con revisione e ID dell’esecuzione. SQLite usa il backup nativo già collaudato; JSON una copia in streaming con budget, hash e verifica della sorgente prima/dopo, permessi 0600 e pubblicazione senza sovrascritture. Non viene generata una stringa dell’intero archivio. Un vecchio backup non viene riutilizzato come se fosse quello della revisione corrente.

`font-audit-run.json` registra stato `running`, `complete` oppure `failed`, backend, identità, revisione attesa e backup. Un esito ambiguo non produce un nuovo rapporto finale di successo. In una directory riutilizzata consultare prima questo file: un vecchio `font-report.json` può appartenere a una precedente esecuzione conclusa. La copia di sicurezza permette l’ispezione; non autorizza un ripristino implicito.

## Stesse regole dell’editor

Il censimento usa ora `resolvePitchprintFont`, con la libreria selezionata e gli stessi controlli di identità/metadati/hash dell’importatore. Un nome amministrativo personalizzato non rende mancante il file esatto. I cinque alias CSS originali già verificati sono riutilizzati dal resolver esistente; non sono state aggiunte nuove equivalenze o condizioni sul titolo del template.

Un originale trovato nel vecchio catalogo ma assente dalla libreria attiva non viene dichiarato installato. Le nuove risorse Google vengono verificate per famiglia, peso e stile prima della richiesta. Nessun font del computer, famiglia simile o peso sintetico.

SQLite viene aperto in sola lettura dal censimento. Progetti verificati uno per volta, libreria font e snapshot mediante letture specifiche; un test vieta `EditorAdminStore.read()` su quel percorso. Nel JSON resta il lettore precedente, evitando però le ripetute ricostruzioni dell’intero stato a ogni font. Al termine sono confrontati tutti i progetti con hash per record, metadati e font preesistenti.

La disponibilità del file **non certifica la copertura dei caratteri né la resa produttiva**: rimangono il preflight dell’editor, i controlli sui glifi e il collaudo Illustrator separati.

## Censimento reale offline

Sulla copia R627, tutti i **473 sorgenti**, comprese le pagine dei gruppi a bassa priorità: **96 combinazioni famiglia/peso/stile**, **94 disponibili**, nessuna dichiarazione incompleta e zero installazioni. Sono più combinazioni del precedente censimento dei soli monopagina: non è una regressione dei file già acquisiti.

Le due combinazioni non risolte localmente:

- **Gloria Hallelujah 700**: «Vogliamo solo coccole», Attenti al Cane 300 × 200 mm, prioritario.
- **Neris Light 400 dichiarato**: «Modern Blue», Biglietti da Visita, due pagine, priorità bassa.

Cinque alias CSS originali riconosciuti con i reali pesi dei file: Kuenstler 700 dichiarato/750 reale, Nexa Bold 400/700, tekton 400/500, URW DIN SemiCond Black 400/900 e Zurich Light Extra Condensed 400/300. Sono i collegamenti già verificati nel precedente incremento, non nuove sostituzioni.

Il runner reale sostituisce `fetch` con un contatore che rifiuta qualunque richiesta: **zero chiamate di rete**. Archivio principale SHA `08b6c33591ca6ecd55489f2eb4da9b96bfbfcce5f56892d206afa053f7e34aeb` e copia R627 SHA `e1eef5be1584441990b929df6d07dce950d2cdb21ff5f7a54dcb67635abfb4cf` identici prima/dopo. Rapporti privati in `.local/editor-storage-trial/20261113-r627/font-audit-offline/`.

Il primo avvio della verifica reale con rete è stato respinto dall’auto-review prima dell’esecuzione: motivazione, possibile invio a Google di nomi derivati dai sorgenti privati. Il percorso `catalog()` richiede il catalogo generale con URL fisso; quella verifica online non è stata ritentata. È stata sviluppata e collaudata l’alternativa offline, che elimina la richiesta di rete. La disponibilità Google dei due casi non risolti non è stata verificata in questa sessione.

## Test e confini

Quattordici nuovi casi coprono JSON/SQLite, copie equivalenti ma differenti, backup e ripetizione senza duplicati, sola lettura, 409 concorrente, perdita della risposta dopo un commit reale, font sbagliato, file troppo grande, alias e prima creazione, origine non locale, font rinominato, offline e avvio effettivo del CLI con JSON esca. I test HTTP esistenti controllano la precondizione sui tre runtime: JSON, copia SQLite e laboratorio completo SQLite.

**988 unitari in 147 file**, **13 browser pertinenti e 13 pubblici**, build locale/pubblica, pacchetto Worker dry-run e scansioni segreti passati. Bundle pubblico invariato `index-BG2r_x-8.js`. Il server principale è stato controllato via HTTP con precondizione di identità: 200, identità corrispondente, R627, 339 record e 219 font. Il runtime Worker e i campioni grafici erano già stati verificati nel precedente incremento, non rieseguiti qui. Nessun nuovo campione grafico richiesto da questo cambiamento degli strumenti; i 59 campioni precedenti restano invariati, non certificati nuovamente in Illustrator.

Un primo controllo TypeScript ha rilevato `styleName` mancante nella risposta Google simulata del test: aggiunto il metadato alla fixture, senza allentare il contratto del prodotto. Log privati con prefisso `.local/font-audit-backend-`.

## Prossima attività

Prima di proporre l’attivazione va completata la scelta persistente del backend per l’avvio ordinario e per gli strumenti: un successivo `npm run dev` non deve riaprire silenziosamente il vecchio JSON dopo nuovi salvataggi SQLite. La configurazione alternativa attuale rimane esplicita e collaudata. Anche le procedure dei prossimi lotti devono dichiarare il runtime e il backup corretti; i vecchi script privati JSON non cambiano destinazione da soli.

Restano **16 template prioritari** e nessuna nuova importazione in questo incremento. Il ruolo dei sette primi piani resta da confermare; gli altri casi grafici/font restano nella coda. Nessun deploy o modifica al negozio, tema, BSS, PitchPrint, prezzi, carrello o checkout; chat preservata e nessuna generazione immagini AI.
