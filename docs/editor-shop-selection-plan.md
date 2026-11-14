# Dal prodotto reale al documento — piano del 14 novembre 2026

Dopo `efc60fd`, aprire un primo percorso locale prodotto → variante → profilo → documento vuoto → salvataggio/riapertura. Segue le priorità del titolare senza nuove funzioni avanzate o deploy.

## Scelte tecniche

I campi storici `productId/variantId` del documento sono legati al catalogo delle montature timbro. Riutilizzarli per targhe a colori attiverebbe regole errate. Aggiungere invece `shopSelection` opzionale, per pagina, ancorata a ID/versione del profilo produttivo e alla variante selezionata. È un’estensione reversibile del JSON: i vecchi documenti rimangono validi, nessuna migrazione dell’archivio. Il profilo salvato resta immutato; non modificarne di nascosto area o associazioni conservando la stessa versione.

La scelta passa da un nuovo comando validato comune manuale/AI, con prodotto/variante ricontrollati nel contesto disponibile. La lettura del documento importato può essere offline; la modifica della scelta richiede un contesto aggiornato. Non è una certificazione produttiva o una verifica di disponibilità/prezzo.

## Primo percorso

- Ingresso dal pannello del prodotto reale; leggere le varianti e i profili locali con gli adattatori esistenti, senza nuove query Shopify.
- Proporre solo profili attivi associati al prodotto e varianti presenti nella lettura corrente. Misure fisse dal profilo, oppure misure esplicite per i profili «Misure della pagina». Nessuna analisi dei titoli per inventare dimensioni.
- Timbri: usare la sola variante primaria del profilo, scelta dall’amministratore; il cliente non seleziona il colore del corpo. Targhe/cartelli: varianti ammesse dal profilo, fissaggi secondo la famiglia. Non attribuire nomi di materiale da titoli simili.
- Prima di aprire, rileggere prodotto e profilo e rifiutare cambiamenti intervenuti dopo l’anteprima. Avviare un documento vuoto con l’area e le regole indicate, preservando la scelta nel JSON, nelle copie e nel riepilogo locale.
- Non offrire un prodotto di prova se la lettura o il profilo mancano. Mostrare cosa completare in amministrazione.

Questo incremento non completa cambio materiale durante il disegno, mappatura delle misure specifiche per variante, lettura dimensioni BSS, adattamento automatico dei template o acquisti. Queste parti seguiranno sullo stesso contratto. Collaudare i controlli mancanti, la concorrenza, ruoli, revisioni, Undo e campioni portatili prima della sincronizzazione GitHub.
