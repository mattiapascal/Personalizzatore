# Importazione dei gruppi PitchPrint — 10 novembre 2026

**Seguito:** [proprietà e gerarchia dei gruppi](iteration-editor-group-properties.md). Conserva label/priorità dei contenitori e annidamento; supera i blocchi descritti sotto. Questo documento conserva il resoconto dell’incremento geometrico precedente.

## Problema e incremento

82 dei 370 sorgenti locali a pagina singola contengono gruppi. Il convertitore precedente li rifiutava tutti. L’editor conserva già gruppi semplici nel documento canonico: questo incremento riutilizza quei gruppi e gli stessi comandi manuali/AI, senza introdurre un nuovo strumento avanzato.

Prima della conversione vengono controllati ricorsivamente tutti i contenitori: coordinate, origini, trasformazioni, effetti, profondità e quantità. Le trasformazioni si concatenano dalle coordinate relative al centro dichiarato del gruppo fino ai millimetri della pagina. Non vengono ricalcolati i centri dai figli né usate le cache `mtx`, che possono essere obsolete.

- Vettori: traslazione, rotazione, scale anche diverse e riflessioni conservate tramite il normale importatore SVG. Un contorno deformato non uniformemente resta bloccato: occorrerebbe espanderlo in tracciati per conservarne la resa.
- Testi: file incorporati esatti, corpo e dilatazione ricavati dagli assi trasformati. Testo ancora editabile; nessun contorno sostitutivo o grassetto simulato. Riflessione e inclinazione che non siano rappresentabili nel modello restano errori espliciti.
- Immagini: rotazione/riflessione conservate; nessuna eliminazione di filtri/ritagli o deformazione delle proporzioni per far riuscire l’importazione.
- Ordine dei figli, ID deterministici, label e proprietà dei singoli elementi conservati. Blocchi, menu nascosti e riferimenti del contenitore applicati conservativamente ai suoi discendenti, con avviso.
- I gruppi annidati diventano un’unica unità di selezione esterna, dichiarata nel resoconto. La gerarchia originaria rimane nel sorgente, non diventa una seconda scena grafica.

## Limiti ancora aperti

Il gruppo canonico non ha oggi un contratto per label/ordine/modulo propri. Un contenitore che li usa viene **rifiutato**, indicando il motivo; non si assegna la sua etichetta a un figlio arbitrario. Per questi casi serve un incremento dedicato, comprendente comportamento del modulo, selezione, duplicazione e salvataggio. L’analisi corrente trova **24 template** bloccati da questa condizione.

Gruppi vuoti, discendenti invalidi, maschere/ombre/opacità e metodi di fusione non rappresentabili restano bloccanti. Preflight entro 12 livelli, 1000 nodi sorgente e 200 elementi grafici; questi sono limiti di risorse del laboratorio, non profili produttivi.

La precedente indagine sui font non ha autorizzato alcun allentamento: nel laboratorio precedente `src/font-catalog/sync.mjs` ricostruisce alcune varianti personalizzate da nome e flag, attribuendo 400/700. Quel catalogo, da solo, non dimostra la dichiarazione CSS originaria quando i metadati del file divergono. I pesi/corsivi non corrispondenti restano rifiutati; la prova sui tre font statici non viene estesa ai font variabili o ad altri file senza evidenza.

## Verifiche e campione

Campione [sorgente nativo TEST](../fixtures/illustrator/pitchprint-groups.source.TEST.json), [JSON portabile](../fixtures/illustrator/pitchprint-groups.TEST.json) e [SVG](../fixtures/illustrator/pitchprint-groups.TEST.svg): **100 × 60 mm, sei oggetti, due gruppi e un file Arimo con licenza OFL**. Testo sintetico, nessun dato cliente. Rigenerazione con `node --import tsx scripts/capture-editor-pitchprint-groups.ts`.

Il riferimento grafico è costruito separatamente con Fabric, mantenendo il piano relativo originale dei figli e disattivando il ricalcolo automatico del layout dei gruppi. Nel confronto a 800 × 480 pixel, **9 pixel differenti su 9006 pixel dell’unione dell’inchiostro, circa 0,10%**. Il campione esegue comandi manuali e AI simulati, Undo/Redo, verifica i glifi, riapre il JSON ed esporta lo SVG. Zero errori browser e scritture amministrative. Anteprima `.local/previews/editor-pitchprint-groups.png`; rapporto `.local/pitchprint-groups-capture.json`. È una verifica browser, **non un collaudo Illustrator**.

**620 unitari / 92 file, build/TypeScript e 11 browser di migrazione pertinenti** superati. I quattro casi nuovi verificano resa uniforme/non uniforme, immagini riflesse, blocchi ereditati nei comandi manuali/AI, rifiuti atomici. Anche **20 campioni JSON riaperti/riesportati** e controllo segreti passati. La suite browser completa non è stata ripetuta dopo questo incremento; l’ultimo controllo completo precedente era di 363 casi.

## Analisi reale in sola lettura

Sulle 370 copie locali a pagina singola: **112 convertibili, 258 bloccate**, con scelta esplicita TEST nero/bianco e sfondo/materiale escluso. **Tre template con gruppi** sono ora convertibili. Zero errori browser, zero scritture amministrative; grafica, impostazioni e file font del titolare invariati. Questi numeri attestano la conversione tecnica, non l’approvazione produttiva delle bozze.

Rispetto al rapporto storico di 93 convertibili risultano 19 nuovi esiti positivi e nessuna regressione: **tre dovuti ai gruppi**, mentre 16 erano bloccati dal font Times New Roman CE ora disponibile nella libreria. Questi ultimi non vengono attribuiti al nuovo codice né a un allentamento dei controlli sui font. Rapporti privati: `.local/pitchprint-migration/groups-analysis.TEST.report.json`, `.local/pitchprint-groups-comparison.json` e `.local/editor-pitchprint-groups-real-analysis.log`.

Nessun deploy o modifica a Shopify, tema, PitchPrint, BSS, prezzi, carrello, checkout o chat pubblicata. Nessuna importazione nel vero archivio template per il solo collaudo.
