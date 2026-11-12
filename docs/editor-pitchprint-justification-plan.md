# Prossimo incremento: giustificazione importata — 12 novembre 2026

**Aggiornamento:** capacità generale implementata e verifiche pertinenti passate; [risultati e limiti attuali](iteration-editor-pitchprint-justification.md). Sotto resta il piano iniziale. Controlli e primo salvataggio completati: 270 template locali. Suite generale 565/566, campione SVG aggiornato e ricontrollato; 46 regressioni pertinenti finali e 13 pubbliche passate. Preparazione dei tre candidati bloccati distinta dall’importazione.

## Evidenza corrente

Quattro sorgenti a pagina singola e priorità normale, non presenti nell’archivio, dichiarano `textAlign: justify`:

- Timbro per scheda fornitura professionale.
- Timbro per fatturazione di libero professionista.
- 25x45 con stemmaa.
- 25x45 senza stemma.

ID e snapshot effettivi nel rapporto privato `.local/pitchprint-migration/remaining-current-audit.json`. Sono candidati al recupero, non quattro conversioni già dimostrate: possono emergere altri blocchi prima o dopo l’allineamento.

`pitchprint-import.ts` accetta attualmente soltanto left/center/right. Il documento e l’editor manuale possiedono già la giustificazione tipografica, gli allineamenti per riga, il box a larghezza fissa e i comandi validati. Riutilizzare questi componenti.

## Differenza da rappresentare

La giustificazione originale Fabric/PitchPrint distribuisce spazio aggiuntivo in parti uguali fra gli spazi della riga, anche sull’ultima riga con il valore `justify`. L’impostazione predefinita del nuovo editor distribuisce invece parole e lettere con i valori concordati dal titolare e lascia l’ultima riga del paragrafo a sinistra.

Controllato nel codice `enlargeSpaces` della copia locale Fabric 3.4.0, `.local/fabric-3.4.0-full-reference.js`: incremento `(this.width - currentLineWidth) / numberOfSpaces`, applicato soltanto quando la riga è più corta e contiene spazi/tab. Il metodo nativo installato di Fabric conserva lo stesso criterio. Il confronto strumentale dei nuovi casi rimane da eseguire.

Cambiare soltanto la stringa dell’allineamento non conserva il sorgente. Anche impostare a zero la spaziatura fra lettere non è una dimostrazione sufficiente: gli spazi con stili/font diversi hanno larghezze diverse e il limite percentuale attuale può impedire la dilatazione originale. Occorre prima verificare questo comportamento con un riferimento nativo e casi sintetici.

## Incremento concreto da realizzare

1. Aggiungere alle impostazioni canoniche di giustificazione una distribuzione esplicita fra soli spazi e la scelta dell’ultima riga, mantenendo invariati i predefiniti tipografici concordati. Schema, comandi manuali/AI, JSON e archivio devono condividere il contratto; nessuno stato grafico parallelo.
2. Riutilizzare `EditorTextBox` per misure, cursore, selezione, SVG e stili locali. Il modo originale deve distribuire incrementi uguali sui singoli spazi, preservando tracking e crenatura; righe prive di spazi non devono acquistare spaziatura artificiale fra lettere. Non congelare le posizioni in una lista di correzioni precalcolate che perderebbe il comportamento durante la scrittura.
3. Rendere queste impostazioni comprensibili nell’ispettore, almeno per i box importati, e consentire il passaggio alla giustificazione tipografica abituale con i medesimi comandi. Conservare allineamenti espliciti delle altre righe. Il comportamento di nuove righe e del cursore deve restare coerente dopo l’importazione.
4. Importare `justify` con box coerente, conservando larghezza, origine, font, stili, contorni e trasformazioni. L’eventuale gestione di altri valori legacy richiede casi verificati propri. Non convertirli implicitamente in left o center.
5. Prove native indipendenti: righe lunghe/corte e ultima riga, spazi multipli, riga senza spazi, stili/font/corpi misti, tracking, box ruotati, IText e Textbox. Verificare editing manuale, comandi AI simulati, Undo/Redo, JSON/SVG e un nuovo campione portabile. Poi controlli pertinenti sulle funzioni tipografiche e sulle importazioni.
6. Solo dopo la funzione generale, confrontare i quattro sorgenti interi con le soglie già in uso e controllare tutti gli originali/font. Eventuali salvataggi locali devono seguire lo stesso flusso con backup, provenienza, tag «Da verificare», colori conservati e nessuna sovrascrittura o associazione implicita.

Nessuna implementazione o nuova conversione dichiarata in questo piano. Restano esclusi multipagina, generazione immagini AI e interventi commerciali/online. I testi curvi mantengono priorità bassa.
