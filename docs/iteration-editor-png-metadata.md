# PNG con metadati e copie equivalenti — 12 novembre 2026

## Comportamento

L’editor accetta PNG statici con eXIf e contenitori con massimo quattro datastream completi, soltanto dopo la verifica di equivalenza dei pixel visualizzati. Il JSON conserva tutti i byte originali. La sorgente, il crop e i filtri restano proprietà del medesimo documento; importazione, sostituzione manuale, librerie e comandi AI simulati condividono la preparazione e i comandi già esistenti, con Undo/Redo.

Il criterio canonico `static-png-exif-before-idat-1` applica una sola volta Orientation 1–8 dichiarato prima di IDAT. Zero è considerato non dichiarato; i metadati successivi a IDAT sono conservati come storico e non ruotano i pixel. È una politica esplicita dell’editor, coerente con i sorgenti verificati, non una garanzia sul comportamento di qualsiasi browser. Il parser TIFF limitato è condiviso con JPEG, che continua a rifiutare Orientation zero.

Le copie concatenate sono confrontate dopo l’orientamento: dimensioni e alpha esatti, canali sRGB premoltiplicati a 8 bit esatti, senza soglie di somiglianza. Questo criterio corrisponde alla rappresentazione Canvas2D; non implica identità dei byte o dei campioni RGB non premoltiplicati, né confronto HDR/16 bit percettivo. Differenze sotto la precisione dell’alpha non alterano un pixel del canvas. Nel backend locale il controllo usa Sharp 0.35.5, già installato e presente nel lockfile tramite Miniflare, ora dichiarato direttamente tra le dipendenze di sviluppo. Nessun download di una versione nuova e nessun decoder nativo nel frontend pubblico.

Restano bloccati immagini concatenate differenti, code sconosciute, stream incompleti, CRC o decompressione errati, APNG, eXIf duplicati, orientamenti invalidi e strutture TIFF fuori limite. Limiti cumulativi: 20.000.000 byte, 24 milioni di pixel, quattro flussi e 8.192 chunk. I descrittori in cache sono immutabili e limitati anche per volume delle chiavi. Il backend verifica le copie anche su salvataggio/sostituzione template, lettura dell’archivio ripristinato e upload di originali/miniature; un errore non effettua scritture parziali.

## SVG e campioni nativi

La sola trasformazione SVG attorno al bitmap produceva differenze di interpolazione rispetto al canvas normalizzato, soprattutto negli esempi piccoli riflessi. L’SVG ora incorpora un derivato PNG orientato senza ricampionamento: decompressione limitata, annullamento dei cinque filtri PNG, ricomposizione dei passaggi Adam7, permutazione intera dei campioni e nuova compressione. Conserva profondità originale, palette, trasparenza e chunk colore; non usa Canvas per ricodificare i campioni. I test verificano anche i byte meno significativi dei colori/alpha a 16 bit e i pixel impacchettati a 1/2/4 bit. Gli originali rimangono nel JSON. I PNG ordinari non vengono ricompressi; per orientamento identità si separa il primo flusso e si rimuove solo eXIf dal derivato.

Le sole miniature con PNG interessati incorporano la versione della politica nella chiave. Font, forme, JPEG e PNG ordinari conservano le chiavi precedenti. Nessuna rigenerazione generale dell’archivio.

Campione portabile: `fixtures/illustrator/png-metadata.source.TEST.json`, `.TEST.json` e `.TEST.svg`, tavola **120 × 70 mm**, tre immagini: copie equivalenti/EXIF zero, orientamento 6 e orientamento 7 con grigi/alpha/tinta. Generatore `node --import tsx scripts/capture-editor-png-metadata.ts`, riapertura e comando AI/Undo dalla UI. Schermata ispezionata. In Illustrator verificare tavola, orientamenti, colori, alpha e ritaglio; collaudo umano non eseguito.

## Caso Corrieri

Il cartello «Corrieri: Cane onnivoro» contiene due PNG 1.024 × 1.024 consecutivi, entrambi con eXIf zero dopo IDAT; totale 2.934.705 byte, SHA-256 `17bacde9f82393f529c887f11e5cb1fa89a7076104b192498b2be92beb889ab5`. Il browser produce gli stessi pixel per file completo e flussi separati. Il decoder nativo rileva 14.779 pixel con RGB non premoltiplicati diversi, solo nelle zone trasparenti: alpha identico e zero differenze dopo premoltiplicazione. Il confronto esplicito evita sia un rifiuto ingiustificato sia l’accettazione di immagini differenti.

Preparazione in sola lettura: **14 oggetti, quattro gruppi**, fondo vettoriale conservato, famiglia targa piana, nessuna associazione. Il PNG originale completo è verificato byte per byte nel documento. Confronto completo con riferimento indipendente a campionamento 4×: **21 pixel oltre delta 24 su 190.153 pixel grafici, rapporto 0,00011044, errore medio 0,0155323**; soglie già adottate 0,01 / 0,25. Manifest e originali privati in `.local/pitchprint-migration/png-exif-prepared/` e `png-exif-analysis/`.

## Importazione locale

Salvata una nuova bozza **Corrieri: Cane onnivoro**, ID locale `08e37938-ff5a-488e-9de6-936d39abfca2`, con tag «Da verificare» e nessuna associazione prodotto. Archivio a **254 template, due composizioni, 219 font**, revisione **507 → 508**. Backup verificato prima della scrittura: `.local/pitchprint-migration/png-exif-local-import/backup-revision-507-b87ebd40b53f.json`, SHA-256 `b87ebd40b53f509ba5277cae3a013496e96b7eae5d05e76dde3d2f4939ada4d0`. Fingerprint di ogni record precedente, font, impostazioni, profili e priorità dei tag conservati. Originali del sorgente e PNG completo immutati. Manifest privato `report-final.json` nella stessa cartella.

Riapertura effettiva in browser: 14 oggetti, gruppi, area, carta, famiglia targa e font uguali al record salvato, zero errori/scritture e checksum dell’archivio invariato. Miniatura generata e riutilizzata dopo il ricaricamento senza rileggere il record. Anche questo template è una **bozza TEST**, non una grafica approvata per produzione. Gli altri blocchi restano distinti.

## Verifiche

**828 test unitari / 122 file**, build laboratorio/pubblico, scansioni dei segreti, **13 browser pubblici** e **41 campioni JSON/SVG** superati. **90 browser di regressione immagini/font/librerie passati**, inclusi i cinque nuovi casi; anche i dieci controlli mirati precedenti erano passati. Avviata anche la regressione completa dei 524 scenari, ancora in corso: log `.local/png-full-browser.log`, handle exec `92719`. Durante la suite non modificare fonti/test o archivio reale. Il JavaScript pubblico resta `index-BG2r_x-8.js`.

I primi tentativi di collaudo sono conservati: `createImageBitmap` non decodificava il blob SVG nel test, sostituito con il decoder Image; il confronto ha poi rilevato il reale difetto di interpolazione risolto dalla permutazione nativa; una lettura del test subito dopo riapertura incontrava temporaneamente l’oggetto di prova senza `source`, ora attende la sorgente con accesso opzionale. Non sono stati aumentati timeout o allentate le tolleranze grafiche. Prove finali in `.local/png-*.log`.

Nessun deploy, scrittura su negozio/PitchPrint/BSS, acquisto o chiamata AI a pagamento. Restano capacità dei due documenti grandi, maschere/effetti, font/glifi, fonte CDN esatta, primi piani da classificare e altri confronti sospesi. Questo incremento non risolve tali blocchi e non certifica produzione o Illustrator.

Fonti tecniche: [PNG W3C](https://www.w3.org/TR/png-3/), [Exif CIPA](https://www.cipa.jp/std/documents/e/DC-X008-Translation-2019-E.pdf), [Sharp: colore](https://sharp.pixelplumbing.com/api-colour/) e [output raw](https://sharp.pixelplumbing.com/api-output/).
