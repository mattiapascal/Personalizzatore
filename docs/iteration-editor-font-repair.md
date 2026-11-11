# Correzione guidata dei caratteri mancanti

Incremento locale dell’11 novembre 2026, base `f0856a5`. L’audit delle 117 bozze segnala 20 composizioni con simboli assenti nei file font dichiarati e due con copertura non verificabile. Nessun font di questi progetti è stato sostituito automaticamente.

## Percorso manuale

Nel pannello **Font del progetto**, disponibile in modalità amministrativa/TEST, ogni segnalazione di caratteri mancanti offre il selettore **Font per i caratteri mancanti**. La scelta resta vuota finché l’operatore non indica esplicitamente una famiglia della libreria; quando esistono più file si sceglie anche lo stile reale. Il pulsante **Applica ai soli caratteri mancanti** modifica soltanto quelle occorrenze, appartenenti al font segnalato, nell’oggetto indicato.

Gli altri caratteri, gli altri oggetti, colore/decorazioni/crenature e il centro del testo restano conservati. La nuova metrica può cambiare l’ingombro e i ritorni a capo, da controllare nell’anteprima. Il file scelto viene incorporato senza eliminare quelli originali; niente grassetto/corsivo simulato. Annulla/Ripristina ripristinano stili e risorse. JSON riapribile e SVG restano distinti.

`missingCharacterFontCommand` rilegge la copertura dell’oggetto corrente, senza fidarsi della sola segnalazione ricevuta, e verifica che il file scelto contenga i caratteri richiesti. File non verificabile o ancora privo dei caratteri respinto; nessun font alternativo viene scelto automaticamente. Produce un normale **updateObject** con risorse e revisione attesa: lo stesso comando funziona per manuale e AI simulata, rispetta i blocchi del ruolo e rifiuta revisioni obsolete. I cambiamenti avvenuti durante il controllo asincrono annullano la preparazione. Nessun salvataggio amministrativo implicito.

Il selettore riusa la libreria/anteprime esistenti; l’etichetta distinta evita di confonderlo con il font dell’ispettore. Le varianti apparse durante il caricamento aggiornano anche questo controllo. Su telefono il percorso si apre dal pulsante Strumenti.

## Limiti ancora aperti

Questo incremento non corregge le bozze esistenti senza una scelta del titolare e non certifica font non analizzabili, shaping o Illustrator. Per sequenze Unicode composte non riscrivibili con gli indici attuali può servire l’editing diretto. La copertura nominale non equivale a un collaudo produttivo.

**Resta da eliminare il fallback visivo del browser nelle bozze che contengono ancora glifi mancanti.** La conferma è già bloccata dal controllo font, ma questo incremento agevola la correzione esplicita senza cambiare il rendering provvisorio né tutti i percorsi di esportazione. L’esempio prima della correzione mostra infatti una Omega di aspetto diverso da quella del file scelto. Prossimo intervento: proteggere anche anteprime/esportazioni e offrire la riparazione prima del rendering, preservando accesso al JSON originale e possibilità di annullamento. Non dichiarare già soddisfatto il requisito completo «mai font del computer» per bozze non corrette.

La lettura del font personale Continuum Medium ha individuato un terminale anomalo nella tabella cmap (segmento FFFF con offset FFFF), che spiega la copertura sconosciuta. Non è stata allentata la validazione né modificato il file; una futura riparazione richiede una copia verificata e una scelta esplicita, non un fallback.

## Campione portabile

[font-repair.TEST.json](../fixtures/illustrator/font-repair.TEST.json) / [SVG](../fixtures/illustrator/font-repair.TEST.svg), **80 × 40 mm**, testo «ABC Ω»: ABC nel file ABeeZee TEST e sola Omega assegnata esplicitamente ad Arimo. Due file OFL incorporati, copertura finale senza segnalazioni; il file ABeeZee limitato originale rimane identico. Generatore `node --import tsx scripts/capture-editor-font-repair.ts`. Zero errori browser/scritture amministrative, schermate di scelta desktop/mobile e risultato ispezionate in `.local/previews/editor-font-repair-*.png`; rapporto `.local/editor-font-repair-capture.json`. Nessun dato cliente nel campione.

Le prime prove del generatore attendevano il pannello mentre il cambio di viewport lo chiudeva; corretto il percorso di collaudo aspettando il layout e premendo Strumenti. Il testo sintetico iniziale conteneva anche lettere non incluse nel piccolo font di prova: controllata la sua cmap e usate lettere effettivamente presenti, così il campione esercita la sola correzione dell’Omega. Nessun file font o controllo è stato alterato per far passare la prova.

## Verifiche finali

- **645 unitari / 99 file passati**, inclusi tre nuovi casi su selettività, variante incorporata, rifiuti, blocchi e storico. Log `.local/editor-font-repair-unit-all.log`.
- **59/59 browser pertinenti passati** in `.local/editor-font-repair-browser-regression.log`; poi **due percorsi completi a 1440 e 390 px passati** in `.local/editor-font-repair-browser-responsive-final.log`. Questi includono copia JSON/ricarica e Undo/Redo. Il primo test mobile cercava il pannello prima di aprirlo: test corretto, non una nuova modifica applicativa. Non è una nuova esecuzione dell’intera suite browser.
- **23 campioni riaperti/riesportati**, zero errori browser e zero richieste esterne: `.local/editor-font-repair-artifacts.log`.
- Build/TypeScript e scansione segreti passati: `.local/editor-font-repair-{build-final,types-final,secrets}.log`. Contratti/schema invariati: si riusa updateObject.

Nessuna dipendenza nuova, importazione o riparazione nell’archivio personale, deploy, spesa AI, modifica a chat/negozio/tema/PitchPrint/BSS/prezzi/acquisti. Illustrator da verificare sui nuovi file.
