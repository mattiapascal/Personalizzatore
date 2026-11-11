# Contorni fisici per template e targhe reali

Incremento locale dell’11 novembre 2026. L’analisi precedente ha individuato dieci sorgenti PitchPrint con contorni da 3,49 a 9,20 mm, respinti dal tetto storico TEST di 2 mm.

Realizzato il limite di capacità di **100 mm**, con un unico `StrokeWidthSchema` condiviso da tutti i sette tipi di forma, stili di selezione e guide testuali. Aggiornati entrambi gli ispettori e l’importatore SVG usato anche da PDF/PitchPrint. Millimetri, centri, scala dei gruppi e Undo/Redo conservati; rifiuto atomico oltre il limite, senza clamp. Il passo degli ispettori resta **0,05 mm**, con valori importati più precisi conservati. Non cambiare automaticamente alcun progetto o record personale. Il formato v1 conserva il tetto storico di 2 mm; nessuna migrazione dei v2 esistenti è necessaria.

Questo tetto è una protezione di capacità locale, non una regola produttiva: non modifica la punta minima delle targhe incise né i vincoli dei timbri. Restano rifiutati contorni con trasformazioni non uniformi, perché una larghezza uniforme non li rappresenta fedelmente.

Verificati i confini del modello e i comandi manuali/AI, i contorni importati/modificati nell’ispettore e il confronto indipendente dei pixel e delle misure SVG. Campioni JSON/SVG e nuova analisi dei 370 sorgenti a pagina singola descritti sotto. Nessuna nuova importazione massiva nell’archivio, scrittura online, deploy o collaudo Illustrator implicito.


## Precisione e campione indipendente

Durante il confronto è emerso che le matrici SVG intermedie di Fabric venivano arrotondate a quattro decimali: il contorno ruotato da 9,2 mm diventava 9,19954928 mm. `preciseIntermediateSvg` serializza ora soltanto quel passaggio sincrono con almeno dodici decimali, ripristinando la configurazione anche in caso di errore. Nessun cambiamento globale permanente, nessun arrotondamento dei record già salvati. L’esportatore produttivo e la versione delle miniature restano invariati, perché cambia la preparazione di nuovi documenti, non il rendering di quelli esistenti.

Il campione `wide-strokes.TEST.json/svg`, **300 × 180 mm**, contiene una cornice ruotata con angoli arrotondati da **9,2 mm**, un cerchio da **6 mm** e una curva da **5 mm**. Sorgente sintetico separato, nessun dato cliente o font di sistema. Il generatore esegue comandi manuali/AI e Undo/Redo, riapre il JSON nell’interfaccia e salva schermate desktop/telefono. Tutti gli oggetti restano vettori.

Riferimento indipendente costruito con Fabric dalle coordinate native, esplicitando le origini predefinite sinistra/alto di Fabric 3, differenti da quelle centrali di Fabric 7. Nel confronto a **1200 × 720 px**, **198 pixel differenti su 80.739 pixel dell’unione dell’inchiostro (0,245%)**; misure dei contorni entro 10⁻⁷ mm dai valori nominali nel campione. Schermate ispezionate, zero errori browser e zero scritture amministrative. Non equivale a identità matematica delle curve né a collaudo Illustrator.

Log dei primi tentativi: un errore nel nome del comando nel nuovo test unitario è stato corretto usando `styleObjects`; TypeScript ha rilevato un accesso non ristretto al tipo di forma nel test. Il primo browser ha rilevato la perdita di precisione descritta sopra; il successivo ha segnalato il riferimento di prova con le origini moderne anziché legacy, corretto nel solo helper. Le soglie del confronto non sono state allentate. La regressione finale deve essere letta separatamente da questi tentativi intermedi.


## Analisi dei sorgenti reali

Rianalizzati **370 sorgenti a pagina singola**, conservando i colori e con esclusione esplicita di sfondi/materiali come nel piano precedente. **123 convertibili, 247 bloccati**, rispetto ai 117 convertibili precedenti: **sei nuovi casi, nessuna regressione**. Tutti e sei avevano contorni oltre 2 mm. Nei restanti quattro casi precedentemente fermati dal contorno emergono tre interlinee inferiori a 1 e un elemento senza geometria visibile; non sono stati forzati né scartati oggetti per dichiararli convertibili.

L’analisi ricontrolla ID/hash dei sorgenti e impedisce scritture amministrative. Archivio personale identico prima/dopo, zero scritture e zero errori browser. Le sei conversioni **non sono state salvate** tra i template: l’autorizzazione all’importazione effettiva riguardava le 117 bozze precedenti. Convertibile non significa già approvato visivamente, con copertura font completa o per produzione.

Rapporto privato `.local/pitchprint-migration/wide-strokes-analysis.report.json`; log `.local/editor-wide-strokes-real-analysis.log`. Sorgenti, dati cliente e font personali restano privati. Prossimi candidati concreti: interlinea compatta e formattazioni parziali native, mantenendo i file font esatti e verificando altezza automatica/resa delle righe. Non introdurre un fallback per sbloccare un template.


## Verifiche finali

- **639 unitari / 97 file passati**, inclusi quattro nuovi test su confini, guide, comandi, centri, Undo/Redo e ripristino della precisione. Log `.local/editor-wide-strokes-unit-all.log`.
- **113/113 browser pertinenti passati**, in un’unica esecuzione finale, su contorni, gruppi, trasformazioni, testo su tracciato, SVG/PDF/PitchPrint e rifiuti atomici. Log `.local/editor-wide-strokes-browser-regression.log`; primo gruppo corretto di sette casi in `.local/editor-wide-strokes-browser-final.log`. Non è una nuova esecuzione dell’intera suite browser.
- **21 campioni JSON riaperti/riesportati**, zero errori browser e zero richieste esterne: `.local/editor-wide-strokes-artifacts.log`. Il verificatore prepara copie TEST esplicite dei vecchi campioni; non sostituisce font nei progetti reali.
- Build TypeScript/Vite, schemi JSON e scansione segreti passati: `.local/editor-wide-strokes-{build-final,schemas,secrets}.log`.
- Campione generato e schermate ispezionate: `.local/editor-wide-strokes-capture.json`, `.local/previews/editor-wide-strokes-{desktop,mobile}.png`.

Nessuna dipendenza aggiunta, modifica a chat pubblicata, Shopify, tema, PitchPrint/BSS online, prezzi o acquisti. Nessun deploy. Illustrator e lavorazione fisica restano da collaudare sui nuovi file.
