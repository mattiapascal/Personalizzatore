# Recupero dei font originali da PitchPrint — 11 novembre 2026

**Aggiornamento successivo:** [cinque associazioni CSS originali risolte e Kuenstler recuperato](iteration-editor-pitchprint-css-fonts.md). La libreria è ora a 219 file e 82/83 combinazioni risolte; resta Gloria Hallelujah 700. I conteggi 218/77 e i sei casi qui sotto descrivono la prima operazione, conservata come evidenza storica.

Il titolare chiede di recuperare i font dai file effettivamente serviti da PitchPrint, prima Alida e poi gli altri mancanti. Il recupero è locale: nessuna modifica a font, template o account PitchPrint e nessuna pubblicazione dei file tipografici nel repository.

## Risultato nell’archivio reale

Dopo Alida, **16 file originali aggiunti**, con backup verificato: libreria **202 → 218 file** (217 attivi e uno precedentemente archiviato, conservato come tale), revisione **369 → 370**. La revisione 369 è quella effettiva letta prima dell’operazione e comprende le modifiche del titolare intervenute dopo il recupero di Alida. Tutti i font precedenti, categorie, ordine delle voci, documenti, impostazioni, profili e tag restano identici per valore. La scrittura passa dall’API locale e dalla sua coda/versione; nessuna sovrascrittura con un vecchio snapshot.

Ogni download è stato limitato a URL HTTPS dell’archivio font PitchPrint, senza redirect, e a 1 MiB. Verificati SHA-256 identico al catalogo acquisito, formato/tabelle, identità interna, peso/stile reali e caricamento/disegno nel browser. **16/16 file decodificati da Chrome prima dell’installazione**. I file sono installati con i loro metadati reali, anche dove una dichiarazione del vecchio template è discordante. Questo non rende automaticamente corretta quella dichiarazione.

| File originale recuperato | Peso reale | Corsivo |
|---|---:|---|
| Arial Bold Italic | 700 | sì |
| Arial Bold | 700 | no |
| Arial | 400 | no |
| DIN Pro Condensed Regular | 400 | no |
| DIN Pro | 400 | no |
| HelveticaNeueLTStd-CnO | 400 | sì |
| HelveticaNeueLTStd-BdCn | 700 | no |
| ITCErasStd-Bold | 700 | no |
| MyriadPro-BoldCond | 700 | no |
| NexaBold | 700 | no |
| Parisienne | 400 | no |
| Pinyon Script | 400 | no |
| Tekton | 500 | no |
| TimesNewRomanMTStd-BoldCond | 700 | no |
| URWDINSemiCond-Black | 900 | no |
| ZurichBT-LightExtraCondensed | 300 | no |

Alida originale era stato recuperato separatamente: [evidenza e collaudo](iteration-editor-high-resolution.md#font-alida-originale). Non è stata applicata la sostituzione ipotizzata quando si pensava che fosse introvabile.

L’installazione iniziale è riuscita. Un primo controllo successivo confrontava i JSON come stringhe e si è fermato per il diverso ordine delle chiavi prodotto dalla serializzazione: il ricontrollo per ID e uguaglianza profonda conferma che **nessun valore preesistente è cambiato**. Non è stata ripetuta l’installazione né ripristinato il backup sopra i dati correnti. Manifest, originali, backup, controlli browser e confronti sono privati in `.local/font-recovery-batch/`.

## Identità, omonimi e inventario

Nei **370 sorgenti a pagina singola** risultano **83 combinazioni di famiglia/peso/corsivo**. Inventario esteso ai testi curvi legacy senza dichiararne implementato il disegno; gli stili di inserimento esattamente a fine riga non richiedono file inutilizzati. Il ricontrollo non cambia il totale di 83.

Prima del recupero: 65 combinazioni già risolte nella libreria, sette originali disponibili ma non installati, 11 bloccate per ambiguità o stile. Dopo il recupero e il controllo dell’identità: **77 risolte con file installati, zero originali verificati ancora da installare, sei dichiarazioni da chiarire**.

Il resolver mantiene i controlli di nome, peso, stile e hash. In presenza di versioni omonime, il file originale del catalogo disambigua soltanto se i suoi byte sono verificabili. Per nomi nativi/PostScript come ArialMT, diversi dall’alias CSS `arial`, un indice di metadati cerca la corrispondenza esatta nel catalogo. Il risultato deve essere unico per hash; il file viene riletto e ricontrollato a ogni uso. L’indice non conserva i file binari e non sostituisce il controllo dell’identità. Catalogo duplicato, file alterato, pesi discordanti e assenza di un originale univoco restano bloccanti. Non è una ricerca di font simili.

| Dichiarazione rimasta da verificare | Evidenza |
|---|---|
| Gloria Hallelujah 700 | Nessuna variante corrispondente nel catalogo acquisito; tentativo dell’URL grassetto non disponibile (HTTP 403). Il normale è disponibile. |
| Kuenstler Script LT Std Medium 700 | Nessun originale corrispondente a quella dichiarazione nel catalogo acquisito. |
| Nexa Bold 400 | Originale recuperato e installato, peso reale **700**. |
| tekton 400 | Originale recuperato e installato, peso reale **500**. |
| URW DIN SemiCond Black 400 | Originale recuperato e installato, peso reale **900**. |
| Zurich Light Extra Condensed 400 | Originale recuperato e installato, peso reale **300**. |

Per i quattro pesi discordanti occorre provare come il CSS originale collega il nome della faccia ai byte; per i due grassetti va verificata l’eventuale simulazione nel vecchio renderer. Non chiedere altri file all’utente presentando questi sei casi indistintamente come «famiglie mancanti». La copertura dei singoli caratteri e le mappe Unicode sconosciute sono controlli separati: restano bloccanti per importazioni/adattamenti e output. La protezione globale delle metriche dei testi irrisolti resta aperta.

Il resoconto privato scaricabile dalla pagina importazione, `font-da-installare.md`, è stato aggiornato alla situazione effettiva, conservando la versione precedente. I vecchi elenchi storici non certificano più quali file manchino oggi.

## Capacità e verifiche

Il volume reale della libreria si avvicinava al vecchio tetto di 32 MiB. Tetto delle voci font portato a **64 MiB**, file di backup a 65 MiB e trasporto di ripristino a 66 MiB, con costanti condivise. Rimangono 500 file per libreria, 1 MiB per file e 4 MiB di font per singolo documento; la libreria globale non viene incorporata interamente nei progetti.

**667 unitari/103 file passati**, compreso il ricontrollo dell’hash dopo aver popolato l’indice. **Sette regressioni browser** su importazione, alias, rifiuti e backup passate; collaudo reale dei 16 file e di Alida distinto dai test con archivi temporanei. Build, schemi e scansione segreti passati. Gli [incrementi sulle foto](iteration-editor-high-resolution.md) comprendono inoltre il collaudo della foto da 12 MP e dei 24 campioni JSON/SVG. Nessun nuovo collaudo Illustrator.

Nuova analisi in sola lettura: **214/370 sorgenti convertibili**, contro 212 prima del recupero, zero regressioni. Recuperati i due «Sposini in auto». **156 restano bloccati**. Hash dell’archivio invariato durante l’analisi, zero scritture amministrative ed errori browser. I conteggi descrivono conversioni riuscite, non bozze approvate: restano **117 template PitchPrint e due composizioni** nell’archivio, senza nuove importazioni implicite.

Nessuna modifica a Shopify, tema, chat pubblicata, BSS, prezzi, carrello reale, checkout o ordini; nessun deploy. Prossimi lavori: prova delle dichiarazioni CSS discordanti, poi geometrie invisibili e altri blocchi dell’importatore, con revisione visiva prima di ulteriori salvataggi reali.
