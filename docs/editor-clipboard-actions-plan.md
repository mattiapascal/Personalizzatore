# Appunti e azioni Modifica — piano del 14 novembre 2026

Dopo `0b3e476`, controllare copia/taglio/incolla/duplica con input ancora in attesa nell’ispettore. Usare il controller condiviso prima di acquisire gli oggetti, così errori e valori validi seguono gli stessi comandi manuali/AI. Scorciatoie nei campi e scrittura del testo restano native.

È emerso un difetto distinto nel taglio asincrono: al completamento della scrittura IndexedDB viene cancellata la selezione corrente, anziché quella catturata. Riprodurre con transazione reale già completata e notifica deliberatamente ritardata, cambiando selezione durante l’attesa.

- Preparare il comando di cancellazione dagli ID e dall’ambito catturati prima della scrittura; fissare revisione e contesto del documento. Se il documento cambia, conservare la copia e annullare il taglio. Cambiare solo selezione non deve spostare la cancellazione su altri oggetti. Bloccare temporaneamente i campi dell’ispettore durante il taglio per non perdere input parziali su una nuova selezione.
- Verificare l’ispettore anche all’avvio dell’incolla; se si attende una copia, fermarsi se il documento originario cambia (salvo la sola revisione prodotta dal proprio taglio appena atteso) e ricontrollare eventuali input ancora in attesa prima dell’inserimento. Non acquisire implicitamente un altro documento.
- Controlli reali da menu/tastiera/tasto destro, ID nuovi e ordine, gruppi/membri diretti, errori della memoria, modifiche durante l’attesa, Undo/Redo e JSON/SVG portabili. Nessuna scrittura agli appunti di sistema.
- Unitari e browser pertinenti, campione, build e chat pubblica; archivi reali in sola lettura, poi commit/push autorizzati. Nessun deploy, migrazione, nuovo multipagina, AI immagini o modifica commerciale.
