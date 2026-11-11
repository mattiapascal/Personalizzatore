# Trasparenza di riempimento e contorno — 11 novembre 2026

Richiesta del titolare: slider sincronizzati, con possibilità di regolarli separatamente. Base di lavoro `0a95e52`; completato anche l’ingrandimento interno delle foto già in sviluppo, [resoconto](iteration-editor-raster-zoom.md).

## Interfaccia

Nelle schede Riempimento e Contorno dell’ispettore compaiono slider e campi numerici: **0% opaco, 100% trasparente**. Il pulsante a catena collega le due regolazioni di default; spezzando la catena si possono impostare valori distinti. I controlli sono gli stessi nelle due schede: cambiare scheda mantiene il collegamento scelto.

Collegare le regolazioni non modifica i valori esistenti, neppure se diversi: la successiva regolazione applica lo stesso valore alle due componenti con un solo comando. La catena è uno stato UI, riparte collegata dopo una nuova selezione; i valori grafici indipendenti restano nel documento e si riaprono senza essere uniformati. Cambio colore, Undo/Redo e comandi AI non cancellano l’alpha.

Testi: un controllo per il riempimento, applicabile all’intero box oppure ai soli caratteri selezionati. Il cursore senza selezione non cambia gli stili. Linee e tracciati aperti espongono soltanto il contorno. Selezioni multiple e gruppi hanno gli stessi controlli, con indicazione dei valori misti. Le immagini conservano il proprio percorso di elaborazione; non acquisiscono campi di riempimento/contorno.

Un riempimento al 100% di trasparenza si seleziona dal solo bordo visibile, come un riempimento assente. Un oggetto totalmente invisibile resta raggiungibile dai livelli. Le misure e i centri non cambiano.

## Documento e rendering

Campi opzionali `fillOpacity` e `strokeOpacity`, numeri finiti da 0 a 1, default implicito 1. `fillOpacity` è disponibile anche negli stili dei caratteri; i colori canonici rimangono RGB separati dall’alpha. Estensione additiva dello schema v2: vecchi JSON invariati e ancora opachi. Schemi dei documenti, comandi e contenitori amministrativi/configurazioni rigenerati.

Le operazioni manuali e AI usano `updateObject` o `styleObjects`; valori invalidi e revisioni obsolete vengono rifiutati atomicamente senza perdere il Redo. Blocchi di selezione/trasformazione e riferimenti continuano a valere. Nessuna seconda fonte di verità nel canvas.

Fabric riceve i due paint CSS con alpha. Durante l’editing del testo, il readback ricostruisce RGB e alpha canonici; gli override locali non si perdono digitando. SVG conserva le due trasparenze, anche per caratteri su tracciato e guida visibile; il JSON conserva anche l’associazione editabile al percorso. L’alpha riguarda ciascun paint, non l’opacità isolata di un intero gruppo: nelle zone di sovrapposizione riempimento e tratto vengono composti separatamente.

La bozza ammette la trasparenza. La conferma di una montatura inchiostrata del catalogo rifiuta trasparenze parziali della grafica stampata, secondo il vincolo B/N del titolare; riferimenti non produttivi esclusi. Non viene introdotta una regola universale per targhe stampate o altri processi. Questa verifica non sostituisce il preflight completo dei raster/profili ancora da sviluppare.

L’importatore PitchPrint/SVG non è stato allentato per ignorare opacità, maschere o filtri: il trasferimento dei casi legacy richiede un incremento dedicato e confronti di resa. I sette rettangoli al 90% individuati nel censimento non diventano automaticamente pronti con il solo controllo manuale.

## Campione

[Sorgente](../fixtures/illustrator/paint-opacity.source.TEST.json), [JSON finale](../fixtures/illustrator/paint-opacity.TEST.json), [SVG](../fixtures/illustrator/paint-opacity.TEST.svg): tavola 80 × 60 mm, sfondo blu e rettangolo rosso con contorno verde. Dalla UI: riempimento 50% con controlli collegati, separazione e contorno 75%; comando AI con valori diversi, poi Undo per tornare al risultato manuale. Revisione finale 5. Nessun font o dato personale.

Generatore `node --import tsx scripts/capture-editor-paint-opacity.ts`. Riferimento Canvas2D indipendente con composizione di fill/stroke: zero pixel con differenza oltre 24/255; errore medio 0,002257/255. Il controllo nativo separato verifica anche i pixel nelle zone di solo riempimento, solo contorno e sovrapposizione, con tolleranza 2/255. Non è una certificazione Illustrator. Schermate desktop/mobile private ispezionate, zero errori browser o scritture amministrative.

Collaudo umano Illustrator ancora da eseguire: dimensioni, geometrie, colori, trasparenza indipendente, sovrapposizioni e testi editabili.

## Verifiche

**727 unitari / 113 file**, tipi/build, schemi e scansione segreti passati. Otto nuovi unitari per alpha/canonico, JSON, manuale/AI/storico/conflitti, limiti numerici, stili comuni, stili dei caratteri, guide e regola produttiva del timbro. **Sette nuovi browser passati**, con campi/slider, catena, gruppo, testo, SVG, selezione sul bordo trasparente e guida visibile.

**13 browser pubblici locali**, build pubblica e scansione segreti passati. **32 campioni riaperti/riesportati**, zero errori browser o richieste esterne. **478/478 browser locali passati nell’esecuzione finale completa** (16,4 minuti), inclusi i sette nuovi casi e i sei dello zoom interno delle foto. Nessun caso fallito o rimasto da eseguire nel controllo finale.

Log privati `.local/paint-opacity-{unit-verified,build-verified,secrets-verified,guide-browser,final-all-browser,public-build-final,public-browser-final,public-secrets-final,capture,artifacts}.log`. Conservati i tentativi intermedi: tipi dei campioni pixel corretti dopo la prima build; un test usava il nome inesistente «Seleziona tutti gli oggetti», corretto in «Seleziona tutto»; la prima cattura mobile trovava il pannello chiuso, ora aperto esplicitamente. La prima regressione completa è stata interrotta dopo 60 passati per completare la guida visibile prima del controllo definitivo: non va presentata come suite passata.

Nessun deploy, nuovo import nell’archivio, modifica dei font personali o intervento su Shopify, tema, PitchPrint, BSS, prezzi, carrello/checkout o chat pubblicata.
