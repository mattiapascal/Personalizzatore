# Più immagini nello stesso progetto — 12 novembre 2026

## Risultato e limiti

Il limite iniziale di quattro immagini è sostituito da **32 posizionamenti** per documento. Manuale, appunti, AI simulata, JSON e archivio locale usano lo stesso validatore canonico; un comando non valido conserva documento e cronologia. Originali, ID, parametri dei filtri e ritagli restano separati per oggetto.

Rimangono **20.000.000 byte, 24.000.000 pixel e 12000 pixel per lato** per ogni file PNG/JPEG. Il documento ha inoltre tre budget complessivi, derivati dalla capacità precedente di quattro originali a dimensione massima:

| Risorsa | Massimo | Conteggio |
|---|---:|---|
| Pixel originali | 96 milioni | Una volta per contenuto incorporato esattamente identico, anche con ID diversi |
| Pixel delle elaborazioni | 96 milioni | Per ogni posizionamento elaborato; modalità originale esclusa |
| Byte originali incorporati | 80.000.000 | Ogni copia presente nel JSON, anche se identica |

Il budget dei derivati è prudente: la rimozione di una voce dalla cache dei filtri non libera una bitmap ancora usata da un oggetto Fabric. Il riuso della stessa elaborazione può quindi consumare meno del budget dichiarato. Gli originali identici continuano a essere preparati una volta sola e le decodifiche sono serializzate.

Non cambia il tetto **120 MB per JSON** o **512 MiB per archivio locale**. Non si tratta di una garanzia sul picco di memoria dell’intero processo: cronologia, risorse preparate in precedenza, esportazione e più documenti richiedono ancora misure su dispositivi reali. Nessuna migrazione dei dati, riduzione automatica dei file o nuovo import nell’archivio personale in questo incremento.

## Verifiche concluse

- Sei nuove prove unitari: confine 32/33 con manuale/AI e Undo/Redo, condivisione esatta dei contenuti, collisioni degli ID, confini indipendenti dei tre budget, PNG validi da 24 MP e copie elaborate, salvataggio/riapertura e rifiuto atomico su archivio temporaneo. Aggiornato il precedente confine degli appunti.
- Due scenari browser mirati passati: 31 incolla successivi fino a 32 immagini e rifiuto della successiva; scena con 32 immagini, geometria dall’ispettore, AI, Undo/Redo, JSON riaperto e SVG con 32 elementi immagine. Il rifiuto non cambia revisione o grafica.
- Campione `multi-image`: 32 posizionamenti, 16 ID risorsa e otto originali esatti; modalità originale, monocolore con tinta/alpha, retino, crop frazionari, rotazioni e riflessioni. Preparati otto originali condivisi. Confronto geometrico Canvas2D → SVG: rapporto pixel differenti **0,00341998**, errore medio **0,0919683/255**; soglie preesistenti 0,03 e 2/255. Il riferimento ricostruisce indipendentemente posizioni e crop; usa il motore dei filtri già collaudato per le bitmap, quindi non è una nuova verifica indipendente degli algoritmi di filtro.
- **45 campioni** riaperti ed esportati senza errori browser o richieste esterne. Screenshot desktop e mobile ispezionati. Illustrator non collaudato.

La prima cattura mobile leggeva lo stato prima dell’effetto del breakpoint e riapriva involontariamente il pannello strumenti: il generatore ora attende la chiusura automatica prima della schermata. Nessuna modifica applicativa per questo problema del collaudo.

## Regressione completa

`npm run check:release` concluso con esito positivo (sessione `80094`, exit 0): **863 unitari / 128 file**, **545/545 browser laboratorio in 24,3 minuti**, **13/13 browser pubblici locali**, build laboratorio/pubblico, preparazione Worker con `--dry-run`, runtime Workers/SQLite e scansioni segreti. Anche gli schemi sono stati rigenerati e controllati. Nessuna modifica applicativa, ai test o all’archivio durante l’esecuzione. È una nuova suite completa verde, successiva ai controlli selettivi degli incrementi precedenti.

Il bundle pubblico rimane `index-BG2r_x-8.js`, CSS `index-L8Ls1asZ.css`; nessun deploy. Archivio e media invariati per SHA-256 rispetto all’inizio delle prove: revisione archivio 543 e media 1051.

Log privati `.local/image-capacity-*.log`, report e schermate `.local/multi-image-capture/`. Archivio iniziale revisione 543, 259 template/due composizioni/219 font; media revisione 1051. Nessuna pubblicazione o modifica Shopify, tema, PitchPrint, BSS, prezzi, carrello, checkout o chat online.

## Prossimo controllo dei sorgenti

Dieci snapshot a pagina singola della categoria «Classe energetica» (A1–A4, B–G) contengono cinque immagini. Il vecchio numero massimo non è più un vincolo, ma ciò **non certifica la convertibilità**: originali, font, maschere, vettori e confronto completo devono essere verificati prima del salvataggio. Gli snapshot e l’archivio reale rimangono invariati; nessuna associazione commerciale viene dedotta dalla sola categoria.

## Campione ripetibile

Con server locale attivo:

```sh
node --import tsx scripts/capture-editor-multi-images.ts
node --import tsx scripts/verify-editor-artifacts.ts
```

Il generatore usa dati TEST e intercetta le operazioni amministrative. Produce `fixtures/illustrator/multi-image.source.TEST.json`, `multi-image.TEST.json` e `multi-image.TEST.svg`, tavola **160 × 100 mm**. In Illustrator verificare misure, tutti i 32 posizionamenti, crop, rotazioni, riflessioni, tinte e trasparenze; il JSON deve conservare gli originali. Nessun collaudo Illustrator o produttivo dichiarato.
