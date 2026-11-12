# Stili residui oltre fine riga — 12 novembre 2026

## Comportamento

L’importazione riconosce gli stili conservati oltre l’ultimo carattere di una riga esistente e non vuota nei sorgenti IText/Textbox Fabric 3.4.0. Sono metadati inattivi: vengono contati e segnalati, senza appiattirli sui caratteri della riga successiva e senza richiedere font usati soltanto nei residui. Lo stesso classificatore serve al censimento preventivo dei font.

Versioni e tipi non verificati, posizioni malformate/oltre budget e proprietà sconosciute rimangono bloccanti. Gli stili delle righe vuote esistenti non vengono ignorati: possono determinare l’altezza anche senza un glifo. Nessun cambiamento dello schema canonico, dei comandi manuali/AI, dei limiti produttivi o della politica dei file font esatti.

## Prova nativa e campione

Runtime originale Fabric **3.4.0**: IText e Textbox con ritorni a capo, Unicode precomposto, font diversi fra righe e font inesistente nei soli residui. Originale e copia priva dei residui producono SVG identici e canvas senza differenze; zero chiamate di misura/disegno al font inesistente. Il sorgente originale rimane invariato. Log/rapporto privati `.local/trailing-styles-native-proof.*`.

Il confronto SVG originale/nuovo campione ha zero pixel differenti. Il confronto diretto fra i canvas Fabric 3/7 registra invece 237 pixel differenti su 7.156 di inchiostro (media 0,02498/255); rimane una differenza di renderer, non viene dichiarata identità dei due canvas. La prova omogenea originale/copia nel runtime 3 resta esatta. Nessun esito Illustrator dichiarato.

Campione portabile 160 × 100 mm: [sorgente](../fixtures/illustrator/trailing-text-styles.source.TEST.json), [JSON](../fixtures/illustrator/trailing-text-styles.TEST.json), [SVG](../fixtures/illustrator/trailing-text-styles.TEST.svg). File Arimo/Tinos TEST incorporati, due box con due/cinque righe visive. Generatore `scripts/capture-editor-trailing-text-styles.ts`: importazione senza pulizia preventiva, modifica X dall’ispettore, comando AI simulato, Undo, export e confronto indipendente; revisione finale 5. Schermate desktop/mobile controllate in `.local/trailing-styles-capture/`.

Il riferimento browser conserva i residui del sorgente: risolve gli alias dei font soltanto sui caratteri presenti, lasciando al renderer nativo la decisione di dipingere/misurare i metadati. Nessun riuso del classificatore dell’importatore nel riferimento indipendente.

## Sorgente reale

«Modello generico», `be1f0cfd9133fc4b1c98beab2be1df2a`, **60 × 33 mm**, tre testi. Hash sorgente `904b366b06441f33292254bfdb73fd37be3b2be1e4364902d224182c0108e602`. Il primo testo conserva dodici stili oltre fine riga. Il convertitore generale completo, senza la rimozione diagnostica privata, supera il confronto: **15 pixel differenti / 42.021 di inchiostro = 0,0357%, media 0,001318/255**. Formato fisico, font e testo originali verificati; nessuna immagine o fondo da escludere. Preparazione e guardia degli originali in `.local/pitchprint-migration/trailing-styles-prepared/`.

Il precedente [piano](editor-pitchprint-trailing-styles-plan.md) resta come evidenza della diagnosi iniziale; l’implementazione generale descritta qui supera la sola pulizia privata di quel piano.


## Verifiche concluse e salvataggio locale

**879 unitari / 129 file**, build TypeScript/Vite, scansione segreti, **48 browser pertinenti** e **48 campioni** riaperti/esportati passati. Log `.local/trailing-styles-unit-recheck.log`, `trailing-styles-build-final.log`, `trailing-styles-browser-regression.log` e `trailing-styles-artifacts.log`. La prima esecuzione unitaria aveva un timeout a 5 s nel caso storico dei 65.536 segmenti mentre altri processi pesanti erano attivi; la successiva intera suite è passata senza modificare test o timeout. Nel nuovo browser sono stati corretti due controlli del test: tolleranza numerica mm/pt e confronto SVG che normalizza soltanto il contatore dei clip ID generati. Nessuna soglia grafica allentata. Il gruppo browser completo del laboratorio non è stato rieseguito; UI pubblica e bundle del servizio pubblicato non modificati.

Il template è stato salvato dopo queste verifiche: **280 template, due composizioni, 219 font; revisione 563 → 564**. Backup verificato `.local/pitchprint-migration/trailing-styles-local-import/backup-revision-563-7e5854a5f3fc.json`, SHA `7e5854a5f3fcf9a3c48eb8970332e899bed50b140da29527c1f3a69ce6ce3d0c`. Record `32eea232-8e0d-4a62-a468-669f605401fe`, tag «Da verificare», nessuna associazione prodotto o sovrascrittura. Record precedenti, composizioni, font, impostazioni, profili e priorità dei tag conservati; originali sorgente invariati.

Riapertura reale con documento/font identici, geometria verificata, canvas visibile, zero avvisi font o errori. Miniatura generata e poi recuperata dalla cache con **zero riletture del record**; archivio invariato durante entrambe le prove. Rapporti `reopen-report.json` e `thumbnails-report.json` nella stessa cartella privata. Audit finale: **65 prioritari**, 25 a priorità bassa, 103 multipagina esclusi, 473 sorgenti complessivi. Tutte le copie rimangono TEST/non certificate per la produzione. Nessun deploy o modifica commerciale.
