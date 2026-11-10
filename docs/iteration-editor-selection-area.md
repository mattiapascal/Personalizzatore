# Allineare gruppi e selezioni all’area — 9 novembre 2026

## Piano iniziale

Completare l’ispettore multiplo con sei allineamenti dell’intero insieme all’area nominale: sinistra/centro/destra e alto/centro/basso. L’insieme è una sola unità, con distanze interne e gruppi invariati; non usare l’allineamento reciproco degli elementi per questo scopo. Nessuna scala automatica.

Comando `alignObjectsToArea`, stesse revisioni/validazione/undo manuali e AI simulati. Come nell’ispettore singolo, bordi riferiti al margine TEST 1 mm e centro riferito al centro dell’area. Gli oggetti possono restare parzialmente fuori durante la composizione; l’allineamento non certifica un file produttivo né i margini di un formato tondo.

Prove: gruppo intero e selezione sparsa, sei direzioni, relazioni geometriche e gruppi preservati, rifiuto di selezione incompleta/revisione obsoleta, storico e comandi simulati. Nessuna modifica online.

## Implementazione e prove mirate

`areaAlignmentDelta` condiviso tra l’allineamento singolo e il nuovo comando dell’insieme. Sei icone dedicate nell’ispettore multiplo; l’allineamento reciproco e quello all’area hanno titoli distinti. Conservati distanze interne, dimensioni, rotazioni e gruppi.

Tre unitari e un browser mirato superati; anche le 15 regressioni unitarie delle trasformazioni singole sono passate dopo il riuso del calcolo. Provati sei riferimenti, selezioni sparse/gruppi, errori atomici, undo/redo e comando AI. Campione `selection-area.TEST.json/svg` generato da `node --import tsx scripts/capture-editor-selection-area.ts`: gruppo rettangolo/cerchio al centro 29×11 mm nell’area TEST 58×22. Illustrator da collaudare.

TypeScript superato e schemi rigenerati. Esiti della regressione completa riportati sotto.


Regressione completa prima della correzione visuale del workspace: `npm run check` passato con **364 unitari, 141 browser laboratorio, build e controllo segreti**. Gli otto nuovi campioni JSON sono stati riaperti ed esportati in SVG senza errori browser o richieste esterne tramite `node --import tsx scripts/verify-editor-artifacts.ts`.

Verifica finale con la toolbar corretta: **364 unitari e 142 browser laboratorio**, build e controllo segreti superati.
