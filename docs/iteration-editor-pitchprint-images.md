# Recupero delle immagini PitchPrint — 11 novembre 2026

La prima importazione effettiva comprendeva 117 bozze. I 23 design delle tre categorie «Attenti al Cane» non erano nell’archivio: i loro originali restavano disponibili, ma la conversione si fermava su caratteristiche non ancora rappresentate. Questa iterazione estende il convertitore e il documento senza aggiungere record all’archivio personale.

## Comportamento

L’importatore preferisce `url`, l’immagine originale dichiarata da PitchPrint, a `src`, spesso un’anteprima ridotta. Se l’originale non è disponibile o non è ammesso dall’adattatore, la conversione fallisce: non viene scelta silenziosamente una versione di qualità inferiore. L’allowlist degli archivi remoti e il limite di 256 KB restano attivi.

Le dimensioni fisiche dichiarate e la scala dei pixel su ciascun asse sono conservate. Nei vecchi canvas il rapporto tra millimetri e pixel può differire leggermente tra X e Y: per esempio 250 × 125 mm su 709 × 354 px. Non si corregge tale differenza deformando nuovamente la composizione. `pixelAspectRatio`, opzionale sullo stesso oggetto immagine canonico, registra il rapporto tra larghezza e altezza fisica di un pixel; se assente vale 1. La validazione richiede:

```
widthMm × crop.heightPx = heightMm × crop.widthPx × pixelAspectRatio
```

L’ispettore ridimensiona proporzionalmente la geometria importata. Ritagli numerici e maniglie usano separatamente le scale X/Y, mantenendo fermi i pixel rimasti visibili anche dopo rotazione/riflessione. La sostituzione della sorgente conserva il comportamento precedente: nuova immagine proporzionata, inserita nel vecchio ingombro, senza ereditare deformazione, ritaglio e riflessioni del file sostituito. JSON, comandi manuali/AI simulati e Undo/Redo condividono lo stesso stato.

Sono rappresentabili i ritagli interi contenuti nella sorgente. Ritagli frazionari o fuori dai pixel originali, assi non ortogonali, filtri, resize filter e contorni dell’immagine non supportati restano bloccanti. Nessun arrotondamento del crop o espansione trasparente implicita. Il riferimento indipendente Canvas2D segue il campionamento e la destinazione del [renderer Fabric 3.4.0](https://raw.githubusercontent.com/fabricjs/fabric.js/v3.4.0/src/shapes/image.class.js), senza chiamare le funzioni geometriche dell’importatore.

Il limite di capacità passa da uno a **quattro milioni di pixel**, mantenendo quattro immagini per documento, 4096 px per lato e 256.000 byte per originale. PNG/JPEG, parser, messaggi e test usano il nuovo limite. Non è una risoluzione produttiva certificata e non risolve ancora i file oltre 256 KB.

## Stili residui e segnaposto

Fabric 3 non misura né disegna lo stile all’indice esattamente successivo all’ultima lettera di una riga non vuota. Queste sole proprietà di inserimento sono escluse con un avviso, senza richiedere font che non rappresentano alcun carattere. Gli stili delle righe vuote, gli indici ulteriori e le proprietà sconosciute restano bloccanti. Verifica sul [sorgente del testo Fabric 3.4.0](https://raw.githubusercontent.com/fabricjs/fabric.js/v3.4.0/src/shapes/text.class.js) e confronto browser con corpo residuo 9999.

I rettangoli senza contorno, anche interamente trasparenti, sono conservati come rettangoli canonici, inclusi ID, label, proprietà e gruppi. Un colore di contorno con spessore zero non aggiunge una linea. Solo i rettangoli senza area e senza contorno, privi di proprietà operative e fuori dai gruppi, vengono esclusi con un avviso esplicito; gli originali rimangono intatti. Non si scartano contenitori vuoti con label o appartenenza a gruppi. Il segnaposto trasparente «Carica la foto» conserva i dati, ma il suo collegamento al campo immagine richiede un’associazione esplicita: il vecchio modulo PitchPrint non viene dichiarato ricreato.

## Verifiche

- **662 unitari in 102 file**, inclusi proporzioni, assi indipendenti, crop, sorgenti originali, comandi condivisi, sostituzione, JSON, Undo/Redo, rifiuti atomici e PNG reale 1280 × 1280.
- **79 casi browser pertinenti verificati tra regressione e ricontrollo**: il primo comando ha passato 78 casi; il test storico degli appunti chiedeva un grassetto simulato sul file normale. Campione corretto usando il file Tinos Bold reale sul solo carattere interessato e ricontrollato. Nessun allentamento della politica dei font. Controlli finali separati su immagini/effetti e segnaposto.
- Build TypeScript/Vite, schemi e scansione segreti; **24 campioni riaperti ed esportati dalla UI**, senza errori browser o richieste esterne.
- Nuovo campione sintetico [JSON](../fixtures/illustrator/pitchprint-images.TEST.json), [SVG](../fixtures/illustrator/pitchprint-images.TEST.svg) e [sorgente](../fixtures/illustrator/pitchprint-images.source.TEST.json), 160 × 100 mm, immagini a colori incorporate, crop e riflessioni. `node --import tsx scripts/capture-editor-pitchprint-images.ts`. Screenshot desktop ispezionato. Il confronto del campione rileva 1,31% dei pixel dell’inchiostro con differenza di canale superiore a 24/255, errore medio massimo di canale 0,081/255 sull’intera immagine; tolleranze, non identità byte/pixel.
- Tre cartelli fotografici reali convertiti in privato, senza scritture amministrative. Confronti anteprima: 1,21%, 1,55%, 1,37% dei pixel dell’inchiostro oltre la stessa soglia; errore medio di canale inferiore a 0,81/255. Originali JPEG conservati byte per byte. Nel terzo design `isReference: true` esclude già la foto dall’output: confrontata anche la produzione, con foto esclusa in entrambi i riferimenti. PNG completi ispezionati per tutti e tre i modelli, 250 × 125 e 300 × 200 mm. Prove e sorgenti reali restano in `.local`, esclusi da Git.

La verifica browser non certifica Illustrator, lavorazione o correttezza commerciale. Il campione aggiunto va collaudato in Illustrator per tavola fisica, crop, colori e trasformazioni delle immagini.

## Inventario e prossimi passi

Analisi in sola lettura dei **370 sorgenti a pagina singola**: **189 convertibili**, 73 in più rispetto ai 116 precedenti, nessuna regressione; **181 ancora bloccati**. «Convertibile» non equivale ad anteprima già approvata né a template già importato. Restano esclusi 20 dei 23 «Attenti al Cane», mentre i tre fotografici superano anche il confronto visivo descritto sopra. Archivio personale invariato per hash, zero scritture amministrative/errori browser.

Il primo ostacolo rilevato nei 181 è: 55 font (file/stile, glifi o copertura), 36 asset oltre 256 KB, 23 effetti/maschere/filtri, 21 contorni con scala non uniforme, 46 altre strutture/limiti. Risolvere il primo errore può far emergere un ostacolo successivo nello stesso design. La disponibilità dei font del computer non viene usata per aggirare i blocchi.

L’archivio reale rimane a **117 template PitchPrint e due composizioni**. I nuovi risultati non autorizzano una migrazione automatica ulteriore: prima anteprime e scelta concreta delle bozze, poi consenso all’importazione locale. Nessuna modifica a Shopify, tema, chat pubblicata, BSS, PitchPrint, prezzi, carrello o checkout; nessun deploy.

Prossimo recupero da valutare: dimensione degli asset oltre 256 KB, con limiti aggregati e prestazioni verificati; poi contorni non uniformi, effetti e testi curvi legacy. Protezione globale delle metriche dei font irrisolti ancora incompleta, come nell’incremento precedente.
