# Maschere rettangolari delle immagini — 12 novembre 2026

## Comportamento e modello

Le immagini PitchPrint con una maschera rettangolare relativa diventano immagini normali con il **ritaglio editabile già presente**. Vale per elementi del documento, sfondi e primi piani. Non vengono appiattite le composizioni o scartati i pixel esterni: il JSON conserva tutti i byte originali, e lo SVG usa il normale viewport di ritaglio. I comandi manuali e AI simulati restano quelli canonici, con revisione e Undo/Redo; nessuno stato parallelo o nuovo schema del documento.

`pitchprint-image-clip.ts` riconosce rettangoli senza angoli arrotondati e singoli percorsi chiusi rettangolari M/L/H/V/Z, anche relativi, con segmenti collineari. La maschera deve essere allineata agli assi locali dell’immagine; una rotazione di 90° è rappresentabile. Le trasformazioni della stessa immagine, dei gruppi e della pagina possono invece ruotare/riflettere la grafica. Il nuovo centro passa dalla matrice completa, preservando la posizione dei pixel trattenuti.

Si conservano frazioni, origini, scale e griglie diverse fra anteprima e originale. Se il frame legacy è più grande dei pixel disponibili, il ritaglio si applica alla sua effettiva finestra campionata e stirata. Nessuna sostituzione dell’originale con la preview. La maschera viene intersecata con il frame dell’immagine; una finestra vuota o inferiore al minimo raster di un pixel resta rifiutata.

La documentazione ufficiale [Fabric: clipPath](https://www.fabricjs.com/docs/old-docs/clippath-part1/) definisce la maschera rispetto al centro dell’oggetto e usa il suo riempimento, senza contorno. La conversione ricostruisce anche l’effetto dello spessore serializzato sulla posizione dell’origine legacy, distinto dall’estensione del riempimento; conserva `strokeUniform` e le posizioni implicite dei percorsi. `clipBounds`, SVG precalcolati e `pathOffset` serializzato non sono autorità geometriche e non vengono eseguiti.

Curve, fori, più sottotracciati, rettangoli arrotondati, maschere assolute/invertite/annidate, skew ed effetti non rappresentabili restano bloccati esplicitamente. Il preflight rifiuta le maschere non supportate prima di scaricare gli asset. Controlli di area, perimetro e allineamento impediscono di scambiare rientranze o percorsi ripetuti per rettangoli. Parsing limitato al budget dei comandi vettoriali, numeri finiti e coordinate limitate. I testi e le forme con maschere restano da gestire con una capacità dedicata.

## Prove e campione

**847 unitari / 125 file**, build laboratorio/pubblico e scansioni dei segreti superati. **76 regressioni browser pertinenti passate** in 2,3 minuti: PitchPrint, gruppi, immagini, crop e maniglie, più i tre nuovi casi. Dopo l’ultima correzione delle coordinate implicite, ricontrollati i tre nuovi casi: **3/3 passati**; il nuovo caso unitario e tutti gli altri unitari sono inclusi nell’esecuzione finale da 847. **13 browser pubblici** e **43 campioni JSON/SVG** riaperti/esportati senza errori o richieste esterne. Bundle pubblico invariato: `index-BG2r_x-8.js`, CSS `index-L8Ls1asZ.css`. Regressione completa conclusa: **532/532 scenari superati in 18,1 minuti** sul codice applicativo `3e9f594`, senza modifiche a sorgenti/test/archivio durante l’esecuzione (`.local/image-clip-full-browser.log`, handle exec `31565` terminale). Lo sviluppo può riprendere.

Confronto indipendente a 4× tramite maschere native Fabric, senza usare i calcoli del convertitore:

- Corpo: maschere rect/path, gruppi, riflessioni, frame maggiore della sorgente; **zero pixel oltre delta 24**, errore medio 0,000127527.
- Sfondo/primo piano: originale e anteprima con griglie differenti, destinazioni print/reference; **zero pixel differenti, errore medio zero**.
- UI: ritaglio in mm nell’ispettore, originale conservato, comando AI simulato, Undo, JSON riaperto e SVG incorporato; errore bloccante prima dei download per una maschera non convertibile.

Il riferimento di prova ora ricostruisce veri oggetti clip Fabric anziché passare un JSON serializzato come se fosse già un oggetto grafico. Per le immagini di pagina il clip è applicato al gruppo locale, prima del viewport dell’immagine. I due errori iniziali dei nuovi test riguardavano rispettivamente la scheda UI sbagliata (Immagine invece di Ritaglio) e il clip del riferimento SVG applicato al viewport; corretti senza aumentare timeout o soglie. Log privati `.local/image-clip-*.log`.

Campione portabile: `fixtures/illustrator/image-clip.source.TEST.json` → `image-clip.TEST.json/svg`, **140 × 90 mm**, due immagini sintetiche e un gruppo, origine dei pixel incorporata, ritagli frazionari e immagine ruotata/riflessa. Generatore `node --import tsx scripts/capture-editor-image-clip.ts`: importazione dalla UI, ritaglio manuale/Undo, riapertura nel laboratorio, comando AI/Undo ed esportazione. Schermata ispezionata e confronto indipendente superato. Illustrator: verificare tavola, orientamento, porzioni visibili, trasparenza e recupero dell’originale dal JSON; **collaudo umano non eseguito**.

## Due bozze reali recuperate

Conversioni ripetute col codice effettivo, senza rimuovere maschere dai sorgenti e senza override del trasporto. Confronto completo indipendente a 4×, soglie invariate rapporto < 0,01 / errore medio < 0,25:

| Template | Formato | Oggetti / gruppi | Pixel oltre delta 24 / grafica | Rapporto | Errore medio |
| --- | --- | --- | --- | --- | --- |
| Morte e Sbrana 2 | 300 × 200 mm | 6 / 3 | 14 / 214.341 | 0,0000653165 | 0,0230555 |
| Kung-Fu | 300 × 200 mm | 9 / 3 | 88 / 164.365 | 0,000535394 | 0,0337406 |

Gli originali delle due immagini sono stati riletti dai percorsi dichiarati e confrontati byte per byte con quelli incorporati: 829.662 e 119.401 byte rispettivamente. Sorgenti completi e checksum conservati privatamente in `.local/pitchprint-migration/image-mask-prepared/`.

Salvate entrambe le nuove bozze TEST con tag «Da verificare», nessuna associazione prodotto o sovrascrittura. Archivio a **258 template, due composizioni e 219 font**, revisione **510 → 512**. Backup preventivo verificato: `.local/pitchprint-migration/image-mask-local-import/backup-revision-510-d8b61c272d5a.json`, SHA-256 `d8b61c272d5a33106e6aa5ca1cd8b3c57117a599963ff3118deda9d8e63ff802`. Record precedenti, font, impostazioni, profili e priorità dei tag invariati per fingerprint.

ID locali: Morte e Sbrana 2 `fffd87cc-8a27-4087-b54c-875299769020`; Kung-Fu `be153f73-0000-418c-87a1-f42d2050f0ec`. Manifest privati in `.local/pitchprint-migration/image-mask-local-import/`. Queste copie non sono un’approvazione produttiva.

Entrambe riaperte dal record effettivo: oggetti, gruppi, font, area, carta e impostazioni targa identici. Schermate ispezionate. Miniature generate e poi riusate dopo ricaricamento, **zero richieste di rilettura dei record dalla cache**, errori o scritture; checksum dell’archivio invariato in entrambi i controlli. Rapporti `reopen-report.json` e `thumbnails-report.json` nella cartella privata dell’importazione.

Prossimi casi da trattare: maschere non rettangolari e sui testi, contorni editabili di Rappresentanti, font/glifi e primi piani ancora da classificare. Nessun deploy o cambiamento di chat pubblicata, negozio, tema, PitchPrint, BSS, prezzi, acquisti o checkout; nessuna chiamata AI a pagamento.
