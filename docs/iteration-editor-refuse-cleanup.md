# Refusi PitchPrint e ultimi due viari multipagina — 12 novembre 2026

Direttive del titolare: i box vuoti, quelli senza caratteri visibili e gli oggetti palesemente fuori canvas sono refusi eliminabili. Questa autorizzazione supera, per questi casi, la precedente richiesta di conservare ogni elemento. Gli originali restano intatti e i casi parzialmente fuori foglio restano editabili.

## Comportamento

- L’importatore rimuove testi costituiti soltanto da spazi Unicode, ritorni a capo, caratteri di formattazione e selettori di variazione. Non basta `trim()`; un testo con un carattere visibile resta. Nessun font viene richiesto per il campo eliminato. I controlli di sicurezza del sorgente rimangono attivi.
- Dopo la conversione rimuove gli oggetti il cui intero ingombro è strettamente disgiunto dal foglio. Conserva intersezioni parziali, tangenze e casi geometricamente ambigui. Ripulisce appartenenze, gruppi vuoti e riferimenti dello sfondo. Ogni rimozione produce un avviso con ID; nessun rinumeramento degli altri elementi.
- Questa politica riguarda la migrazione. Nel normale editor si può svuotare temporaneamente un box, ridigitarci, mantenerlo fuori foglio o ridimensionarlo tramite le maniglie esterne. Svuotamento manuale e AI condividono comandi e Undo/Redo; larghezza del frame e altezza automatica restano utilizzabili. Anche il box vuoto richiede il file esatto del font, senza fallback.
- Angoli proporzionali, Shift libero e lati indipendenti rimangono come nel [precedente incremento](iteration-editor-resize.md), inclusi i nuovi test dei box vuoti. Gruppi e testo su tracciato mantengono la scala uniforme.

## Archivio reale locale

Riattivate prima le due copie archiviate «Dietro al vetro» e «Sul davanti», conservandone inizialmente ogni oggetto. Dopo l’autorizzazione a eliminare i refusi, rimosso in ciascuna soltanto il rettangolo `pp-4` di circa 0,268 mm, totalmente esterno. Comandi grafici validati, Undo, confronto prima/dopo: **zero pixel differenti**. Copie aggiornate alla versione 4, ID e provenienza invariati.

Importati anche «60x20 due righe» e «60x20»: due pagine ciascuno, tre box vuoti rimossi per sorgente. Tutte e quattro le pagine confrontate con il riferimento nativo indipendente; rapporti di differenza inferiori a 0,000467, errore medio per canale inferiore a 0,035. Formati **700 × 400 mm**, come nei dati fisici del sorgente: il nome del template non viene usato per reinterpretarli. Colori, font, altri elementi e materiali di riferimento conservati.

**300 template, tutti attivi; due composizioni e 219 font; revisione 590.** Nessuna associazione prodotto modificata. Altri record, impostazioni, font e profili confrontati tramite impronte e conservati. Le quattro copie interessate sono state riaperte dall’archivio; quattro miniature verificate e riutilizzate dalla cache senza riletture dei record o scritture durante i controlli.

Backup privati, fuori dal repository:

- Ripristino iniziale: `external-template-recovery/backup-revision-584.json`, SHA-256 `29f537bd8ab3aefe4b2c976b3487fa4e9d6f736cc603ba5eb34b0c7aba821202`.
- Importazione: `multipage-empty-local-import/backup-revision-586-4a105b42bbc9.json`, SHA-256 `4a105b42bbc974e5df37f4f64e41415f390e5b133d788693213adae1000600fb`.
- Pulizia: `refuse-cleanup/backup-revision-588.json`, SHA-256 `1c8334c2c83baf43aaf7fbea866ee0e9be6780d4e3c17c78beff672875e8c579`.

Percorsi relativi a `.local/pitchprint-migration/`. Rapporti di preparazione/importazione/riapertura/cache nelle stesse directory; sorgenti originali non modificati.

## Audit multipagina già importati

Verificate **tutte le 300 copie** contro i rispettivi sorgenti locali acquisiti: 300 file trovati, zero differenze del numero di pagine, zero hash sorgente cambiati, zero box senza caratteri visibili nelle copie attuali. Otto libri conservano complessivamente **44 pagine**; le altre 292 copie sono monopagina come i loro sorgenti acquisiti. Non risultano copie da reimportare per perdita di pagine in questo insieme. Non è un nuovo download integrale da PitchPrint: eventuali sorgenti remoti aggiornati andranno confrontati in una successiva sincronizzazione, proteggendo modifiche locali.

Rapporto privato: `imported-scenes-current-audit.json`. «Templates PitchPrint» resta escluso; Biglietti da Visita e testi curvi restano a bassa priorità. L’audit dei refusi in tutte le geometrie storiche resta distinto dal controllo automatico dei box senza testo: non è stata eseguita una cancellazione indiscriminata sulle altre copie.

## Collaudo

- **902 unitari / 135 file** passati: `.local/refuse-all-unit.log`.
- Suite pertinente **69/70 passati**: `.local/refuse-pertinent-browser.log`. Il solo caso non concluso si è fermato prima dell’editor, sull’attesa di caricamento di cinque secondi durante altre prove locali. Ripetuto isolato tre volte insieme ai due casi di ridimensionamento del box vuoto: **9/9 passati** (`.local/refuse-resize-repeat.log`). Tutti i 70 scenari verificati fra esecuzione e ricontrolli; il primo comando resta fallito. Ulteriori cinque casi di pulizia/importazione atomica passati in `.local/refuse-final-browser.log`.
- **52 campioni** riaperti/esportati senza errori browser o rete esterna (`.local/refuse-artifacts.log`); nuovo `empty-text.TEST.json/svg`, generatore `scripts/capture-editor-empty-text.ts`. Schermata ispezionata: frame vuoto selezionabile e controlli utilizzabili.
- **13 test pubblici**, Worker locale, build, schemi e controlli segreti verificati; JavaScript pubblico ancora `index-BG2r_x-8.js`.

Non una nuova suite browser generale. Nessun deploy, modifica commerciale o collaudo Illustrator dichiarato.

Prossimo: completare la verifica dei sei materiali/targhette preparati, distinguendo supporti e viti dai contenuti produttivi; poi rivalutare i restanti 47 casi prioritari con le nuove regole sui refusi. Nessuna reimportazione automatica di copie già modificate dall’utente.
