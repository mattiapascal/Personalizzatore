# Archivio SQLite isolato — 12 novembre 2026

## Motivo e perimetro

Lo storage esiste già: un unico `state.json` contiene template, composizioni, font e risorse incorporate. Dopo il lotto precedente occupa **526.058.877 byte (501,7 MiB)** su un tetto locale di 512 MiB. L’audit ha misurato 441.333.657 byte di stringhe ripetute. Non si tratta di aggiungere un altro archivio per gli utenti, ma di preparare una persistenza che eviti copie identiche e salvataggi dell’intero file.

**La nuova persistenza è un prototipo isolato, non attivato sul server.** L’editor in uso continua a leggere/scrivere il JSON precedente. Nessuna migrazione dell’archivio attivo o modifica commerciale. La copia di prova non riceve automaticamente le successive modifiche dell’utente.

## Implementazione

- Interfaccia opzionale `EditorAdminPersistence`, passata esplicitamente a `EditorAdminStore` soltanto da test/strumenti. Lo switch dei comandi amministrativi, gli schemi e i controlli restano unici; il percorso JSON predefinito conserva il suo comportamento.
- SQLite separa metadati, record, font e risorse. Font/immagini identici condividono il contenuto tramite SHA-256 della stringa esatta. ID, nomi, stili, pagine, geometrie e proprietà restano nel documento originale. In lettura si ricostruisce il JSON completo: nessun riferimento al database nei progetti esportati.
- Transazioni, revisione attesa e controllo delle modifiche da altre connessioni/processi. Le copie mutabili coinvolgono i soli destinatari del comando; record invariati conservano identità e righe senza riserializzazione. Errori o quota annullano righe, risorse e revisione.
- Indice con chiavi miniature precalcolate; letture selettive di progetto/font. I contenuti condivisi restano presenti finché esiste almeno un riferimento, inclusi quelli incorporati in progetti che usano un font eliminato dalla libreria.
- Checksum di risorse/righe/metadati, conteggi, chiavi esterne e verifica integrità. Dati mancanti/corrotti producono errori: nessuna sostituzione di font, ritorno a dati vecchi o ricostruzione implicita di un archivio vuoto.

Uso del modulo integrato nel Node 24.17 installato, senza nuove dipendenze. API confrontate con la [documentazione ufficiale SQLite di Node](https://nodejs.org/download/release/v24.9.0/docs/api/sqlite.html) e provate nel runtime locale.

## Strumenti di copia e ripristino

```sh
npm run editor:storage -- prepare --source PERCORSO/state.json --output DIRECTORY_SEPARATA/archive.sqlite
npm run editor:storage -- verify --source PERCORSO/state.json --copy DIRECTORY_SEPARATA/archive.sqlite
npm run editor:storage -- export --source DIRECTORY_SEPARATA/archive.sqlite --output ALTRA_DIRECTORY/state.json
```

Nessuna selezione o attivazione automatica. Output nuovi in directory separate; file temporaneo, controllo della sorgente e pubblicazione senza sovrascrivere file esistenti. File privati con permessi 0600. Esportazione JSON per record, senza costruire un’unica stringa per l’archivio completo.

## Collaudo sul volume reale

Copia privata `.local/editor-storage-trial/20261112/archive.sqlite`:

- **328 record: 326 template e due composizioni, 219 font**, revisione 616.
- **289 risorse uniche**, 66.556.626 byte di stringhe; database **86.790.144 byte (82,8 MiB)**, contro 501,7 MiB del JSON. Riduzione di circa l’83,5% del file, senza riduzione della qualità.
- Tutti i record/font/metadati, ordine delle liste e chiavi miniature confrontati. Ogni contenuto di risorsa verificato per hash; integrità SQLite e riferimenti passati.
- Verifica ripetuta da una nuova connessione in sola lettura. Esportato `rollback/state.json`, poi letto con il **precedente EditorAdminStore JSON**: tutti i 328 record e i 219 font confrontati nuovamente con la copia.
- Archivio attivo identico prima/dopo, SHA-256 `ef57cdb7a67345286810521fc3a6c949e32111cabf8fc4380d1f2e32d1945c56`. Backup e copie precedenti conservati.

Rapporti privati: `.local/sqlite-real-prepare.log`, `.local/sqlite-real-verify.log`, `.local/sqlite-real-export.log`, `.local/editor-storage-trial/20261112/rollback-report.json`.

Un singolo campione di lettura su processi distinti ha misurato indice JSON circa 18,6 s / 1,03 GiB RSS massimo e indice SQLite circa 109 ms / 185 MiB RSS massimo, con zero risorse/progetti decodificati per il solo indice. **Misura diagnostica con altro lavoro simultaneo, non benchmark ripetuto né velocità già applicata all’editor attivo.** La copia richiede ancora una lettura iniziale del grande JSON: circa 32 s e 1,33 GiB RSS nella preparazione osservata. Le scritture/letture ordinarie del prototipo non richiedono quella conversione.

## Verifiche automatiche

- **921 unitari / 137 file** nell’esecuzione finale completa: `.local/sqlite-unit-release.log`; 15 casi del nuovo backend, inclusi risorse condivise, cancellazioni, errore dopo mutazione della copia, rollback dopo inserimento di una nuova risorsa, quota, processi concorrenti e interruzione con transazione aperta.
- **60 browser pertinenti completi**: `.local/sqlite-pertinent-browser.log`, inclusi archivio JSON corrente e tre nuovi casi SQLite. Manuale e simulazione AI modificano lo stesso documento canonico, Undo/Redo e salvataggi riaperti; cache riusata, indice senza lettura dei progetti e metadati senza riscrittura delle risorse.
- **54 campioni JSON/SVG** riaperti/esportati senza errori o rete esterna: `.local/sqlite-artifacts-second.log`. Primo tentativo interrotto da un timeout di avvio; il ricontrollo completo è passato. **13 test pubblici**, build locale/pubblica, Worker e segreti passati; bundle pubblico sempre `index-BG2r_x-8.js`. Non una nuova suite browser generale o una certificazione Illustrator.

## Lavoro ancora necessario

L’integrazione del backend alternativo con tutte le letture del server e i resolver dei font va completata e collaudata prima di proporre un’attivazione. Nessun rilevamento automatico di un database nella directory dell’archivio, nessun passaggio implicito al prototipo.

Il ripristino nel vecchio lettore è verificato per il volume corrente. Con un futuro archivio logico oltre 512 MiB, l’esportazione streaming rimane completa ma il vecchio lettore manterrebbe il suo tetto; il piano di migrazione dovrà prevedere anche backup/ripristino SQLite e il relativo collaudo, senza promettere rollback illimitato nel vecchio formato. I JSON dei singoli progetti rimangono completi e portabili.

Restano 27 sorgenti prioritari non importati. Il prototipo di storage non risolve differenze grafiche, font mancanti o classificazioni dei materiali. Nessun deploy, generazione immagini AI o modifica Shopify/BSS/PitchPrint/prezzi/carrello/checkout.
