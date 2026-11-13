# Compatibilità delle cmap legacy — diagnosi del 13 novembre 2026

La ricerca dei font ha isolato Continuum Medium come unico file attivo non verificabile. Analisi in sola lettura: i due record Unicode condividono una cmap formato 4; tutti i segmenti dei caratteri sono ordinati e nei limiti, ma il solo segmento conclusivo U+FFFF→U+FFFF usa `idRangeOffset=0xFFFF`. Il lettore attuale rifiuta questo valore dispari prima di constatare che il segmento non contiene un carattere da consultare.

Confronti indipendenti sulla copia privata originale: FontTools 4.63.0 legge 246 codici, HarfBuzz restituisce i glifi 36/37/38/112/227 per ABCéΩ; Chromium carica il file. Il font della libreria non viene modificato, reinstallato o sostituito. Hash e diagnostica in `.local/font-continuum/`.

La [specifica OpenType cmap](https://learn.microsoft.com/en-us/typography/opentype/spec/cmap#format-4-segment-mapping-to-delta-values) descrive il segmento conclusivo separatamente dai caratteri mappati. Il [lettore FreeType](https://raw.githubusercontent.com/freetype/freetype/master/src/sfnt/ttcmap.c) contempla esplicitamente l’offset legacy FFFF solo quando compare nell’ultimo segmento, con start/end entrambi FFFF. FontTools ignora il segmento conclusivo nella lettura dei caratteri. Non si tratta di una regola sul nome del font o del template.

Incremento: tollerare quel solo valore in quel solo segmento vuoto, mantenendo ordinamento, bounds, allineamento degli offset, esclusione del glifo 0 e limite della complessità per tutti i segmenti reali. U+FFFF resta escluso dalla copertura. Nessun tentativo di correggere una mappa ambigua o tronca; nessuna unione indiscriminata delle sottotabelle o copertura universale.

Collaudo richiesto: fixture sintetiche positive/negative, font OFL TEST con sola sentinella alterata e checksum coerenti, confronto dell’intero BMP con il controllo, stessi glifi/metriche/immagine nel browser e comandi manuali/AI/Undo. Nuovo campione JSON/SVG portabile; confronto completo della copertura del file personale con FontTools, hash originale e archivio invariati; API reale e ricerca frontend. Nessun font personale in Git e nessun deploy. Un’eventuale rilettura del backend Vite deve avvenire con il normale riavvio di sviluppo, senza migrazioni o salvataggi nell’archivio.

**Completato:** [esiti e limiti](iteration-editor-legacy-cmap.md). Correzione condivisa, 1.194 unitari, 29 browser pertinenti, 13 pubblici e 71 campioni passati. File personali e SQLite R638 invariati; il laboratorio ha riletto il modulo senza riavvio.
