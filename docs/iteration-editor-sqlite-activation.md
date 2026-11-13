# Attivazione autorizzata dell’archivio SQLite locale — 13 novembre 2026

Il titolare ha autorizzato esplicitamente il passaggio del solo editor locale a SQLite. Il laboratorio ordinario sulla porta **5173** usa ora il registro persistente già collaudato; non serve avviare una modalità di prova. Negozio, chat pubblicata e integrazioni commerciali non sono stati modificati.

## Dati conservati

**Revisione 627: 337 template, due composizioni e 219 font.** Tutti i contenuti, ID, metadati e file incorporati coincidono semanticamente con il JSON precedente. Dimensione SQLite **90.738.688 byte, 86,5 MiB**, rispetto ai **535.456.964 byte, 510,7 MiB** del JSON. Non sono stati importati altri template durante il passaggio.

Il normale server è stato fermato dopo le regressioni. Prima dell’attivazione sono stati creati un backup SQLite separato e una proposta aggiornata. `editor:selection apply` ha ripetuto il confronto integrale, verificato gli hash e il server fermo, quindi pubblicato atomicamente il registro. Il laboratorio è stato riavviato con il normale `npm run dev -- --strictPort`, senza variabili o configurazioni alternative. L’intestazione amministrativa e l’API confermano il backend SQLite e la sua identità.

File privati, esclusi da Git:

- Attivo: `.local/editor-storage-ready/20261113-r627/archive.sqlite`.
- Registro: `.local/editor-admin/archive-selection/active.json`.
- Originale conservato: `.local/editor-admin/state.json`.
- Backup verificato: `.local/editor-storage-ready/20261113-r627/pre-activation-backup/archive.sqlite`.
- Proposta applicata: `.local/editor-storage-ready/20261113-r627/activation-plan-authorized.json`.
- Proposta di ritorno al checkpoint JSON: `.local/editor-storage-ready/20261113-r627/rollback/selection-plan-r627.json`.

Hash JSON originale `08b6c33591ca6ecd55489f2eb4da9b96bfbfcce5f56892d206afa053f7e34aeb`; SQLite e backup `67c7c0dc87feb47796c791955f2fd67b189f2e2bf77f88674d4f9bfc25b0dbde`. Contenuto semantico comune `cd120bff52978c4e7a5dcf30c82ec154bd09d8a3538ae3e5e5c318859758c75c`.

Il piano di ritorno è stato preparato con il confronto completo, ma **non applicato**. È valido per questo checkpoint: dopo nuovi salvataggi occorre esportare e verificare la revisione corrente prima di tornare a JSON. Non cancellare il registro e non riaprire direttamente il vecchio JSON. I dettagli e i limiti del ritorno sono nel [resoconto del registro persistente](iteration-editor-persistent-archive.md).

## Verifica sul laboratorio reale

La risposta API completa coincide con lo snapshot SQLite; intestazioni di identità e backend corrette. Cinque template riaperti confrontando oggetti, font e pagine con il record effettivo: Consulente del lavoro, Cartello viario monofacciale, Oltre i 100a, Timbro aziendale - Mod. B e 80x25 a due pagine. Nessun errore di rendering/font o sostituzione. Il resolver dell’Alida originale risponde HTTP 200. Schermate in `.local/editor-storage-ready/20261113-r627/activation/`.

Tre miniature amministrative effettive verificate e schermata ispezionata. Dopo il ricaricamento sono visibili dalla cache senza nuove letture dei tre record; zero errori, richieste esterne o scritture, database invariato. Rapporto `activation/preview-report.json`, log `.local/editor-sqlite-activation-previews.log`.

Entrambe le vecchie composizioni di prova contengono ancora il nome Arial senza file incorporato. Il recupero propone correttamente **Scegli i file font del progetto**, con apertura disabilitata finché non viene scelto un file. Non sono state associate automaticamente a un’altra risorsa né alterate per far passare il test. Le prime due prove del verificatore si aspettavano erroneamente l’apertura diretta e sono conservate come fallimenti; la verifica finale distingue l’esito previsto per i documenti legacy. Questo non certifica l’impaginazione di quei progetti prima di una scelta esplicita del font.

Zero errori browser, richieste esterne o scritture amministrative durante la verifica. Database attivo, JSON originale e backup immutati. Rapporti `.local/editor-sqlite-activation-{backup,prepare,apply,rollback-final,smoke-final}.log` e `activation/report.json`. Il primo output del piano di ritorno è stato rifiutato perché collocato nella stessa directory del database: usata una sottodirectory separata, mantenendo intatta la protezione dei percorsi.

Le prove del salvataggio e riavvio con revisione incrementata erano già state eseguite su copie isolate; **nessun salvataggio artificiale è stato effettuato sull’archivio reale**. Il [controllo del testo mascherato](iteration-editor-text-mask-inspection.md) e i relativi test sono un incremento distinto. Nessun deploy, generazione immagini AI o modifica Shopify/BSS/PitchPrint.
