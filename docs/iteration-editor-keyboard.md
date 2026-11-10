# Tastiera dell’editor — 8 novembre 2026

## Piano

Aggiungere selezione totale, annulla/ripristina, duplicazione, raggruppamento/separazione, cancellazione e spostamenti fini mediante tastiera. Riutilizzare i comandi già validati, con una revisione per operazione. Frecce: 0,1 mm; Maiusc: 1 mm; Alt: 0,01 mm. Cmd/Ctrl per i comandi standard. Rendere il canvas focalizzabile.

Escludere scrittura del testo, campi numerici/testuali, select, composizione IME, comandi già gestiti dal pannello e contenuti esterni all’editor. Le freccine dello spessore devono continuare a usare il passo di 0,05 mm. Nessun aggancio implicito ai comandi da tastiera; il motore grafico resta l’autorità per limiti e gruppi. Non introdurre clipboard di sistema in questo incremento.

## Implementazione e prove

Handler limitato all’editor visibile e ai comandi non già gestiti. Canvas focalizzabile con etichetta accessibile. Comandi Cmd/Ctrl+A, D, G, Maiusc+G, Z, Maiusc+Z e Ctrl/Cmd+Y; Canc/Backspace; frecce con passi 0,1/1/0,01 mm. Le operazioni si appoggiano a selezione corrente, ID/revisione e comandi/store esistenti, senza manipolare una scena parallela o agganciare i valori alla griglia.

Tre test browser mirati superati: operazioni e storico, protezione dei campi numerici/testo e assenza di spostamenti quando il focus è fuori dall’editor. Provati anche gli agganci attivi durante i nudge (che restano liberi) e il passo 0,05 mm delle freccine del contorno. Le scorciatoie sono elencate in un dettaglio del pannello Oggetti. Nessuna modifica alla chat pubblica o al browser fuori dall’editor.


Regressione completa dopo entrambi gli incrementi: `npm run check` superato con **266 unitari, build, controllo segreti e 75 browser laboratorio**. Nessuna modifica ai file pubblici; nessuna pubblicazione.
