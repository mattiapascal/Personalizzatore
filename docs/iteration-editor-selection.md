# Selezione, gruppi e interazione del testo — 8 novembre 2026

**Aggiornamento successivo:** [trasformazioni dell’insieme](iteration-editor-group-transforms.md) aggiunte; le prove browser sospese sui contorni sono state eseguite e il campione è stato rigenerato. Le sezioni seguenti conservano il resoconto del primo incremento.

## Piano e perimetro

Si prosegue sulla worktree locale precedente, preservando tutte le modifiche dell’editor e la chat pubblica. Correggere i cursori alto destro/basso sinistro, poi introdurre selezione multipla, gruppi semplici, spostamento/copia/eliminazione atomici, allineamenti e distribuzione tra elementi. Nessun deploy, accesso al negozio, AI reale o generazione immagini. Il multipagina resta escluso.

Durante il lavoro il titolare ha precisato l’interazione del testo e il valore iniziale dell’allineamento, poi richiesto che le forme trasparenti siano agganciabili dal solo contorno. Queste precisazioni sono applicate nell’incremento.

## Comportamento disponibile

- Clic singolo sul testo: seleziona il box. Doppio clic fuori dalla scrittura: entra nel punto cliccato, senza selezionare la parola. Clic in scrittura: sposta il cursore. Doppio clic già in scrittura: seleziona la parola. Funziona anche quando il box era stato selezionato dall’elenco. Esc termina la scrittura; gli stili locali rimangono nel documento.
- Nuovi box e nuove bozze: `textAlign: center`. I progetti importati mantengono l’allineamento salvato; l’assenza della proprietà conserva il vecchio significato a sinistra. Altezza sempre automatica, come già richiesto. I cursori degli angoli seguono la diagonale e la rotazione, indipendentemente dal rapporto larghezza/altezza del box.
- Selezione multipla con Maiusc nel canvas o nell’elenco, oppure riquadro che racchiuda completamente gli oggetti. Pulsanti a icone Seleziona tutto/Deseleziona e modalità Selezione multipla per aggiungere/togliere elementi dall’elenco anche senza tastiera.
- Raggruppa/Separa, spostamento dal canvas o X/Y centrali in tempo reale, duplica/elimina dell’intera selezione. Una sola revisione e un solo passo Annulla per ogni operazione. Duplicare conserva geometrie e stili ma assegna nuovi ID a oggetti e gruppi.
- Ispettore della selezione: sei allineamenti entro l’ingombro complessivo e distribuzione di spazi uguali su due assi. Servono almeno due unità per allineare e tre per distribuire; i gruppi contano come una unità. Spazio insufficiente per evitare sovrapposizioni: rifiuto atomico. Modificare una coordinata conserva esattamente l’altra, senza applicare gli arrotondamenti della visualizzazione.

## Documento e vincoli

Il documento v2 conserva gli oggetti piatti, in coordinate globali, e aggiunge `groups?: {id, objectIds}[]`. Nessun secondo documento Fabric. Sono validati riferimenti, unicità, appartenenze e contiguità dei livelli: i gruppi non possono condividere membri o usare ID già occupati. Il gruppo viene collocato al livello del membro più alto, preservando l’ordine relativo degli altri oggetti e le geometrie. Il parser v1 rimane stretto.

Comandi tipizzati condivisi con la simulazione AI: `groupObjects`, `ungroupObjects`, `moveObjects`, `duplicateObjects`, `deleteObjects`, `alignObjects`, `distributeObjects`. ID e revisione vengono verificati prima del commit. I comandi sul singolo membro richiedono prima Separa; quelli della selezione devono comprendere l’intero gruppo. JSON e undo/redo conservano appartenenze, livelli e stili. Il renderer crea Group/ActiveSelection soltanto come vista; prima dell’export SVG toglie la selezione temporanea, poi la ripristina. Testata l’uguaglianza dell’SVG con/senza selezione attiva.

Primo supporto di gruppi a un livello: niente gruppi annidati o trasformazione dimensionale/rotazione dell’insieme. I gruppi sono spostabili, duplicabili, eliminabili e allineabili come unità. Separarli permette di modificare i singoli elementi. Un gruppo parzialmente esterno è ammesso se almeno un membro interseca l’area; trascinarlo totalmente fuori mostra il cestino ed elimina tutti i membri al rilascio. Annulla recupera il gruppo. Per separare un gruppo con membri totalmente esterni occorre prima riportarli nell’area. Una selezione temporanea di oggetti indipendenti conserva invece i vincoli dei singoli elementi.

## Forme con riempimento trasparente — ultima richiesta

Rettangoli e cerchi senza `fill` o con `fill: none` usano il rilevamento dei pixel dipinti di Fabric 7.4.0 (`perPixelTargetFind`), mantenendo `targetFindTolerance` al valore predefinito di zero. L’interno lascia passare il clic agli oggetti sottostanti; il contorno visibile aggancia selezione e trascinamento. Anche il gruppo e la selezione temporanea verificano i pixel dipinti, evitando una superficie rettangolare invisibile che catturi i clic. Bianco e nero pieni restano selezionabili all’interno. Le maniglie attive restano utilizzabili; un elemento senza riempimento né contorno può essere recuperato dall’elenco. Il riquadro di selezione deve racchiudere interamente gli elementi: trascinare soltanto entro il vuoto di una cornice non la seleziona.

Sono stati aggiunti test browser per rettangoli/cerchi, passaggio al testo sottostante, drag dal contorno, riempimento bianco e gruppo trasparente. Aggiornate le prove di spostamento dei gruppi e selezione con Maiusc per partire sul tratto visibile. **Questa ultima modifica non è ancora collaudata nel browser**, per il blocco di verifica descritto sotto.

## Prove ed evidenze

- Prima dell’ultima richiesta sui riempimenti: `npm run check` superato con **254 unitari, build, controllo segreti e 61 browser laboratorio**. Superati anche quattro test mirati successivi: precisione X/Y, gruppi, cursori e doppio clic contestuale.
- Dopo l’ultima modifica: `npm test` **254/254**, `npm run build` e `git diff --check` superati. I nuovi test browser sono presenti e compilano, ma non sono stati eseguiti.
- La riesecuzione dei test browser pubblici è stata rifiutata dall’auto-review: limite d’uso del servizio raggiunto, impossibilità di completare la revisione automatica; non una valutazione di pericolosità. Non si è aggirato il blocco tramite un’altra modalità di controllo del browser. Anche le nuove prove sui contorni restano da eseguire dopo lo sblocco.
- Verificata l’assenza di modifiche a `src/public`, selezione/AI/privacy, stile condiviso, backend/Cloudflare, istruzioni assistente, lockfile e golden storico `stamp.TEST.json/svg`. Nessun deploy o modifica al negozio.
- `npm run capture:selection` ha generato `selection.TEST.json/svg` con testo a stili misti, un gruppo e forme distinte, e verificato la selezione dall’elenco mobile senza Maiusc, prima dell’ultima richiesta. Il primo screenshot desktop ha preceduto il ridisegno del canvas dopo il fit; lo script ora attende due frame. Rigenerazione delle anteprime dopo questa correzione e dopo la modifica dei contorni ancora da fare. **Non usare lo screenshot desktop iniziale come prova della resa del canvas.**
- Campioni e SVG sono TEST. Illustrator non collaudato: restano da verificare misure, livelli/gruppi, caratteri modificabili e salvataggio senza variazioni.

## Come provare e prossimi passi

Aprire `http://127.0.0.1:5173/editor?workspace=1`; per il campione scegliere il formato fixture 4913 e aprire `fixtures/illustrator/selection.TEST.json`. Il menu Oggetti contiene le icone nuove. Prossimo controllo: `npm run test:e2e` e `npm run test:storefront` dopo lo sblocco della verifica automatica; poi `npm run capture:selection` e ispezione visiva delle nuove anteprime. Prossimi incrementi funzionali: trasformazioni dell’insieme, snap/guide e import SVG/raster, sempre sul medesimo documento e senza azioni online.
