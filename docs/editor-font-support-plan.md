**Incremento implementato e collaudato:** [evidenziazione, ricerca, caricamento selettivo e verifiche](iteration-editor-font-support-highlight.md). Il piano sotto conserva i criteri di partenza. Rimane da diagnosticare la copertura non verificabile di Continuum Medium, senza alcuna sostituzione automatica.

# Ricerca esplicita dei font che contengono i caratteri mancanti

Incremento locale proposto il 13 novembre, dopo il collegamento delle segnalazioni all’ispettore. Il controllo preventivo del candidato rimane autorevole; la ricerca non sceglie un font e non esegue comandi grafici.

La ricerca parte soltanto dal pulsante della segnalazione. Controlla i font incorporati nel documento e quelli attivi della libreria, distinguendo file che contengono tutti i caratteri richiesti, file privi di almeno un carattere e file non verificabili. Non assume che tutte le varianti della stessa famiglia abbiano la medesima copertura.

L’analisi della libreria avviene sul server locale, in lotti di massimo otto file. Contratto tipizzato con revisione dell’archivio, ID unici e massimo 64 caratteri Unicode distinti; richieste più grandi vengono rifiutate senza troncamento silenzioso. Solo simboli da controllare, non il testo completo o il progetto. Analisi dei byte e della cmap con lo stesso criterio Unicode del preflight, nessun font del sistema operativo, rete esterna o installazione.

Un indice leggero di revisione/ID/stato permette di controllare le precondizioni senza leggere tutti i documenti o trasferire tutti i font. Vengono letti soltanto i file richiesti; cache di copertura limitata e derivata da hash/formato dei byte, mai dal nome. Risultati obsoleti, file eliminati/archiviati e analisi sconosciute non diventano candidati verificati.

Il frontend deve mostrare avanzamento, interruzione e Riprova. La scelta di un risultato prepara soltanto quel file e passa dal controllo del candidato già presente; solo Applica esegue l’`updateObject` validato, con gli stessi permessi, revisioni, Undo/Redo e risorse immutabili. Il caricamento iniziale dell’editor non deve avviare la ricerca né attendere l’intera libreria.

Accettazione: corrispondenza Unicode/non BMP/accenti, varianti diverse, file non leggibili, revisione cambiata durante un lotto, cancellazione/risposta tardiva, formati compressi reali, limiti e cache; backend JSON e SQLite su archivi separati, frontend desktop/telefono con zero modifiche fino ad Applica e stessi campioni JSON/SVG. API disponibile anche nelle copie in sola lettura, senza aggiungere possibilità di scrittura. Nessuna migrazione, installazione di font personali, importazione automatica, sostituzione implicita o deploy.

Richiesta successiva del titolare: valutare un’evidenziazione rossa semitrasparente dei font problematici; chiarimento sulla posizione richiesto separatamente. L’evidenziazione diagnostica non deve attribuire geometrie attendibili a glifi mancanti, modificare i colori del documento o comparire negli output produttivi.
