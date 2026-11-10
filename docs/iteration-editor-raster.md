# Importazione raster locale — piano del primo incremento

Primo supporto per loghi PNG, conservando l’originale nel JSON e derivando localmente la versione bianco/nero del profilo TEST. Non usare servizi AI o URL remoti. JPEG, crop, filtri colore e SVG importato seguiranno separatamente; non dichiarare parità immagini completa con questo incremento.

Documento: nuovo oggetto `image`, sorgente PNG identificata da ID stabile e data URL originale, pixel dichiarati verificati, dimensioni fisiche, angolo e parametri di conversione (soglia, inversione, bianco trasparente). Copie riusano l’ID sorgente; lo stesso ID non può designare dati diversi. `updateObject` modifica geometria/parametri e conserva la sorgente. Importare/aggiungere risorse richiede preparazione e decodifica prima del comando; il misuratore comune rifiuta sorgenti non preparate, anche per comandi AI simulati. Un solo documento e nessuna scena parallela.

Limiti iniziali espliciti del laboratorio: PNG fino a 256.000 byte, 1.000.000 pixel totali, lato fino a 4096 pixel, massimo quattro oggetti immagine. Verificare firma/IHDR/dimensioni prima della decodifica; niente SVG mascherato da PNG o riferimenti esterni. File non validi e revisioni cambiate durante la preparazione devono lasciare scena/storico intatti. Durante la lettura/decodifica, sospendere gli strumenti e il cambio formato. Limiti JSON locali da aggiornare per riaprire i progetti con sorgenti incluse; nessuna modifica ai limiti dell’API pubblica.

Il renderer usa cache di risorse derivate e una copia della sorgente immutabile; lo storico deve evitare ricopie inutili delle stringhe base64. Conversione pixel locale: trasparenza originale piena conservata, alpha parziale composto su bianco prima della soglia, RGB finali soltanto 0/255 e alpha 0/255; il bianco può diventare trasparente. La sorgente originale mantiene colori/alpha nel JSON. SVG contiene un’immagine raster derivata, non una vettorializzazione. Proporzioni protette nei comandi e nei controlli; posizione centrale, rotazione, gruppi e storico riutilizzati. DPI effettivi informativi, nessuna soglia produttiva universale inventata.

Prove: campioni di pixel noti, PNG reali/ostili/troncati, risorse non preparate, file oltre limiti, comandi manuali/AI, copia e sorgente immutabile, modifiche della soglia e undo, dimensioni native/rotazione, JSON riapribile, SVG raster e nessuna richiesta esterna. Illustrator rimane da collaudare.

## Implementazione del 9 novembre 2026

Tipo `image` nel v2: sorgente PNG originale incorporata con ID, pixel, dimensioni mm/angolo e parametri binari. Massimo quattro immagini; rapporti geometrici protetti nel validatore, nell’ispettore e nelle maniglie uniformi anche con Maiusc. Copie/gruppi/storico riutilizzati; la sorgente di un’immagine esistente è immutabile, i dati diversi con lo stesso ID sono respinti. Clonazione di documento/oggetti copia i metadati senza ricodificare le stringhe base64.

L’importazione PNG, il JSON con immagini e i comandi AI simulati preparano le risorse prima del commit. `measureFabric` rifiuta sorgenti non preparate. La preparazione sospende canvas/strumenti/file/zoom/formato e confronta documento/revisione prima di applicare. Non esiste un ingresso AI privilegiato. JSON locale ora fino a **10 MB**, per i sorgenti inclusi; limiti API pubblici invariati.

Controlli secondo la [specifica PNG W3C](https://www.w3.org/TR/png-3/): firma, IHDR, profondità/colore, CRC dei chunk, struttura, fine file, limiti dimensionali e decompressione con conteggio righe/filtri, compreso Adam7. Un test ha mostrato che il decoder browser accetta un flusso danneggiato; la verifica zlib viene quindi eseguita prima e con volume limitato ai pixel dichiarati. PNG animati ed EXIF non supportati in questo primo incremento. La decodifica browser verifica infine le dimensioni reali.

Cache sorgenti decodificate locale e cache derivati limitata a otto canvas. Conversione da originale a ogni variazione, senza accumulare modifiche: soglia 0–255, inversione, bianco trasparente e ripristino. SVG con `<image>` contenente un PNG derivato a RGB/alpha 0 o 255; originale colorato/trasparente nel JSON. Nessuna vettorializzazione, profilo ICC/PDF o collaudo produttivo dichiarato. DPI effettivi informativi.

**323 unitari** e **6 browser PNG mirati** superati, TypeScript e schemi aggiornati. Verificati dati compressi/CRC, casi ostili, PNG indicizzato e interlacciato reali, byte originali/ID, pixel SVG effettivi, JSON dopo reload, selezione/scala/rotazione/copia, comandi AI e sorgente immutabile, undo, sospensione e revisione cambiata durante la preparazione. **Suite completa `npm run check` superata: 323 unitari, 116 browser laboratorio, build e controllo segreti.**

Campione generabile con `node --import tsx scripts/capture-editor-raster.ts`: `raster-source.TEST.png` di calibrazione 160×80 px, `raster.TEST.json/svg`, soglia 160 e bianco trasparente, immagine 24×12 mm. **Illustrator non collaudato.**

Stato: implementato, prove mirate superate; soltanto sviluppo locale.
