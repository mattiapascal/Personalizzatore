# Trasparenza delle immagini — 14 novembre 2026

La scheda **Immagine** dell’ispettore offre all’inizio un valore numerico e uno slider **Trasparenza immagine**: 0% opaca, 100% trasparente, passo 1%. La regolazione si combina con l’alpha dei pixel, conservando file originale, crop, filtri, trasformazioni e maschere. «Ripristina colori originali» riguarda i filtri e non annulla questa proprietà indipendente.

Una selezione di sole immagini, anche raggruppate, mostra il valore comune o misto. Il comando applica la trasparenza a ciascuna immagine; nelle sovrapposizioni non equivale all’opacità isolata dell’intero gruppo. Le selezioni incompatibili non mostrano il controllo e il motore rifiuta atomicamente richieste di stile non applicabili a tutti i membri.

## Stato canonico, output e importazione

`SceneObject` di tipo image ammette `opacity` facoltativo fra 0 e 1. Assente significa opaco: nessun campo aggiunto automaticamente ai vecchi documenti, nessuna migrazione o invalidazione globale delle miniature. `updateObject` e `styleObjects` sono gli stessi comandi manuali/AI, con revisioni, ruoli, rifiuti atomici e Undo/Redo. I blocchi di selezione restano validati; un blocco della sola geometria consente lo stile senza spostamenti.

Fabric applica l’opacità all’immagine completa; la cache dei bitmap continua a dipendere da originale e filtri, senza creare una copia dei pixel per ciascuna trasparenza. SVG, PNG, miniature e riquadri del controllo produttivo seguono la stessa proprietà. Il confronto indipendente ha rilevato che il serializzatore SVG degli originali sostituiva anche lo style di Fabric: ora mantiene l’alpha **una sola volta** attorno al viewport di crop/orientamento, conservando i byte compressi. La variante opaca conserva il markup storico.

L’importatore PitchPrint conserva l’opacità nativa dei raster, compresi sfondo e primo piano di pagina. I gruppi con compositing isolato, le pitture aggiuntive non rappresentabili e gli SVG composti che richiedono alpha complessivo restano rifiutati: applicarlo a ogni figlio cambierebbe le sovrapposizioni. Nessun nuovo template reale importato. La lettura generica SVG continua ad avere i propri limiti di opacità/compositing: il JSON resta il formato di riapertura del progetto completo.

## Controlli produttivi

La trasparenza parziale dell’immagine non è ammessa quando la conferma richiede grafica B/N, anche se il filtro sorgente è una soglia binaria. Il gate condiviso controlla la proprietà prima di affidarsi al decoder: un adattatore permissivo non può aggirarla. Browser e server concordano sulle modalità originale, RGB e binaria. Un’immagine completamente trasparente non dipinge; la sua sorgente conserva comunque i controlli previsti dal decoder. I riferimenti restano esclusi dalla produzione.

Questa è una proprietà della bozza e dell’output; non autorizza produzioni con trasparenze né cambia i profili reali del negozio. Le regole restano specifiche del prodotto/profilo.

## Campione e verifiche

[JSON](../fixtures/illustrator/image-opacity.TEST.json) e [SVG](../fixtures/illustrator/image-opacity.TEST.svg), 120×65 mm: due immagini con lo stesso originale, alpha dei pixel differenti, un’immagine RGB regolata, opacità 50%/40%, crop frazionari, rotazioni/riflessione, fondo giallo e testo Arimo OFL incorporato. Generatore `node --import tsx scripts/capture-editor-image-opacity.ts`. Nell’editor selezionare un’immagine, aprire **Immagine**, cambiare la trasparenza e provare Undo; la riapertura JSON conserva tutti i parametri.

- **1.365 unitari in 189 file**, nove nuovi casi: campo facoltativo/compatibilità storica, manuale/AI e Undo/Redo, selezione di immagini, rifiuti atomici, ruoli, B/N e immagini di pagina. Aggiornati due vecchi test che rifiutavano ogni opacità immagine; valori fuori range, effetti e compositing non supportati restano rifiutati.
- **66 browser pertinenti distinti**: 13 nuovi, cinque sul B/N del ritaglio, sei sui colori, quattro sulla tonalità, sette sulla palette e 31 esistenti su trasparenze/maschere/import PitchPrint. Cinque casi UI/SQLite ricontrollati dopo aver posizionato il controllo all’inizio della scheda. Desktop e telefono, valori numerici/slider, una revisione per il comando comune, JSON, Undo e conferma/riapertura in SQLite temporaneo. Non una nuova esecuzione generale di tutta la suite browser.
- Confronti Canvas2D a opacità **0, 0,25, 0,65 e 1**, su originali e immagini filtrate con crop/rotazione/riflessione: zero pixel oltre soglia 12 nel Canvas, SVG e PNG; miniature entro **0,554%**, errore medio massimo **0,075/255** sui pixel dipinti. SVG entro **0,242/255** di errore medio. Il campione finale 50%/40% supera le stesse soglie.
- Import raster PitchPrint contro riferimento nativo indipendente: zero pixel oltre soglia, errore medio **0,00249/255** sull’immagine; sfondo/primo piano con alpha 20%/70% confrontati separatamente. SVG composti con alpha complessivo rifiutati prima di appiattire i figli. Nessuna scrittura ai template reali.
- Maschera dell’immagine: pixel esterno alpha 0 e interno alpha 128 al 50%, concordi in SVG, PNG e tile produttivo. Nove confronti B/N browser/server sui modi originale/RGB/binario; il gate di conferma rifiuta alpha parziale anche con decoder simulato permissivo.
- **86 campioni JSON/SVG** riaperti/esportati, zero errori browser o richieste esterne e nessun font letto dalla libreria reale. **13 test della chat pubblica**, build laboratorio/storefront, TypeScript Worker, schemi e scansioni dei segreti passati. Sei schemi generati aggiornati con il campo facoltativo e lo stile comune.
- Archivio reale letto soltanto e revisioni confrontate: **SQLite R638, 346 template, due composizioni, 219 font (218 attivi), un profilo**, invariati. La cancellazione preesistente di `output/pdf/editor-font-compressi.TEST.pdf` non fa parte del commit.

Log `.local/image-opacity-*.log`. Catture desktop/telefono `.local/previews/editor-image-opacity-*.png` esaminate visivamente; confronto e conservazione degli originali nel riepilogo `.local/image-opacity-capture.json`. Illustrator e la lavorazione fisica rimangono collaudi umani non eseguiti. La nuova alpha nel PDF non è stata sottoposta a un confronto raster dedicato; il percorso PDF usa lo SVG condiviso, senza certificazione ulteriore.

La [matrice delle capacità](pitchprint-capabilities.md) è stata riallineata al codice: niente vecchi limiti di 256 KB, font del computer, gruppi solo semplici o guide ancora indicate come mancanti. Restano esplicite le lacune avanzate e quelle dell’integrazione commerciale. Prossimo incremento manuale da preparare: QR generati localmente, con contenuto validato, misura fisica, riapertura ed effettiva leggibilità da collaudare, senza servizi esterni a pagamento.

Nessun deploy, migrazione, nuova funzione multipagina, generazione immagini AI o modifica a negozio/chat pubblicata. Archivio reale letto soltanto; la cancellazione PDF preesistente resta esclusa.
