# Risultati — primo incremento locale, 5 novembre 2026

Esecuzione effettiva su macOS, Node 24.17.0, npm e dipendenze fissate dal lockfile. Nessun test sul carrello o checkout reale.

| Comando / controllo | Risultato |
|---|---|
| `npm run check` → `npm test` | **33/33 superati**, tre file; include 14 scenari tabellari di selezione |
| `npm run check` → `npm run build` | **Superato**, TypeScript strict + Vite; nessun avviso sui chunk dopo caricamento differito del laboratorio |
| `npm run check` → `npm run test:e2e` | **5/5 superati**, Chromium, durata ultima esecuzione 6,2 s |
| `npm run schemas` | **Superato**, otto JSON Schema generati da Zod |
| `npm run fixtures:editor` | **Superato**, JSON canonico TEST generato |
| `npm run capture:lab` | **Superato**, SVG effettivo Fabric e tre screenshot locali |
| QA visiva screenshot | Desktop selettore/editor e mobile 390 px ispezionati; nessuna sovrapposizione o testo tagliato rilevato |
| `npm audit --omit=dev --json` | **0 vulnerabilità note runtime** al momento della verifica; non è un audit completo di sicurezza |
| Scansione sorgenti, documenti, fixture e DOCX iniziale | **0 corrispondenze** per pattern di token/chiavi private cercati; non una garanzia assoluta |
| Validatore Shopify sulla query URL, senza prompt privato | **VALID**, schema Admin 2026-10, scope richiesto `read_products` |

## Evidenze funzionali

- Richiesta iniziale con logo e sei righe → chiarimento montatura → ingombro 50×20 → candidati 4913/4915 con ID reali e motivazioni. Link del primo candidato uguale all'`onlineStoreUrl` restituito dall'Admin API.
- Ricaricamento conserva requisiti; nuovo ingombro 60×23 lascia solo 4915 conservando il logo. Nessuna richiesta verso servizi esterni nel test del selettore.
- UI manuale cambia text-1; comando simulato sposta lo stesso ID. Revisione vecchia rifiutata; export JSON uguale allo stato; riapertura incrementa revisione e cambio sezione conserva il documento.
- Trascinamento con mouse Chromium aggiorna posizione canonica: testo da x=5 mm a x=7 mm. La prima prova ha identificato rientro nel completamento del gesto Fabric: corretto differendo il commit fino al termine dell'evento e acquisendo la revisione all'inizio del gesto. Test mirato e regressione completa successivi superati.
- SVG reale contiene testo e rettangoli vettoriali, entità XML escapate, niente immagini raster; width/height 58mm/22mm e viewBox 464×176. Il nuovo export del JSON canonico coincide col riferimento `fixtures/illustrator/stamp.TEST.svg`.
- Profilo editor solo TEST: rifiuto font sotto 7 pt, colori fuori bianco/nero, ID sconosciuti, oggetti fuori area e comandi obsoleti; undo/redo/import mantengono revisione monotona.
- Input HTML non interpretato, tool amministrativi e argomenti estranei rifiutati, provider offline/malformato/timeout gestibile con scelte guidate.

## Esiti iniziali risolti / limiti degli strumenti

- I primi controlli hanno segnalato dichiarazione CSS e uso asincrono del percorso download: corretti prima della build finale.
- Avvio iniziale e2e prima del completamento download Chromium: test non eseguibili, poi ripetuti dopo installazione completa.
- Generatori tsx CLI richiedevano una pipe IPC non consentita dalla sandbox: script aggiornati a `node --import tsx`, ora eseguibili.
- Controllo versione Shopify CLI ha tentato autoaggiornamento, interrotto. Nessuna CLI usata per installare app o modificare lo store.
- Validazione aggiuntiva dello schema Shopify inizialmente bloccata dal controllo automatico perché il comando includeva il prompt con percorsi locali. Quel comando non è stato eseguito; ripetuto senza prompt e con telemetria disattivata, risultato VALID su Admin 2026-10. Le query eseguite dal connettore sono inoltre validate dal suo schema.

## Accettazione e limiti residui

**Completato per il primo incremento:** audit, piano, schemi dati, fixture con dati reali, regole spiegabili, percorso locale completo fino al link, contratto AI sostituibile, demo Fabric con stato condiviso e export, checklist e documentazione.

**Non completato / non dichiarato verificato:** provider LLM reale e qualità dialogo, costo AI per sessione misurato, catalogo aggiornabile, profili produttivi certificati, accessibilità completa, SVG complessi, loghi/gruppi/testi multilinea e collaudo umano Illustrator. Nessun test Illustrator effettuato; compatibilità/editabilità/font/misure fisiche sono ancora da registrare in `production-files.md`.

BSS V1/V2 e rollback, stato tema live e significato dei tag No-AI richiedono conferme documentate. Nessuna modifica o migrazione Shopify/BSS/PitchPrint eseguita. Per la prima landing pubblicabile occorrono gate della specifica e autorizzazione esplicita.

Prossima azione: confermare profili e tag dei tre timbri e aprire il campione SVG in Illustrator; poi concordare backend/provider e budget per un incremento AI reale. Fonti di integrazione e handoff documentati in `integrations.md` e `handoff-review.md`.
