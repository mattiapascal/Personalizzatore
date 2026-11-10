# Area di disegno a tutto schermo — 8 novembre 2026

Richiesta del titolare durante l’incremento trasformazioni: poter accedere anche a un ambiente di disegno a tutto schermo con uno o più pannelli strumenti. Rimane solo locale, sulla stessa bozza; nessuna pubblicazione.

## Consegna

- Link diretto: `http://127.0.0.1:5173/editor?workspace=1`. Da `/editor` usare «Apri area di disegno a tutto schermo».
- Canvas centrale, pannello sinistro «Oggetti e file» e destro «Proprietà e livelli». Si possono mostrare entrambi, uno solo o nessuno. Sotto 900 px sono pannelli a scomparsa, aperti uno alla volta.
- Zoom dal 25% al 400% e «Adatta all’area». Sono trasformazioni della vista: nessuna revisione o modifica ai dati produttivi. Export SVG sempre in mm e viewBox canonico, indipendente dallo zoom; dopo l’export la vista viene ripristinata.
- «Schermo intero browser» richiede il fullscreen nativo, se disponibile; la modalità espansa a tutta viewport funziona anche senza fullscreen nativo. «Torna al laboratorio» conserva documento, selezione e storico e ripristina zoom/scroll della vista normale.
- Sfondi della pagina resi inerti durante la modalità espansa, scorrimento body sospeso e navigazione tastiera contenuta nell’area. Esc chiude la vista quando non si sta scrivendo; durante IText termina soltanto la modifica del testo. Zoom e uscita esplicita disabilitati durante la scrittura.
- Su successiva richiesta del titolare, pulsanti grafici SVG al posto delle scritte: aggiunta, copia/eliminazione, livelli, allineamenti, annulla/ripristina, import/export, applicazione e comandi di vista. `EditorButton.tsx` conserva nome accessibile e tooltip in italiano; bersagli da 44×44 px. Numero sull’icona per distinguere oggetti dello stesso tipo, sigle JSON/SVG per i file. Anche il link di ritorno al selettore usa un’icona. Nessuna libreria o risorsa esterna aggiunta.

## Architettura e verifiche

`WorkspaceFrame.tsx` gestisce solo disposizione, pannelli e stato della vista. `EditorLab` mantiene lo stesso `DocumentStore`, canvas e comandi. Non vengono aperte copie del documento o un secondo editor al cambio di modalità. `fabric-adapter.ts` conserva lo zoom soltanto come proprietà del renderer e lo neutralizza temporaneamente durante l’export, ripristinandolo in `finally`.

Prove browser aggiunte: stessa identità/revisione passando alla vista espansa; pannelli e fit; golden SVG identico al 400%; trascinamento allo zoom 400% con spostamento corretto in mm; cambio proprietà da pannello mobile senza overflow; scrittura IText senza uscire dalla modalità; fullscreen nativo ed uscita con ripristino della pagina.

Anteprime con `npm run capture:editor -- --transforms --workspace`: `.local/previews/editor-workspace-{desktop,mobile}.png`. Solo fixture, API e rete esterna bloccate. Il campione grafico rimane `transforms.TEST.json/svg`.

Limiti: pannelli per ora agganciati ai lati e richiudibili, non trascinabili o ridimensionabili; niente salvataggio della disposizione tra reload. Il progetto si conserva passando tra viste, mentre per un reload serve esportare il JSON. Nessun collaudo su dispositivo fisico o Illustrator.

La suite completa **finale con le icone** (`npm run check`) ha superato **233 unità, 51 browser laboratorio, build e scansione credenziali**. I test attivano i pulsanti tramite i nomi accessibili originali e verificano i risultati grafici, non la sola presenza delle icone. Le 13 regressioni pubbliche locali sono state superate nella stessa sessione; UI pubblica, backend e tema restano invariati. Anteprime desktop/mobile con icone ispezionate. Nessun deploy o test Illustrator.

## Correzione successiva dello scorrimento — 9 novembre 2026

Durante il controllo del nuovo ispettore multiplo è stato riprodotto uno scorrimento di 33 px del contenitore a tutto schermo: il focus/scroll verso controlli nei pannelli faceva salire anche la barra superiore. I pannelli devono scorrere indipendentemente; la cornice del workspace deve rimanere ferma. Browser Chromium locale conferma supporto di `overflow: clip`; correzione mirata al solo contenitore esterno, mantenendo overflow automatico di pannelli e canvas. Nuova regressione desktop/mobile sul focus di controlli in basso, posizione della toolbar e revisione invariata. Correzione applicata con fallback hidden/clip al solo contenitore esterno. Nuovo browser desktop/mobile superato; toolbar a Y=0, scroll del contenitore esterno a 0, pannelli realmente scorrevoli e revisione invariata. Anteprime dell’allineamento rigenerate e ispezionate: barra completamente visibile.

Prima regressione finale dopo la correzione: 364 unitari, build e segreti passati; 141/142 browser passati. La traccia dell’unico timeout mostra `net::ERR_NETWORK_CHANGED` sui moduli Vite prima dell’avvio dell’editor, non un errore delle operazioni PNG. Traccia conservata localmente in `.local/test-traces/png-initial-load-network-changed.zip`. Test mirato ripassato senza modifiche e ripetizione completa successiva **superata: 364 unitari, 142 browser laboratorio, build e controllo segreti**.
