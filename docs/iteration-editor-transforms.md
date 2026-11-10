# Trasformazioni locali — 8 novembre 2026

## Piano e assunzioni prima dell’implementazione

Si prosegue sulla worktree dell’incremento oggetti, ancora non committata, senza cancellare modifiche precedenti. Solo editor locale, contratti grafici, test e campioni; niente deploy o cambi a chat/negozio. Multipagina escluso e generazione immagini AI rinviata.

1. Schema documento v2 per rotazioni: import esplicito dei v1 esistenti, angolo implicito zero. Il vecchio reader rifiuta i nuovi file invece di ignorare trasformazioni. Comandi con contratto v1 mantenuti ed estesi.
2. Un comando atomico `transformObject` contiene posizione, angolo e dimensioni tipizzate. Testo scalato tramite pt, cerchio tramite raggio, rettangolo tramite mm; nessuna scala persistente Fabric. Pannello proprietà e maniglie usano lo stesso comando revisionato.
3. X/Y descrivono il minimo dell’ingombro esterno sul piano dopo rotazione. Le dimensioni delle forme escludono il tratto; testo non deformabile e cerchio sempre circolare. La rotazione del cerchio resta zero perché non ne cambia la geometria.
4. Il validatore calcola i vertici orientati usando le misure reali del renderer; controlla margine rettangolare e cerchio effettivo dei profili tondi. Non basta verificare l’angolo di origine.
5. Test unitari su trasformazioni, revisioni, import v1 e geometria; prove browser delle maniglie e del pannello, ripristino conservativo, JSON/SVG e regressioni commerciali. Illustrator rimane un collaudo umano separato.

Completamento dello stesso incremento: comandi `reorderObject` e `alignObject` per ordine livelli e allineamento del singolo oggetto all’area/margine TEST. L’array del documento definisce l’ordine di disegno e di export; gli allineamenti usano l’ingombro ruotato. Nei tondi un allineamento al bordo del riquadro nominale può essere rifiutato se esce dal cerchio. Selezione multipla e allineamento tra oggetti restano successivi.

Rischi principali: differenze tra scala Fabric e spessore produttivo, origine della rotazione e arrotondamenti presso i margini. Conservare il tratto fisico e misurare il risultato canonico; tolleranza esclusivamente numerica, nessun ampliamento del margine TEST.

Riferimento consultato: [Fabric ObjectGeometry](https://www.fabricjs.com/api/classes/basefabricobject/), API per coordinate e bounding box. Renderer e misure fisiche rimangono isolati nell’adapter.

## Consegna e prova

Accesso diretto: `http://127.0.0.1:5173/editor`. Carica il 4913 del catalogo fixture e permette di passare agli altri due formati TEST senza chat, bootstrap, polling API o provider AI. La normale pagina `/` conserva il selettore commerciale locale.

Selezionare un oggetto e usare il pannello proprietà oppure le maniglie. La checkbox «Mantieni proporzioni» vale per le dimensioni numeriche del rettangolo. Le maniglie di testo e cerchio rimangono uniformi anche con Maiusc; per i rettangoli, gli angoli mantengono le proporzioni per default e Maiusc consente scala libera. Il tratto conserva il suo spessore fisico dopo il commit.

La modifica numerica di X/Y/angolo/dimensioni avviene con «Applica trasformazione», in una sola revisione. Cambi di selezione, import, undo/redo o comandi simulati ricostruiscono il pannello dal documento aggiornato. Le bozze dei campi non sono una seconda scena. I pulsanti livelli e allineamenti usano gli stessi comandi del pannello JSON simulato.

Campioni: `fixtures/illustrator/transforms.TEST.json` e `.svg`, generati con `npm run capture:editor -- --transforms`. Tavola 58×22 mm, rettangolo 10×5 mm ruotato 30°, «COPIA» a 10 pt ruotata −15°, testo originale centrato orizzontalmente e ordine livelli variato. Il JSON usa il catalogo fixture v1: si può aprire direttamente su `/editor`, sul 4913, non sul catalogo reale di versione differente. I campioni precedenti non vengono rigenerati.

## File e confini

- `src/editor/model.ts`: documento v2, migrazione in ingresso v1, geometria orientata e tre nuovi comandi.
- `src/editor/fabric-adapter.ts`: scala/rotazione manuali e ricostruzione delle trasformazioni canoniche. `getCoords`/bounding box verificabili rispetto al validatore.
- `src/editor/ObjectProperties.tsx`, `EditorLab.tsx`, `editor.css`: pannello, livelli e allineamenti.
- `src/editor/EditorStandalone.tsx`, `src/App.tsx`: ingresso diretto al solo laboratorio. La UI pubblica ha un entrypoint separato e non importa questi file.
- Test del modello e browser; schemi JSON aggiornati; script cattura con campione dedicato.

Nessuna nuova dipendenza, modifica a `.env.local`, API commerciale, Worker, fonti dimensionali, regole della chat o file tema. Nessun deploy, chiamata AI reale o scrittura Shopify/BSS/PitchPrint.

## Limiti e controlli

Selezione multipla, allineamenti tra oggetti, snap, gruppi, font aggiuntivi, import/elaborazione immagini restano da sviluppare. Il canvas mantiene il proprio zoom di laboratorio e scorre orizzontalmente sui telefoni; la pagina non deve avere overflow orizzontale. Nero/bianco, minimo TEST 7 pt e margine TEST 1 mm non sono profili produttivi universali. Non esistono ancora vincoli di layout automatico tra oggetti.

Prova Illustrator da eseguire: aprire `transforms.TEST.svg`, controllare tavola, tratto, angoli e testo modificabile; riscrivere entrambi i testi e salvare senza rasterizzazione. **Non eseguita in questa iterazione.**

## Evidenze automatiche

- **233 test unitari superati**, inclusi 15 nuovi casi/parametri sulle trasformazioni, migrazione e disposizione degli oggetti.
- **47 browser laboratorio superati** nell’esecuzione finale: sette prove nuove per questo incremento, oltre alle due della precedente gestione oggetti.
- **13 browser pubblici locali superati** con trasporti controllati; nessuna chiamata al servizio pubblicato.
- TypeScript/build e scansione credenziali client superati dopo le ultime modifiche. Schema JSON rigenerati; nessuna variazione agli altri contratti.
- Golden SVG storico invariato dopo import del v1. Import/export v2, revisioni obsolete, errori atomici e undo/redo verificati. Controllo numerico di vertici e bounding box Fabric per testo e rettangolo a −180°, −90°, −45°, 0°, 30°, 90°, 180°.
- Campioni JSON/SVG e screenshot desktop/mobile generati e ispezionati. Illustrator non eseguito.

Diagnostica risolta: un test iniziale non attendeva la lettura asincrona del file JSON e usava una revisione precedente; sincronizzato sulla revisione importata. Due esecuzioni Playwright concorrenti interferivano con gli artefatti trace: eseguite poi in sequenza. Un nuovo paragrafo di collegamento spingeva il compositore fuori dalla viewport a 360×640: rimosso, rendendo invece disponibile il pulsante editor già presente anche senza candidato. Suite completa finale superata; non sono stati allentati i limiti delle verifiche responsive.

Il pulsante «02 · Editor Fabric.js» nella pagina iniziale apre `/editor` quando non esiste ancora una bozza; con una bozza aperta continua a mostrarla senza ricaricarla.

Successiva richiesta del titolare nella stessa sessione: [area di disegno a tutto schermo con pannelli e zoom](iteration-editor-workspace.md). La descrizione del solo canvas scorrevole sopra riguarda la vista laboratorio.
