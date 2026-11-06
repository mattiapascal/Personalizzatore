# Pubblicazione e gestione dei due repository

Il primo rilascio è stato autorizzato e attivato il 6 novembre 2026 nella sola pagina [Crea il tuo timbro](https://www.incisoriasacchetti.it/pages/crea-timbro-online). Il [registro del rilascio](release-cloudflare.md) contiene verifiche, risorse e ripristino; [Cloudflare Free](cloudflare-free.md) descrive il piano scelto e i limiti. Un push Git non equivale a un deploy.

## Ambito pubblico

Chat, riepilogo, anteprime e link alle varianti attuali. Il cliente prosegue sulla pagina prodotto con BSS/PitchPrint. Nessun trasferimento automatico dei contenuti della chat al personalizzatore e nessun intervento su prezzi, varianti, carrello o checkout. Fabric e gli export TEST restano nel laboratorio; il collaudo produttivo Illustrator richiede un percorso separato.

Il frontend cliente e il backend risiedono su Workers, con SQLite e aggiornamento pianificato del catalogo. Il tema incorpora il frontend in un iframe isolato e trasmette solo font, colori e altezza disponibile. Nessun CSS globale del tema viene sostituito, nessuna nuova app Shopify installata.

## Dove lavorare

| Repository | Contenuti | Ramo usato nel primo rilascio |
|---|---|---|
| `mattiapascal/Personalizzatore` | UI, backend, regole umane, contratti, catalogo, test, manifest | `main` |
| `mattiapascal/Mode-mio-5.2.0` | Sezione/template dedicati, caricatore, chiavi locali e documenti tema | `feature/ai-stamp-assistant` |

La worktree tema isolata si trova in `.local/theme-ai-release`, dalla base remota verificata `e465ac6`. La cartella originale `/Users/davide/Documents/Shopify/Temi/Mode mio 5.2.0` non viene sovrascritta. I Git restano distinti; chiavi e cartelle locali non entrano nel tema. Una traduzione italiana preesistente online è stata preservata nel commit separato `d5a908f`.

Regole lette nell'handoff del tema: commit piccoli e tematici; aggiornare sempre `MIGRAZIONE_MODE_5_2_0_HANDOFF.md` e `MIGRAZIONE_MODE_5_2_0_PERSONALIZZAZIONI.md`; validare Liquid e Theme Check; distinguere push Git e upload Shopify. Il caricamento diretto di questa pagina è autorizzato esplicitamente dal titolare, in deroga al normale caricamento manuale del tema.

## Procedura per una modifica successiva

1. Controllare entrambi gli stati Git e rileggere i file remoti interessati. Preservare modifiche concorrenti e mantenere una copia dei soli file da cambiare.
2. Modificare le istruzioni in `REGOLE_ASSISTENTE.md`, non nel modulo generato. Eseguire `npm run assistant:generate` e i test pertinenti. Casi nuovi possono richiedere anche contratti, regole deterministiche e test reali, oltre al prompt.
3. Prima di rilasciare l'app usare `npm run check:release`: test locale e pubblico, build Workers, SQLite, privacy e controllo segreti. I collaudi AI reali sono separati e consumano token.
4. Fare commit/push nel repository corrispondente. Registrare commit sorgente, versione API, hash asset e versione Worker. In assenza di autorizzazione al rilascio fermarsi al pacchetto verificato.
5. Per regole/UI/backend compatibili pubblicare soltanto il Worker autorizzato. Il tema non richiede un upload se URL e contratto rimangono compatibili. Per caricatore/sezione/template fare anche commit tematico e upload dei soli file cambiati, senza cancellazioni o sostituzione dell'intero tema.
6. Rileggere versione, checksum e pagina pubblica; provare la conversazione e la navigazione al prodotto. Non dichiarare una prova visiva o produttiva non eseguita.

## Ripristino

Riassegnare `wide` alla pagina `689437639036`: titolo, URL e corpo originale sono conservati. Il template condiviso `wide` è intatto. Per un problema del solo backend ripristinare una versione verificata del Worker senza cancellare il registro consumi. Un upgrade Cloudflare, una migrazione BSS o un ampliamento del perimetro richiedono nuova autorizzazione.
