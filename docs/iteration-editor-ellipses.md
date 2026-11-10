# Ellissi vettoriali — piano locale

Incremento successivo alle primitive disegnabili: introdurre `ellipse` distinto da `circle`, con raggi X/Y positivi, rotazione e aspetto già comune alle forme. Aggiunta predefinita e disegno tra angoli opposti; Maiusc vincola a un cerchio senza cambiare tipo. Ispettore con larghezza/altezza e proporzioni opzionali, maniglie, gruppi e file JSON/SVG. Nessuna conversione dei cerchi o dei progetti precedenti.

Assunzioni: le misure nell’ispettore escludono il tratto; il riferimento di posizione resta il centro, x/y del documento restano l’ingombro storico usato da Fabric. Tratto invariato al ridimensionamento della singola ellisse, scalato nelle trasformazioni dell’insieme. Rischi da verificare: scala sui due assi, rotazione e centro stabile, contorno trasparente selezionabile solo sulla linea, riapertura, SVG e rifiuti atomici del validatore. Controllo di uscita dall’area da mantenere coerente con le altre forme.

## Implementazione e prime prove

Aggiunto `ellipse` nel documento v2 e nelle dimensioni di `transformObject`, raggi X/Y fino a 500 mm e rotazione. Cerchi precedenti invariati. Aggiunta predefinita centrata 8×4 mm e disegno fra angoli con Maiusc circolare. Ispettore live con dimensioni, proporzioni, centro, angolo, riempimento, contorno e livelli; selezione/gruppi/allineamenti/copia/undo riutilizzati. Le maniglie laterali cambiano un solo asse e conservano lo spessore. Il parser v1 rimane stretto.

L’intersezione con l’area rettangolare o tonda calcola la distanza alla curva effettiva dell’ellisse ruotata, includendo metà tratto; non basta sovrapporre il riquadro alla pagina. Questo evita che gli angoli vuoti del riquadro impediscano di mostrare il cestino. Per il cambio prodotto resta il controllo conservativo del riquadro e del margine TEST.

**285 unitari** e **5 browser mirati** superati; TypeScript e schemi aggiornati. Provati raggi/angoli invalidi, revisione obsoleta e redo preservato, differenza tra curva e riquadro, aree tonde, UI/AI simulata, copia e gruppi, proporzioni, maniglie, interno trasparente, disegno diretto, JSON e SVG `<ellipse>`. **`npm run check` completo superato: 285 unitari, 86 browser laboratorio, build e controllo segreti.** Campione `ellipses.TEST.json/svg` e anteprime generabili con `npm run capture:selection -- --ellipses`; Illustrator da collaudare.

Stato: incremento verificato. Anteprima desktop ispezionata; mobile generata. Nessun deploy, nuove dipendenze o servizio esterno.
