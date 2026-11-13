# Ordine dei campi PitchPrint — 13 novembre 2026

Richiesta esplicita del titolare: adattare gli indici dei template già importati e delle importazioni future alla priorità crescente del configuratore. Esempio confermato: **0, −1, −2, −3 → 1, 2, 3, 4**. Collaudo del titolare su «Azienda tecnologia»: risultato corretto.

## Regola

Per ogni pagina si raccolgono i valori `editor.order` presenti sugli oggetti e sui gruppi, si ordinano i valori distinti dal maggiore al minore e si assegnano i ranghi 1, 2, 3, … . Esempio 8, 3, 0, −2 → 1, 2, 3, 4. Le parità rimangono parità, con lo stesso ordine relativo nel modulo. Un parametro assente resta assente. Non cambiano l’ordine dei livelli, la gerarchia o la pagina attiva.

La regola riguarda l’adattamento da PitchPrint: non cambia il significato degli indici nei documenti canonici, che restano crescenti, né rinumera continuamente le modifiche manuali. Aprire un template non modifica i valori.

## Importazioni future

`pitchprintAscendingFormOrder` è usato dall’importatore nativo, dopo la conversione e la rimozione dei refusi. Il risultato espone `formOrderVersion: 1`; il batch la conserva nella provenienza del record. L’API accetta anche client precedenti: un nuovo `importPitchprintTemplate` privo della marcatura viene adattato dal server e marcato. Se il client ha già convertito gli indici, la marcatura impedisce la seconda inversione. Sorgenti già presenti conservano la protezione contro duplicati e sovrascritture.

Nuovo comando amministrativo tipizzato `normalizePitchprintFormOrders`: elenco di ID, versioni e hash sorgente, più revisione dell’archivio. Accetta soltanto template con provenienza PitchPrint; verifica tutti i destinatari prima della modifica, protegge le copie in cache e commette atomicamente. Una conversione già marcata è un no-op. Non viene eseguita automaticamente all’avvio né sui progetti dei clienti.

## Aggiornamento effettivo dell’archivio locale

- Censiti tutti i **339 template** e trovati tutti i sorgenti originali, con hash coerenti. Gli indici salvati coincidevano con quelli nativi; per la copia autorizzata di Azienda Agricola sono state considerate le label dopo la rimozione del testo curvo, senza usare alla cieca gli ID rinumerati.
- Backup nativo verificato a **R629**, 341 record e 219 font; hash semantico `9ade94826defb46c9191f305b1a58dbe175fd6238a526658ae72747456496359`. Backup e piani restano privati in `.local/pitchprint-form-order/`.
- Operazione completa provata su una copia separata. Verificato ogni record contro il risultato atteso: soli indici, marcatura, versioni e timestamp; geometrie, testo, stili, ID, immagini, font e associazioni identici. Il primo controllo della copia assumeva erroneamente un incremento della revisione grafica anche nei dieci documenti senza variazioni numeriche: corretto il verificatore e riletta la copia già aggiornata, senza ripetere l’inversione.
- Applicato tramite l’API locale **un solo comando atomico**: **R629 → R630**, 339 template marcati, **4.333 valori modificati**. Nei dieci documenti senza variazioni numeriche cambia soltanto la provenienza/versione del record; la revisione grafica non viene incrementata inutilmente.
- Verifica integrale successiva: esatti tutti i valori attesi; invariati due progetti cliente, impostazioni, profili, tag, associazioni, 219 font e tutte le 297 risorse. Le chiavi delle miniature produttive e tecniche restano identiche: nessuna rigenerazione causata dal solo ordine.

Esempio controllato nell’archivio: «Azienda tecnologia», record `c376702f-5d3b-40d1-8d94-0fabd0d9ff6a`, versione 2. Attività 1, Descrizione 2, Giorni 3, Orari 4. Conferma visiva del titolare ricevuta dopo l’applicazione.

## Verifiche del codice

**1.089 unitari / 157 file**, compresi 13 nuovi casi su parità, indici negativi, pagine, font/miniature preservati, cache selettiva, rifiuti atomici, versioni, JSON e SQLite, client vecchi/nuovi e idempotenza. **15 browser pertinenti** passati, compreso il modulo dei campi importati con 5 prima di 1 nel sorgente e 1 prima di 2 nel nuovo documento. Build e schemi verificati; altri controlli di consegna nel resoconto successivo dell’ispettore.

Log privati `unit-full.log`, `browser.log`, `preparation.log`, `trial-verification.json`, `apply-receipt.json` e `applied-verification.json` nella cartella dell’operazione. Nessun deploy, aggiornamento di Shopify/PitchPrint/BSS o modifica dei sorgenti originali.
