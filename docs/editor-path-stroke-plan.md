**Incremento completato e verificato:** [risultati e limiti](iteration-editor-path-stroke.md). Piano conservato come riferimento delle scelte.

# Contorni di tracciati — piano locale, 14 novembre 2026

Estendere estremità e giunzioni a tracciati a punti/Bézier e giunzioni ai vettori/rettangoli, con tre icone per controllo e limite delle punte numerico. Riutilizzare updateObject/styleObjects, comandi revisionati, Undo e simulazione AI.

Le punte miter e i cap quadrati possono superare la cornice storica di mezzo spessore. Introdurre una versione facoltativa della cornice dei tracciati: i documenti precedenti restano graficamente invariati. Quando si modifica lo stile dai nuovi controlli, il centro resta fermo e la cornice simmetrica contiene sia il riquadro storico sia le sporgenze calcolate dalle tangenti reali dei segmenti. È una cornice di controllo, non una misura stretta dei pixel dipinti.

Il calcolo deve coprire tracciati aperti/chiusi, cubiche, segmenti degeneri, limite miter, cap punteggiati rotondi, trasformazioni e maniglie. Il commit delle maniglie deve rispettare il riquadro trascinato anche con spessore invariato. I dettagli di una punta rimasti sul foglio non devono causare la cancellazione automatica dell’oggetto. Guide del testo conservano stile/versione e separazione; SVG/PNG, diagnostica e cache usano lo stesso disegno.

Verifiche: geometria indipendente, schema/legacy, comandi/ruoli/Undo, limiti e selezioni miste; UI desktop/telefono e confronti nativi SVG/PNG con riferimenti Canvas2D, tracciati affini e maniglie. Campione JSON/SVG, build/schemi/segreti e regressioni chat. Nessuna scrittura all’archivio reale, nuova funzione multipagina, deploy o generazione immagini AI. Illustrator resta un collaudo umano.
