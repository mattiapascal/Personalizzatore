# Associazioni originali recuperate nell’archivio locale

14 novembre 2026, dopo `82b830a`; [piano](editor-association-recovery-plan.md). Eseguito il recupero locale richiesto dal titolare, con letture correnti, backup verificato, prova sulla copia e comando amministrativo atomico. Nessuna modifica al negozio o a PitchPrint.

## Risultato reale

Principale **SQLite R638 → R639**: **290 template aggiornati, 398 collegamenti verso 133 prodotti reali**. Ricontrollate **496 varianti**; tutti i collegamenti nuovi coprono le varianti attuali, come l’associazione originaria PitchPrint al prodotto. Nessun collegamento precedente presente nel principale; il motore conserva comunque quelli già impostati, senza ampliare automaticamente eventuali varianti ristrette. La seconda esecuzione riconosce il recupero completo e non incrementa la revisione.

I 133 prodotti sono **122 attivi, nove in bozza e due non elencati**. Sono riferimenti commerciali locali: non ne è stato cambiato lo stato né la pubblicazione. Il percorso cliente continua a rifiutare prodotti non attivi. **56 template** non hanno un legame originale ricostruibile: nessuna associazione dedotta da nomi o misure. Elenco privato in `.local/association-recovery/da-associare.md` e piano completo in `plan.json`. Tre configurazioni Shopify non indicano un design: sono vuote o dedicate al solo caricamento file, non errori risolti con un abbinamento arbitrario.

Restano **346 template, due composizioni, 219 font/218 attivi e un profilo produttivo**. L’audit dimostra che grafica, tag, provenienza, font, profili, risorse e impronte delle miniature sono invariati. Cambiano soltanto associazioni, versione e data dei 290 template, oltre alla revisione dell’archivio. Le associazioni non forniscono automaticamente misure, materiale o profili tecnici: il timbro usato per il controllo visivo mostra correttamente tre template associati e zero profili.

## Provenienza e procedura

- Il plugin Shopify ha confermato il dominio atteso e letto in sola lettura **1.597 prodotti**, comprese 141 configurazioni PitchPrint. Poi ha verificato i dettagli dei 133 prodotti interessati e le 496 varianti. Nessuna query di scrittura, lettura prezzi o modifica di acquisti.
- Categorie PitchPrint rilette tramite il client esistente, con una whitelist che ammette soltanto login, init, identificazione del dominio e letture: **46 categorie, 473 design, 50 richieste**. Nessun cambio dominio, modifica, clonazione o pubblicazione. Le sole coppie ID/titolo sono state conservate, senza token o credenziali.
- Anche il catalogo amministrativo locale è stato aggiornato attraverso l’adattatore esistente: **1.597 prodotti, 73 collezioni**, nessun errore. Ora il pannello distingue la data della lettura Shopify da quella dell’inventario categorie; un futuro aggiornamento Shopify non farà sembrare nuove anche categorie vecchie.
- Il piano usa soltanto ID design di provenienza e ID prodotto corrispondenti. `scripts/prepare-pitchprint-recovery.ts` prepara riepilogo, elenco esclusi, comando e digest senza scrivere nel principale. I sorgenti correnti, la prova e i resoconti commerciali sono privati in `.local/association-recovery`.
- Backup nativo completo con pagine WAL incluse, verificato prima di procedere: `before-R638.sqlite`, **94.887.936 byte**, revisione 638, 348 record, 219 font e 300 risorse. Hash e verifica completa in `backup.log`. Il database attivo non è stato sostituito.
- `scripts/apply-pitchprint-recovery.ts trial DIGEST` ha applicato il comando su una copia indipendente. L’audit ha confrontato tutti i record e gli indici, i font, il root dei profili/impostazioni, le risorse e i relativi riferimenti; verifica dell’integrità dei dati delle risorse. Prova e hash in `trial-report.json`.
- `apply DIGEST` richiede il piano invariato, sorgenti recenti, backup e prova corrispondenti, identità del database e stessa revisione/versioni. Usa il comando locale `bulkTemplateAssociationMap`, che rilegge le varianti Shopify prima del commit. Un solo salvataggio atomico, senza retry automatici: `apply-report.json`. Dopo l’applicazione l’audit sul principale è passato e il piano non propone altre operazioni. `idempotent.log`: R639, già completo.

## Pannello e controlli

Il pannello mostra i template già associati. I conteggi dei collegamenti ancora da recuperare/completare escludono quelli completati; quando sono tutti presenti mostra uno stato esplicito e non propone un altro salvataggio. Le scelte manuali di ampliamento di varianti restano esplicite nel normale pannello; il recupero automatico non le applica a un prodotto già associato.

- **1.439 unitari / 199 file passati**, inclusi sette nuovi casi: ID/provenienza, esclusioni, conservazione di varianti manuali, date distinte, JSON/SQLite, idempotenza, errori atomici e audit positivo/negativo. L’audit rileva una geometria manomessa nella copia di test (`.local/association-recovery/all-units.log`, `audit-unit.log`).
- **38 browser pertinenti distinti passati**: 36 su prodotti, template e varianti (`browser.log`), poi sette su pannello aggiornato/operazioni massive, con cinque casi già contati (`final-browser.log`). Non una nuova suite generale.
- Verifica visiva sul principale **R639 in sola lettura**, dopo il recupero: tre collegamenti già salvati nel prodotto scelto, zero operazioni proposte, zero scritture/errori, immagini esterne bloccate. `scripts/capture-editor-product-integration.ts --real-copy --associated`; `final-capture.log` e catture `product-integration-associated-real-*`, desktop/telefono ispezionati.
- **13 test della chat pubblica locale passati**; JavaScript pubblico ancora `index-BG2r_x-8.js`. Build laboratorio/storefront, TypeScript Worker e scansioni segreti passati. Schemi persistenti rigenerati senza differenze; il nuovo timestamp riguarda soltanto il contratto della copia delle associazioni. Nessuna nuova grafica introdotta: l’audit dei dati reali sostituisce la generazione di un nuovo campione grafico, non è un collaudo Illustrator.
- Dati di negozio, backup e credenziali esclusi dal repository. Cancellazione PDF preesistente non inclusa nel commit. Il laboratorio è stato riavviato sulla stessa porta 5173; il database rimane quello selezionato, ora R639.

## Ripristino e prossimo lavoro

Conservato il database indipendente precedente e le copie precedenti di associazioni e inventario PitchPrint. Per ripristinare si prepara un nuovo file dalla copia con gli strumenti SQLite già presenti e si verifica prima di selezionarlo; nessuno scambio o ripristino automatico. Il recupero non è una migrazione dello storage.

Ora completare profili tecnici e aree utili verificabili per rendere utilizzabili nel percorso cliente i legami recuperati; poi materiale/prodotto e fissaggi con anteprima. I 56 casi senza associazione originale richiedono dati o scelta amministrativa, senza bloccare lo sviluppo. Prezzi dopo le associazioni secondo le indicazioni del titolare; preservati chat pubblicata, tema, BSS, PitchPrint, prezzi, carrello e checkout. Nessun deploy.
