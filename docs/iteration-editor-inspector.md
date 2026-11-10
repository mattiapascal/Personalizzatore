# Ispettore oggetto — 8 novembre 2026

## Piano prima dell’implementazione

Richiesta del titolare: continuare dalle funzioni già realizzate e aggiungere un ispettore che raccolga le opzioni dell’oggetto selezionato, prendendo spunto da Macromedia FreeHand. Si lavora sulla worktree locale precedente, senza scartare modifiche e senza deploy.

Fonte consultata: [Adobe/Macromedia, View the Object panel](https://www.adobe.com/support/freehand/learning/1_stroke_fills/1_stroke_fills03.html). Il riferimento ispira l’elenco delle proprietà e i controlli contestuali. Non si replica il codice, né si dichiarano disponibili effetti o attributi multipli non implementati.

1. Un solo pannello Ispettore, contestuale alla selezione: geometria; testo; riempimento; contorno; disposizione/livelli. Navigazione con icone, tooltip e nomi accessibili.
2. Riutilizzare le geometrie attuali. Aggiungere testo/stile del box e dei caratteri selezionati (Arial, corpo, grassetto/corsivo/sottolineato, allineamento, interlinea e spaziatura in pt) e aspetto delle forme (riempimento, contorno opzionale, spessore, tratteggio, arrotondamento rettangoli).
3. Comando tipizzato `updateObject` con oggetto completo e revisione, senza modifiche a ID o tipo. Applica atomica, rifiuto conservativo, stesso store per manuale e simulazione AI. Gli altri comandi rimangono compatibili.
4. Mantenere documento v2 con proprietà opzionali; vecchi v2 e v1 leggibili, vecchio reader v2 rifiuta gli attributi nuovi anziché ignorarli. Il parser v1 deve rimanere stretto e non accettarli come se fossero storici.
5. Aggiornare renderer, metriche e scala con/senza tratto; testare ingombri del testo formattato, arrotondamenti, rifiuti atomici, JSON/SVG e UI desktop/mobile. Illustrator da collaudare separatamente.

Assunzioni aggiornate dalle richieste del titolare: un oggetto selezionato; il testo può contenere stili diversi per intervalli di caratteri. Restano esclusi da questo incremento gradienti, opacità/grigi, effetti e contorni/riempimenti multipli. Non offrire pulsanti fittizi. I limiti nero/bianco, Arial e 7–48 pt rimangono vincoli TEST, non l’obiettivo finale del prodotto.

Rischi da verificare: font più larghi dopo grassetto/corsivo, raggio degli angoli maggiore della nuova geometria, differenza d’ingombro quando si disattiva il contorno. Ogni modifica deve essere validata prima del commit. Semplici bozze dei campi locali non modificano il documento; un comando esterno o undo aggiorna l’ispettore dalla revisione corrente.

## Riferimento centrale richiesto durante lo sviluppo

Il titolare preferisce il centro come punto di ancoraggio. X/Y dell’ispettore diventano coordinate del centro; cambi di dimensioni, rotazione, testo o contorno ne conservano la posizione. Fabric usa `originX/Y: center` e scala/ruota dal centro. I JSON storici **non vengono spostati o riscritti automaticamente**: le coordinate canoniche `xMm/yMm` rimangono il minimo dell’ingombro per compatibilità. `objectCenter` e `placeObjectAtCenter` effettuano la conversione, anche per testi misurati e scene ruotate. Il comando atomico dell’ispettore contiene il risultato canonico validato, condiviso con la simulazione AI.

I vecchi comandi `moveObject` e `transformObject` conservano il contratto esplicito delle coordinate esterne. Non attribuire loro implicitamente nuove semantiche. Gli adattatori AI futuri dovranno usare la conversione centrale quando interpretano le coordinate dell’interfaccia. Non esiste ancora un modello AI collegato alla grafica.


## Aggiornamenti richiesti durante l’implementazione

- Nessun pulsante Applica. Campi numerici e contenuto inviano un comando dopo 250 ms; colori e pulsanti di stile sono immediati. Un campo incompleto resta una bozza, i valori non validi non cambiano il documento. Esc ripristina; undo/redo e comandi esterni riallineano il pannello.
- Gli oggetti possono uscire **parzialmente** dall’area. In modifica si verifica l’intersezione effettiva con rettangolo/cerchio, anche per oggetti ruotati. La verifica stretta con margine TEST rimane separata e continua a proteggere il cambio di modello. Lo SVG ritaglia all’area nominale: non certifica l’idoneità produttiva.
- Durante il solo trascinamento totalmente fuori appare un cestino al centro dello schermo. Rilasciare invia `deleteObject`; Esc annulla il gesto e Annulla recupera l’oggetto nella posizione precedente. I comandi numerici/AI totalmente esterni vengono rifiutati e non cancellano implicitamente.

## Contenitori di testo ispirati a FreeHand

Fonte primaria consultata: [tutorial ufficiale Adobe, Text blocks and auto-expansion](https://www.adobe.com/support/freehand/learning/fhmx_tutorial02/fhmx_tutorial0209.html). Distingue dimensioni fisse/automatiche e maniglie vuote/piene. L’implementazione è nostra, su Fabric 7.4.0 già presente; non si dichiara una replica completa di FreeHand.

Ogni testo è reso come un contenitore. I testi storici senza `textBox` equivalgono a espansione automatica su entrambi gli assi e mantengono il golden SVG invariato. I nuovi box hanno larghezza fissa 30 mm (ridotta se necessario al formato) e **altezza sempre automatica**, come richiesto dal titolare alla fine dell’iterazione. L’ispettore offre larghezza fissa/automatica e altezza calcolata in sola lettura, senza interruttore di altezza. Il testo originale non contiene gli a capo introdotti dall’impaginazione automatica. Nessun ritaglio verticale dovuto al contenitore, nessuna riduzione automatica del font. Una parola più larga del box resta segnalata: larghezza automatica/allargamento sono rimedi distinti. Il ritaglio all’area di disegno rimane conforme alla richiesta precedente di consentire oggetti parzialmente esterni.

Le maniglie ridimensionano il contenitore e rifanno l’impaginazione, senza cambiare il corpo del testo. **Il lato o l’angolo opposto resta fermo**; l’altezza automatica cresce dal bordo superiore. Questa interazione è distinta dall’ancoraggio centrale delle proprietà e della rotazione. Corretta anche l’invalidazione delle coordinate Fabric dopo l’impostazione della misura del frame: prima del calcolo dei limiti si esegue `setCoords()`, altrimenti alcune maniglie usavano il vecchio ingombro del testo.

Le maniglie dei box modificano la larghezza; l’altezza viene ricalcolata dall’impaginazione. Alt scala anche i corpi, inclusi gli stili locali. Doppio clic sulle maniglie laterali commuta soltanto la larghezza automatica. Maniglie e doppio clic non possono disattivare l’altezza automatica; la maniglia centrale inferiore è nascosta. Collegamenti e scorrimento del testo tra box restano da implementare, così come testo su tracciato e altri font.

## Formattazione del testo selezionato

Richiesta esplicita del titolare: box selezionato → modifica di tutti i caratteri; intervallo evidenziato durante la scrittura → modifica soltanto della selezione. Sono disponibili corpo, grassetto, corsivo, sottolineato e colore nero/bianco; Arial rimane l’unico font del profilo TEST. Gli attributi misti sono indicati con campo “Misto” e pulsanti `aria-pressed=mixed`. Allineamento, interlinea e spaziatura rimangono proprietà del box; con solo cursore, senza caratteri evidenziati, gli strumenti dei caratteri sono disabilitati e l’interfaccia invita a selezionare il testo.

`characterStyles` conserva intervalli ordinati, non sovrapposti, di punti di codice Unicode (inclusi a capo; una coppia surrogata/emoji conta uno). Conversione esplicita verso gli stili Fabric per riga/carattere, senza usare gli indici serializzati Fabric che omettono gli a capo. La modifica dell’intero box elimina soltanto gli override della proprietà modificata, preservando gli altri. La scrittura nel canvas aggiorna gli intervalli con le inserzioni/cancellazioni; la sostituzione completa nel campo Contenuto o tramite `setText` li azzera, come indicato nell’interfaccia.

Le modifiche live al contenuto e agli stili vengono raccolte nello stesso `updateObject`, con schema e revisione validati: nessuna scena persistente parallela. Il render ripristina lo stato di scrittura, l’intervallo selezionato e il focus dell’ispettore. Le proprietà geometriche e del paragrafo sono sospese durante la selezione dei caratteri. JSON, duplicazione e undo/redo conservano frame e stili. Il file SVG mantiene testi e tspan, con il collaudo Illustrator ancora da eseguire.

## Prova locale e verifiche

Aprire `http://127.0.0.1:5173/editor?workspace=1` con il server locale attivo. Selezionare un testo e aprire la scheda Testo nell’ispettore. Doppio clic sul contenuto per scrivere, evidenziare alcuni caratteri, quindi usare l’ispettore: la selezione rimane attiva. Esc torna al box intero. La scheda Geometria contiene i controlli della larghezza e mostra l’altezza calcolata.

Campione riproducibile: `npm run capture:inspector`, con sole fixture e rete esterna/API bloccate. Produce `fixtures/illustrator/text-box.TEST.json/svg` e `.local/previews/editor-inspector-{desktop,mobile}.png`. Riaprire il JSON nel formato TEST 4913 da 58×22 mm. I file sono TEST, non approvati per produzione. Misure e stile misto in Illustrator richiedono ispezione umana.

Verifiche finali riportate sotto. Nessun deploy, nessuna chiamata AI reale, nessuna modifica a chat pubblicata, backend, tema o flussi commerciali.


### Altezza automatica obbligatoria — ultima richiesta del titolare

L’attivazione/disattivazione era corretta, ma il titolare ha chiesto di sospendere l’altezza fissa per evitare testo nascosto verticalmente nel box. Il contratto ora accetta soltanto `textBox.autoHeight: true`; anche comandi strutturati manuali/AI non possono introdurre box fissi. All’apertura, i primi JSON v2 con `autoHeight: false` vengono adattati a `true`, senza perdere testo/stili/ID o cambiare le coordinate salvate. `heightMm` è conservato per compatibilità e non limita la misura effettiva: l’altezza reale viene sempre misurata dal contenuto. L’opzione non è più nell’ispettore. Lo schema JSON è rigenerato; il test di migrazione e il browser verificano testo completo e altezza maggiore della vecchia misura insufficiente.


## Risultati finali verificati

- `npm run check`: **246 unitari, build TypeScript/Vite, controllo segreti e 55 browser laboratorio superati**, dopo l’ultima modifica che impone l’altezza automatica.
- `npm run test:storefront`: **13 browser della chat pubblica superati localmente**. Nessuna modifica successiva al codice pubblico; `git diff --exit-code` conferma preservati `src/public`, selezione/AI/privacy, stile condiviso, backend/Cloudflare, istruzioni assistente e lockfile.
- `npm run schemas`: rigenerati contratti GraphicDocument/GraphicCommand; altezza fissa non ammessa nei nuovi comandi. Golden `stamp.TEST.json/svg` conservati e test SVG storico superato.
- `npm run capture:inspector`: fixture JSON/SVG con stili misti e altezza automatica, anteprime desktop/mobile; ispezione visiva browser effettuata. Altezza reale del campione: circa 9,137 mm, calcolata dal testo. Nessun collaudo Illustrator.
- `tsc --noEmit` e `git diff --check` finali superati, incluso lo script di cattura aggiornato.

File principali dell’incremento: `ObjectInspector.tsx`, `use-inspector-draft.ts`, `text-box.ts`, `text-style.ts`; aggiornati modello, adapter Fabric, EditorLab, schemi e test. Campione aggiunto `text-box.TEST.json/svg`, documentazione e comando `capture:inspector`. Nessuna nuova dipendenza.

Prossimi incrementi proposti: completare tipografia/font e collegamenti tra box se desiderati, poi selezione multipla/gruppi e import SVG/raster secondo la roadmap. Multipagina escluso e generazione immagini AI rinviata. Nessuna azione online eseguita o implicata da queste verifiche.
