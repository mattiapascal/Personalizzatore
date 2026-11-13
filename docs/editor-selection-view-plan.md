# Inquadrare la selezione — 13 novembre 2026

Incremento di usabilità manuale: pulsante grafico «Adatta alla selezione» accanto all’adattamento dell’intero foglio. Calcolare l’ingombro dei soli ID selezionati mediante le geometrie canoniche, con contorni/rotazioni/inclinazioni/riflessioni; nessuna deduzione dalla sola pittura né espansione implicita di un membro selezionato direttamente al suo gruppo intero.

Applicare zoom e traslazione al viewport esistente. Usare le dimensioni DOM effettive, con un margine visivo, e il limite bitmap/Retina già previsto per l’intero canvas. Nessuna modifica del documento, delle dimensioni fisiche, dei filtri, della selezione, delle revisioni o della cronologia. Nessun font del computer o misura provvisoria per caratteri non verificati. Una selezione non misurabile produce un avviso di vista senza inventare un ingombro.

Operazione esplicita, senza inseguire gli oggetti durante modifiche o trascinamenti successivi. Cambio pagina/documento riprende il comportamento esistente; slider, rotella, PAN e Adatta all’area restano disponibili. Annullare una richiesta superata da cambio selezione/contenuto, una nuova azione di zoom o smontaggio. Nei formati compatti liberare lo spazio dai pannelli laterali prima della misura del viewport.

Prove: matematica indipendente di scala/centro e limiti, geometrie affini, testo verificato/non verificato, membri di gruppo, selezioni multiple e parzialmente esterne. Browser desktop/mobile e grande formato, PAN/rotella, nuova modifica manuale e comando AI equivalente con Undo/Redo, output JSON/SVG/PNG/miniature invariati dalla sola vista. Campione JSON/SVG e schermate TEST. Nessuna nuova funzione multipagina, nuovo schema di documento, integrazione commerciale, migrazione o deploy.

**Completato:** [funzione, campione e collaudi](iteration-editor-selection-view.md).
