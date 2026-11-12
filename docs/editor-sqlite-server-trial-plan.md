# Collegamento SQLite in server di prova — 12 novembre 2026

Completare l’integrazione del prototipo senza attivarlo sull’archivio corrente.

1. Runtime esplicito JSON/SQLite di copia. Stessa istanza del negozio amministrativo per API e resolver PitchPrint; nessuna scelta automatica in base alla presenza di file. Chiudere la connessione al termine del server.
2. API indice/progetto/font/backup con le letture selettive già collaudate. Risoluzione dei font e import Google attraverso lo stesso store configurato, conservando identità, hash e assenza di fallback.
3. Configurazione Vite distinta sulla porta 5175, con percorso di copia obbligatorio, sola lettura predefinita e scritture consentite soltanto con opzione esplicita sulla copia. Rifiutare percorsi dell’archivio attivo e database mancanti; nessuna creazione silenziosa di un archivio vuoto.
4. Identificare chiaramente la copia nell’amministrazione e nell’editor. Escludere chat AI e flussi carrello/configurazioni; librerie media consultabili ma non modificabili. Consentire analisi font e conversioni grafiche locali. Il server principale 5173 e i dati in uso restano invariati.
5. Testare le vere API HTTP su dati isolati, risoluzione font dopo upload/categoria/archiviazione/eliminazione, versioni concorrenti, copia in sola lettura e confini fra ambienti. Riaprire template reali nella copia in sola lettura e verificare integrità della sorgente.
6. Collaudare backend JSON esistente, campioni grafici e chat pubblica; documentare e sincronizzare. Nessuna migrazione dell’archivio attivo: il passaggio definitivo rimane una fase distinta da rendere rivedibile e autorizzare secondo AGENTS.md.

## Collegamento al server di prova completato

[Incremento e collaudo](iteration-editor-sqlite-server-trial.md): API reali, resolver font condiviso e copia in sola lettura sulla porta 5175. Il JSON principale resta predefinito e invariato; nessuna migrazione. Prima dell’attivazione restano procedura e strumenti di manutenzione da completare.
