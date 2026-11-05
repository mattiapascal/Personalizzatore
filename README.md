# Assistente e personalizzatore Shopify — laboratorio locale

Primo incremento del progetto per Incisoria Sacchetti. Repository: [mattiapascal/Personalizzatore](https://github.com/mattiapascal/Personalizzatore).

**Prototipo TEST, nessun deploy.** Assistente simulato e sostituibile, regole deterministiche su tre timbri reali Shopify, laboratorio Fabric.js con stato condiviso UI/comandi, JSON e SVG. BSS/PitchPrint continuano a essere usati sulla pagina prodotto; nessuna modifica al negozio è necessaria.

## Avvio

Node 24.17.0 (`.nvmrc`), npm e Git. Se usi nvm:

```sh
nvm use
npm ci
npm run dev
```

Apri `http://127.0.0.1:5173`. Nessun `.env` o token necessario. Il server è limitato al loopback; non esporlo online come servizio di produzione.

## Prova del percorso completo

1. Scrivi `Un timbro aziendale con logo e sei righe` e analizza la richiesta di prova.
2. Scegli `Autoinchiostrante`.
3. Conferma ingombro minimo 50×20 mm: il motore mostra Printy 4913 e 4915, motivando nominali e ordinamento per area. Sei righe e logo richiedono ancora verifica grafica.
4. `Personalizza sulla pagina prodotto` apre l'URL reale acquisito da Shopify, senza trasferire opzioni o creare righe carrello.
5. Modifica ingombro a 60×23: resta 4915, stessa sessione. `Non so le misure` apre l'esplorazione delle tre referenze senza garantire idoneità.

Il campione è snapshot TEST del 5 novembre 2026: ID reali, prezzi e disponibilità non mostrati. Il parser riconosce solo poche espressioni; non è un LLM. Si può sempre proseguire tramite scelte guidate.

Apri `Editor Fabric.js`: modifica `text-1` dal campo manuale o trascinandolo; prepara un comando aggiornato ed eseguilo. Un comando con revisione precedente viene rifiutato. Prova annulla/ripristina, esporta JSON/SVG e riapri il JSON. Il documento resta in memoria cambiando sezione; per conservarlo dopo reload esporta il JSON. Testo singola riga Arial e rettangolo sono il perimetro attuale, senza import loghi o scene complesse.

## Verifiche ripetibili

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run schemas
npm run fixtures:editor
```

`npm run check` esegue unit test, build e browser e2e. Chromium è necessario solo per gli e2e. Questi test navigano esclusivamente sul laboratorio locale e controllano gli URL prodotto senza visitarli. Per generare un SVG campione da Fabric e screenshot, con `npm run dev` aperto in un altro terminale:

```sh
npm run capture:lab
```

Risultati e limiti: [docs/test-results.md](docs/test-results.md). Collaudo Illustrator ancora richiesto, indipendentemente dai test automatici.

## Struttura

```text
src/catalog/       snapshot, profili, confine lettura e link prodotto
src/selection/     requisiti, domande, regole spiegabili e sessione
src/ai/            contratto tipizzato, dispatcher e mock senza rete
src/editor/        stato canonico, comandi, FabricAdapter e laboratorio
fixtures/          prodotti TEST reali; campione Illustrator JSON/SVG
tests/             scenari, contratti, comandi e browser e2e
docs/              audit, architettura, decisioni, integrazioni, checklist
```

Fonte iniziale: [01_Specifica_Progetto.md](01_Specifica_Progetto.md) e [AGENTS.md](AGENTS.md). Non esiste il file `_Codex` citato in AGENTS: non è stata creata una specifica alternativa. [Piano 2–4 settimane](docs/audit-and-plan.md), [architettura e schemi](docs/architecture.md), [handoff esistenti](docs/handoff-review.md), [dati da confermare](docs/integrations.md), [file e checklist Illustrator](docs/production-files.md), [metodo costi AI](docs/costs-and-metrics.md).

## Gate prima di un rilascio

Profili e tag No-AI confermati, catalogo aggiornabile, provider server con quote/budget e retention, costo per sessione misurato, prove Illustrator, accessibilità e test su ambiente dev/tema duplicato. BSS rollback da supporto prima di qualsiasi eventuale migrazione futura. Nessun deploy, installazione app, modifica tema/prezzi/varianti/carrello/checkout o invio al supporto senza autorizzazione esplicita. Il contratto Preventivometro V2 è distinto da BSS Storefront V2.
