# Distanza precisa tra gli oggetti — piano locale

Incremento manuale nel pannello Trasforma. Riutilizzare selezione, ingombri fisici e gruppi del motore; comando `spaceObjects` revisionato, comune a UI e simulazione AI. Nessuna modifica a prodotti, archivio personale o servizio pubblicato.

- Due o più oggetti/gruppi completi; distanza non negativa in mm, tra gli ingombri comprensivi di contorni e trasformazioni. Non è una misura della distanza fra singoli tratti interni.
- Conservare ordine spaziale, dimensioni, stile, livelli e coordinate sull’altro asse. A parità di posizione iniziale usare l’ordine stabile dei livelli.
- Senza master rimane fermo il primo elemento lungo l’asse; con master rimane fermo l’intero suo gruppo e si dispongono gli altri sui due lati.
- L’opzione Allinea alla pagina riguarda gli allineamenti, non questa distanza. La distribuzione esistente con tre elementi rimane disponibile.
- Un solo commit del documento e un Undo. ID mancanti/duplicati, gruppi incompleti, revisioni obsolete, font non misurabili e limiti geometrici devono fallire senza modificare stato o cronologia.

Verifiche: unità con assi/master/gruppi/affini e blocchi cliente; browser desktop/telefono con input numerico, stessa simulazione, Undo/Redo e riapertura JSON/SVG; campione TEST portabile con soli font OFL. Regressioni delle trasformazioni e della chat pubblica locale, build e scansione segreti. Illustrator resta collaudo umano.
