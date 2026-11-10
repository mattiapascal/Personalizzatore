# Editor locale: gestione oggetti — 8 novembre 2026

## Consegna

Riutilizzato il prototipo Fabric 7.4.0 esistente, senza aggiornare dipendenze. Aggiunti testo/rettangolo/cerchio dal pannello manuale, selezione sincronizzata canvas/elenco, duplicazione e cancellazione. Le copie conservano stile/geometria e partono sovrapposte; si spostano trascinandole. È possibile cancellare anche l’ultimo oggetto e ricominciare.

UI e pannello JSON simulato usano `DocumentStore.dispatch` e gli stessi nuovi strumenti: `addObject`, `duplicateObject`, `deleteObject`. Restano disponibili `moveObject`, `setText`, `setObjectStyle`. Revisione e schema obbligatori; payload e proprietà non previsti rifiutati. `addObject.objectId` deve coincidere con `arguments.object.id`; la copia specifica `arguments.newObjectId` e coordinate in mm. I nuovi ID manuali vengono generati con UUID. Selezionare non modifica la revisione.

Validazione prima del commit: massimo 30 oggetti, ID univoci, metriche Fabric, area rettangolare/circolare e vincoli TEST. Un errore non modifica scena, storico o redo. Undo/redo conservano gli ID e avanzano monotonamente la revisione: un comando precedente resta obsoleto.

Schema documento ancora v1: nessuna proprietà esistente migrata. Rimossa soltanto la cardinalità minima di un oggetto per rendere salvabili i documenti vuoti. I JSON storici sono ancora validi; il vecchio lettore v1 potrebbe rifiutare un nuovo JSON vuoto. Questo limite è locale e non coinvolge un editor online. JSON Schema rigenerati insieme al codice.

## File principali

- `src/editor/model.ts`: nuovi contratti, applicazione atomica e scena vuota.
- `src/editor/EditorLab.tsx`, `fabric-adapter.ts`, `editor.css`: strumenti manuali e selezione. CSS dedicato caricato solo con l’editor; CSS condiviso invariato.
- `tests/editor.test.ts`, `tests/e2e/local.spec.ts`: sette nuovi test unitari e due browser.
- `scripts/capture-editor-objects.ts`, comando `npm run capture:editor`: campioni riproducibili con rete esterna e API bloccate; JSON/SVG e screenshot desktop/mobile.
- `docs/editor-roadmap.md`, `docs/pitchprint-capabilities.md`: piano e inventario con fonti ufficiali, decisioni del titolare e miglioramenti proposti.

Nessuna modifica a `src/public`, chat commerciale, provider, regole assistente, backend/Worker, configurazione di pubblicazione o tema. Nessuna scrittura Shopify, PitchPrint, BSS, prezzi, carrello o checkout; nessuna chiamata AI reale, migrazione, upload o deploy.

## Verifiche eseguite

Repository inizialmente pulito su `main`, commit `6731add`. Node di shell 22.12.0 sostituito per i comandi dalla versione già installata **24.17.0** fissata in `.nvmrc`. Dipendenze presenti, nessun `npm ci` necessario. Un Vite locale dello stesso progetto avviato il 6 novembre aveva cache React incoerente (HTTP 504) e causava timeout prima della chat. Riavviato il solo processo locale in demo con AI/Shopify disabilitati; nessuna modifica a `.env.local`.

| Controllo | Esito |
| --- | --- |
| Baseline unità prima delle modifiche | 211/211 |
| `npm run check` dopo incremento | 218 unità + 40 browser laboratorio; build e scansione credenziali superate |
| `npm run test:storefront` | 13/13 browser della chat pubblica, su server locale e trasporti controllati |
| `npm run schemas` | Rigenerati i due contratti grafici; altri schemi invariati |
| Build e scansione finali dopo isolamento CSS | Superate |
| `npm run capture:editor` | JSON/SVG reali da Fabric, screenshot desktop/mobile, nessun errore browser |
| Collaudo umano Adobe Illustrator / dispositivi fisici | **Non eseguito** |

Test nuovi: manuale → simulazione → copia → eliminazione; annullamento/ripristino; isolamento dell’originale e del payload; tutti i tipi supportati; collisioni ID; comandi obsoleti; campi ostili; limite oggetti; layout circolare; scena vuota/import; selezione senza revisioni; blocco durante IText; download e riapertura dopo reload; errore atomico e layout mobile senza overflow della pagina. Il canvas largo rimane scorrevole su mobile: zoom adattivo non ancora implementato.

## Prova locale

Con Node 24.17.0, eseguire `npm run dev`, aprire `http://127.0.0.1:5173` e scegliere la demo a parole chiave. Richiesta: «Timbro autoinchiostrante rettangolare, non so le misure» → Trodat 4913 → «Prova nel canvas».

1. Aggiungere un testo, scriverlo con doppio clic e terminare con Esc. Selezionare anche dall’elenco.
2. Duplicarlo; trascinare la copia. Eliminare, annullare e ripristinare.
3. Aggiungere rettangolo e cerchio; esportare JSON e SVG.
4. Ricaricare e riaprire il JSON sul medesimo candidato. Nel pannello sviluppatore un comando con revisione vecchia deve essere rifiutato.

Campione: `fixtures/illustrator/objects.TEST.json` / `objects.TEST.svg`, 58×22 mm, testo originale e copia, rettangolo 10×5 mm e cerchio raggio 2 mm (dimensioni geometriche senza spessore del tratto 0,25 mm). Associazione al **catalogo fixture** `TEST-2026-11-05-v1`: riaprire nella demo, non su un catalogo reale con versione diversa. `capture:editor` prepara automaticamente il trasporto fixture per rigenerarlo. Screenshot in `.local/previews/editor-objects-{desktop,mobile}.png`, ignorati da Git.

## Limiti e prossimo incremento

Non è ancora un sostituto completo di PitchPrint: scala/rotazione, stili completi, livelli, allineamenti, gruppi, import loghi e filtri restano da implementare. Le aggiunte manuali hanno dimensioni iniziali TEST; non esiste ancora il pannello proprietà. Font Arial, nero/bianco, 8 righe e 30 oggetti sono limiti del laboratorio, non obiettivi finali.

Priorità successiva: trasformazioni e proprietà di singoli oggetti con validazione/undo, quindi livelli e allineamenti, poi font/import/elaborazione immagini. **Multipagina escluso; generazione immagini AI rinviata** su istruzione del titolare. Archivio template e associazioni prodotto/opzioni da definire prima dell’implementazione. Illustrator resta il gate umano per qualità produttiva: indicatori `fixture: true` / `validatedForProduction: false` conservati.
