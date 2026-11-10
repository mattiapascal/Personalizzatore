# Linee vettoriali — 8 novembre 2026

## Piano

Aggiungere il tipo linea al documento e ai comandi di trasformazione, senza codice SVG arbitrario: lunghezza in mm, rotazione, colore/spessore e tratteggio del profilo TEST. Pulsante grafico Aggiungi linea, ispettore live e maniglie per la lunghezza. Riutilizzare copia/elimina, gruppi, trasformazioni uniformi, allineamenti, guide e tastiera. JSON riapribile e SVG con linea vettoriale; v1 rimane stretto e golden storico preservato.

Assunzioni: estremità arrotondate, sola linea visibile (nessun riempimento o contorno disattivato), profilo TEST nero/bianco e spessore positivo fino a 2 mm. Il ridimensionamento della singola linea conserva lo spessore; scalare un gruppo scala anche il tratto, come già implementato. Disegno a mano libera, editing dei nodi e frecce alle estremità sono incrementi separati.

## Implementazione e risultati

Aggiunto `line` al documento v2 e alle dimensioni di `transformObject`: lunghezza positiva fino a 1000 mm, rotazione, spessore positivo fino a 2 mm, nero/bianco, tratteggio e cap arrotondati. Niente riempimento o tratto disattivato. L’ispettore offre lunghezza, posizione centrale, rotazione e contorno; le maniglie laterali cambiano la lunghezza mantenendo lo spessore. Copia, gruppi, trasformazione uniforme dell’insieme, guide e tastiera riutilizzano i comandi comuni. Il parser v1 non accetta la nuova primitiva.

`npm run check` superato con **270 unitari, build, controllo segreti e 77 browser laboratorio**. Verificati modifiche live, freccine del tratto, SVG `<line>`, JSON, copia, maniglie, rotazione e storico. Golden storico e geometrie dei tipi precedenti preservati. `npm run schemas` aggiornato.

`npm run capture:selection -- --lines` genera `lines.TEST.json/svg` per il formato fixture 4913 da 58×22 mm e anteprime desktop/mobile. Campione con regola orizzontale 38 mm/spessore 0,3 mm e verticale 6 mm/spessore 0,2 mm tratteggiata, insieme a testo/forme. Illustrator non collaudato. Il disegno diretto è descritto sotto.

## Disegno diretto di linee, rettangoli e cerchi

Tre icone dedicate nel pannello Oggetti. Linea: trascinare tra le estremità, Maiusc vincola a multipli di 45°. Rettangolo: trascinare tra due angoli opposti, Maiusc rende i lati uguali. Cerchio: trascinare dal centro alla circonferenza. Alt sospende gli agganci; Esc annulla lo strumento o il gesto conservando documento e revisioni, anche nella vista espansa. Al rilascio si torna alla selezione con la nuova forma selezionata. Un clic o un gesto inferiore a due pixel visibili non crea un oggetto; per il rettangolo la soglia riguarda entrambi i lati.

`PrimitiveDrawingController` conserva solo un’anteprima transitoria, esclusa dall’export, e consegna al rilascio un solo `addObject` con la revisione iniziale. `primitiveFromEndpoints` converte i punti alle coordinate canoniche che comprendono lo spessore. Lo stesso renderer visualizza anteprima e risultato; il validatore del documento decide se accettare il comando. Durante il gesto sono sospesi ispettore, cambio formato, file e zoom. Nessun salvataggio intermedio o percorso privilegiato rispetto ai comandi AI simulati.

Verifica mirata: **277 unitari** e **5 browser sul disegno diretto** superati. Provati entrambi i quadranti, centro/raggio, quadrato, vincolo angolare, clic degenere, Esc, revisione unica, selezione e undo. Suite completa `npm run check` superata: **277 unitari, build, controllo segreti e 82 browser laboratorio**. Anteprime desktop/mobile rigenerate e ispezionate. Corretto anche il riuso del documento iniziale durante l’avvio: il suo UUID non cambia quando viene creato lo store.
