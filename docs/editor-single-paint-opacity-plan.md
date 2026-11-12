# Opacità PitchPrint a singolo riempimento — 12 novembre 2026

Blocco osservato nei sorgenti locali di Colop 2660, Datario Mod. A/B, Trodat 5440/5460, Colop S226-P e Datario generico: un rettangolo grigio, senza contorno effettivo, con opacità oggetto 0,9. Il modello canonico e l’ispettore supportano già `fillOpacity`/`strokeOpacity`, con comandi condivisi e Undo/Redo.

Incremento:

1. Accettare l’opacità sorgente soltanto per primitive a riempimento unico (rettangolo senza angoli arrotondati, cerchio intero, ellisse), prive di contorno effettivo e sfondo proprio. Trasferirla al riempimento, senza introdurre un secondo stato grafico.
2. Mantenere bloccante l’opacità di gruppi, testi, immagini, riempimento+contorno, sfondi propri e geometrie non trattate: la sovrapposizione richiede compositing, non una moltiplicazione arbitraria degli alpha.
3. Confrontare nativamente sovrapposizioni, rotazioni, riflessioni, stroke invisibile e fill trasparente; collaudare cambio alpha dall’ispettore, simulazione AI, Undo/Redo e JSON/SVG. Nessun fallback font o rasterizzazione dei vettori.
4. Riprovare i sette sorgenti e confrontare la pagina intera prima di un’importazione con backup. I rettangoli non diventano automaticamente riferimenti: ruolo e blocchi del sorgente restano conservati, bozze da verificare.

Lotto distinto già preparato: sei targhette metalliche monopagina. Supporto in basso e gruppi «Viti» in alto come riferimenti non stampabili, usando proprietà amministrative e comandi esistenti; confronto tecnico completo e produttivo separato prima dell’importazione. Originali e byte immagine conservati, nessuna associazione prodotto. Nessuna nuova funzionalità multipagina, AI generativa, deploy o modifica commerciale.
