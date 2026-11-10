# Copia, taglia e incolla — 9 novembre 2026

## Piano iniziale

Appunti interni dell’editor, in memoria fino alla chiusura della pagina. Copiare una selezione cattura oggetti e gruppi interi, ordine dei livelli, stili di carattere, geometrie e sorgenti raster originali. Incollare crea ID oggetto/gruppo nuovi, riutilizza gli ID sorgente e mantiene le coordinate, senza spostamenti o deformazioni automatiche. Il legame prodotto del documento di destinazione resta quello corrente.

Un nuovo comando tipizzato `insertObjects` inserisce l’insieme in una sola revisione; schema, gruppi, limiti e intersezione con l’area vengono validati prima del commit. Manuale e simulazione AI usano questo comando. Risorse immagine preparate prima dell’inserimento con protezione da revisioni cambiate durante l’attesa. Un rifiuto conserva scena e redo.

Pulsanti a icona e Cmd/Ctrl+C/X/V solo quando non si sta scrivendo in un campo o nel testo del canvas. Nessun accesso agli appunti del sistema, nessuna lettura di contenuti esterni. La duplicazione esistente resta disponibile.

Prove previste: copia senza revisione; taglio/inserimento annullabili; selezione di un membro espansa al gruppo; stili e immagini ritagliate conservati; ID nuovi; limiti di oggetti/immagini e gruppi estranei respinti atomicamente; comandi obsoleti; import JSON/SVG; protezione della scrittura nei campi e del testo in editing. Solo laboratorio locale, nessun collegamento a un modello AI reale.

## Implementazione e prove mirate

Aggiunti `clipboard.ts`, comando `insertObjects`, tre icone e scorciatoie nel laboratorio. Nessuna persistenza o accesso agli appunti di sistema. L’inserimento rifiuta gruppi che comprendano oggetti già nel documento; i nuovi gruppi si riferiscono solo al blocco inserito. Il validatore finale applica limiti e invarianti comuni.

Cinque test unitari e tre browser mirati superati: gruppi/stili con nuovi ID, taglio e undo, PNG ritagliati/riflessi e limiti atomici, comando AI simulato, protezione dei campi/testo e svuotamento degli appunti al reload. TypeScript e rigenerazione schemi completati. Suite completa in esecuzione.

Nel controllo precedente del ritaglio: 327 unitari, build e segreti superati; 118/119 browser passati. Un test preesistente della chat inviava il secondo messaggio prima che la prima risposta fosse comparsa nel DOM. Aggiunta l’attesa esplicita della prima risposta nel solo test, poi il test mirato è passato. Nessun codice della chat modificato.


Regressione completa dopo clipboard: `npm run check` superato con **332 unitari, 122 browser laboratorio, build e controllo segreti**. Il test chat con attesa corretta è passato anche nella suite completa.
