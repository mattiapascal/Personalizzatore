**Aggiornamento 11 novembre:** [ritagli frazionari e griglia filtri stabile](iteration-editor-fractional-crop.md) supera i riferimenti storici ai bordi interi e al filtraggio della sola porzione tagliata. I quattro bordi sono ora in mm; i filtri operano sui pixel originali completi, conservati sotto un clip SVG.

# Elaborazione raster locale — 9 novembre 2026

## Piano iniziale

Estendere la conversione PNG con luminosità e contrasto non distruttivi prima della soglia; aggiungere mezzitoni binari tramite matrice ordinata 4×4 o diffusione dell’errore. Il profilo TEST continua a esportare solo pixel bianchi/neri con alpha 0/255: non introdurre grigi nel file produttivo, servizi AI o rete.

Parametri opzionali, con valori assenti equivalenti alla conversione attuale. Originale, crop e scala fisica conservati. Metodi deterministici e cache che comprende tutti i parametri. I controlli restano nella scheda Immagine, con reset completo e spiegazione che la diffusione riproduce tonalità con puntini: la resa fisica del timbro richiede collaudo, nessuna certificazione automatica.

Prove: gradiente e campioni con trasparenza, estremi della soglia/luminosità/contrasto, ripetibilità, nessuna mutazione della sorgente, errori di dimensione; pixel reali nello SVG, JSON riaperto, undo/reset e comandi simulati comuni. Nessuna nuova dipendenza.

## Implementazione e verifiche mirate

`raster-processing.ts`: parametri opzionali `method`, `brightness`, `contrast`, con compatibilità dei progetti precedenti. Matrice Bayer 4×4 e diffusione con pesi 7/16, 3/16, 5/16, 1/16; due righe temporanee di errore, nessuna diffusione verso pixel completamente trasparenti. I pieni nero/bianco restano saturi. Luminosità additiva e contrasto simmetrico intorno al grigio medio, con clamp finale. Inversione e bianco trasparente agiscono dopo la quantizzazione.

Sette unitari aggiunti, suite unitaria completa **339 passati**. Tre browser mirati passati: campione medio a metà punti neri con pixel PNG realmente esportati nello SVG, effetti dei parametri, reset/undo, JSON dopo reload e comandi AI invalidi con redo conservato. Corrette l’etichetta accessibile del nuovo selettore e la lettura dello stato nel test dopo reload (pannello diagnostico chiuso).

Campione `raster-filters.TEST.json/svg` con `raster-gradient.TEST.png` generato da `node --import tsx scripts/capture-editor-raster.ts --filters`. Soglia 160, diffusione, luminosità +8, contrasto +20, bianco trasparente; PNG originale 160×80 conservato, immagine 24×12 mm. Anteprima desktop ispezionata. In una misura locale Node su 1 MP: soglia 20 ms, matrice 20 ms, diffusione 36 ms; misura indicativa del computer di sviluppo, non benchmark garantito sui dispositivi clienti.

Le 13 regressioni browser dell’interfaccia pubblica locale sono passate. Nessun codice pubblico modificato. Regressione completa del laboratorio da eseguire dopo il prossimo incremento export PNG. La prova produttiva dei mezzitoni/Illustrator resta manuale.


Regressione completa: `npm run check` superato con **344 unitari, 129 browser laboratorio, build e controllo segreti**. Anche le 13 regressioni pubbliche locali sono passate nella stessa sessione.
