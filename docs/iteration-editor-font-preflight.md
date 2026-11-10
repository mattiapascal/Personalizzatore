# Controllo dei font incorporati — 9 novembre 2026

> Aggiornamento successivo: [analisi dei WOFF2 singoli supportati](iteration-editor-imprint-woff2.md) e [amministrazione della libreria](iteration-editor-font-administration.md). I limiti WOFF2 di questo checkpoint sono storici; collezioni, mappe non supportate, font di sistema e shaping restano da completare.

## Comportamento disponibile

L’editor segnala i caratteri che non sono presenti nei file font del progetto, rispettando il font di ciascuna porzione di testo. Il pannello **Font del progetto** compare solo quando sono usati font incorporati. Non cambia testo, font, posizione o revisione; il cliente può continuare a correggere la bozza.

Nel flusso locale `/editor?workspace=1&configurations=1`, **Controlla e aggiungi** / **Controlla le modifiche** verificano i font prima dell’anteprima di conferma. Un carattere mancante o un grassetto/corsivo simulato su un font incorporato impediscono la conferma e indicano come correggere. Il controllo viene ripetuto dal backend Vite per aggiunta e sostituzione, anche se una richiesta evita la UI. Un rifiuto non modifica le righe o le configurazioni già salvate.

La bozza JSON, l’archivio di lavoro e l’esportazione SVG restano disponibili per correzione e verifica; questo controllo non è una nuova certificazione produttiva degli export. Il motore dei comandi grafici conserva gli stessi schemi: l’analisi è derivata dall’unico documento usato da manuale e simulazione AI. Eventuali stili simulati già presenti restano modificabili e vengono bloccati al momento della conferma locale, non cancellati durante l’importazione.

## Implementazione

- `src/editor/font-cmap.ts`: lettura limitata delle mappe Unicode OpenType formato 4 e 12; esclusione del glyph ID 0, rispetto dei buchi e dei caratteri oltre il piano BMP. Mappa sconosciuta/corrotta non significa copertura universale.
- `src/editor/font-preflight.ts`: analisi degli esatti file incorporati TTF/OTF e WOFF, con decompressione WOFF limitata a 1 MB per tabella; cache limitata. Gli intervalli di copertura non sono forniti dal client come metadati attendibili. Stessa funzione in browser e API locale.
- Gli indici dei caratteri seguono Unicode come gli stili del documento. Gli accenti canonicamente equivalenti vengono controllati senza riscrivere il testo; le porzioni con font differenti non vengono unite. Nessuna normalizzazione di compatibilità che cambi simboli o significato.
- `FontCheckPanel.tsx`: risultato legato al documento corrente; una risposta asincrona vecchia non sostituisce quella della nuova revisione. Il riepilogo di conferma conserva le eventuali avvertenze di copertura sconosciuta.
- `scripts/font-coverage.ts` riutilizza ora il parser Unicode condiviso, mantenendo la lettura delle tabelle Node già disponibile.

Nessun nuovo pacchetto, rete o servizio AI. Nessun testo cliente inviato per questi controlli.

## Limiti espliciti

WOFF2 e mappe Unicode non supportate rimangono **non verificabili**, con avviso; non vengono dichiarate corrette o bloccate arbitrariamente. I sette font di sistema continuano ad avere il controllo di disponibilità già esistente, senza un’analisi completa dei relativi file. La mappa nominale dei caratteri non certifica shaping, ligature contestuali, sequenze di variazione, geometria dei glifi o compatibilità Illustrator. Caratteri di controllo della formattazione e selettori di variazione non sono trattati come glifi visibili mancanti.

La scelta delle varianti reali rimane quella del menu dell’ispettore. Gli assi dei font variabili, la gestione remota di risorse/licenze e il collaudo della filiera produttiva sono attività successive. Nessuna modifica ai profili TEST o ai vincoli reali delle lavorazioni in questo incremento.

## Prove

- Unit test su font reale di simboli, caratteri mancanti, glifi Unicode estesi, selezioni parziali, accenti equivalenti, WOFF compresso/limiti, formato sconosciuto e stile simulato.
- API locale: richiesta diretta con caratteri mancanti rifiutata senza scritture; sostituzione con stile simulato rifiutata conservando il carrello.
- Browser: avviso del carattere assente, blocco della conferma, correzione sul solo carattere interessato e successiva aggiunta; stile simulato segnalato senza distruggere la bozza.
- Prova in sola lettura del font OTF già nella libreria personale, con campione fisso `TEST · Città ÀÈÉÌÒÙ 0123456789`: caratteri presenti, nessun problema rilevato. Nessun contenuto cliente usato nella prova e nessuna modifica all’archivio.
- Log e checkpoint completi in [editor-local-status.md](editor-local-status.md). Anteprime private `.local/previews/editor-font-preflight-{warning,block}.png`.

Fonti tecniche consultate: [OpenType cmap](https://learn.microsoft.com/en-us/typography/opentype/spec/cmap) e [Unicode Normalization Forms](https://unicode.org/reports/tr15/). Non sono istruzioni di prodotto né conferme di collaudo.

Nessun deploy o modifica a Shopify/BSS/PitchPrint. Illustrator non collaudato.
