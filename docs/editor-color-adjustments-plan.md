# Regolazioni delle immagini a colori — piano locale

Luminosità, contrasto e saturazione nell’ispettore, usando `updateObject` esistente e un nuovo valore `color` dei parametri raster. `original` continua a significare pixel non elaborati: i vecchi progetti non cambiano resa. Nessuna migrazione dei documenti/archivi personali.

- RGB elaborato localmente, alpha conservato; saturazione 0–200%, 100 neutro. Saturazione sulla luminanza pesata dei canali sRGB, poi contrasto e luminosità per canale. Non è gestione ICC/CMYK.
- Originale incorporato invariato, ritaglio e trasformazioni conservati. Reset esplicito ai colori originali. UI/AI, Undo/Redo, JSON, SVG, PNG e miniature usano lo stesso motore.
- Solo documenti a colori; nessun aggiramento dei controlli timbro/B/N. Cache distinte per saturazione e filtri contabilizzati nei limiti raster già esistenti.
- Verificare valori neutri/estremi, alpha, grigi e saturazione zero, sorgenti PNG/JPEG orientate, equivalenza server/browser e invalidazione cache. Campione TEST con originali generati; regressioni foto/produzione/chat, build/schemi/segreti e sincronizzazione Git.

Rimozione sfondo a colori, AI, multipagina e integrazioni commerciali restano fuori dall’incremento. Illustrator da collaudare umanamente.
