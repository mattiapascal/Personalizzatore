# Backup e ripristino della libreria font

Incremento locale del 9 novembre 2026. Backend `/editor/admin`, sezione **Font**, scheda **Backup della libreria font**.

## Comportamento

**Scarica backup font** genera `libreria-font.backup.json`, con file originali, ID, nomi/metadati, licenze, fonte, date e stato attivo/archiviato. Include anche i font archiviati. Non contiene progetti, template, bozze, impostazioni, credenziali o dati commerciali. È una copia scaricata sul computer, non un backup remoto automatico.

**Controlla un backup da ripristinare** legge il file e chiede all’API locale un confronto senza scritture. Mostra risorse da aggiungere, già presenti e conflitti. **Annulla ripristino** lascia l’archivio invariato; soltanto **Conferma ripristino font mancanti** può aggiungere file.

- ID assente: aggiunge il font con gli stessi byte e dati, mantenendo anche l’eventuale stato archiviato.
- ID presente e stessi byte/formato: lascia invariati tutti i dati locali, anche se nome/note/licenza nel backup sono precedenti.
- ID presente e file differente: blocca l’intero ripristino; non aggiunge neppure gli altri file nuovi.
- Backup già importato: nessun duplicato o incremento di revisione. La preview indica che non occorre ripristinare nulla.
- Archivio cambiato dopo la preview: revisione attesa rifiutata; **Ricontrolla il backup** rilegge lo stato corrente e prepara un nuovo confronto prima della conferma.

Progetti, template e configurazioni esistenti non vengono riscritti. Gli ID conservati consentono di ritrovare le stesse risorse dopo un recupero della libreria; i progetti che incorporano i font rimangono comunque autonomi.

## Contratto e limiti

`FontLibraryBackupSchema`: tipo esplicito `incisoria-font-library`, versione 1, data export e massimo 500 font (ampliato il 10 novembre per il catalogo reale; archivio ancora entro il limite di 32 MB), senza ID duplicati. Stessi controlli di codifica, firma/formato e limiti delle tabelle usati dal caricamento font. Non è un certificatore completo di tutte le tabelle del font né dei diritti d’uso.

Nuovo comando `restoreFontLibrary`, validato e serializzato come le altre scritture locali. Controllo del limite di 50 risorse e del limite globale di archivio 32 MB prima della scrittura atomica. Nessun aggiornamento parziale o sostituzione silenziosa dei file.

API dev protette da loopback, intestazione locale, origine e cache disabilitata:

- `GET /__editor-local/admin/font-library/backup`
- `POST /__editor-local/admin/font-library/preview`: comando di ripristino, sola lettura.
- `POST /__editor-local/admin/font-library/restore`: stesso comando, scrittura dopo conferma.

I due endpoint POST dedicati accettano solo `restoreFontLibrary`, con limite richiesta 34 MB per il pacchetto JSON; le altre richieste amministrative mantengono 11 MB. L’interfaccia legge backup fino a 32 MB. I file font singoli conservano il massimo di 1 MB. Archiviare non elimina il file né libera una delle 50 posizioni; un’eventuale eliminazione definitiva della libreria è un’operazione distinta ancora da progettare.

## Prove

Cinque unitari: conservazione esatta di file/ID/date/licenze/archiviazione; preview senza scritture; ripetizione; dati/progetti locali preservati; collisione atomica anche con altri font nuovi; backup duplicato/corrotto; revisione obsoleta; limite della libreria.

Due browser: download confrontato con la sorgente, passaggio a un’installazione vuota di prova, preview/annullamento/conferma, ripetizione senza duplicati e layout mobile; collisione di file e modifica concorrente con ricontrollo. Archivi temporanei, nessuna modifica alla libreria personale. Verifica aggiuntiva dei veri endpoint HTTP su server temporaneo, con protezioni, preview senza scritture e ripetizione. Esiti e checkpoint completo nello [stato locale](editor-local-status.md).

Nessun servizio, dipendenza, chiamata AI, integrazione commerciale o deploy aggiunto.
