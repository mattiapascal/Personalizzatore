# Foglio, proprietà e modulo — piano del 14 novembre 2026

Dopo `8d73c2d`, consolidare le azioni immediate che cambiano la scena senza aggiungere contenuti: colore del foglio, rimozione sfondo, proprietà di oggetti/gruppi e testo del modulo. Mantenere stesso documento e comandi validati manuali/AI.

- Riprodurre prima le modifiche eseguite con un campo incompleto dell’ispettore. Controllo condiviso prima del comando, senza guardia ricorsiva dentro `act`. Una modifica valida precede il nuovo comando e mantiene un Undo distinto.
- I numeri di proprietà rifiutati devono tornare al valore effettivo; controlli e azioni non devono sottrarre prematuramente il fuoco al campo da correggere.
- Verificare il cambio scheda del singolo oggetto: non perdere un numero incompleto quando il controllo DOM viene smontato; mantenere la memoria della scheda e il fallback Geometria concordati.
- Il testo digitato nel modulo e non applicato deve rimanere visibile come pendente dopo modifiche geometriche estranee, senza sostituire il documento canonico o essere considerato salvato. Ripresa possibile dopo correzione, contesto documento/pagina distinto; testo centrato e selezione originale conservati.
- Prove desktop/telefono, mouse/tastiera, timer, gruppi e membri, manuale/AI, Undo/Redo e campioni JSON/SVG. API simulate e archivi TEST isolati; principale in sola lettura. Nessuna nuova funzione multipagina o immagini AI, nessun deploy o modifica commerciale/chat pubblicata.
- Profili, adattamento dei prodotti e altre azioni asincrone conservano i propri contratti e saranno verificati separatamente: non aggiornare revisioni catturate per comodità.
