# QR locali — piano del 14 novembre 2026

Incremento manuale della matrice PitchPrint, dopo `280a53d`. Un oggetto canonico dedicato `qr`, con contenuto testo/URL, codifica `qr-v1`, ECC richiesto e frame fisico quadrato. Encoder Nayuki MIT fissato per commit/impronta e adattato soltanto per ESM/controlli TypeScript del vendor/licenza; jsQR 1.4.0 è soltanto un lettore indipendente di test. Nessun servizio esterno o AI.

- Bianco/nero, bordo bianco di quattro moduli, stessa resa Canvas/SVG/PNG/miniature e strumenti produttivi. Payload UTF-8 con ECI; contenuti e complessità limitati, anche nel budget vettoriale complessivo. Nessun tracciato modificabile che possa divergere dal payload. Cache derivata limitata, dati e ID canonici stabili.
- Dialogo di inserimento, icona Strumenti, scheda QR nell’ispettore con modifiche live e rifiuto dei dati errati. Geometria dal centro e maniglie proporzionali dall’angolo opposto, spostamento/rotazione, livelli, gruppi, appunti, archivi e Undo/Redo. Vietare deformazioni/riflessioni e stili che rompano il contrasto, anche da comandi AI; non saltare membri incompatibili.
- Lettore indipendente su matrici e output reali, Unicode/URL/testo, ECC, quiet zone, contenuto modificato e dimensioni, native handles, gruppi/appunti, JSON/SQLite isolato, no rete esterna. La prova digitale non certifica supporto/lavorazione fisica o lettura da ogni dispositivo.
- Campione portabile JSON/SVG, catture desktop/telefono, schemi, unitari e regressioni browser pertinenti, build e chat pubblica, scansioni segreti, censimento reale in sola lettura; poi commit e push autorizzati.

Preservare chat pubblicata e dati personali. Nessun deploy, migrazione, nuovo multipagina o modifica a negozio/tema/PitchPrint/BSS/prezzi/carrello/checkout. Il PDF cancellato preesistente resta escluso.
