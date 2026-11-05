# Audit e piano iniziale — 5 novembre 2026

## Evidenze prima dell'implementazione

- Letti integralmente `AGENTS.md` e `01_Specifica_Progetto.md` (v1.0). Il file `01_Specifica_Progetto_Codex.md` citato dalle istruzioni non esiste: riferimento operativo è la specifica presente, senza modificarne i requisiti.
- Cartella iniziale: due specifiche (MD/DOCX), AGENTS, metadati macOS; nessun codice o test. Git ereditato da `../SHOPIFY`, senza commit/remote. Creato repository isolato qui, senza acquisire file della cartella superiore.
- Remoto richiesto `https://github.com/mattiapascal/Personalizzatore.git`: `git ls-remote` riuscito, nessun ref. Credenziale GitHub esistente valida quando la rete è consentita. La sincronizzazione del codice è richiesta dall'utente; nessun deploy autorizzato.
- Node disponibili: 20.19.2, 20.20.2, 22.12.0, 24.17.0; npm 10.9.0 e Git 2.50.1. Shopify CLI 4.5.0 presente: il controllo versione ha tentato un autoaggiornamento, subito interrotto. Non usare la CLI per operazioni remote in questa fase.
- Connettore Shopify in sola lettura: dominio atteso confermato, piano Basic. Ricerca circoscritta e dettaglio di tre prodotti Printy 4912/4913/4915: ID e varianti reali, attivi alla cattura. Fixture limitata e sanitizzata; nessun inventario dell'intero catalogo.
- I titoli dichiarano dimensioni nominali; descrizioni permettono testo/logo. Margini, area effettiva e limiti produttivi non verificati. Tag `No-AI` e `warning-pitchprint` presenti: significato da confermare prima dell'uso pubblico/provider esterno.
- Le verifiche HTTP dirette delle tre pagine sono state limitate con 429. Non ritentare scraping. Una query successiva `Product.onlineStoreUrl` ha restituito tutti e tre gli URL canonici pubblicati; resta da verificare la navigazione cliente effettiva, non eseguita da questi e2e.
- Nessun codice del tema, export BSS, risposta supporto o prova Illustrator disponibile nel repository. Nessuna di queste integrazioni è stata collaudata.

## Incremento autorizzato e assunzioni

Una singola app locale React/TypeScript con Vite; nessuna app registrata su Shopify e nessun tunnel. Moduli catalogo, selezione, AI ed editor separati nella stessa app. Zod valida dati/tool a runtime. Fixture TEST con dati commerciali veri e vincoli tecnici null se ignoti. Nessun prezzo o disponibilità stimati.

Adattatore AI simulato, esplicitamente indicato in UI, senza rete/costi. Un provider reale potrà implementare lo stesso contratto dietro backend: questo incremento non misura comprensione LLM o costo token. Regole conservative su dimensioni dichiarate, meccanismo e forma; numero righe/logo non prova l'idoneità del layout. Chiedere chiarimenti mirati, accettare «non so», mostrare motivazioni e verifiche residue. Link alla pagina prodotto senza parametri applicativi.

Laboratorio Fabric.js separato: documento canonico in mm/pt, ID stabili, revisione obbligatoria, comandi comuni UI/simulazione AI, storico e JSON riapribile. Profilo editor TEST con 7 pt e nero, senza attribuirlo a prodotti commerciali. SVG con unità fisiche; approvazione produttiva sempre pendente fino a Illustrator.

## Piano 2–4 settimane, indicativo

1. Fondazioni: audit, fixture reali, schemi versionati, regole, almeno 10 scenari, percorso locale completo. Gate: nessun candidato inventato, input e tool rifiutati se invalidi.
2. Catalogo/assistente: confermare profili e tag con il titolare; selezionare backend e un provider reale dopo budget; TTL e sincronizzazione catalogo, fallback, quote e misure token. Gate: casi di revisione requisiti, errori provider e privacy verificati.
3. Laboratorio: comandi Fabric condivisi, JSON/SVG, conflitti, annullamento e misure; collaudo umano Illustrator per font, accenti, vettori, dimensioni e riapertura. Gate: evidenze registrate per ciascuna fixture.
4. Valutazione: 10–20 casi con il laboratorio, revisione di accessibilità/mobile, preventivo misurato e piano ambiente dev. Solo dopo consenso: scaffold Shopify ufficiale React Router, tema duplicato/dev store, nessuna modifica BSS.

## Rischi e criteri di accettazione

- Profili non validati: non presentare la dimensione nominale come area sicura, né garantire sei righe a 7 pt.
- Catalogo snapshot: avviso persistente, prezzo/disponibilità demandati alla pagina attuale; verifica pubblicazione e varianti prima di rilascio.
- Provider assente: distinguere il parser di prova da un LLM; fallback e whitelist testati, integrazione reale rimane aperta.
- SVG: test automatici di struttura/unità non certificano resa o modificabilità in Illustrator.
- Produzione: BSS V1, PitchPrint, tema, carrello, checkout, prezzi e ordini fuori dalle scritture. Rollback V2→V1 e preservazione formule da supporto BSS; la non coesistenza è già riferita, non da richiedere di nuovo.

Accettazione del primo incremento: installazione e build ripetibili, schemi runtime, almeno 10 casi di selezione, flusso richiesta→domanda→candidato→URL reale, modifica requisiti senza perdere sessione, test rifiuto tool sconosciuti/stale revision, stesso oggetto modificato manualmente e via comando, export/import JSON ed export SVG, README e checklist con limiti espliciti. Gli altri gate della specifica restano aperti finché non esistono prove.

Riferimenti: [scaffold ufficiale Shopify](https://shopify.dev/docs/apps/build/scaffold-app), [librerie/template](https://shopify.dev/docs/api/libraries-and-templates), [concetti Fabric](https://www.fabricjs.com/docs/core-concepts/). Versioni npm verificate prima dell'installazione, fissate in package.json e lockfile.
