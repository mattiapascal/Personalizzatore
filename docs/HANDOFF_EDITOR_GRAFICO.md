# Handoff — sviluppo locale del configuratore grafico

Aggiornato l’8 novembre 2026 tramite lettura del repository. Base applicazione: `5ddbc84`. Questo documento prepara il lavoro della prossima chat: non autorizza la sostituzione di PitchPrint nel negozio o un deploy.

## Obiettivo e confini

Sviluppare nel laboratorio locale il configuratore destinato, dopo collaudo e autorizzazione separata, a sostituire PitchPrint. Partire dai timbri e conservare un’architettura estendibile alle altre famiglie. Riutilizzare il prototipo Fabric esistente; l’editor deve funzionare manualmente anche senza AI.

La chat e il selettore sono già pubblicati, mentre il canvas è soltanto nel laboratorio locale. Preservare questa separazione. Nessuna modifica al Worker pubblico, al tema, a PitchPrint, BSS, prezzi, varianti, carrello, checkout o ordini durante questa fase. Nessuna migrazione BSS V1/V2. I dati economici rimangono responsabilità del Preventivometro/BSS, non dell’editor.

## Letture iniziali

1. `AGENTS.md`: vincoli operativi e autorizzazioni circoscritte.
2. `01_Specifica_Progetto.md`: specifica originale; il vecchio nome `01_Specifica_Progetto_Codex.md` non esiste in questa cartella.
3. Questo documento: stato locale e perimetro della nuova fase.
4. `README.md`: avvio e comandi attuali.
5. `docs/production-files.md`: formati e checklist umana Illustrator.
6. `docs/iteration-variant-dimensions.md`: fonte autorevole delle misure.
7. `docs/handoff-review.md` e `docs/integrations.md`: responsabilità e riferimenti ai progetti esterni.
8. `docs/release-cloudflare.md` e `docs/releases/2026-11-07-knowledge.json`: distinguere il servizio già online dal laboratorio.
9. Se si modifica l’AI, leggere anche `REGOLE_ASSISTENTE.md`, `CONOSCENZE_ASSISTENTE.md` e `docs/knowledge-assistant.md`.

`docs/iteration-canvas.md`, `docs/architecture.md` e varie sezioni di `docs/test-results.md` descrivono incrementi storici. Le frasi «nessun LLM reale», «nessun aggiornamento Shopify» o «nessun deploy» non rappresentano più lo stato generale: AI, sincronizzazione e pubblicazione della sola chat sono state completate successivamente. Rimane attuale il limite specifico: **nessun collegamento del modello reale ai comandi grafici**.

## Cosa esiste nel codice

- `src/editor/model.ts`: schema del documento canonico e degli oggetti, `GraphicCommandSchema`, validazione e `DocumentStore`, con revisioni monotone e ID stabili. Lo store non è in un file `store.ts` separato.
- `src/editor/fabric-adapter.ts`: renderer Fabric, misure, scrittura diretta nel canvas tramite IText, trascinamento ed esportazione SVG.
- `src/editor/EditorLab.tsx`: UI del laboratorio, import/export JSON, undo/redo, conflitti di formato e pannello sviluppatore per comandi JSON simulati.
- `src/App.tsx`: passaggio dal candidato al canvas; associazione prodotto/variante/versione e testo raccolto nella chat.
- `src/public/`: interfaccia pubblica separata, priva di editor Fabric. Non aggiungere qui il nuovo editor in questa fase.
- `tests/editor.test.ts` e `tests/e2e/local.spec.ts`: regressioni del modello e dei gesti browser.
- `fixtures/illustrator/`: esempi JSON/SVG di prova; alcune fixture sono storiche, leggere le note prima di usarle.

Funzionalità presenti: selezione prodotto → «Prova nel canvas», testo modificabile direttamente nel canvas, trascinamento, undo/redo, salvataggio e riapertura JSON, SVG con dimensioni fisiche, cambio prodotto con conservazione degli oggetti solo se validi nel nuovo formato. Un errore deve conservare il progetto precedente.

Perimetro effettivo: oggetti testo/rettangolo/cerchio; testo Arial, massimo 8 righe e 480 caratteri; colori nero/bianco. Scala e rotazione degli oggetti bloccate nell’adapter. I soli comandi grafici attuali sono `moveObject`, `setText` e `setObjectStyle`. Gli esempi AI del pannello grafico sono simulati, anche se l’assistente commerciale usa già OpenAI.

## Cosa manca per sostituire PitchPrint

- Gestione completa degli oggetti: aggiunta, eliminazione, duplicazione, ridimensionamento, rotazione, ordinamento, allineamenti e selezione multipla; definire l’ordine di implementazione.
- Loghi e immagini SVG/raster, gestione sicura dei file importati, font aggiuntivi e metriche affidabili; gruppi e scene complesse.
- Comandi grafici AI reali, tipizzati e validati, sullo stesso store delle modifiche manuali; gestione delle risposte obsolete e dei conflitti.
- Autocomposizione che valuti l’ingombro effettivo, senza deformare loghi o ridurre caratteri sotto il limite del profilo.
- Profili produttivi confermati, area utile e margini reali, regole specifiche di lavorazione.
- Salvataggio persistente dei progetti/file e futura approvazione della bozza; definire prima privacy, accessi e conservazione.
- Integrazione nel tema e trasferimento di configurazione/file al percorso commerciale: fase futura, con autorizzazione e contratto dedicati.
- Collaudo produttivo Illustrator e prove su dispositivi fisici.

Non trattare questi punti come funzioni già disponibili o come un mandato a implementarli tutti nel primo incremento.

## Invarianti da preservare

Un solo documento grafico: gesti manuali e AI passano dagli stessi comandi validati, con ID e revisioni. Fabric non deve diventare una seconda fonte di verità. Unità canoniche mm/pt; pixel soltanto per visualizzazione.

JSON editabile e SVG di produzione sono artefatti distinti. Gli attuali documenti hanno `fixture: true`, `validatedForProduction: false` e profilo `TEST-stamp-v1`: non rimuovere questi indicatori per far apparire certificato il prototipo.

Le dimensioni nominali dei timbri derivano esclusivamente dai metafield variante `custom.larghezza` e `custom.altezza`. Non sostituirli con titolo, opzioni o descrizione. Dimensione nominale, area utile e margine produttivo non sono sinonimi. I 7 pt, il margine TEST di 1 mm e il nero/bianco del prototipo non sono regole universali.

I contenuti originali e i dati identificativi raccolti nella chat rimangono sul dispositivo per la composizione; verso OpenAI devono passare per la protezione privacy già esistente. Non introdurre un nuovo invio diretto di testo o file privati. Non cambiare budget, segreti o impostazioni di condivisione per attivare prove.

## Prima iterazione consigliata

1. Rileggere istruzioni, verificare Git, strumenti e codice attuale; non presumere che il conteggio prodotti o lo stato live siano immutati.
2. Avviare il laboratorio e riprodurre candidato → canvas → modifica diretta → JSON → riapertura → SVG.
3. Proporre una sequenza di piccoli incrementi, con criteri di accettazione; primo candidato: aggiungere/duplicare/eliminare oggetti con comandi condivisi e undo/redo. Valutare eventuali migrazioni dello schema prima di modificare i documenti esistenti.
4. Implementare il primo incremento locale concordato nel mandato della nuova chat, aggiungendo test significativi e mantenendo le regressioni commerciali.
5. Registrare risultati e limiti; consegnare file campione per il collaudo umano Illustrator. Nessun deploy.

## Avvio e verifiche

Dalla cartella del progetto, Node fissato in `.nvmrc`:

```sh
nvm use
npm ci
npm run dev
```

Aprire `http://127.0.0.1:5173`; dal candidato usare «Prova nel canvas». `.env.local` è privato e ignorato da Git: verificarne solo la configurazione necessaria, senza mostrarne i valori. Le letture catalogo locali possono usare l’accesso già configurato; le prove dell’editor devono poter usare fixture e trasporti di test.

```sh
npm run check
npm run schemas
```

`npm run check` comprende unit test, build, scansione dei segreti nel client e browser del laboratorio. Se cambiano moduli condivisi con il pubblico, usare anche `npm run check:release` (preparazione e test, senza pubblicazione). Non usare `worker:deploy` in questa fase. Gli script `eval:*` fanno chiamate AI reali e richiedono un budget autorizzato; non sono necessari al primo sviluppo manuale dell’editor.

Baseline documentata del 7 novembre: 211 test unitari, 38 browser laboratorio, 13 browser pubblici, runtime Worker/SQLite e controllo segreti superati. Questi test **non sono stati rieseguiti per questo handoff** e non certificano Illustrator. Il nuovo agente deve eseguire le verifiche appropriate alle proprie modifiche.

## Repository e documenti esterni

Continuare nel repository `mattiapascal/Personalizzatore`; verificare il ramo e le modifiche prima di lavorare. Il tema è un altro repository, con regole proprie. Non copiarvi automaticamente il laboratorio e non pubblicare l’editor insieme alla chat.

I documenti originali degli altri progetti non sono tutti duplicati qui. Per una futura integrazione rileggere gli handoff aggiornati e i rispettivi `AGENTS.md` nelle cartelle:

- `/Users/davide/Documents/Shopify/Temi/Mode mio 5.2.0`
- `/Users/davide/Documents/Shopify/Preventivometro`

La lettura storica è riassunta in `docs/handoff-review.md`, ma non prova lo stato attuale del negozio, del tema o del Preventivometro.
