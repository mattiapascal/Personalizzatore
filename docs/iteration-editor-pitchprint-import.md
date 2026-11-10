# Importazione locale dei template PitchPrint

Riferimento fornito dal titolare: [pitchprint-template-lab](https://github.com/mattiapascal/pitchprint-template-lab). Letti README, handoff, schema, fixture e client Runtime; trovata e consultata anche la copia locale più aggiornata in `Documents/Shopify/PitchPrint Template Lab`. Nessuno script di pubblicazione, riparazione, cancellazione o assegnazione ai prodotti è stato eseguito. HAR e sessioni browser non sono stati copiati.

## Percorso di prova

[Importa da PitchPrint](http://127.0.0.1:5173/editor/import-pitchprint?workspace=1&mode=admin), raggiungibile anche dall’amministrazione. Si può leggere un design online per ID con il solo endpoint Runtime `fetch-design`, scegliere un sorgente già acquisito o caricare un JSON nativo. Credenziali esclusivamente nel backend locale, da configurazione privata esistente; URL del servizio fisso, nessuna chiave nel frontend. Asset remoti ammessi soltanto negli archivi PitchPrint conosciuti, con limite, timeout e redirect bloccati.

Si sceglie esplicitamente se convertire i colori nella palette TEST o escludere uno sfondo/materiale non produttivo. Nessun prodotto Shopify viene dedotto o assegnato automaticamente. Selezionando una famiglia di targa si possono poi usare misure/fissaggi parametrici. Si controllano anteprima e differenze, si apre una copia nell’editor e si usa Conferma design per salvarla come template nel solo archivio locale. Sorgente originale e design online restano invariati.

## Censimento reale

Letti **46 categorie e 473 design** attraverso gli endpoint Runtime documentati in sola lettura; acquisiti tutti i 473 sorgenti, dei quali 370 a pagina singola. Gli ID osservati includono sia il formato esadecimale storico sia `des_` con UUID. Inventario e copie private sono in `.local/pitchprint-migration/`, protetti dall’accesso HTTP e ignorati da Git. Questo è un censimento/acquisizione: non significa che tutti i design siano già convertibili né che siano stati salvati nell’archivio del nuovo editor.

## Conversione e limiti espliciti

Primo convertitore di sorgenti a **una pagina in mm**: testi editabili, forme/vettori semplici e immagini PNG/JPEG nei limiti attuali, con geometria fisica, Label, Ordine e proprietà riconosciute. Le matrici `mtx` e gli ingombri testuali memorizzati nel sorgente possono essere obsoleti: per i testi vengono usati posizione, scala, rotazione, origine effettiva e misure del file font esatto, ricalcolate con Fabric. Una prova reale di 400×300 mm ha conservato tutti i 13 elementi; la resa è stata ispezionata e la conversione delle coordinate corretta dopo il primo controllo visivo.

I font sono risolti mediante file verificati. Gli alias del catalogo originale sono ora riconosciuti con prova del file e riscontro di peso/stile: [contratto e verifiche](iteration-editor-pitchprint-font-aliases.md). **Nessun fallback, neppure su un peso diverso della stessa famiglia**. Varianti Google richieste installabili dalla gestione locale; font mancanti/non verificabili bloccano il template. Il rapporto dei font contiene quelli da fornire o verificare manualmente.

Gruppi, maschere, ombre, skew, opacità particolari, formattazioni parziali e altre funzioni non ancora mappate producono un errore esplicito; non viene salvata una conversione parziale. Colori e sfondi richiedono una scelta esplicita. Catene/hook/tag speciali e mappature dei blocchi non documentate richiedono revisione. `reference` stringa è un identificativo nativo, non il flag “guida”: non va scambiato per `isReference`. I blocchi legacy `dLocked/eLocked` sono trasferiti conservativamente e segnalati per il controllo amministrativo.

La compatibilità visiva fra Fabric 3 e il nuovo motore richiede confronto umano; non è una certificazione Illustrator o produttiva. Multipagina resta fuori ambito. Prezzi, BSS, associazioni online, PitchPrint e tema non vengono modificati.

## Font richiesti

`scripts/pitchprint-font-inventory.ts` censisce anche gruppi e stili dei caratteri, distingue famiglia/peso/corsivo e usa il primo nome dichiarato nelle liste CSS; non sceglie un font alternativo dalla lista. Dry-run predefinito. `--install-google` installa soltanto varianti disponibili e verificate, conserva licenze e crea un backup prima delle aggiunte. Il confronto finale controlla che record, impostazioni, profili e font preesistenti restino invariati. I dati dei template non vengono trasmessi a Google: solo i nomi/varianti dei font richiesti.

Rapporto privato: `.local/pitchprint-migration/font-audit/font-report.json` e `font-da-installare.md`. Verifiche finali e numeri effettivi nello [stato locale](editor-local-status.md).

Installazione effettiva autorizzata: **39 varianti Google**, di cui 37 dal catalogo corrente e 2 file storici esatti Arima Madurai, riscontrati con hash contro l’origine `fonts.gstatic.com` e con [licenza ufficiale](https://github.com/google/fonts/blob/1b5032e4675c56e621f5bffec9519b4da1f126f3/ofl/arimamadurai/OFL.txt). Non è stata usata la nuova famiglia Arima. Nel primo censimento rimanevano **57 combinazioni di 40 famiglie** manuali, incluse varianti Google non esistenti con il peso richiesto. L’elenco indica 49 file/varianti presenti nel vecchio laboratorio: presenza non equivale a identità già certificata. I vecchi file e i template non sono stati modificati. Tutti i 39 file installati e le relative licenze sono stati ricontrollati; preservati record, impostazioni, profili e font precedenti.

Ricontrollo aggiornato dopo i caricamenti del titolare: [stato locale](editor-local-status.md) e lista scaricabile nell’importatore. I conteggi originali sopra sono storici; disponibilità di un file nel vecchio catalogo, installazione globale e convertibilità del template sono verifiche distinte.
