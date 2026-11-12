# Capacità dell’archivio locale — 12 novembre 2026

L’archivio JSON contiene copie complete delle risorse nei singoli documenti. Il formato è portabile e le stringhe uguali sono condivise in memoria, ma sul disco font e immagini comuni possono ripetersi. Con i nuovi template si avvicina al limite di 512 MiB; aumentare soltanto il tetto del JSON accentuerebbe tempi di lettura/salvataggio e picchi di memoria.

## Incremento da preparare

1. Misurare su una copia quanto spazio occupano record, immagini/font unici e duplicati. Individuare anche i picchi delle operazioni reali; distinguere il normale server appena avviato dalle vecchie sessioni con molti riavvii HMR. Nessuna deduzione di una perdita di memoria dal solo esaurimento di una sessione.
2. Confrontare uno storage locale con indice/record e risorse indirizzate per hash (SQLite o file separati). Conservare invariati API, comandi validati e JSON completo scaricabile: nessun progetto deve dipendere da risorse assenti quando viene esportato.
3. Preparare un convertitore su archivio isolato con checksum prima/dopo, controlli di parità per tutti i record/font/impostazioni/profili, salvataggi atomici, versioni concorrenti e rollback. Una singola scrittura non deve riserializzare tutti i template o tenere due archivi completi in memoria.
4. Verificare cache miniature e letture selettive, font rigorosi, risorse immutabili, eliminazioni/archiviazioni, ripristino del backup e test con il volume reale. Nessuna deduplicazione basata su nomi, somiglianza visiva o font alternativi.
5. Solo dopo questi controlli, rendere concreta e rivedibile l’eventuale migrazione dell’archivio reale secondo le autorizzazioni applicabili. Nessuna migrazione di storage è eseguita da questo piano.

Nel frattempo i salvataggi mantengono il controllo di capacità esistente: superare il limite rifiuta il nuovo salvataggio e conserva i dati già salvati. Non ridurre qualità delle immagini, comprimere arbitrariamente i font o cancellare documenti per fare spazio.

## Misura sul volume reale

Audit in sola lettura dopo il lotto di riferimenti: revisione 616, 326 template, JSON di **526.058.877 byte (circa 501,7 MiB)**. In 1.062 occorrenze di font/immagini sono presenti **289 risorse uniche**: 219 font e 70 immagini. Le stringhe codificate occupano 507.890.283 byte contando le ripetizioni, 66.556.626 byte contando ogni risorsa una volta; **441.333.657 byte sono ripetizioni**. Non è una stima del database finale: vanno aggiunti indici, metadati e transazioni, ma la deduplicazione per contenuto è la direzione da collaudare. Archivio identico prima/dopo; rapporto privato `.local/pitchprint-migration/archive-resource-size-audit.json`. Nessuna migrazione effettuata.

## Collegamento al server di prova completato

[Incremento e collaudo](iteration-editor-sqlite-server-trial.md): API reali, resolver font condiviso e copia in sola lettura sulla porta 5175. Il JSON principale resta predefinito e invariato; nessuna migrazione. Prima dell’attivazione restano procedura e strumenti di manutenzione da completare.
