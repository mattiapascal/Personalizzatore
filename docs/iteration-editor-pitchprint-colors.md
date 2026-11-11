# Template PitchPrint con colori originali — 11 novembre 2026

Il titolare ha autorizzato l’importazione locale delle 117 bozze, precisando che i colori devono essere conservati per le targhe stampate. Questa indicazione prevale sulla preparazione precedente in B/N. Ha inoltre autorizzato la sincronizzazione del repository GitHub, senza deploy.

## Modello e importazione

Il documento v2 ha ora `colorMode` opzionale: l’assenza conserva il comportamento monocromatico dei documenti esistenti; `color` consente pitture RGB opache canoniche `#rrggbb`. Riempimenti, contorni e stili dei singoli caratteri usano gli stessi schemi e gli stessi comandi manuali/AI. Nei progetti a colori l’ispettore offre il selettore grafico del colore anche per la selezione multipla.

Il catalogo grafico tipizzato attuale contiene montature timbro. Un documento a colori non viene associato a queste montature e non viene convertito silenziosamente. La prova di compatibilità valuta esplicitamente il documento monocromatico: se contiene colori o immagini originali non convertite, viene rifiutata. Riconvalidata anche l’importazione JSON dopo l’associazione al prodotto corrente, prima di cambiare lo stato.

PitchPrint e SVG conservano i valori RGB; la conversione in nero richiede l’opzione esplicita già presente. I progetti importati senza conversione sono a colori, senza prodotto assegnato. Il ritaglio e le trasformazioni non cambiano questa politica. Gradienti, opacità parziali delle pitture e altri effetti non rappresentabili restano bloccati, anziché essere eliminati.

Per le immagini è disponibile `raster.mode: original`: sorgente, pixel RGB e trasparenza sono conservati. Le elaborazioni B/N richiedono il passaggio esplicito alla modalità binaria. Il validatore impedisce di combinare modalità originale ed elaborazioni che ne altererebbero i pixel. Nuove immagini e importazioni SVG/PDF nel progetto a colori mantengono i colori per impostazione iniziale. Progetti monocromatici mantengono il comportamento precedente.

Canvas, PNG e anteprime applicano il colore dimostrativo del tampone soltanto ai documenti monocromatici. Il progetto a colori mantiene anche grigi e bianchi originali. Nessun servizio AI o modifica delle regole commerciali.

## Preparazione verificata

Riconvertite tutte le **117 bozze** con `monochrome: false`, `excludeBackground: true`, nessuna famiglia/prodotto preassegnati. **37 con pitture a colori, 79 vettoriali B/N e una con immagine**. Confronto con la precedente preparazione: geometrie e proprietà invariate, cambiano soltanto pitture e conservazione dei pixel. Hash dei 117 sorgenti locali verificati; originali non modificati. File font richiesti incorporati, senza sostituire famiglia, peso o stile. La copertura dei singoli caratteri è controllata separatamente, come indicato sotto.

Dati privati esclusi da Git in `.local/pitchprint-migration/import-plans/`: `prepared-color-original-drafts.jsonl`, `prepared-color-summary.json`, `color-plan-audit.json`. La precedente preparazione B/N resta distinta e non viene usata per il salvataggio autorizzato.

## Verifiche

- 633 test unitari in 94 file: colori canonici, stili parziali, comandi manuali/AI, rifiuto atomico nei timbri, Undo/Redo, conservazione RGBA e archivio temporaneo idempotente.
- Due nuovi casi browser: sorgente PitchPrint sintetico con testo, vettore e PNG; modifica colore dall’ispettore, archivio temporaneo, riapertura e confronto pixel PNG; SVG a colori con rifiuto atomico nel canvas monocromatico.
- Build TypeScript e Vite, schemi JSON aggiornati e controllo segreti passati.

Regressione conclusa: **376/376 casi browser verificati**, **13 regressioni pubbliche** e **20 campioni portatili riaperti/esportati**, oltre ai 633 unitari e alla build. Il controllo dell’importazione reale è riportato sotto. Il collaudo Illustrator resta umano e non è stato effettuato. Nessun deploy o modifica a negozio, tema, PitchPrint, BSS, prezzi, carrello o checkout.

## Importazione effettiva e controllo dell’archivio

Salvati **117 nuovi template**, non soltanto preparati: revisione **247 → 364**, totale **119 record**. I due record preesistenti sono composizioni cliente e sono identici; file font e sorgenti originali invariati. Ogni nuova bozza ha provenienza con ID/hash, categorie originali e tag «PitchPrint» / «Da verificare», nessuna associazione commerciale o montatura. Copia di sicurezza completa con hash verificato prima della prima scrittura.

L’importazione ha usato l’endpoint amministrativo locale e i suoi comandi con revisione attesa, senza scritture dirette al file dell’archivio. La deduplicazione per ID/hash originale evita duplicati e sovrascritture. Manifest e backup sono privati e non entrano nel repository. Riepilogo: `.local/pitchprint-migration/import-plans/imported-117-colors-summary.json`.

**Tutti i 117 documenti salvati sono stati riaperti, controllati nel layout e riesportati in SVG nel browser**, senza errori o richieste esterne e senza modificare l’archivio. Verificati anche filtro «Da verificare», miniature e apertura di un template a colori dall’amministrazione; schermate dell’elenco e dell’editor ispezionate. Rapporto privato `imported-117-browser-verification.json`. Sono passate anche le **13 regressioni pubbliche locali**.

Il controllo separato dei caratteri rileva **95/117 senza segnalazioni automatiche**, **20 con simboli assenti nel file font dichiarato** e **due con copertura non verificabile (Continuum Medium)**. Zero font non incorporati. Questo controllo non cambia i file e non sceglie sostituti: apribilità/geometria non equivalgono a fedeltà tipografica approvata. I casi restano bozze «Da verificare» e il controllo font dell’editor mostra le segnalazioni. Elenco privato con collegamenti alle bozze: `.local/pitchprint-migration/import-plans/template-importati-font-da-verificare.md`; dati in `imported-117-font-verification.json`. Le miniature non costituiscono approvazione della resa dei simboli mancanti.

Per annullare in futuro questa importazione dopo ulteriori modifiche del titolare, usare gli ID del manifest e le revisioni correnti con i comandi amministrativi. Non ripristinare automaticamente l’intero backup sopra un archivio che potrebbe contenere modifiche successive.

## Evidenze finali e prossimi passi

Il primo giro generale è stato interrotto dopo 240 passati e due arresti durante caricamento/selezione, mentre il server veniva aggiornato. Il completamento a server stabile ha dato **138/138 passati**, inclusi i due casi precedenti e due ripetizioni: il confronto per riga/titolo con l’elenco dei test verifica **376 casi distinti su 376**, nessuno mancante. Il primo log non viene presentato come interamente passato. Rapporti privati: `.local/editor-color-full-browser.log`, `.local/editor-color-browser-completion.log`, `.local/editor-color-browser-consolidated.json`. Gli ultimi due browser coprono anche riflessione dell’immagine originale e passaggio esplicito B/N → colori originali.

Altre evidenze: `.local/editor-color-unit-final.log`, `editor-color-build-final.log`, `editor-color-public.log`, `editor-color-artifacts.log`, `editor-color-secrets.log` e i manifest dell’importazione. Nessun dato proprietario dei template/font è stato inserito in Git.

Prossimi interventi individuati: revisione dei 22 casi tipografici segnalati; estensione coerente del limite risorse sui contorni reali oltre 2 mm; recupero dei sorgenti ancora bloccati da font/effetti/asset non rappresentabili. Le associazioni commerciali dei 117 template restano vuote e potranno essere configurate in massa dopo la verifica. Il collegamento completo ai profili produttivi e la certificazione Illustrator restano distinti dall’importazione delle bozze.
