# Bozze, template, cambio modello e preparazione profili — 9 novembre 2026

Mandato: proseguire autonomamente durante l’assenza del titolare sulle funzioni definite, privilegiando semplicità e casi reali. Decisioni esplicite ricevute: modello iniziale del template = più piccolo compatibile; riduzione proporzionale solo entro i vincoli, con anteprima/conferma; ammessa anche la sola foratura.

## Percorsi da provare

- Editor: <http://127.0.0.1:5173/editor?workspace=1&configurations=1>.
- Galleria: <http://127.0.0.1:5173/editor/templates>.
- Backend: <http://127.0.0.1:5173/editor/admin>, sezioni Template e Profili produttivi.

Tutto locale. Nessun collegamento commerciale, prezzo o disponibilità inventati. Il catalogo di questa prova resta il sottoinsieme di tre modelli 4912/4913/4915 già presente in `fixtureCatalog`, con identificativi reali e misure censite, distinto dall’archivio esteso delle montature usato dalla chat. Non certifica area utile e produttività: il canvas usa ancora profilo e margine TEST di 1 mm.

## Autosalvataggio e recupero

Il solo editor autonomo `/editor` salva le modifiche concluse in IndexedDB sul browser/dispositivo corrente. La chat pubblicata e il canvas incorporato nel laboratorio della chat non ricevono questa nuova persistenza. L’analisi non invia dati a servizi esterni.

Alla riapertura dello stesso formato, il cliente può **Riprendere la bozza** oppure **Continuare con una nuova bozza**, conservando quella precedente. Se inizia direttamente a modificare, il nuovo lavoro viene salvato separatamente. L’elenco **Bozze salvate su questo browser** offre ripresa, download JSON ed eliminazione con conferma; una bozza di un altro modello richiede prima la scelta del suo formato. Le aperture esplicite da template/configurazione/archivio iniziano una nuova copia, senza sostituire una bozza esistente.

Gli aggiornamenti usano un controllo atomico della versione: due schede non sovrascrivono silenziosamente la stessa bozza. In caso di conflitto, **Salva come nuova bozza** conserva entrambe. Indice e documento sono scritti nella stessa transazione. Un nuovo documento importato con ID diverso riceve una bozza distinta. Il cambio formato confermato conserva preventivamente la composizione originale.

Limiti locali: 20 bozze, 10 MB per progetto, 64 MB complessivi; nessuna eliminazione automatica per fare spazio. In caso di storage indisponibile o pieno, l’editor e il download JSON rimangono utilizzabili. I gesti/testi ancora in editing non sono documenti validati salvati: la navigazione avverte quando restano operazioni o modifiche non salvate. Gli autosalvataggi conservano l’ultima bozza, **non uno storico completo di ogni revisione**.

L’archivio dipende da browser e origine: `127.0.0.1:5173` e `localhost:5173` sono distinti. Cancellare i dati del browser può eliminarlo. Nessun account, backup remoto, trasferimento tra dispositivi o politica di conservazione online è implementato qui.

## Associazioni e galleria template

Nel backend selezionare un template e impostare **Modelli associati al template**, poi salvare. Le associazioni sono molti-a-molti, indipendenti dal prodotto con cui fu creato il documento; solo chiavi del catalogo di prova sono accettate. Un template senza associazioni non si può usare nella galleria.

La galleria sceglie il modello ammesso più piccolo che contiene la composizione **alle dimensioni originali**, ordinando per area nominale (cerchi compresi), poi ingombro e chiave stabile. Non è una scelta per prezzo. Il confronto considera gli ingombri misurati dal renderer e i vincoli TEST, senza deformare o ridurre all’ingresso per forzare la scelta di un prodotto piccolo.

Il cliente può confrontare gli altri modelli associati. Se occorre una riduzione uniforme, vede la percentuale e l’anteprima; sotto i limiti, inclusi i 7 pt anche nei singoli run, la proposta viene respinta. **Conferma e personalizza il template** apre una copia nel formato selezionato. Link dal pannello Progetto consente la ricerca di template per il modello corrente.

La versione del record e le associazioni sono ricontrollate all’apertura: una modifica amministrativa dopo l’anteprima non applica una sorgente differente. Il comando grafico tipizzato `applyTemplate` sostituisce gli oggetti in una singola revisione, conserva origine/versione, gruppi/font e permette Undo/Redo. Il documento originale in archivio resta invariato. La provenienza è informazione del prototipo locale, non una firma o prova di approvazione produttiva.

## Cambio modello nell’editor

Dal pannello **Modello**, premere **Cambia modello**, scegliere il formato e confrontare prima/dopo. Un formato più grande conserva misure fisiche e corpo; un formato più piccolo può proporre riduzione uniforme. Nessuna conferma se i vincoli non sono rispettati. La proposta non modifica il documento.

**Conferma cambio modello** conserva una copia originale nelle bozze, poi applica il nuovo comando `changeFormat`. Il motore risolve la chiave nel contesto catalogo fornito dall’applicazione e rifiuta chiavi inventate, cataloghi diversi, revisioni obsolete e contesti mancanti. Manuale e simulazione AI usano la stessa operazione. Annulla/Ripristina recuperano anche montatura/variante; il selettore segue il documento canonico senza invalidare lo storico. Il carrello di prova conserva le configurazioni già congelate.

Si riusa l’algoritmo di similitudine già presente: font, spaziature, tracciati, immagini e contorni scalano coerentemente, senza compressioni indipendenti degli assi. I controlli di contenimento dei cerchi e degli oggetti ruotati sono quelli del validatore TEST, conservativi rispetto ai soli contorni dipinti. Non sono ancora i controlli reali per zone meccaniche, incisione o fissaggi.

## Backend di preparazione dei profili produttivi

Nuova sezione **Profili produttivi**: profili locali versionati, modificabili e archiviabili per timbro inchiostrato, timbro a secco, targa incisa o stampa. Area utile, margine, zone riservate e schemi di fissaggio possono essere compilati senza inventare i dati mancanti. Associazione al modello separata dalle misure utili; l’area utile non può superare il nominale della variante conosciuta. La catalogazione locale corrente non contiene prodotti targa, quindi i loro profili restano non associati.

Le regole dichiarate sono distinte: timbri inchiostrati 7 pt e immagini B/N; incisione 0,5 mm nelle parti incise e 30 mm tra vernici differenti; stampa senza ereditare questi minimi. Timbri a secco con dati specifici ancora da compilare. I campi non certificano la misura dei dettagli dei font o dei loghi.

Fissaggi: **solo fori** oppure kit, anche senza foratura. Se forati: diametro, offset orizzontale/verticale dal bordo al centro, zona di rispetto e schema due superiori/due inferiori/quattro angoli. Le posizioni sono derivabili con offset fisici invarianti al cambio formato, senza percentuali. Rifiuto degli schemi con fori sovrapposti o esterni al supporto, anche tondo. Le misure incomplete rimangono segnalate.

**Questa sezione raccoglie dati; i nuovi profili non governano ancora il canvas.** Non è disponibile la scelta/renderizzazione dei fissaggi nell’editor né il blocco delle aree meccaniche in tutti i comandi. Tutti i profili conservano `validatedForProduction:false`. I contatori di versione non costituiscono uno storico completo recuperabile. Prezzi, utensili e tempi macchina non vengono calcolati; servono dati reali e il contratto Preventivometro/BSS.

## Moduli e verifica

- `src/editor-workflow/drafts.ts`, `DraftPanel.tsx`: persistenza e UI delle bozze.
- `TemplateGallery.tsx`, `template-fit.ts`, `src/editor/format-adaptation.ts`: galleria e adattamento deterministico.
- `ProductPanel.tsx`, `DocumentPreview.tsx`, `model.ts`: proposta di cambio e comandi condivisi.
- `src/editor-admin/TemplateProductsEditor.tsx`, `production-profile.ts`, `ProductionProfilesPanel.tsx`, schema/store: gestione locale di associazioni e dati produttivi.

Nuovi test: tre unitari bozze, otto adattamento/template/comandi, associazioni backend e cinque unitari profili; dieci casi browser nuovi tra persistenza, conflitto, galleria, versione obsoleta, cambio/undo e pannello produttivo. Il primo test del pannello ha evidenziato le etichette implicite dei menu: corrette con nomi accessibili espliciti, poi passato. I campi tecnici accettano decimali esatti, senza vincolo di step che impedisca misure valide.

Checkpoint e log in [editor-local-status.md](editor-local-status.md). Screenshot privati in `.local/previews/editor-{template-gallery,format-change}-{desktop,mobile}.png`, `editor-draft-recovery.png` e `editor-production-profile.png`. Tutte le prove amministrative usano archivi temporanei; le misure sintetiche sono marcate TEST. Nessuna modifica alla libreria personale.

Nessun deploy, scrittura Shopify o modifica a tema/BSS/PitchPrint/prezzi/carrello/checkout reali. Nessuna nuova chiamata AI a pagamento. Illustrator e lavorazione fisica non collaudati.
