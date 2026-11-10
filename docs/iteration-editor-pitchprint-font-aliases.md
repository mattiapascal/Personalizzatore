# Alias dei font PitchPrint — incremento locale

## Contratto e piano

Il catalogo originale collega un nome CSS PitchPrint, peso e stile a un file con SHA-256. Alcuni nomi CSS sono alias che non compaiono nei nomi interni del file. Il confronto del solo nome blocca questi casi, pur disponendo del file originale.

1. Conservare la ricerca esatta nella libreria installata e il rifiuto dei casi ambigui.
2. Quando serve il vecchio catalogo, verificare voce univoca, percorso confinato, dimensione, firma del formato, SHA-256 e peso/corsivo effettivi. Il nome interno può differire solo grazie al collegamento esplicito del catalogo. Nessuna ricerca per somiglianza.
3. Restituire al convertitore una risoluzione tipizzata con richiesta originale, font canonico e prova del file. Il browser ricontrolla richiesta/hash/peso/stile e conserva l’avviso di alias nel resoconto.
4. Riutilizzare un font installato soltanto quando i byte coincidono con l’originale verificato. Non equiparare file diversi basandosi sui nomi: i DIN caricati e quelli del vecchio archivio hanno differenze anche nelle metriche e nelle tabelle OpenType.
5. Verificare con fixture TEST e analisi reale in sola lettura. Non salvare template o cambiare la libreria personale per il solo riconoscimento degli alias.

## Limiti concordati

Questa fase non corregge i pesi né sintetizza grassetti/corsivi. Nexa Bold dichiarato 400 con file 700 resta da verificare; Gloria Hallelujah richiesto 700 con il solo file 400 resta bloccato. File mancanti/cambiati, hash errati, metadati illeggibili e strutture native non supportate restano errori espliciti. Nessun deploy, nuovo servizio, font simile o installazione automatica di font commerciali.

Il documento grafico resta unico: usa gli stessi FontAsset e gli stessi comandi validati di manuale/AI. La prova di risoluzione appartiene all’importazione e ai suoi avvisi, non crea uno stato grafico parallelo. L’anteprima richiede sempre il controllo amministrativo; non è un collaudo Illustrator.

Evidenze e risultati saranno riportati al termine dell’incremento.

## Implementazione e contratto

`/font` restituisce ora `PitchprintFontResolution`: richiesta originale, `FontAsset` canonico e prova `file-metadata` oppure `original-catalog`. [Schema JSON](schemas/PitchprintFontResolution.json). Peso/corsivo effettivi sono obbligatori; il convertitore verifica di nuovo richiesta, hash dei byte e coerenza della prova. Le callback storiche che forniscono direttamente un FontAsset restano supportate soltanto quando famiglia/peso/stile corrispondono; un font diverso richiede la prova del catalogo.

La ricerca originale è confinata nella cartella dei font, con catalogo entro 8 MB, file entro 1 MB, voce/variante univoca, SHA-256 e formato verificati. Errori di file mancante o permessi non espongono percorsi privati al frontend. URL con credenziali o parametri non vengono riportati come fonte. Non vengono modificati nomi, metriche o programmi dei font originali.

I nomi effettivi Unicode non vengono più ridotti ai soli caratteri ASCII: due nomi non latini differenti non possono diventare la stessa identità vuota. Per i vecchi record amministrativi senza peso/stile, la ricerca legge i valori del file, senza attribuire implicitamente il peso 400.

L’avviso di alias rimane nel resoconto e il menu delle varianti indica **originale del template**, così il file storico è distinguibile da una versione caricata più recentemente. Versioni differenti restano risorse distinte; la scelta automatica fra varianti ambigue resta bloccata. Il salvataggio incorpora il FontAsset, senza serializzare la risposta di risoluzione come un secondo documento.

## Riscontri reali

Confronto controllato fra il codice precedente (`4e8a958`) e quello nuovo sulla **stessa copia temporanea della libreria**: 83 requisiti dei template a pagina singola, **63 risolvibili prima, 70 dopo, nessun caso perso**. Recuperati DIN Pro Cond 400 normale, DIN Pro Regular 400 normale, HelveticaNeueLT Std Cn 400 corsivo e 700 normale, ITC Eras Std Medium 700 normale, Myriad Pro Cond 700 normale, Times New Roman MT Std Cond 700 normale. Tutti con file originali verificati, non nomi simili.

Analisi browser aggiornata dei 370 sorgenti a pagina singola: **93 convertibili e 277 bloccati**, con opzioni TEST esplicite nero/bianco e sfondo/materiale escluso. Zero errori browser, zero scritture amministrative e file/progetti/impostazioni del titolare invariati durante la prova. Il primo tentativo della sonda era scaduto attendendo il caricamento iniziale dei sorgenti; aumentata l’attesa della sola sonda, senza cambiare i dati o avviare un’altra importazione. La seconda prova è terminata.

La disponibilità del file storico per una conversione non equivale alla sua installazione nella libreria globale: il ricontrollo della lista manuale resta distinto. Nessun nuovo font installato e nessun template salvato nell’archivio reale.

Log privati: `.local/editor-font-alias-controlled-comparison.log`, `.local/font-alias-controlled-comparison.json`, `.local/editor-font-alias-real-analysis-final.log`, `.local/pitchprint-migration/mass-analysis.TEST.report.json`. Test mirati iniziali: sette browser passati (inclusi prova alterata, salvataggio del font portabile e regressioni massive). Controllo completo e conteggi nello [stato locale](editor-local-status.md).

## Seguito individuato dal censimento

82 dei 370 design contengono gruppi: 243 gruppi fino a tre livelli, 9 con scala non uniforme e 10 con riflessioni; diversi hanno etichette o proprietà editoriali. Questo è un blocco dell’importazione di composizioni esistenti, non una richiesta di nuovi strumenti grafici avanzati. Un incremento successivo dovrà conservare trasformazioni e proprietà rappresentabili nel modello canonico, segnalando i casi non rappresentabili; non basta scartare il contenitore o sommare le coordinate. Censimento in `.local/native-groups-audit.json`.


## Facce esatte negli SVG e campione riproducibile

Le risorse canoniche mantengono il nome PostScript della faccia (oppure il nome completo quando quello PostScript manca), distinto dal raggruppamento amministrativo. La prova dei metadati conserva i nomi effettivamente letti nel file: un raggruppamento personalizzato non cambia l’identità del carattere. Le liste di fallback SVG includono la faccia esatta sia negli attributi `font-family` sia negli stili inline dei singoli caratteri. Questo conserva informazioni necessarie ai programmi che non usano il font incorporato; non è una certificazione Illustrator.

Campione [JSON](../fixtures/illustrator/pitchprint-font-alias.TEST.json) e [SVG](../fixtures/illustrator/pitchprint-font-alias.TEST.svg), 100 × 40 mm, tre elementi, un file ABeeZee incorporato con licenza OFL conservata. Fonte nativa sintetica in cm, con ingombri testuali volutamente obsoleti; nessun dato cliente. Script `node --import tsx scripts/capture-editor-pitchprint-font-alias.ts`: catalogo e libreria TEST temporanei, importazione tipizzata, comandi manuali e AI simulata, Undo/Redo, verifica di tutti i glifi e font invariato. Anteprima ispezionata: `.local/previews/editor-pitchprint-font-alias.png`.

La verifica dei campioni riapre ora anche questo documento e confronta gli esatti FontAsset, oltre a oggetti e gruppi, prima di riesportare con le dimensioni fisiche salvate. I 19 campioni passano senza errori browser o richieste esterne.

Prima del perfezionamento dei metadati SVG: `npm run check` interamente passato con 598 unitari / 85 file, build, segreti e 351 browser. Sul codice successivo: 600 unitari / 85 file, build/segreti e otto prove browser pertinenti passate, incluso il nuovo caso SVG sugli stili dei caratteri; 13 regressioni pubbliche passate. Il nuovo totale dei casi browser è 352: non viene dichiarata una seconda suite completa che non è stata eseguita. Log `.local/editor-font-alias-complete-check.log`, `.local/editor-font-face-final-unit.log`, `.local/editor-font-face-browser.log`, `.local/editor-font-alias-public.log`, `.local/editor-font-alias-artifacts-final.log`.

Il confronto controllato è stato ripetuto dopo le modifiche del titolare alla libreria: 63 → 70 requisiti risolvibili sulla medesima copia; la prima fotografia dava 64 → 71. In entrambi i casi sette recuperati e nessuno perso. L’analisi reale finale resta 93/370 convertibili con gli stessi vincoli TEST, senza modificare l’archivio personale.
