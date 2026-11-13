# Testo su tracciati con proprietà — 14 novembre 2026

Applicare un testo a un tracciato con label/proprietà o con `visible` esplicito causava il rifiuto dello schema geometrico stretto. Ora l’associazione conserva questi dati nel binding canonico `textPath.originalPathMetadata`, separati dalla geometria. I documenti precedenti senza metadati rimangono leggibili e non acquisiscono proprietà inventate. Non serve una migrazione dell’archivio.

Label, ordine, proprietà modulo, blocchi e visibilità originale tornano al tracciato quando viene separato dal testo. Le proprietà del testo rimangono distinte. La geometria ripristinata segue le trasformazioni attuali; non è una copia storica che annulla il lavoro successivo. Copia/incolla, ID scelto per la separazione, JSON e Undo/Redo usano gli stessi comandi revisionati della simulazione AI.

Il cliente non può consumare direttamente un percorso protetto da selezione, eliminazione, trasformazione o menu. L’amministratore può preparare l’associazione. Nei binding così preparati, il cliente non può riscrivere i metadati per aggirare i blocchi: trasformazioni e cancellazioni rispettano i vincoli del componente originale. Può cambiare il testo o farlo scorrere su un percorso bloccato mantenendo fermo il percorso. La separazione esplicita ripristina l’oggetto con i suoi vincoli.

## Riferimenti e produzione

Il tracciato marcato Riferimento non rende il testo non produttivo. Con «Mostra tracciato nel disegno» attivo, compare nell’editor e nelle tavole/miniature tecniche; rimane escluso da SVG, PNG, miniature e diagnostica produttivi. La visibilità originale serve al ripristino, mentre il controllo Mostra tracciato determina la visualizzazione durante l’associazione. L’ispettore spiega questa distinzione e mostra la label del percorso.

Il renderer conserva il layout completo e filtra solo la pittura. Rimuovere il tratto dal documento prima di misurare cambierebbe il riquadro e sposterebbe i glifi. Le proiezioni tecniche derivano un componente che dipinge solo il percorso, mantenendo font e geometria esatti; non duplicano il testo. Nel PDF il riferimento appartiene al livello superiore con stampa disattivata. Il file produttivo separato resta necessario: gli importatori SVG possono ignorare le regole CSS di stampa.

Il colore del riferimento non entra nella palette produttiva; la sua trasparenza non causa un falso rifiuto della grafica del timbro. I controlli sui caratteri e sulle pitture realmente produttive restano attivi. Le chiavi delle miniature ignorano label, ordine, blocchi e visibilità di ripristino; conservano i dati che influenzano il disegno e la separazione dei livelli. Nessun font del computer o sostitutivo viene usato, nemmeno per misurare un componente tecnico.

## Prove eseguite

- **1.327 unitari in 186 file**, inclusi 15 nuovi: proprietà, legacy, visibilità, ruoli, tentativi tramite updateObject, percorso bloccato, revisione, conflitto ID, copia, Undo/Redo, proiezioni, palette, timbri e chiavi cache.
- **35 browser pertinenti**: sette nuovi, sette regressioni PDF e 21 esistenti su testo su tracciato, trasparenze, stili, maniglie, trasformazioni e livelli tecnici. Le prove dell’associazione reale includono desktop 1440 px e telefono 390 px. Nessuna scrittura amministrativa o richiesta esterna nelle nuove prove interattive.
- Per linea ed ellisse inclinate/riflesse, SVG produttivo confrontato con la vista interattiva privata del solo tratto rosso tramite DOM; tavola tecnica confrontata con la vista completa. A 1000×700 px con campionamento 4×: zero pixel differenti oltre soglia 24 nello SVG produttivo; al massimo un pixel nel tecnico, errore medio massimo 0,0075 su 255 nei due test.
- PNG miniatura, miniatura tecnica e riquadro diagnostico confrontati con la vista Canvas alla stessa scala, neutralizzando soltanto la pittura del percorso nel riferimento produttivo: **pixel identici** per entrambi i casi. La prova usa la medesima griglia fisica, senza deformare il riferimento per arrotondare l’altezza.
- PDF verificati con qpdf, pdffonts, pdftotext e Poppler: Arimo incorporato, testo identico fra i due output senza duplicazione, zero pixel rossi nel produttivo e 1.808 nel tecnico; 350 pixel neri in entrambi. I due livelli di riferimento hanno `/PrintState /OFF`. Nessun errore di sintassi.
- **83 campioni** riaperti/esportati dal laboratorio, senza errori browser, richieste esterne o download dalla libreria reale; **13 regressioni pubbliche** passate. Build laboratorio/storefront/Worker TypeScript, schemi generati e scansioni segreti passati. Nessun deploy.
- Archivio locale letto senza modifiche: **SQLite R638, 346 template, due composizioni, 219 font (218 attivi), un profilo**. Gli automatismi usano fixture e archivi temporanei. La cancellazione locale preesistente di `output/pdf/editor-font-compressi.TEST.pdf` resta estranea alla consegna.

I log privati sono `.local/text-path-properties-*.log`; confronti/catture in `.local/text-path-properties-capture.json` e `.local/previews/editor-text-path-properties-*.png`, esaminati visivamente. I PDF temporanei della regressione di visibilità sono conservati sotto `.local/text-path-properties-pdf-visibility-regression`.

## Campione e collaudo umano

[JSON editabile](../fixtures/illustrator/text-path-properties.TEST.json), [SVG produttivo](../fixtures/illustrator/text-path-properties.TEST.svg), [SVG tecnico](../fixtures/illustrator/text-path-properties.technical.TEST.svg): 100×70 mm, Arimo OFL, testo sopra un’ellisse rossa inclinata e marcata Riferimento, con label e ordine distinti. Generatore: `node --import tsx scripts/capture-editor-text-path-properties.ts`.

Aprire il JSON nel laboratorio, verificare Mostra tracciato, scorrimento/scostamento e separazione: l’ellisse recupera label, ordine e visibilità. Lo SVG produttivo deve avere il solo testo; quello tecnico anche l’ellisse in un gruppo di riferimento separato. In Illustrator verificare posizione, misure, font e modificabilità dei glifi. **Collaudo Illustrator non eseguito**; non equivale a certificazione produttiva.

Prossimo incremento manuale: completare controlli delle giunzioni dei contorni e delle estremità sui tracciati a punti/Bézier, usando proprietà canoniche, misure e output condivisi. Rimane separato il lavoro sul renderer per ingrandire dettagli piccoli su fogli molto grandi. Nessuna nuova funzione multipagina, generazione immagini AI o integrazione commerciale in questo incremento.
