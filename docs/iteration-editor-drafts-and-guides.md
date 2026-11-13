# Compila i dati, righelli, cancellazione guide e bozze — 13 novembre 2026

Il comando condiviso `setText` conserva ora l’ancoraggio superiore coerente con l’allineamento sinistro/centrato/destro. Il testo autoespandibile modificato dal modulo non rimane agganciato a sinistra quando è centrato. Gli allineamenti espliciti dei paragrafi vengono trasferiti ai nuovi intervalli Unicode; gli intervalli carattere obsoleti vengono eliminati come prima. Testo su tracciato e blocchi cliente mantengono i comportamenti precedenti. Con metriche del font non verificabili non vengono inventate misure o sostituiti file font.

Riprodotto il pulsante righello inattivo all’apertura diretta di un template: il ref del contenitore non era ancora assegnato quando partiva l’effetto del figlio. L’inizializzazione usa ora un effetto successivo al montaggio; scale, PAN/zoom e guide funzionano al primo caricamento. Il pulsante cambia in Nascondi righelli e mostra un breve aiuto.

Le guide si eliminano trascinandole fuori dal **foglio**, anche rilasciando nel margine ancora interno al viewport. Un semplice clic nel margine non cancella. Sono disponibili menu tasto destro e Shift+F10, Elimina guida, Esc per chiudere e ritorno del focus, Canc e Undo. Guide bloccate protette; quelle visibili restano magnetiche con gli agganci attivi, Alt li sospende. Guide e menu non cambiano gli oggetti né compaiono negli output.

## Gestione delle bozze

- Editor: aprire Compila i dati/Prodotto e fissaggi → Bozze salvate su questo browser → Elimina tutte le bozze di questo template.
- Amministrazione: Template → selezionare una voce → Bozze del template → eliminazione con conteggio e conferma.
- Impostazioni: pulizia di tutte le bozze anteriori al numero di giorni impostato, con conteggio e conferma; soglia temporale precisa, esclusa la data di confine.
- Impostazioni: massimo per template/browser da **1 a 100**, valore iniziale **20**. Si applica dalle nuove aperture. Una nuova bozza sostituisce le più vecchie dello stesso template; aggiornare quella aperta non crea nuove voci. Abbassare il limite non elimina subito i dati esistenti: la rotazione scatta al prossimo nuovo salvataggio.

Scrittura e rotazione condividono una transazione IndexedDB; quota complessiva invariata a 256 MiB, verificata dopo le rimozioni previste, senza sacrificare altri template per liberare spazio. La pulizia verifica nuovamente tutte le versioni nella stessa transazione: se una bozza è cambiata, annulla l’intera operazione. Le altre schede ricevono la notifica. La grafica aperta resta disponibile e viene salvata nuovamente solo alla prossima modifica, evitando ricreazioni immediate e cicli fra schede.

Il riepilogo ha un riferimento opzionale al template. Le bozze storiche vengono riconosciute dall’origine del documento oppure dal suo ID originale; non dal solo prodotto. Nessuna riscrittura dei payload durante la lettura, nessun aumento di versione del database. Il riconoscimento storico ha una piccola cache dei soli metadati; le nuove bozze prive di template sono distinte da quelle ancora da riconoscere, evitando riletture ripetute dei documenti. Nell’editing amministrativo di un template copiato, il record aperto prevale sull’origine storica.

**Ambito:** sono le bozze di recupero **di questo browser**, separate da template e composizioni salvati in SQLite. Questi comandi non cancellano bozze su altri dispositivi/clienti. La futura pulizia globale dei clienti richiederà la persistenza lato server. Nessuna bozza personale eliminata durante i test e nessun limite salvato nell’archivio principale per conto dell’utente.

## Verifiche

- **1.253 unitari / 179 file passati** (`.local/draft-management-delivery-units.log`). Copertura nuova: ancoraggio sinistro/centrale/destro, inclinazione/riflessione/rotazione, Unicode e allineamenti per paragrafo, box fisso, manuale/AI e storico, quota/rotazione, isolamento dei template e soglia per giorni.
- **48 browser locali pertinenti passati**: 16 su modulo, primo caricamento, righelli/guide, editor/admin, rotazione, versioni concorrenti, bozze storiche, due schede, menu/tastiera e mobile (`draft-management-guides-final.log`); 32 regressioni esistenti su bozze, modulo, sessioni, allineamenti, tracciati e multipagina (`draft-management-regression-browser.log`). Non è una nuova esecuzione della suite browser generale.
- **13 browser pubblici passati**, build locale e pubblica e scansioni dei segreti passate (`draft-management-final-build.log`, `draft-management-public-*.log`, `draft-management-secrets.log`). Schemi amministrativi rigenerati. JavaScript della chat invariato: `index-BG2r_x-8.js`.
- **76 campioni JSON/SVG riaperti ed esportati**, senza errori browser o richieste esterne e senza caricamento di font personali (`.local/draft-management-artifacts.log`).
- Schermate TEST desktop/mobile e impostazioni in `.local/previews/editor-draft-management-*.png` e `admin-draft-settings.png`, ispezionate visivamente. Nessun nuovo collaudo Illustrator.

Archivio principale verificato in sola lettura: **SQLite R638, 346 template, due composizioni, 219 font e un profilo**, invariato (`.local/draft-management-archive.json`). Nessun deploy, migrazione SQLite o intervento su negozio, tema, PitchPrint, BSS, prezzi, carrello o checkout.
