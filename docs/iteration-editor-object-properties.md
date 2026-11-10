# Proprietà degli oggetti nei template — 10 novembre 2026

Richiesta del titolare sulla schermata PitchPrint. Proprietà configurabili nella nuova scheda **Proprietà template** dell’ispettore amministrativo; salvate nell’oggetto del documento canonico, nelle copie e nello storico Undo/Redo. La vista cliente non può modificarle.

| Proprietà | Comportamento |
|---|---|
| Label | Titolo descrittivo, comune a ispettore, livelli e modulo. L’ID stabile dell’oggetto resta distinto. Nessun precompilamento automatico con dati dell’account. |
| Ordine nel modulo | **Crescente per scelta esplicita del titolare: 1 prima di 5**, 0 iniziale, valori negativi ammessi. Non cambia l’ordine dei livelli; a parità conserva l’ordine del documento. |
| Formato testo | Testo libero, email, telefono, sole cifre oppure CAP italiano. Controllo completo alla conferma cliente; digitazione parziale consentita, campi vuoti facoltativi, nessuna correzione automatica. |
| Limite caratteri | Per singolo box, conteggio di punti Unicode coerente con i comandi testuali. Nessun troncamento silenzioso. Un tentativo non applicato nel modulo impedisce la conferma della precedente versione. |
| Blocca trasformazioni | Cliente: movimento, scala e rotazione bloccati nel canvas e nel motore, comprese selezioni multiple/allineamenti. Amministratore libero di comporre il template. Il contenuto testuale resta modificabile; la sostituzione di un’immagine dal modulo conserva il centro e la adatta allo spazio disponibile senza deformarla. |
| Blocca selezione | Nessuna selezione dal foglio, dai livelli o con Seleziona tutto. I gruppi con un membro bloccato restano esclusi come unità. Se incluso nel modulo, testo/logo può essere compilato da lì. |
| Blocca eliminazione | Impedisce cancellazione, taglio, cestino e rimozione implicita tramite sostituzione del layout; operazioni multiple atomiche. |
| Nascondi menu | Nasconde al cliente i controlli dell’oggetto nell’ispettore. Non sostituisce i blocchi operativi; il testo può restare compilabile. |
| Includi nel modulo | Con Label valorizzata mostra il campo in **Compila i dati**: testo editabile, immagine sostituibile, forme richiamabili per la selezione se consentita. Un oggetto di riferimento non entra nel modulo. |
| Elemento di riferimento | Guida visibile sul foglio e conservata nel JSON, esclusa da SVG, PDF, PNG, miniature e anteprime. Non rappresenta una zona meccanica produttiva. |

Il comando amministrativo è `setObjectProperties`; contenuto del modulo e interventi sul canvas usano gli stessi `setText`, `replaceImageSource` e comandi grafici validati. Il motore controlla anche `updateObject` e operazioni multiple: nascondere un pulsante non è l’unica protezione. L’apertura iniziale di un template costituisce la base della sessione, così Undo non può tornare alla scena provvisoria precedente rimuovendo i blocchi.

Le modalità locali dell’URL non costituiscono autenticazione per una versione online. I permessi devono essere verificati dal futuro backend; nessun collegamento all’AI grafica reale o allo store attivato.

Fonti primarie consultate: [Admin Design Editor](https://docs.pitchprint.com/article/66-design-editor), [Data Form](https://docs.pitchprint.com/article/40-data-form-module), [creazione dei design](https://docs.pitchprint.com/article/46-how-to-create-a-design). L’ordine crescente è la scelta del titolare e differisce dall’ordine descritto da PitchPrint. Chain, List, Tags e Hooks non erano indicati dalle frecce e non sono stati aggiunti con questo incremento.

Verifiche: test del motore su conflitti, blocchi manuali/AI, selezioni multiple, conteggio Unicode, formati e riferimenti; prove browser su configurazione amministrativa, modulo cliente, immagini e file SVG/PNG. Esiti consolidati nello [stato locale](editor-local-status.md).
