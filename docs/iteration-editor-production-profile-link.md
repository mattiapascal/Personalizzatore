# Profili tecnici nel documento — primo collegamento locale, 13 novembre 2026

Primo incremento del collegamento tra amministrazione e canvas. Non è ancora l’applicazione completa dei vincoli produttivi: corpo minimo e immagini entrano nel controllo finale; margine e zone riservate sono guide visuali. Le collisioni con tali zone, gli ingombri dei fissaggi, la finezza dell’incisione e le distanze tra vernici restano da verificare con i prossimi incrementi.

## Contratto canonico e versioni

Il campo opzionale `productionProfile` conserva per ogni pagina una copia completa del profilo, con ID e versione. Il medesimo schema e validatore sono stati spostati in `src/editor/production-profile.ts`; il percorso amministrativo precedente li riesporta. Non esistono due schemi divergenti.

Il comando tipizzato `setProductionProfile`, con revisione attesa, collega o scollega il profilo. È amministrativo, usa il motore comune a UI e AI simulata, e supporta Undo/Redo. Non cambia gli oggetti, le misure, la sagoma, i colori, il prodotto o i fissaggi. Il cliente può leggere il profilo e modificare la grafica entro i controlli disponibili, ma non cambiarlo tramite quel comando. La nuova pagina cliente deve conservare lo stesso profilo; l’importazione nel contesto corrente non può rimuoverlo omettendolo dal JSON.

La copia è profonda, anche per le pagine inattive. Il documento resta riapribile se la libreria del profilo viene aggiornata o archiviata: conserva la versione scelta, senza sincronizzazione implicita. L’aggiornamento volontario richiede una nuova scelta. Se il profilo cambia tra scelta e conferma, l’interfaccia chiede di aggiornare l’elenco; la pagina rimane invariata. I documenti precedenti senza questo campo restano validi e non vengono riscritti.

## Misure fisse e parametriche

Nuovo parametro opzionale `sizeMode`:

- assente o `fixed`: area e sagoma del profilo devono coincidere con quelle della pagina; nessun adattamento automatico della grafica;
- `document`: si usano le dimensioni effettive della pagina. L’area compilata nel profilo è lo schema di riferimento per l’amministratore; margine, zone e misure tecniche restano fisici, non vengono scalati.

È la base per usare un profilo su più varianti o misure personalizzate; non è un nuovo collegamento ai campi BSS. La provenienza delle dimensioni commerciali resta nel relativo adattatore. Un’area/sagoma incompatibile, un margine che occupa tutto il foglio o una zona che esce dal nuovo formato vengono rifiutati. I kit opzionali non scelti non impongono alla pagina la dimensione del loro schema: non vengono applicati o posizionati da questo collegamento.

L’associazione TEST viene verificata con il catalogo corrente quando il profilo viene collegato/confermato. Prodotto, variante e lavorazione devono essere coerenti. Un profilo timbro non si applica implicitamente a una targa a colori. L’eventuale associazione Shopify del profilo non diventa automaticamente un’associazione commerciale del documento o del template.

## Controlli effettivamente attivi

- Il minimo tipografico effettivo è il più restrittivo fra catalogo e profilo. I timbri inchiostrati mantengono almeno 7 pt. L’ispettore segnala il valore e le conferme client/API lo verificano anche per profili su documenti senza montatura TEST.
- Il controllo tiene conto dei caratteri realmente stampati, degli stili locali, della scala verticale e dei riferimenti, come nel contratto precedente. Una bozza sotto soglia resta modificabile.
- I tentativi di adattamento proporzionale conservano il minimo del profilo; non applicano indiscriminatamente i 7 pt alle targhe.
- `rasterMode: binary` attiva il controllo dei campioni B/N e dell’alpha anche per un profilo di targa senza montatura timbro. La regola riguarda le immagini; non trasforma automaticamente l’intero documento a colori. Il controllo della sola immagine ritagliata/mascherata resta una lacuna esplicita del gate precedente.
- I profili timbro applicano anche il controllo dei riempimenti/contorni semitrasparenti. Riferimenti individuali/di gruppo esclusi. Rifiuti prima di aggiungere/sostituire la configurazione locale: nessuna riga, ricevuta o revisione alterata.

## Interfaccia e guide

Nel pannello laterale dell’editor, «Profilo tecnico della pagina»: elenco locale, incompatibilità, collegamento esplicito, scollegamento annullabile, versione e riepilogo. Il cliente vede soltanto la copia collegata. Il pannello amministrativo dei profili espone la scelta delle misure; salvare un profilo non lo applica ai template esistenti.

Nel canvas, azzurro tratteggiato per il margine e arancione per le zone. Non sono oggetti selezionabili. Non entrano nello SVG, nel PNG/PDF produttivo o nelle miniature dell’archivio; il JSON conserva le regole. La chiave della miniatura non cambia per il solo collegamento. Non vengono create geometrie produttive o accessori inventati. Il pannello chiarisce che questi sono ancora riferimenti visuali, non un controllo di collisione.

## Verifiche e campione

**1.126 unitari / 159 file** passati, con 20 nuovi casi: comandi manuali/AI, snapshot/versioni, copie profonde, revisioni, formati parametrici, zone fuori sagoma, profili archiviati, ruoli, binding, minimo tipografico, immagini, pagine, miniature, JSON/SQLite, importazione e API di conferma atomica. **Cinque nuovi browser** passati: scelta/Undo/versioni, aggiornamento concorrente, cliente/minimo senza montatura e parità dei file esportati con/senza guide e salvataggio parametrico amministrativo su copia isolata.

**67 campioni JSON/SVG** riaperti ed esportati, zero errori/richieste esterne. **13 browser pubblici**, build/TypeScript, schemi e pacchetto Worker `--dry-run` passati. Runtime Worker/SQLite e scansioni dei segreti dei due bundle passati. JavaScript pubblico ancora `index-BG2r_x-8.js`; nessun deploy. Lettura del principale: R630, 341 record (339 template e due composizioni), 219 font, 297 risorse e zero record con profilo collegato; nessuna applicazione implicita. Il primo controllo TypeScript segnalava import inutilizzati, poi rimossi; nessuna modifica al prodotto per mascherare errori dei test.

[profile-link.TEST.json](../fixtures/illustrator/profile-link.TEST.json), [SVG pagina 1](../fixtures/illustrator/profile-link.TEST.svg) e [SVG pagina 2](../fixtures/illustrator/profile-link.page2.TEST.svg): stesso profilo parametrico, 100 × 60 e 120 × 80 mm, zone/margine fisici invariati, Arimo incorporato. Generatore `node --import tsx scripts/capture-editor-production-profile-link.ts`; comando manuale, AI simulata e storico verificati. Schermate desktop/compatta in `.local/profile-link/capture/` ispezionate. Illustrator non ancora verificato.

### Correzione della validazione parametrica

Una prova aggiuntiva sul backend ha rilevato che il vecchio controllo dell’area utile nominale veniva applicato anche alle misure di riferimento della modalità `document`. Corretto il controllo: il profilo fisso rimane limitato al nominale, mentre nella modalità parametrica viene verificata la pagina effettiva al collegamento/conferma. Verificate anche versione del catalogo e lavorazione della montatura per i profili generici, senza richiedere una specifica associazione TEST nel profilo.

La prima suite generale è stata fermata intenzionalmente per questa correzione: **162 passati, uno interrotto e 525 non eseguiti**, non una suite verde. Aggiunti due unitari e un browser sul salvataggio parametrico, poi ripetuti unitari completi (**1.126**) e cinque browser pertinenti, tutti passati. Il nuovo collaudo generale indicato sotto include la correzione.

### Collaudo generale avviato

La suite completa di **689 scenari browser** è in esecuzione sul codice dell’incremento: `.local/profile-link/browser-full-final.log`, sessione exec `55644`. Non è ancora dichiarata passata. **Non modificare sorgenti applicativi o avviare una seconda suite sullo stesso output mentre è in corso.** Al prossimo passaggio controllare il processo/handle effettivo; completare eventuali diagnosi e aggiornare questo resoconto con l’esito terminale. I test pertinenti sopra sono già conclusi; non sostituiscono il risultato della suite generale.

Nessuna migrazione o applicazione massiva ai 339 template; archivio e libreria personali non sono destinatari delle prove. Nessuna modifica a Shopify/tema/PitchPrint/BSS, prezzi, carrello online o checkout. Prossimo incremento: controlli geometrici di margine/zone e completamento delle regole produttive, mantenendo distinti esiti dimostrati e verifiche mancanti.
