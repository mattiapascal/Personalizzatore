# Maschere del testo: prossimo incremento — 13 novembre 2026

Piano successivo all'[importazione affine](iteration-editor-pitchprint-affine-text.md). **Non ancora implementato**. I due cartelli prioritari rimangono bloccati, senza rimuovere maschere o modificare i sorgenti.

## Comportamento nativo verificato

Prova sintetica nel runtime originale Fabric 3.4.0, font Arimo TEST esatto, nessuna rete o scrittura personale. Dieci casi, con origine centrale e sinistra/alto: base, cambio testo, cambio corpo, scala dell'oggetto, cambio larghezza del Textbox. La maschera rettangolare locale rimane sempre 120 × 45 unità, con posizione 5/−3. Cambiare testo/corpo/larghezza non cambia quelle dimensioni; scalare l'oggetto 2× produce invece una maschera mondiale 240 × 90. Con origine centrale il centro mondiale resta stabile durante gli aggiornamenti di contenuto; con origine sinistra/alto segue il nuovo centro dell'oggetto.

Script diagnostico privato `.local/probe-text-mask-edit-behavior.ts`, risultato `.local/text-mask-behavior/report.json`. La prova riguarda rettangoli relativi: non certifica maschere assolute/invertite o gruppi di maschere. Conferma che normalizzare la maschera rispetto alla larghezza/altezza variabile del testo ne cambierebbe il comportamento.

## Contratto da realizzare

1. **Geometria locale esplicita:** mantenere curve normalizzate e regole di riempimento già usate dalle maschere vettoriali, con un frame fisico in mm nel piano locale del testo, prima di dilatazione/inclinazione/rotazione. Non derivare il frame da `textBox.widthMm` o dal testo corrente. Una proprietà distinta evita di reinterpretare le maschere relative delle immagini già salvate.
2. **Modifiche del contenuto/font:** conservare il frame della maschera quando si digita, si cambia font/corpo o si modifica la larghezza di impaginazione. La maschera segue il centro grafico stabilito dai comandi dell'editor; non modifica l'altezza automatica o i ritorni a capo.
3. **Ridimensionamento geometrico:** applicare alla maschera la stessa trasformazione fisica dell'oggetto. Quando una scala viene assorbita nel corpo del font, scalare esplicitamente il frame locale; una modifica tipografica del corpo non è la stessa operazione. Coprire `transformObject`, `transformSelection`, ridimensionamento numerico e maniglie, inclusi Shift e ancoraggio opposto.
4. **Aggiornamenti Fabric:** `initDimensions` ricrea già il ritaglio del box fisso. Il nuovo livello deve ricostruire l'intersezione con le maschere del testo dopo ogni aggiornamento, senza perderle durante la digitazione e senza impilare wrapper SVG obsoleti. Riutilizzare la geometria/concatenazione dei clip già presente, distinguendo input relativo e locale fisico.
5. **Documento e controlli:** proprietà tipizzata/versionata, stessi comandi manuali/AI e cronologia, appunti e JSON, limiti geometrici e budget di segmenti condivisi. Verificare anche che i blocchi delle trasformazioni impediscano cambiamenti delle maschere; nessuna rimozione automatica da parte del cliente o dell'AI.
6. **Visibilità intenzionale:** maschera esplicita distinta dall'altezza automatica del box. Mostrare che il testo è mascherato e permettere di verificarne il contenuto; non nascondere testo inconsapevolmente dopo una modifica. Il controllo produttivo deve distinguere ingombri nominali da inchiostro effettivamente ritagliato: le prove sui 12 testi reali mostrano che il solo ingombro non basta. Non aggirare i controlli font considerando soltanto i caratteri visibili.
7. **Esportazione:** testo e stili rimangono editabili, clip vettoriali applicati a glifi e decorazioni, PNG/miniature coerenti e chiavi cache corrette. Nessun raster del testo per superare una maschera non supportata.

## Importazione e collaudo

- Trasformare la maschera dal piano locale originale al piano fisico del font, usando la decomposizione affine verificata. Non usare `mtx`, `clipBounds`, SVG memorizzati o `pathOffset` serializzati come autorità. Normalizzare i comandi legacy, compresi H/V, senza assumere che il parser 3 e quello attuale restituiscano lo stesso formato.
- Curve, fori e intersezioni conservati entro i budget. Maschere assolute, invertite, effetti o strutture ancora non rappresentabili devono restare rifiutati esplicitamente; nessuna condizione su nome/ID del template.
- Campione sintetico con maschera che taglia davvero e controllo negativo spostato, testo multiriga/stili locali, cambi di contenuto e font, font esatti, spostamento/rotazione, ridimensionamento numerico e trascinamento, gruppo, copia, Undo/Redo e riapertura. Verificare sia inchiostro ritagliato sia stato JSON.
- Confronto completo dei due cartelli con il runtime originale e i file font esatti, mantenendo maschere e tutti gli oggetti. La diagnosi precedente con maschera rimossa rimane soltanto una prova isolata dei glifi iniziali.
- Preparazione privata prima di qualsiasi salvataggio reale. L'archivio JSON è quasi pieno; l'attivazione della copia SQLite rimane soggetta al consenso già richiesto. Nessun deploy, modifica commerciale o sostituzione online.
