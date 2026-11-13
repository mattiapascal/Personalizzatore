# Copia aggiornata e manutenzione dell’archivio — 13 novembre 2026

Il JSON attivo è a revisione 627, 339 progetti e 219 font, 535.456.964 byte: circa 1,35 MiB dal tetto operativo. La copia precedente era ferma a revisione 616. Nuova copia separata preparata a revisione 627, tutti i contenuti/indici/miniature confrontati: 90.738.688 byte e 296 risorse uniche. Nessuna selezione o attivazione automatica.

1. Ripetere la verifica da una nuova connessione, esportare il JSON di ripristino e provarlo nel lettore precedente sul volume attuale.
2. Aggiungere backup SQLite coerenti e ripristino soltanto in nuove destinazioni isolate, con verifica completa delle risorse, metadati, record/font e chiavi miniature. Nessuna copia grezza del solo file mentre è in uso: provare transazioni aperte e journal WAL.
3. Rifiutare sovrascritture, percorsi dell’archivio attivo e alias tramite collegamenti; pubblicare il file solo dopo verifica/sync, con permessi privati. Errori o interruzioni non devono lasciare un backup apparentemente pronto.
4. Collaudare backup/ripristino anche con un archivio logico oltre 512 MiB ma risorse condivise. Il vecchio lettore JSON conserva il proprio limite; non promettere il suo ripristino per volumi che non può leggere. I singoli progetti JSON restano portabili.
5. Aggiornare l’ambiente di prova in sola lettura con la copia corrente, verificare i template recenti, i libri, le miniature e i font, mantenendo il server principale sul JSON. Prove di scrittura soltanto su un’ulteriore copia indipendente.

Rischi: un backup deve includere uno snapshot coerente dei commit, anche se il database usa WAL; il nome del file non ne prova la validità. Il collaudo degli strumenti e delle copie non autorizza l’attivazione sull’archivio principale. La scelta e il ritorno devono essere concreti e rivedibili prima di chiedere l’autorizzazione prevista da AGENTS.md. Nessun deploy o modifica commerciale.

Completamento e limiti verificati in [iteration-editor-sqlite-maintenance.md](iteration-editor-sqlite-maintenance.md). La selezione/ritorno del laboratorio completo resta il prossimo incremento, senza attivazione implicita.
