# Giustificazione parole/lettere — 9 novembre 2026

Richiesta del titolare: parole minimo 80%, desiderato 100%, massimo 133%; lettere minimo 0%, desiderato 15%, massimo 30%. Valori aggiuntivi a spaziatura/crenature esistenti; nessuna modifica dei glifi o del corpo per giustificare.

Riferimento delle percentuali: larghezza dello spazio normale nel font applicato. [Documentazione ufficiale Adobe](https://helpx.adobe.com/incopy/desktop/format-text/paragraph-formatting/text-composition.html): 100% parole è lo spazio normale, 0% lettere nessuna aggiunta, 100% lettere aggiunge uno spazio intero. Si mantiene distinto l’allargamento del glifo dalla spaziatura.

Piano locale: parametri opzionali serializzati nel box, con ordinamento minimo ≤ desiderato ≤ massimo validato. Calcolare larghezza minima/desiderata/massima partendo dagli avanzamenti originali, che includono già tracking/crenature. Interpolare dai minimi ai desiderati o dai desiderati ai massimi per raggiungere la misura del box. Gli spazi variano solo tra parole; le aggiunte tra lettere solo tra due caratteri non bianchi adiacenti, con la misura dello spazio del loro font. Font/stili misti rispettati. Distribuzione di una singola riga, senza compositore ottimizzante sull’intero paragrafo.

Se la riga non può riempire il box entro i massimi, resta corta: non eccedere silenziosamente i limiti. Analogamente non comprimere oltre i minimi. Segnalazione non bloccante nell’ispettore. JSON conserva impostazioni e testo originale, SVG/PNG usano gli stessi avanzamenti; Undo e comandi UI/AI invariati. Testare anche la parola singola, range uguali, rifiuti, righe locali/globali, testo dilatato e misure reali. Illustrator da collaudare.
