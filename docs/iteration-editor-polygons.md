# Forme poligonali — piano locale

Riutilizzare il nuovo tracciato chiuso per triangolo, poligono regolare e stella, con comandi `addObject` validati e punti nel documento. Nessun nuovo stato Fabric o tipo di documento: dimensioni, angolo, contorno, riempimento, gruppi e storico sono quelli del tracciato. Forma inizialmente vuota e centrata nel formato, come le altre primitive. I parametri della costruzione servono soltanto a generare i nodi; non introdurre metadati di forma scollegati dai punti.

Primo incremento: tre pulsanti grafici per triangolo, pentagono e stella a cinque punte; il generatore deterministico ammette numero di lati/punte e rapporto dei raggi entro limiti espliciti per riuso futuro. Ispettore comune per modificarne geometria e aspetto. Testare simmetrie/vertici, errori, comandi/undo e output vettoriale. Editing interattivo dei nodi e Bézier restano successivi.

## Implementazione

Tre pulsanti Aggiungi triangolo/pentagono/stella producono tracciati chiusi centrati, con tratto 0,25 mm e nessun riempimento iniziale. Triangolo: 3 vertici; pentagono: 5 vertici; stella: 10 vertici alternati, raggio interno pari al 45% dell’esterno. Raggio di costruzione 4 mm; il riquadro effettivo segue i vertici. `polygon-geometry.ts` costruisce anche poligoni da 3 a 32 lati e stelle da 3 a 32 punte, con raggi/rapporto validati; i parametri aggiuntivi non sono ancora controlli UI.

I punti sono l’unico dato geometrico della forma: l’ispettore del tracciato modifica dimensioni, rotazione, chiusura, contorno e riempimento; nessun metadato duplicato del poligono. Comandi e vincoli comuni. **297 unitari** e **3 browser sulle forme** superati; TypeScript valido. **`npm run check` completo superato: 297 unitari, 94 browser laboratorio, build e controllo segreti.** Include il test del ridimensionamento del tracciato corretto per il solo confronto numerico floating point (14,000000000000002 mm). La precedente esecuzione aveva superato 90 browser su 91; il test corretto è ora passato anche isolato.

Stato: incremento verificato; campione `polygons.TEST.json/svg` generato con `npm run capture:selection -- --polygons` e anteprima desktop ispezionata. Illustrator da collaudare; nessuna modifica online.
