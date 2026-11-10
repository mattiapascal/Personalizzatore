# Maniglie dei nodi Bézier — 9 novembre 2026

Incremento manuale locale successivo alla dilatazione testo: tre operazioni sul nodo selezionato, allinea le due maniglie, rendile simmetriche, rimuovile. Riutilizzare `updateObject`, coordinate fisiche e ricostruzione Bézier esistenti. Nessun formato nuovo o secondo stato. Non è un vincolo persistente: i successivi trascinamenti restano indipendenti.

La maniglia guida, entrante o uscente, è scelta nell’ispettore. Allinea conserva entrambe le lunghezze esistenti; una maniglia assente/di lunghezza nulla viene costruita a un terzo della distanza dal vicino. Simmetria usa direzione e lunghezza della guida, con lo stesso ripiego. Se la guida non ha direzione, usare l’altra maniglia o la secante tra i vicini. Estremità aperte: allinea/simmetria disabilitati perché non hanno due segmenti. Rimuovi disponibile anche alle estremità, senza spostare il nodo o altri punti.

Rischi e prove: normalizzazione dopo modifica dell’ingombro, coordinate ruotate e dimensioni non uniformi, nodo degenere/vicini coincidenti, riferimenti entrante/uscente, comandi obsoleti e gruppi, Undo/JSON/SVG. Operazione singola e atomica; nessun cambiamento degli altri nodi in coordinate fisiche. Nessun deploy o rimozione sfondo a colori. Illustrator da collaudare.

Implementate cinque prove unitarie e due browser con entrambe le guide: coordinate fisiche e rotazioni, lunghezze, direzioni, altri nodi invariati, maniglie mancanti, degenerazioni, JSON/Undo e rifiuti di gruppo/revisione. Campione `bezier-handles.TEST.json/svg`, anteprime desktop/mobile ispezionate. Esito della regressione completa nello stato corrente.
