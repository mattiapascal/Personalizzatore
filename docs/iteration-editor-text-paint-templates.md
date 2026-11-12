# Otto template recuperati dopo la correzione dei contorni — 12 novembre 2026

Confrontati integralmente i nove sorgenti prioritari individuati dal censimento degli stili di contorno assente. **Otto conformi**, uno ancora fermato dal parser. Il lotto usa il codice verificato `de463d6`, senza ulteriori modifiche applicative. Sono state mantenute le soglie di confronto già in uso: rapporto dei pixel differenti sotto 0,01 e media sotto 0,25/255.

## Template salvati

| Template | Formato mm | Oggetti | Immagini originali |
|---|---:|---:|---:|
| Trodat 5211 | 85 × 55 | 1 | 0 |
| Timbro con logo | 58 × 22 | 4 | 1 |
| Check conformità | 49 × 28 | 14 | 0 |
| Validazione Fatture Passive | 60 × 40 | 1 | 0 |
| Timbro generico | 70 × 10 | 1 | 0 |
| Timbro con logo per certificazioni | 60 × 40 | 3 | 1 |
| Corrieri: Cane onnivoro | 250 × 125 | 13 | 1 |
| 72 × 30 mm | 72 × 30 | 2 | 1 |

Sette confronti senza pixel oltre soglia; «Corrieri» ha 48 pixel differenti su 132.111 di inchiostro, rapporto **0,00036333** e media **0,010354/255**. Tutte le medie sono sotto soglia; massimo **0,0151069/255** per «Check conformità». Font esatti, nessun fallback. Le quattro immagini, da 16.628, 91.452, 2.934.705 e 29.887 byte, coincidono byte per byte con gli originali verificati. Sfondi/primi piani nativi assenti; descrittori senza URL non riattivati.

## Salvataggio e controllo reale

Archivio **271 → 279 template**, due composizioni e 219 font conservati; revisione **555 → 563**. Tutti i record precedenti, font, impostazioni, profili e priorità dei tag conservati per fingerprint. Tag «Da verificare», provenienza originale, colori e millimetri; nessuna sovrascrittura o associazione prodotto. Restano bozze non validate per produzione.

Backup della revisione 555, SHA `e98f8c0623f1433848f831f51865dd57828d7a44c0d9d9ade9f8179e678664d1`, in `.local/pitchprint-migration/text-paint-candidates-local-import/backup-revision-555-e98f8c0623f1.json`. Archivio finale SHA **`7e5854a5f3fcf9a3c48eb8970332e899bed50b140da29527c1f3a69ce6ce3d0c`**.

**Otto riaperture** dei record effettivamente salvati: identità del documento, oggetti, gruppi, font, colore e formato uguali alle copie d’archivio. Verificati anche copertura dei font nel browser, canvas visibile e assenza dell’avviso di font pendenti/bloccati prima delle schermate. Zero errori o scritture, archivio invariato per checksum.

**Otto miniature** generate e poi verificate dopo il ricaricamento dalla cache persistente: zero richieste dei record nella fase cache, zero errori o scritture e checksum invariato. Ogni scheda è stata portata in vista per attivare il caricamento differito. Gli omonimi sono distinti mediante ID e ordinamento stabile.

La baseline applicativa rimane quella dell’[incremento degli stili residui](iteration-editor-inactive-text-styles.md): 876 unitari, 220 browser pertinenti, 13 pubblici, 47 campioni e build verificati. Non sono dichiarati rieseguiti per questo lotto di dati. Le accettazioni specifiche del lotto sono confronto completo, originali, otto riaperture e otto controlli della cache. Illustrator ancora da collaudare.

## Caso ancora escluso

«Modello generico» contiene 12 stili nelle colonne 12–23 della prima riga di un IText 3.4.0, che oggi ha 11 caratteri. È diverso dalle righe assenti di Textbox già supportate. Una copia diagnostica senza questi dati supera il confronto completo: rapporto **0,000356964**, media **0,00131818/255**. Il sorgente è conservato e la copia resta privata, marcata come prototipo non approvato per l’archivio: nessuna importazione nascosta o rimozione applicata al parser.

[Piano verificabile per gli stili oltre fine riga](editor-pitchprint-trailing-styles-plan.md). Il primo tentativo diagnostico è stato fermato perché il salvataggio del lotto stava ancora cambiando il checksum dell’archivio; ripreso dopo la conclusione del processo di scrittura, non per un timeout di osservazione.

Restano **66 sorgenti prioritari non importati**, 25 a priorità bassa e 103 multipagina esclusi. Nessun deploy, modifica al negozio, associazione commerciale o generazione immagini AI. Manifest, sorgenti e schermate restano privati in `.local`; resoconti in `text-paint-candidates-prepared/` e `text-paint-candidates-local-import/`.
