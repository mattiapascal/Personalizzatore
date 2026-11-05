# Architettura del laboratorio

Una sola app React/TypeScript, senza backend connesso, autenticazione Shopify, tunnel o deploy. Vite serve solo su `127.0.0.1`. Questo non è lo scaffold di un'app Shopify installabile: la documentazione ufficiale raccomanda React Router per la futura app, da inizializzare su ambiente dev dopo consenso. I moduli di dominio restano trasferibili.

```text
UI richiesta / chiarimenti
    → AiProvider.propose (mock esplicito, output unknown)
    → AiToolSchema + revisione sessione
    → updateRequirements → motore deterministico
    → snapshot CatalogAdapter → motivazioni + verifiche residue
    → productPage → onlineStoreUrl acquisito da Shopify

Candidato → Prova nel canvas → Product/Variant ID + versione + area nominale
UI editor / IText nel canvas / trascinamento / comando JSON simulato
    → DocumentStore.dispatch → schema + revisione + vincoli + misure Fabric
    → documento canonico in mm/pt → FabricAdapter (8 px/mm di zoom)
    → JSON sorgente oppure SVG fisico (misure del modello; 8 px/mm nel viewBox)
```

## Modelli e strumenti

Schemi Zod in `src/catalog/schema.ts`, `src/selection/schema.ts`, `src/ai/contract.ts`, `src/editor/model.ts`. Gli equivalenti JSON Schema sono in `docs/schemas/`, rigenerabili con `npm run schemas`. I controlli semantici (appartenenza al catalogo, origine URL, revisioni, ID unici e misure) restano nel motore runtime: il JSON Schema da solo non li sostituisce.

| Modello | Contenuto / confine |
|---|---|
| ProductProfile | Product/Variant GID reali, URL Admin, provenienza, versione, dimensioni nominali; vincoli ignoti null |
| Requirements | Famiglia, montatura, forma, righe/logo facoltativi, ingombro minimo o scelta non so |
| Recommendation | Solo ID del catalogo, versione, ruleId e spiegazioni, verifiche pendenti |
| SelectionSession | UUID pseudonimo, revisione, requisiti e candidati ricostruibili, selezione, versione catalogo, timestamp |
| GraphicDocument | UUID, revisione, area nominale mm, oggetti con ID stabili; Product/Variant ID, versione catalogo e profilo commerciale; vincoli grafici ancora TEST |
| GraphicCommand | Whitelist, ID oggetto, revisione attesa e argomenti stretti |

Whitelist selezione: `collectRequirements`, `searchProducts`, `getProductProfile`, `recommendProducts`, `askMissingInformation`. La lettura del profilo rifiuta ID estranei; le domande devono essere ancora pertinenti. Il mock propone soltanto `collectRequirements`; il dispatcher è pronto per gli altri strumenti. La raccomandazione e il link vengono sempre dal catalogo/motore, mai dalla prosa di un provider.

Whitelist grafica di questo incremento: `setText`, `moveObject`, `setObjectStyle`. Nessun JavaScript, HTML, URL logo o SVG arbitrario accettato. Non sono ancora implementati `addText`, logo, gruppi, rotazione o ridimensionamento. `DocumentStore.changeProduct` è un'azione esplicita della UI: conserva oggetti, verifica ingombri, aggiorna riferimenti e area e invalida revisioni precedenti. Fallimento atomico: documento e storico immutati. Successo: storico undo ricomincia, per non ripristinare un prodotto differente. Font/colore/margine attuali appartengono esclusivamente a `TEST-stamp-v1`, distinto da `catalogProductProfileVersion`.

## Selezione verificabile

1. Se manca la famiglia, chiederla; poi la montatura. Campione: solo timbri rettangolari autoinchiostranti.
2. Per gli automatici chiedere ingombro minimo o «non so». Non assumere che sei righe entrino in un determinato modello.
3. Filtrare per stato ACTIVE alla cattura, montatura, forma, logo dichiarato e dimensioni nominali in orientamento fisso.
4. Ordinare per area crescente, spareggio per ID. Nessun prezzo, disponibilità, punteggio AI o capacità di righe inventato.
5. Mostrare dimensioni nominali e motivazioni; con misure ignote presentare possibilità esplorative. Layout e area utile richiedono conferma.

Esempio ripetibile: «timbro aziendale con logo e sei righe» → richiesta montatura → «autoinchiostrante» → richiesta ingombro → 50×20 mm → 4913 (58×22) e 4915 (70×25), ordinati per area. Nuovo requisito 60×23 → solo 4915, stesso UUID e logo conservato, vecchia selezione azzerata.

## Stato e persistenza

La sessione salva solo attributi strutturati nel localStorage, con scadenza logica di ripristino a 24 ore dall'ultima modifica; il ripristino ricalcola i candidati ed esclude versioni catalogo incompatibili e ID manipolati. Alla riapertura dati scaduti sono sostituiti dalla sessione vuota: il browser chiuso non può cancellarli automaticamente. La richiesta libera non è salvata; nessun log remoto o analytics. È una persistenza locale sostituibile, non un database produttivo. `Azzera sessione` cancella i requisiti.

`selection/interaction.ts` gestisce insieme sessione e riscontro transitorio della UI, senza salvare messaggi nel localStorage. Ogni analisi o scelta conferma l'azione e porta il focus al riquadro con domanda successiva, numero di risultati o assenza di candidati. «Non so le misure» viene conservato anche prima della scelta montatura; il pulsante per vedere i modelli porta il focus al titolo dei risultati. Il reducer mantiene il controllo delle revisioni e non avvia aggiornamenti React dentro altri updater.

Il documento grafico è l'unico stato autorevole. Fabric è una vista: al termine di un trascinamento emette un comando manuale; se rifiutato, il canvas viene ripristinato dal documento. Le misure browser di Fabric verificano l'ingombro prima del commit. Undo/redo/import incrementano sempre la revisione locale, invalidando i comandi precedenti. Storico di sessione in memoria; JSON contiene lo stato editabile, non lo storico completo. Cambiare sezione non azzera il documento; un reload richiede la riapertura del JSON esportato.

La scena è ristretta a testo Arial fino a 8 righe/480 caratteri e rettangolo vettoriale, senza trasformazioni. IText fornisce caret e scrittura nel canvas; all'uscita produce `setText` con revisione acquisita all'ingresso. La scrittura temporanea è una bozza del gesto: export, navigazione fra sezioni e altri comandi sono sospesi finché viene validata. Il commit è differito alla fine dell'evento Fabric; se rifiutato si ripristina la scena canonica. Le misure usano la stessa metrica FabricText/IText, verificata nei test browser. SVG viene prodotto da Fabric usando lo stesso renderer. Misure browser e unità SVG sono verificabili automaticamente, ma non certificano metrica fisica o resa in Illustrator.

Il primo canvas si apre soltanto da un candidato reale. I successivi cambi di requisiti non cancellano una composizione aperta: si cambia modello con `Prova nel canvas`. La sessione di selezione e il documento sono distinti: aprire un prodotto Shopify esterno non trasferisce la grafica. Gli import non possono sostituire associazione o dimensioni del prodotto corrente. Fixture storiche senza associazione sono adottate solo a parità di area, dopo validazione. L'associazione non certifica l'area utile o la variante di acquisto; nel campione ogni profilo contiene un riferimento variante.

## Provider reale e sicurezza futura

`AiProvider` riceve dati strutturati e restituisce `unknown`, con timeout e `AbortSignal`; ogni output è poi validato. Errori e risposta malformata lasciano praticabili le scelte guidate. Attualmente non esiste endpoint HTTP AI né uso LLM. Il mock riconosce un piccolo vocabolario italiano e non comprende negazioni o dialoghi generici in modo affidabile.

Prima di un provider reale: backend con autenticazione/sessioni, body limit, rate limit, quota token e spesa, logging redatto, TTL server, prompt/model versionati e consenso su dati inviati. Nessuna chiave `VITE_*`: tutti gli asset frontend sono pubblici. Non copiare credenziali dai repository di handoff. L'assenza di API amministrative e carrello è un confine attuale di esecuzione, non una dichiarazione di sicurezza per un futuro deploy.
