# Stile della selezione e dei gruppi — 9 novembre 2026

## Piano iniziale

Aggiungere all’ispettore multiplo riempimento e contorno comuni, con indicazione dei valori misti. Un solo `styleObjects` tipizzato applica colore, spessore o tratteggio all’intera selezione/gruppo, in una revisione annullabile; identica validazione per manuale e simulazione AI. Nessuna modifica dei soli oggetti compatibili nascosta: se una proprietà non vale per tutti, il controllo non è disponibile e il comando viene respinto.

Sul testo il riempimento riguarda tutti i caratteri, eliminando i soli override di colore e preservando gli altri stili. Le immagini non hanno riempimento/contorno; linee e tracciati aperti non hanno riempimento. Per cambiare il contorno di più forme, conservare il centro di ogni oggetto e il passo 0,05 mm anche con valori precisi. I gruppi restano interi, senza separazione implicita.

Prove: selezione con valori misti, testo con colori locali, gruppo intero, forme aperte e immagini incompatibili respinte atomicamente; spessore/centri, revisioni obsolete, undo/redo e JSON/SVG. Nessuna modifica online o modello reale.

## Implementazione e prove mirate

Aggiunti `object-appearance.ts`, `SelectionStyleInspector.tsx` e `SelectionStyleSchema`/`styleObjects`. Estratto `PaintPicker.tsx`, condiviso con l’ispettore singolo. Il contorno numerico usa lo stesso `NumberField` con passo 0,05 mm; breve accorpamento live e flush uscendo dal campo, Esc annulla la modifica pendente. Colori e tratteggio si applicano subito. Controlli misti senza un valore scelto implicitamente, centri di ogni forma mantenuti anche in rotazione.

Cinque unitari e tre browser mirati superati: gruppo con fill misti, incremento 0,2875→0,3375 mm, Esc e tratti SVG, colori di tutti i caratteri con grassetto conservato, comandi AI identici e rifiuto atomico delle immagini o stili incompatibili. Schemi rigenerati e TypeScript superato. Campione `selection-style.TEST.json/svg` con `node --import tsx scripts/capture-editor-selection-style.ts` comprende anche il cambio d’ordine del gruppo. Illustrator da collaudare.

Regressione completa in esecuzione.


Regressione completa: `npm run check` superato con **358 unitari, 137 browser laboratorio, build e controllo segreti**. Campioni desktop ispezionati. Nessun deploy o modifica pubblica.

Correzione successiva: il riempimento del testo nella selezione multipla deriva dal colore effettivo di tutti i caratteri, anche quando un override uniforme copre l’intero contenuto e il colore base è diverso. Nuovo browser mirato passato insieme agli altri tre dello stile; il colore nero/bianco applicato alla selezione conserva gli override di grassetto.
