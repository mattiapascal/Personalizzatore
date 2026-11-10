# Collaudo raggruppato del 10 novembre 2026

Apri <http://127.0.0.1:5173/editor/admin?section=acceptance>. Sono raccolte 18 prove con istruzioni, risultato atteso e collegamenti agli ambienti locali. Registra Superata/Problema/Da verificare e le note; scarica il resoconto alla fine. Gli esiti sono conservati soltanto nel browser e non certificano automaticamente Illustrator o la produzione. Usa copie TEST per le modifiche.

La sezione include anche i nuovi profili versionati, l’associazione alle varianti reali e il disegno delle zone nel backend. I profili non governano ancora il canvas; il collegamento produttivo completo è successivo. [Dettagli dell’incremento](iteration-editor-profile-zones-shop-acceptance.md).

Disponibile anche la [checklist completa da consultare senza server](editor-collaudo-2026-11-10.md), generata dagli stessi casi della pagina interattiva. Le istruzioni precedenti sotto restano un approfondimento.

# Prova guidata del configuratore locale

Avviare `npm run dev` con il Node indicato dalla `.nvmrc`, se il server è spento. Usare sempre lo stesso indirizzo `127.0.0.1:5173`: bozze e archivio del browser sono separati per origine.

## 1. Riprendere una composizione

Apri <http://127.0.0.1:5173/editor?workspace=1>. Se compare una bozza, **Riprendi la bozza** la riapre; **Continua con una nuova bozza** conserva quella precedente e inizia una copia indipendente.

Modifica il testo nel canvas e attendi l’indicazione di salvataggio. Ricarica la pagina e riprendi la bozza: testo, formato e colore devono essere gli stessi. **Bozze salvate su questo browser** apre l’elenco per recuperare/esportare le altre composizioni. Il JSON scaricato resta il modo per trasferirle su un altro browser o computer.

## 2. Cambiare montatura e colore

Nel pannello **Modello**, premi **Cambia modello**. Scegli un modello e confronta prima/dopo, misure e percentuale di riduzione. **Mantieni il modello attuale** chiude senza applicare; **Conferma cambio modello** applica la proposta. Se viola i vincoli TEST, correggi la grafica o scegli un modello maggiore. Annulla/Ripristina comprende anche la montatura. L’originale è recuperabile nelle bozze.

Prova **Colore impronta (prova)**: tutti i segni assumono la stessa tinta, mantenendo bianchi e trasparenze. Il PNG della bozza usa la tinta; lo SVG di lavorazione conserva il B/N. La palette è dimostrativa: non seleziona ancora tamponi acquistabili né modifica prezzi.

## 3. Creare un template e provarne le associazioni

Nell’editor, apri **Archivio locale di template e composizioni** nel pannello Progetto. Dai un nome, assegna i tag desiderati (oppure sceglili dall’elenco dei tag già salvati), scegli **Template** nel tipo di archivio e premi **Salva copia nell’archivio locale**.

Apri <http://127.0.0.1:5173/editor/admin>, sezione **Template**: ogni riga ha una miniatura. Puoi cercare, combinare tag in modalità tutti/AND o almeno uno/OR e ordinare per nome, modifica o priorità. In **Ordine predefinito dei tag** trascina le maniglie e premi **Salva ordine predefinito**; l’ordine vale anche nelle composizioni. Seleziona poi la voce e configura i modelli tecnici ammessi. Apri la [galleria](http://127.0.0.1:5173/editor/templates): viene proposto il più piccolo modello ammesso che contiene la grafica alle misure originali. Se nessuno contiene la composizione, serve modificarla o aggiungere un modello compatibile; non viene ridotta automaticamente all’ingresso.

Apri il template nell’editor: lavori su una copia. Modificare questa composizione non modifica l’originale nell’archivio. Il cambio successivo verso un modello più piccolo richiede l’anteprima e la conferma descritte sopra.

Per trasformare un progetto cliente in template, apri **Composizioni clienti**, seleziona il progetto e premi **Copia nei template**. Il nuovo template ha un altro ID e conserva grafica e tag; il riferimento cliente viene escluso e l’originale rimane invariato.

## 4. Controllare il caso «13 e 15»

Apri <http://127.0.0.1:5173/editor?workspace=1&configurations=1>. Prepara un testo «13», premi **Controlla e aggiungi**, assegna un nome e conferma **Aggiungi al carrello di prova**.

Nel riepilogo, **Crea una copia da aggiungere** apre una bozza indipendente. Cambia «13» in «15» e conferma il nuovo articolo. Devono comparire due righe, una «13» e una «15».

Per correggere invece il primo articolo, scegli su quella riga **Modifica questo articolo nel carrello**. Modifica, controlla il confronto prima/dopo e conferma la sostituzione. Cambia soltanto la riga scelta; chiudere la finestra prima della conferma la lascia invariata. Questo è un carrello di prova locale, senza acquisti.

## 5. Provare i font

Nel [backend](http://127.0.0.1:5173/editor/admin), sezione **Font**, carica un file personale oppure apri **Sfoglia Google Fonts** e aggiungi la variante desiderata. La navigazione Google richiede rete; i font già installati vengono letti dall’archivio locale.

Nella libreria le anteprime si caricano automaticamente, senza premere pulsanti. Prova ricerca, filtri, testo di anteprima e download dell’originale. **Informazioni sul font** raccoglie nome/note/provenienza/licenza facoltativi; i dati tecnici rilevati dal file restano automatici. Apri di nuovo l’editor e seleziona il font dall’ispettore Testo: famiglia e variante usano i file installati. Salva il JSON e riaprilo: contiene il font usato. Archiviare il font nella libreria lo nasconde per le nuove scelte, conservando le copie nei progetti già salvati.

Il controllo del progetto segnala caratteri mancanti o stili simulati dei font incorporati. Questi problemi bloccano la conferma nel carrello di prova, ma lasciano il progetto modificabile per correggerli. Copertura sconosciuta non significa copertura certificata.

Per una copia della libreria usa **Scarica backup font**. Per recuperarla, scegli il backup in **Controlla un backup da ripristinare**, leggi il confronto e conferma soltanto dopo aver controllato l’elenco. I font già presenti restano invariati; un ID con file differente blocca l’operazione. **Ricontrolla il backup** aggiorna il confronto se l’archivio è cambiato. Il backup dei font è distinto dai JSON dei progetti.

## 6. Controllare un profilo tecnico

Nel backend apri **Profili produttivi**. Compila soltanto misure verificate: lo **Schema del profilo** mostra area utile, margine e zone riservate. Per una targa puoi definire sola foratura o kit e confrontare ciascuno schema nel selettore della preview. Gli offset sono dal bordo al centro del foro; il rispetto è dal bordo del foro. Senza misure complete la vista lo segnala. La preview e i campi non modificano i dati salvati finché non premi **Salva profilo locale**. Il profilo non si applica ancora al documento dell’editor.

## 7. Sfogliare il catalogo reale

Apri [Prodotti del negozio](http://127.0.0.1:5173/editor/admin?section=products). Inizialmente sono mostrati gli attivi; **Stato prodotto → Tutti gli stati** include anche bozze, archiviati e non elencati. Cerca per nome/handle/tag, seleziona una collezione e apri **Tag prodotto** per combinarli. Sono filtri distinti dai tag dell’archivio dei template. L’elenco è paginato; **Aggiorna da Shopify** rilegge i dati senza modificarli sul negozio. Controlla la data della lettura.

Questa è la vista commerciale completa. I prodotti che non hanno ancora un profilo tecnico utilizzabile non vengono resi automaticamente apribili nell’editor.

## Cosa resta dimostrativo

Il catalogo tecnico utilizzato dal canvas contiene ancora tre montature TEST, mentre il navigatore amministrativo mostra il vero catalogo commerciale. I profili produttivi nel backend raccolgono misure/regole ma non governano ancora il canvas; supporti e fissaggi non sono ancora opzioni del progetto. Prezzi, account, carrello/checkout Shopify e ritorno alla pagina prodotto non sono collegati. Nessuna certificazione Illustrator o lavorazione fisica. [Funzioni e passi mancanti](editor-gap-review.md).
