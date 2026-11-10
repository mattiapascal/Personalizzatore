# Operazioni sui tracciati — 9 novembre 2026

## Piano iniziale

Aggiungere riflessione orizzontale/verticale rispetto al centro nelle coordinate del foglio, inversione del verso dei nodi e apertura di un tracciato chiuso dal nodo scelto. Riutilizzare punti, ID e `updateObject` con validazione e storico. L’apertura dal nodo ruota la sequenza affinché il punto scelto diventi il primo e lo duplica come ultima estremità: tutti i segmenti del contorno restano presenti, le due estremità possono poi essere spostate separatamente. Il riempimento viene azzerato. Al limite di 512 nodi questa operazione è disabilitata, perché serve un nodo aggiuntivo. Non introduce curve o gruppi di tracciati.

Riflessione geometrica nel documento, senza flag soltanto nel renderer: testi/immagini non vengono convertiti. Con rotazione, negare l’angolo e riflettere la coordinata locale appropriata per conservare ingombro e centro, senza skew. Doppia riflessione deve restituire gli stessi punti. Invertire il verso non altera la geometria né il riempimento; il nodo selezionato deve seguire lo stesso vertice geometrico dopo il riordino.

Prove: invarianti sui vertici a 0/30/90°, tracciati piatti e chiusi, sequenza e ultimo segmento, sorgente immutata, undo/redo, JSON/SVG, browser con coordinate di nodo prima/dopo e doppia riflessione. Nessuna modifica online.

## Implementazione e prove mirate

`path-operations.ts`, pulsanti nella scheda Nodi e icone dedicate. Riflessione con angolo opposto e coordinate locali riflesse: vertici rispecchiati nel foglio, centro invariato anche a 30/90°. Apertura con estremità duplicate e riempimento rimosso; il selettore segue lo stesso vertice dopo l’inversione dell’ordine. `updateObject` e storico comuni.

Cinque unitari e quattro browser mirati passati, inclusi tracciati piatti e rotazioni, coordinate numeriche del nodo scelto, contorno aperto nello SVG, JSON riaperto e blocco a 512 nodi. Campione `path-operations.TEST.json/svg` generato con `node --import tsx scripts/capture-editor-path-operations.ts`: stella riflessa/invertita, aperta al terzo nodo e prima estremità spostata di +1 mm in X per rendere visibile il taglio. Illustrator da collaudare.

Regressione completa in esecuzione insieme allo stile e ordine multipli.


Regressione completa: `npm run check` superato con **358 unitari, 137 browser laboratorio, build e controllo segreti**. Campioni desktop ispezionati. Nessun deploy o modifica pubblica.
