# Vista dei dettagli su formati grandi — piano locale, 14 novembre 2026

Sostituire, nella vista espansa, il limite di zoom legato al bitmap dell’intero foglio con un backing limitato alla zona visibile. Il foglio DOM conserva dimensioni/origine logiche; il canvas Fabric può occupare un ritaglio con viewportTransform traslata. Documento, comandi, misure, ID, selezione e output restano indipendenti dalla vista. Il laboratorio compatto conserva il limite storico finché non si apre lo spazio di disegno.

- Pianificatore puro: intersezione foglio/viewport, margine, zona non visibile, rapporti Retina anche frazionari; ogni backing resta entro 8192 px e 16 milioni di pixel, anche durante cambi verticali/orizzontali. Ridurre solo la densità del backing se uno schermo enorme supera il budget, senza tagliare una parte della vista.
- Traslazioni DOM/PAN e zoom notificano l’adattatore. Resize/scroll osservati, senza ricreare il documento o perdere la selezione. Congelare il buffer durante i gesti nativi e aggiornarlo alla fine.
- Puntatori, testo/cursore, rettangolo di selezione, maniglie esterne, nodi, crop, master, fissaggi, profili, guide e mirino devono usare la stessa trasformazione. La cornice logica resta il riferimento di righelli e zoom attorno al mouse.
- Clipping del foglio grande tramite percorso Canvas2D nativo, senza cache bitmap grande del clipPath. Export SVG logico intero e output raster esistenti separati dalla camera di lavoro.
- Verifiche: pianificatore e densità, allocation instrumentation, desktop/telefono/Retina, piccolo oggetto su foglio 3 m al 400%, PAN/rotella/slider/adattamento, modifica manuale/AI/Undo, testo e maniglie, guide/crop/fissaggi e output invariati. Campione portabile e confronto pixel. Test/build/chat/schemi/segreti, archivio reale letto soltanto, poi sincronizzazione Git.

Nessun deploy, scrittura Shopify/BSS/PitchPrint/prezzi/carrello/checkout, migrazione, nuova funzionalità multipagina o generazione immagini AI. Illustrator rimane un collaudo umano.
