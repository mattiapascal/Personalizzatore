# Dieci template Classe energetica recuperati — 12 novembre 2026

## Importazione locale

Importate le classi **A1, A2, A3, A4, B, C, D, E, F e G**, formato originale **100 × 160 mm**. Ogni documento conserva 69 oggetti, cinque immagini e 12 gruppi. I testi usano i due file originali già presenti in libreria, ArialMT e Arial-BoldMT; nessun font nuovo o sostitutivo.

Il recupero riutilizza la [capacità di 32 immagini](iteration-editor-image-capacity.md), i ritagli rettangolari e l’espansione dei contorni già implementati. Nessun nuovo codice applicativo. I contorni deformati diventano geometrie vettoriali; i testi rimangono editabili. Gli avvisi del convertitore su gruppi, blocchi, proprietà aggiuntive e ricostruzione multiriga sono conservati nella provenienza delle bozze.

Salvataggio tramite `importPitchprintTemplate`, con colori originali, tag **PitchPrint**, **Da verificare** e **Classe energetica**. Nessuna associazione a prodotto o variante; `fixture: true` e `validatedForProduction: false` conservati.

Archivio: **259 → 269 template**, revisione **543 → 553**. Conservate le due composizioni, tutti i 219 font, profili, impostazioni e priorità dei tag precedenti. Ogni record preesistente è stato confrontato per fingerprint prima e dopo i comandi; nessuna sovrascrittura. Il nuovo tag è aggiunto al vocabolario.

Backup privato verificato prima della prima scrittura:

`.local/pitchprint-migration/multi-image-local-import/backup-revision-543-e86088a56c0d.json`

SHA-256 iniziale `e86088a56c0d803677396bf514dc8fa7e35a6610df2d6cc9134a1e201607ea2b`; finale `c765f99c6a5dc795edbe43dd362434beaddb5ccc35ad8328f35f3c4354f37849`. Libreria media invariata, revisione 1051.

## Verifiche

- **10/10 confronti completi** con il riferimento SVG indipendente, ricostruito dal sorgente PitchPrint a colori e campionato a 4×. Rapporto dei pixel differenti fra **0,00782407 e 0,00787241**, errore medio fra **0,1477168 e 0,1484688/255**; soglie invariate 0,01 e 0,25/255.
- **50/50 immagini** confrontate byte per byte con gli originali verificati. URL e snapshot sorgenti conservati; nessuna anteprima usata al posto di un originale indisponibile. Le cinque risorse comuni vengono scaricate una sola volta nel controllo indipendente e confrontate per tutti i posizionamenti.
- **10/10 documenti salvati riaperti nell’editor reale**, con oggetti, gruppi, font, formato e dati tecnici identici ai record. Zero errori browser o scritture durante la verifica. Schermate A3 e G ispezionate.
- **10/10 miniature** generate e verificate di nuovo dopo il ricaricamento: zero riletture dei record nella fase di cache, zero errori o scritture e archivio invariato per checksum. Ogni riga è stata portata in vista: la sola schermata a pagina intera non certifica le miniature fuori dal viewport, mostrate in modo differito.
- Il codice applicativo resta quello di `426cd77`, verificato dalla suite completa **863 unitari, 545 browser laboratorio e 13 pubblici**, oltre a 45 campioni e controlli di build/Worker/segreti. Questa iterazione aggiunge il collaudo dei dati reali descritto sopra, senza dichiarare una nuova esecuzione della suite completa.

Manifest, backup e schermate privati in `.local/pitchprint-migration/multi-image-prepared/` e `multi-image-local-import/`; log `.local/multi-image-*.log`. Il JSON dell’archivio e i font personali non entrano in Git. Nessun collaudo Illustrator o produttivo; nessun deploy o intervento su negozio, tema, PitchPrint, BSS, prezzi o acquisti.

## Dove provarli

Aprire `http://127.0.0.1:5173/editor/admin?section=template`, premere **Aggiorna** e filtrare per il tag **Classe energetica**. Le denominazioni A1–A4 indicano le classi energetiche dei sorgenti, non formati carta.

## Censimento attuale degli esclusi

Nuovo controllo in sola lettura dell’indice effettivo e dei 473 snapshot locali, con archivio invariato durante l’audit:

| Stato | Sorgenti |
|---|---:|
| Già presenti nell’archivio | 269 |
| Pagina singola, priorità normale, ancora da analizzare | 76 |
| Pagina singola, priorità bassa | 25 |
| Multipagina esclusi | 103 |
| Totale snapshot | 473 |

I 370 sorgenti a pagina singola sono distinti dai 103 multipagina, in gran parte appartenenti ai vecchi modelli a bassa priorità. «Da analizzare» non significa convertibile o pronto al salvataggio. La categoria Biglietti da Visita, Templates PitchPrint e i testi curvi restano in coda; l’eccezione autorizzata di Azienda Agricola 99×139 è già presente come copia da completare manualmente.

Rapporto privato `.local/pitchprint-migration/remaining-current-audit.json`. Individuati quattro sorgenti prioritari con `textAlign: justify`: prossimo incremento proposto nel [piano sulla giustificazione](editor-pitchprint-justification-plan.md), senza modifiche a quei sorgenti o nuove importazioni implicite.
