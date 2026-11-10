# Ordine dei livelli per selezioni e gruppi — 9 novembre 2026

## Piano iniziale

Completare Disposizione nell’ispettore multiplo: primo piano, fondo, avanti e indietro di un livello. Un gruppo conta come una sola unità; gli elementi selezionati mantengono il proprio ordine relativo. Avanti/indietro sposta ciascun blocco selezionato oltre l’unità non selezionata adiacente, senza separare gruppi.

Comando `reorderObjects` con ID/revisione e validazione condivisa. Nessuna trasformazione geometrica o modifica agli ID. Pulsanti disabilitati quando non c’è spazio in quella direzione. Prove su selezioni contigue e sparse, gruppi, errori atomici/redo, ordine reale nello SVG e JSON. Nessuna modifica online.

## Implementazione e prove mirate

`reorderObjects` nell’unione dei comandi di selezione; operazioni sulle unità intere e pulsanti nell’ispettore multiplo con disponibilità calcolata dalla posizione reale. Resta invariata la geometria dei membri e la struttura dei gruppi.

Quattro unitari e un browser mirato passati: blocchi contigui e sparsi, gruppi come unità, ordine relativo e limiti dei pulsanti; rifiuti/redo, JSON riaperto e ordine effettivo dei testi nello SVG. Schema comandi rigenerato. Campione condiviso con lo stile in `selection-style.TEST.json/svg`. Illustrator da collaudare.

Regressione completa in esecuzione.


Regressione completa: `npm run check` superato con **358 unitari, 137 browser laboratorio, build e controllo segreti**. Campioni desktop ispezionati. Nessun deploy o modifica pubblica.
