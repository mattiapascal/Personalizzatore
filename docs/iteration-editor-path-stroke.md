# Estremità e giunzioni dei tracciati — 14 novembre 2026

La scheda **Contorno** offre le estremità piatte/arrotondate/quadrate anche per polilinee e Bézier. Tre nuove icone distinguono giunzioni **a punta**, **arrotondate** e **smussate**, su polilinee, Bézier, vettori SVG e rettangoli. Il limite delle punte è numerico da 1 a 100, con passo 0,1: oltre il rapporto consentito la punta viene smussata. Sono disponibili anche nello stile comune delle selezioni compatibili, senza saltare oggetti incompatibili. Le linee rette non hanno giunzioni; cerchi/ellissi non presentano spigoli. Il controllo non modifica i contorni dei caratteri del testo.

Nel punteggiato il cap effettivo rimane rotondo; la preferenza memorizzata ritorna quando si sceglie continuo o tratteggiato. Stessi updateObject/styleObjects validati per azioni manuali e simulazione AI, revisioni, ruoli, gruppi e Undo/Redo. Nessuna chiamata a un modello AI.

## Cornice, maniglie e compatibilità

Le punte miter e i cap quadrati diagonali possono oltrepassare il vecchio margine di mezzo spessore. Il modulo `path-stroke.ts` deriva le sporgenze dalle tangenti dei segmenti, comprese cubiche con maniglie degeneri, contorni separati e chiusi. La cornice resta simmetrica rispetto alla geometria centrale e comprende il vecchio riquadro più le sporgenze. **Non è un riquadro stretto dei soli pixel dipinti**: conserva la corrispondenza con coordinate/nodi ed evita spostamenti della geometria quando cambia lo stile.

Il parametro facoltativo `strokeFrameVersion:1` si applica modificando lo stile di un percorso dai nuovi controlli o da styleObjects. I documenti precedenti mantengono cornice, aspetto e dati, senza aggiornamento automatico o migrazione dell’archivio. Per polilinee/Bézier che specificano i nuovi stili lo schema richiede la nuova cornice; i vettori storici mantengono i parametri già presenti. Le guide vettoriali del testo precedenti conservano il comportamento storico delle giunzioni finché il percorso non è aggiornato esplicitamente.

Le modifiche di stile mantengono fermo il centro. Le maniglie ridimensionano la **cornice**, con spessore finale invariato; il motore risolve le dimensioni nominali necessarie, che possono variare su entrambi gli assi quando cambiano le sporgenze. Il comando transformObject accetta strokeFrameScale con le dimensioni nominali correnti, per evitare richieste ambigue: il calcolo e gli eventuali rifiuti avvengono nel dominio condiviso, senza eccezioni lasciate nel gestore del mouse. Se il target è incompatibile con spessore/limite miter, il comando è rifiutato e il progetto resta identico. La geometria dell’ispettore continua a modificare le misure nominali dal centro.

I trascinamenti conservano l’ancora opposta, anche con inclinazione/riflessione. Il controllo di uscita dal foglio considera anche le punte e i cap: una punta rimasta sul foglio non provoca una cancellazione prematura. Rimane un controllo geometrico di editing; la verifica produttiva campionata continua a leggere la pittura effettiva. Le proprietà del nuovo contorno si conservano applicando/separando un testo dal percorso.

Durante il collaudo una verifica SQLite ha rilevato una differenza nelle chiavi delle miniature: l’aggiunta dei campi aveva riordinato quelli già esistenti dei vettori. Corretto lo schema mantenendo l’ordine storico, senza modificare lo storage né indebolire il test. Campioni legacy e verifica concorrente WAL sono nuovamente passati. Nessuna invalidazione globale delle immagini per i documenti non modificati.

## Evidenze

- **1.345 unitari in 187 file**, inclusi 18 nuovi: tangenti/sporgenze indipendenti, limiti, cap, contorni chiusi/multipli/degeneri, solver, comandi/ruoli/rifiuti atomici, revisioni, Undo/Redo, testo sul percorso e chiavi legacy.
- **68 browser pertinenti**: 18 nuovi, 11 regressioni delle estremità delle linee, sette di proprietà/riferimenti del testo sul percorso e 32 esistenti su nodi, Bézier, maniglie, testo, trasparenze e trasformazioni. Desktop 1440 px e telefono 390 px; sei trascinamenti laterali e quattro modifiche native dei nodi, con ancore o altri vertici fermi.
- Canvas2D indipendente per polilinea/Bézier/SVG/rettangolo inclinati/riflessi: nei tre tipi di giunzione **zero pixel SVG differenti oltre soglia 12** sul canale premoltiplicato. Errore medio massimo 0,0045/255 sui pixel dipinti. Nel Canvas massimo 0,447% di pixel oltre soglia e media 0,215; miniature massimo 0,039% e media 0,125. Nessuna diluizione dell’errore sui grandi margini trasparenti.
- Nove combinazioni di cap e tratto, tre geometrie ciascuna: zero pixel oltre soglia per SVG, Canvas e miniature; errore medio massimo 0,014/255. Preferenze conservate nel punteggiato. Testo sul nuovo percorso confrontato con il percorso separato, proprietà ripristinate.
- **84 campioni JSON/SVG** riaperti/esportati dall’editor: zero errori browser, richieste esterne o caricamenti dei file dalla libreria reale. **13 test della chat pubblica** passati. Build laboratorio, storefront e Worker TypeScript, schemi generati e scansioni segreti passati.
- Nuove prove interattive/catture senza scritture amministrative o richieste esterne. Archivio principale letto soltanto: **SQLite R638, 346 template, due composizioni, 219 font (218 attivi), un profilo**. La cancellazione preesistente di `output/pdf/editor-font-compressi.TEST.pdf` resta esclusa dalla consegna.

Log privati `.local/path-stroke-*.log`, catture desktop/telefono `.local/previews/editor-path-stroke-*.png` esaminate visivamente, riepiloghi `.local/path-stroke-capture.json` e `.local/path-stroke-archive.json`. Nessun deploy, migrazione, nuova funzione multipagina, generazione immagini AI o modifica commerciale.

## Campione e seguito

[JSON editabile](../fixtures/illustrator/path-stroke.TEST.json) e [SVG](../fixtures/illustrator/path-stroke.TEST.svg), 140×100 mm: quattro geometrie, due colori, punte miter e cap quadrati. Generatore `node --import tsx scripts/capture-editor-path-stroke.ts`; comandi manuali/AI nel medesimo documento. Nel laboratorio selezionare un percorso e aprire Contorno; provare le giunzioni, il limite, le estremità e Undo, poi Nodi e Geometria.

In Illustrator controllare misure, mantenimento dei vettori, punte/cap e corrispondenza del disegno: **collaudo umano non eseguito**, nessuna certificazione produttiva dichiarata. Il seguito prioritario riguarda il renderer limitato alla vista, per poter ingrandire piccoli dettagli su formati grandi senza allocare il bitmap dell’intero foglio; preservare limiti di memoria, zoom/PAN, maniglie, font e coordinate fisiche.
