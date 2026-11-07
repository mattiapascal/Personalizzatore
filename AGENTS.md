# Istruzioni operative per Codex — Shopify AI Customizer

## Obiettivo e fonte di riferimento
Leggi prima e considera autorevole `01_Specifica_Progetto.md`. Questa è la fase di prototipo locale: selezione assistita del prodotto + spike Fabric.js. Non è un progetto autorizzato a sostituire subito PitchPrint o BSS.

## Divieti espliciti
Eccezione autorizzata dal titolare il 6 novembre 2026: integrare e pubblicare la selezione assistita nella sola pagina `/pages/crea-timbro-online`, con backend Cloudflare Free e file tema dedicati. Il titolare riferisce di averne creato una copia di backup. Preparare e verificare comunque il rollback; preservare URL, titolo e corpo originale conservato della pagina. Nessuna autorizzazione a sostituire BSS/PitchPrint, modificare acquisti o attivare piani a pagamento. I divieti sotto restano validi fuori da questo ambito.

- Non modificare il negozio Shopify pubblicato, il tema attivo, le opzioni BSS, l'integrazione PitchPrint, prezzi, varianti, checkout o ordini.
- Non aggiornare BSS V1 a V2. La decisione dipende dal riscontro del supporto tecnico e dalla verifica di rollback.
- Non pubblicare app/landing o inviare richieste amministrative con effetti di scrittura senza consenso esplicito.
- Non inserire segreti nel repository, nei log o nel codice frontend.
- Non inventare prodotti, prezzi, identificativi, caratteristiche tecniche o il risultato di test non effettuati.

## Vincoli tecnici
- L'AI interpreta richieste e propone tool calls tipizzate; il motore di regole e quello grafico validano ed eseguono.
- Un solo stato grafico, con revisioni e ID stabili: tutte le modifiche manuali e AI passano dagli stessi comandi.
- Catalogo Shopify reale e profili prodotto versionati; fixture marcati come prova.
- Progetto editabile JSON e file SVG produttivo distinti; Illustrator è il riferimento di collaudo per geometrie e testi modificabili.
- Per timbri, i 7 pt minimi e nero/bianco sono esempi di profili tecnici specifici, non regole universali.
- Mantieni integrazioni Shopify/BSS dietro adattatori e non usare selettori non documentati senza test.

## Comportamento dell'assistente e manutenzione delle istruzioni
- Prima di modificare interpretazione, tono, domande o casi gestiti, leggi `REGOLE_ASSISTENTE.md`: contiene la sezione attiva per il modello e la mappa delle regole applicative.
- Per domande informative leggi anche `CONOSCENZE_ASSISTENTE.md`: contiene soltanto conoscenze pubblicabili e pagine fonte. Mantieni distinti fatti e istruzioni; non usare descrizioni o FAQ come autorità sulle misure dei timbri.
- Modifica le istruzioni editoriali nel documento sorgente, non in `server/assistant-policy.generated.ts`; poi esegui `npm run assistant:generate` e i controlli pertinenti. Mantieni documento e artefatto nello stesso commit.
- Non dichiarare supportato un caso nuovo aggiungendo soltanto una frase al prompt: verifica contratti, filtri, domanda successiva e test. I test strutturali non certificano la comprensione del modello reale.
- Destinazione iniziale concordata: Cloudflare Workers Free, secondo `docs/cloudflare-free.md`. Primo rilascio autorizzato soltanto nell'ambito dell'eccezione sopra; altri deploy, ampliamenti e upgrade richiedono consenso esplicito.

## Workflow in ogni iterazione
1. Controlla stato del repository e strumenti disponibili.
2. Elenca piano, assunzioni e rischi prima di cambiamenti importanti.
3. Implementa un piccolo increment testabile; aggiungi test.
4. Esegui test e mostra evidenze, senza dichiarare verificati i test Illustrator che richiedono ispezione umana.
5. Riassumi file creati/modificati, decisioni e prossima azione.
6. Chiedi approvazione prima di azioni esterne, spese, migrazioni o deploy.

## Prima consegna attesa
Scheletro locale eseguibile, catalogo fixture, selettore prodotti guidato con regole deterministiche, contratto API AI sostituibile, demo Fabric.js locale con SVG/JSON, checklist Illustrator e documentazione dei risultati. Nessuna dipendenza funzionale da una modifica a BSS o PitchPrint.
