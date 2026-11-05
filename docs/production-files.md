# JSON, SVG e collaudo Illustrator

Il JSON è il progetto sorgente riapribile nel laboratorio, con UUID, versione schema, revisione e ID oggetti. L'SVG è un output distinto, generato da Fabric e non reimportato come progetto. Entrambi sono TEST e non certificati per produzione.

Fixture: `fixtures/illustrator/stamp.TEST.json` e `stamp.TEST.svg`. Profilo isolato, non collegato a un ID Shopify: area 58×22 mm, Arial 9 pt nel campione, minimo TEST 7 pt, nero/bianco, margine TEST 1 mm. Il canvas visualizza 8 px/mm, mentre l'export imposta misure fisiche e viewBox 464×176. Lo zoom non cambia le dimensioni fisiche del file.

Esempi aggiuntivi reali Fabric generati con `npm run capture:mounts`: `wood-round-35.TEST.*` (legno Ø35), `pocket-square-12.TEST.*` (tascabile 12×12) e `emboss-round-41.TEST.*` (a secco Ø41). JSON associati a variante e catalogo TEST; SVG con misure fisiche, cerchio/rect e testo vettoriali, clipPath nei tondi. Riaprire ogni JSON solo sulla corrispondente variante e versione di catalogo, oppure rigenerare con la versione corrente. Non importarlo su una referenza diversa. Questi file sono destinati al collaudo, non approvati per produzione.

Il canvas interattivo ora si apre da un prodotto reale, a differenza della fixture di riferimento: JSON include Product/Variant ID e versioni catalogo/profilo commerciale. SVG usa le dimensioni nominali del modello corrente (47×18, 58×22 o 70×25 nel campione). I vincoli di impaginazione rimangono TEST, con `validatedForProduction: false`; l'area nominale non è ancora area utile certificata. Aggiunto testo multilinea fino a 8 righe: richiede un nuovo collaudo umano Illustrator, non deducibile dal golden SVG monoriga.

`npm run fixtures:editor` rigenera il JSON canonico. Con il server locale acceso, `npm run capture:lab` genera SVG effettivo da Fabric e anteprime locali. Per aggiornare il riferimento SVG, rivedere la diff e annotare il motivo; non trattare una rigenerazione come verifica Illustrator. Il test golden confronta il riferimento con un nuovo export dopo import del JSON.

## Checklist umana obbligatoria

Stato attuale di ogni voce: **NON ESEGUITO in questa iterazione**. L'esito visivo storico riferito nella specifica non sostituisce questi controlli.

| Prova in Adobe Illustrator | Risultato richiesto | Stato |
|---|---|---|
| Aprire stamp.TEST.svg | Nessun errore; rettangolo e testo vettoriali distinti | Da eseguire |
| Misurare tavola e bordo | Tavola 58×22 mm; bordo nominale 54×18 mm con tratto 0,25 mm | Da eseguire |
| Selezionare e riscrivere il testo | Testo ancora editabile, font Arial risolto; accenti e simboli corretti | Da eseguire |
| Confrontare browser/Illustrator | Coordinate, allineamento, tratto e dimensioni coerenti | Da eseguire |
| Salvare e riaprire | Nessuna variazione inattesa o rasterizzazione | Da eseguire |
| Legno Ø35 e a secco Ø41 | Tavola fisica corretta, cerchio/ritaglio e testo modificabili, nessuna variazione al salvataggio | Da eseguire |
| Tascabile 12×12 | Misura fisica e testo piccolo leggibile; regole produttive specifiche confermate dal laboratorio | Da eseguire |
| Testo a 7 pt / 3–8 righe / altri font | Fixture aggiuntive e verifica produttiva per profilo | Non implementato |
| Logo vettoriale/raster, gruppi e rotazioni | Tracciati preservati, raster identificato come raster | Non implementato |

Registrare versione Illustrator/OS, font installati, dimensioni rilevate, screenshot e difformità. Non dichiarare file produttivo finché non è stato verificato dal laboratorio. Import loghi, conversione binaria e vettorializzazione sono attività separate e non presenti.
