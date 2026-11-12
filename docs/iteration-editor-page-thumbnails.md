# Miniature delle pagine sotto il canvas — 12 novembre 2026

## Comportamento

La navigazione delle pagine ora si trova sotto il canvas: ogni miniatura mostra nome, numero e dimensioni fisiche della pagina. La pagina attiva è evidenziata in azzurro. Il menu a discesa a sinistra è stato rimosso, come richiesto. La striscia scorre orizzontalmente anche con gesture touch; frecce, Home ed End permettono di sfogliare le pagine da tastiera.

«Gestisci pagine», accanto alle miniature, raccoglie rinomina, aggiunta, duplicazione, riordino ed eliminazione con conferma. Il pannello si apre in sovrimpressione entro la finestra, si chiude con X, Escape o clic esterno e non sposta il canvas.

**Ogni pagina può avere dimensioni proprie.** Il modello lo supportava già: la nuova navigazione mantiene geometrie, formati e ordine, passando dallo stesso comando validato `selectPage` usato dal motore. Il cambio pagina non modifica il contenuto o lo stato di salvataggio. Undo/Redo, blocchi durante editing/caricamenti e controlli di revisione restano condivisi con le altre operazioni.

## Miniature e cache

Le miniature mostrano supporto/materiale sotto, grafica al centro e cornici/fissaggi di riferimento sopra. Le esportazioni produttive restano separate. Preparazione progressiva delle sole pagine vicine alla zona visibile, coda seriale e cache in memoria/IndexedDB già disponibile.

Il cambio pagina o del nome non rigenera immagini invariate; modificare una pagina invalida soltanto la relativa miniatura. Le chiavi tecniche includono i livelli di riferimento. In assenza di riferimenti coincidono con le chiavi produttive preesistenti, evitando una rigenerazione generale. Gli URL temporanei sono rilasciati quando non servono più. Una miniatura con font non valido lo segnala senza usare font del computer o sostituzioni implicite; la pagina resta raggiungibile per correggerla.

I contratti di colore esistenti non sono estesi: RGB nei documenti a colori, nero/bianco nei monocromatici. Permettere riferimenti RGB su documenti monocromatici richiede anche di separare il filtro di tinta del canvas e un collaudo dedicato. L’elenco amministrativo conserva per ora le sue anteprime produttive: il riuso di questo renderer in quella lista è un incremento successivo.

## Evidenze

- **905 test unitari / 136 file** passati: `.local/page-strip-unit-final.log`.
- **75 test browser pertinenti completi** passati: `.local/page-strip-pertinent-browser.log`. Inclusi gestione pagine, formati differenti, tastiera, cache, testo in editing senza spostamenti, zoom/PAN, maniglie esterne, font e scorrimento touch nativo di 14 pagine. Corretto il vincolo della colonna CSS che su mobile poteva allargare il canvas al contenuto della striscia.
- **54 campioni** riaperti/esportati senza errori browser o richieste esterne: `.local/page-strip-artifacts.log`. Nuovo campione `fixtures/illustrator/page-strip.TEST.json`, SVG produttivo/tecnico e PNG miniatura; generatore `scripts/capture-editor-page-strip.ts`. Schermate desktop, gestione pagine e mobile ispezionate.
- **13 test pubblici**, runtime Worker, build locale/pubblica e controlli segreti passati. Bundle pubblico sempre `index-BG2r_x-8.js`.
- Verificati in sola lettura **tutti gli otto documenti multipagina reali, 44 pagine**: miniature caricate, dimensioni/aspect ratio, oggetti/gruppi/font conservati e nessuna modifica al contenuto durante la navigazione. Zero errori, zero scritture, archivio identico prima/dopo tramite SHA-256. Rapporto privato: `.local/pitchprint-migration/page-strip-verification/report.json`.

Archivio invariato: 313 template attivi, due composizioni, 219 font; revisione 603. Non una nuova suite browser generale. Illustrator e dispositivi touch fisici non collaudati; touch verificato tramite emulazione browser. Nessun deploy o modifica commerciale.

## File e prossimi passi

Nuovi componenti `PageStrip.tsx` e `PageThumbnail.tsx`, composizione in sola lettura `reference-thumbnail.ts`; aggiornati `PagesPanel`, integrazione EditorLab, CSS, esclusioni PAN e chiavi cache. Test e generatori multipagina aggiornati alla navigazione reale tramite miniature.

Prossimo: riutilizzare la miniatura tecnica nell’elenco amministrativo per rendere utili anche i template con solo materiale di riferimento, poi proseguire i confronti dei sorgenti prioritari ancora bloccati senza abbassare le soglie di fedeltà.
