# Testi PitchPrint: interlinee compatte e stili dei caratteri

Incremento locale dell’11 novembre 2026, base `608dcc6` (123/370 sorgenti convertibili). Nessun deploy, importazione aggiuntiva nell’archivio personale o scrittura sul negozio.

## Interlinea e altezza automatica

Intervallo di capacità **0,1–3** condiviso da schema e ispettore; default **1** e passo **0,1** conservati. Non è una regola produttiva e non cambia il minimo TEST di 7 pt. Gli stessi `updateObject` validati funzionano per manuale/AI e Undo/Redo.

Con interlinea compatta, l’altezza automatica comprende l’ingombro naturale di ogni riga, non soltanto l’avanzamento fino all’ultima: una riga iniziale alta seguita da caratteri piccoli non viene ritagliata. Le distanze fra le baseline restano quelle richieste, quindi sovrapposizioni intenzionali sono possibili. Il cambiamento riguarda documenti con interlinea sotto 1, prima rifiutati dallo schema; i documenti precedenti e le loro miniature non cambiano.

## Stili nativi importati

`pitchprint-text-styles.ts` trasferisce in intervalli canonici per carattere:

- file di famiglia/peso/corsivo esatto, risolto anche quando il carattere sovrascrive soltanto uno di questi valori;
- corpo in punti ricavato dalla trasformazione fisica, colori RGB o conversione B/N esplicitamente scelta;
- sottolineato, sopralineato e barrato, compresa la disattivazione locale di una decorazione del box.

Nessun grassetto/corsivo simulato: il renderer riceve l’ID del file corretto con stile CSS normale. Risoluzioni verificate/cache per richiesta e stessi limiti di 16 file/4 MB, controllati prima del caricamento di ulteriori file. Indici nativi per riga/colonna convertiti in punti di codice Unicode, inclusi gli a capo. I file e i metadati originali restano incorporati nel documento.

Per i-testo, testo multiriga e textbox, misure e ancoraggi vengono ricalcolati con gli stessi file esatti. Il riferimento conserva la posizione delle righe anche se l’altezza automatica del box deve crescere; gli ingombri testuali e le matrici `mtx` memorizzati nel sorgente non sostituiscono le metriche reali. Gruppi, ID, label, proprietà e livelli seguono il contratto esistente.

Restano errori espliciti: font/varianti assenti; indici fuori dal testo; proprietà sconosciute; contorno del testo attivo, sfondo dei caratteri o scostamento verticale; allineamento del singolo carattere diverso dal box. Le dichiarazioni di contorno spento/scostamento zero/sfondo trasparente sono accettate senza aggiungere effetti. Le sequenze con più punti di codice per grafema (per esempio accenti decomposti) richiedono ancora una mappatura dedicata quando hanno stili: la conversione viene fermata, senza spostare stili su caratteri vicini. Accenti precomposti e caratteri oltre BMP sono coperti dai test degli indici. Il giustificato nativo e altri effetti non mappati restano bloccati.

Non dichiara completa tutta la tipografia PitchPrint: non sostituisce il controllo della copertura dei glifi o il collaudo produttivo.

## Campione e confronto

`pitchprint-text-styles.source.TEST.json` è sintetico; il [JSON](../fixtures/illustrator/pitchprint-text-styles.TEST.json) e lo [SVG](../fixtures/illustrator/pitchprint-text-styles.TEST.svg) sono **200 × 100 mm**, due testi, cinque file font OFL esatti. Testo ruotato con corpi/stili/colori misti e box a larghezza fissa con un altro font locale; interlinee 0,8/0,9. Generatore: `node --import tsx scripts/capture-editor-pitchprint-text-styles.ts`.

Riferimento indipendente ricostruito dalle coordinate native con IText/Textbox e varianti reali; confronto a **1200 × 600 px: zero pixel differenti su 4864 pixel dell’unione dell’inchiostro**. È il risultato di questo campione e di questa risoluzione, non una garanzia di identità per ogni fonte o dimensione. Comandi manuali/AI, storico e riapertura verificati; schermate desktop/telefono ispezionate, zero errori browser/scritture amministrative. Dati privati in `.local/editor-pitchprint-text-styles-capture.json` e `.local/previews/editor-pitchprint-text-styles-{desktop,mobile}.png`.

Test dedicato a interlinea **0,1**, prima riga da **60 pt** e successive da **12 pt**: nessuna perdita di inchiostro togliendo il clip, confrontando le sagome con tolleranza di un pixel per l’antialiasing della cache Fabric. Il confronto iniziale esatto dei canali rilevava soltanto differenze di rasterizzazione cache/disegno diretto, osservate nelle immagini diagnostiche; il test finale misura l’inchiostro eventualmente nascosto e l’altezza effettiva.

## Analisi reale

Nuovo passaggio sui **370 sorgenti** già acquisiti, colori conservati e sfondi/materiali esclusi esplicitamente: **144 convertibili e 226 bloccati**. **21 nuovi esiti positivi**, di cui tre con contorni ampi e interlinea compatta; nessuna regressione sui 123 precedenti. Nessuna nuova bozza salvata. Hash/ID delle copie controllati, archivio personale identico prima/dopo, zero scritture amministrative e zero errori browser. Il limite dei file font è ora controllato anche prima dei caricamenti: non cambia gli esiti positivi, già validati dallo stesso schema finale.

Rapporto privato `.local/pitchprint-migration/text-styles-analysis.report.json` e log `.local/editor-text-styles-real-analysis.log`. Convertibile non significa approvato visivamente, privo di glifi mancanti o pronto per la produzione.

## Verifiche

**642 unitari / 98 file passati**, tre nuove prove su mappatura/ereditarietà, indici/effetti/font assenti e interlinea con comandi e storico. Log `.local/editor-text-styles-unit-all.log`. Build TypeScript/Vite, schemi JSON e scansione segreti passati; regressione browser estesa e campioni registrati nello stato finale sotto.

Nessuna dipendenza nuova, servizio AI attivato o modifica alla chat pubblicata/negozio/tema/PitchPrint/BSS/prezzi/acquisti. Illustrator e lavorazione fisica da collaudare sui nuovi campioni.


Stato finale: **183/183 browser pertinenti passati in un’unica esecuzione (8 minuti)**, compresi i tre nuovi casi e regressioni su editing, font/varianti, selezioni, gruppi, importazioni, colori, miniature ed esportazioni. Log `.local/editor-text-styles-browser-regression.log`; non è una nuova esecuzione dell’intera suite browser. Il primo gruppo mirato aveva 6/7 esiti positivi per il confronto antialiasing sopra descritto; il successivo gruppo corretto 3/3 e la regressione finale comprendono quel caso passato.

**22 campioni riaperti/riesportati**, zero errori browser e zero richieste esterne, in `.local/editor-text-styles-artifacts-final.log`. Il verificatore ora ammette i colori legittimi nei campioni RGB ed esclude i dati binari dal controllo dei numeri non finiti: la prima prova aveva scambiato una sequenza Base64 di un font per la parola `NaN`. Nessuna modifica ai byte dei font o alle coordinate per far passare la verifica.

Build/schemi/segreti e controllo finale TypeScript passati: `.local/editor-text-styles-{build-final,schemas,secrets,types-final}.log`. Il controllo tipi ha individuato e fatto correggere soltanto un tipo troppo generico nelle opzioni native e un accesso numerico nel test pixel. Nessuna nuova prova Illustrator eseguita.
