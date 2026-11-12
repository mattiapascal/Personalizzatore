# Storage SQLite su copia isolata — 12 novembre 2026

Prova locale esplicita, non attivata sul server o sull’archivio reale. Basata sulla misura di 441 MB di risorse ripetute. SQLite integrato nel Node 24.17 installato; nessuna nuova dipendenza o servizio esterno.

1. Introdurre un’interfaccia di persistenza opzionale nel negozio amministrativo, lasciando il JSON predefinito invariato. Stesso switch dei comandi, validazione, revisioni e risposte API. Il backend alternativo viene passato esplicitamente soltanto da test e strumenti isolati.
2. Salvare separatamente metadati, record, font e risorse immutabili per hash del contenuto esatto. Ricostruire lo stesso JSON completo in lettura/esportazione. Nessuna modifica ai documenti canonici, ai byte dei font/immagini o alle chiavi delle miniature.
3. Scritture transazionali con controllo della revisione; aggiornare solo le righe coinvolte e mantenere le risorse condivise finché esiste almeno un riferimento. Letture selettive di indice, record e font senza ricostruire l’intero archivio.
4. Conversione ed esportazione verso file nuovi, con rifiuto di sovrascrittura, checksum e confronto completo. Testare rollback, concorrenza fra connessioni/processi, risorse corrotte/mancanti, errori/quota, duplicazioni ed eliminazioni. Non scegliere un font alternativo per risolvere dati errati.
5. Collaudare tutti i record del volume reale in una directory privata separata, confrontare indici/cache/JSON e misurare spazio, tempi e memoria. Test browser su archivi isolati. Nessun deploy o migrazione automatica dell’archivio usato dall’editor.

Rischi da verificare: mutazioni della cache nel reducer, perdita di riferimenti condivisi alla cancellazione, formato DB incompleto dopo errori, letture incoerenti fra righe, attivazione implicita. I documenti multipagina già autorizzati devono rimanere integri; la clausola storica del goal non annulla le direttive successive del titolare.

## Esito del primo incremento

[Prototipo e copia reale verificati](iteration-editor-sqlite-isolated.md), senza attivazione. Persistenza opzionale, strumenti di copia/verifica/esportazione, confronto di tutti i dati e ripristino nel vecchio lettore completati. Collegamento completo alle API/font resolver e procedura di attivazione ancora da sviluppare/collaudare; archivio in uso invariato.
