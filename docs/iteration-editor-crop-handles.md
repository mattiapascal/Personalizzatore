# Ritaglio per bordi e maniglie — 9 novembre 2026

Richiesta del titolare: quattro valori che indicano quanti pixel rimuovere da sinistra, destra, sopra e sotto; possibilità di ritagliare con maniglie come nei programmi di grafica.

Piano locale: presentazione degli insets della sorgente orientata, conversione al crop canonico esistente senza cambiare formato. Scheda Ritaglio attiva otto maniglie dedicate sul canvas; Geometria o freccia ripristinano il ridimensionamento. Drag in pixel interi, anche per immagini ruotate/riflesse, con originale e scala dei pixel conservati. Le parti recuperabili si possono ripristinare allargando le maniglie entro l’originale.

Bordi numerici e maniglie usano la stessa geometria: i pixel rimasti non cambiano posizione nel foglio; la cornice si restringe/allarga attorno a essi. Preview senza revisioni, singolo `updateObject` al rilascio, guardia di revisione, Esc annulla. È distinto dal ridimensionamento dell’immagine. Risorsa originale immutabile; stessi crop/filtri per JSON, SVG e PNG. Nessuna AI, deploy o modifica commerciale.

Prove previste: bordi opposti indipendenti, minimi 1 px, limiti sorgente, tutti i versi, rotazione/riflessione, preview/commit e pixel realmente esportati, Undo/JSON, annullamento e zoom/gesture sospesi durante il gesto. Illustrator da collaudare.
