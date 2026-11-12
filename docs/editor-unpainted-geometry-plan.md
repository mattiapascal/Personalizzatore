# Geometrie senza pittura — 12 novembre 2026

Le due etichette adesive ancora bloccate contengono un rettangolo arrotondato o un percorso senza riempimento e senza contorno dentro un gruppo. La geometria è valida, ma il passaggio SVG usato dall’adattatore PitchPrint esclude gli oggetti senza pittura e restituisce un errore. Non è un elemento nascosto né una curva degenere.

1. Aggiungere una politica esplicita alla preparazione SVG per conservare geometrie senza pittura. Usarla nell’adattatore delle forme PitchPrint, mantenendo l’importazione SVG ordinaria e i limiti esistenti.
2. Conservare coordinate, curve, fori, ordine, appartenenza al gruppo e proprietà. Nessun tratto artificiale o eliminazione dell’oggetto. Oggetti nascosti e input non rappresentabili restano distinti.
3. Verificare confronto nativo indipendente, riempimento successivo manuale/AI, Undo/Redo e JSON/SVG con un sorgente sintetico. Aggiungere campioni portabili e checklist Illustrator.
4. Ripreparare le due etichette reali in sola lettura, controllare tutti i font e confrontare la grafica completa. Importare soltanto dopo i controlli, con backup e protezione da modifiche concorrenti.

Assunzioni: una forma esplicitamente priva di pittura resta modificabile dall’elenco livelli; non viene resa selezionabile cliccando sul suo interno trasparente. Le sue dimensioni partecipano alle trasformazioni del gruppo originale. Rischi: la politica non deve rendere importabili elementi nascosti o degeneri, alterare le curve né perdere proprietà. Nessuna nuova regola sul nome del template, modifica dell’archivio prima del collaudo o intervento online.

Esito: implementazione e regressioni concluse, due copie salvate con backup e riaperte. [Rapporto finale](iteration-editor-unpainted-geometry.md); recupero originali preparato come incremento successivo.
