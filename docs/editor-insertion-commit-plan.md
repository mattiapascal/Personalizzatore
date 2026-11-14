# Inserimento di oggetti e risorse — piano del 14 novembre 2026

Dopo `23f51c2`, verificare le azioni manuali che aggiungono contenuti senza sostituire il progetto: testo, forme, Bézier, poligoni, QR, immagini locali, SVG/PDF e risorse della libreria.

- Riprodurre prima la perdita di un campo incompleto durante creazione/importazione.
- Controllare l’ispettore prima di aprire dialoghi o selettori file e prima dell’inserimento effettivo. Conservare il fuoco fino al controllo; una modifica valida viene applicata prima di acquisire la revisione del nuovo comando. Geometria e inserimento rimangono comandi distinti, annullabili e condivisi con la simulazione AI.
- Conservare i controlli asincroni di store/documento/pagina/revisione, senza aggiornare arbitrariamente comandi catturati. Nessun inserimento su una scena cambiata durante il caricamento. Nessun controllo globale ricorsivo dentro `act`.
- L’apertura esplicita di un JSON che sostituisce il progetto rimane distinta dall’aggiunta di un contenuto. Non impedire uno scarto intenzionale di input incompleti.
- Browser con API simulate e risorse TEST: input incompleti/validi prima del timer, mouse/tastiera, telefono, import reali e ritardati, Undo/Redo, identità della scena, confronti manuale/AI e campioni portabili. Regressioni pertinenti, unitari e build; archivio personale in sola lettura.
- Nessun deploy, migrazione, nuova funzione multipagina o generazione immagini AI, nessuna modifica commerciale o alla chat pubblicata. Documentare le evidenze e sincronizzare il codice verificato.
