# Giustificazione importata e letture dei font — 12 novembre 2026

## Risultato locale

La giustificazione originale PitchPrint viene rappresentata nel documento canonico con `distribution: word-space` e `justifyLastLine: true`. Ogni spazio o tab riceve lo stesso incremento assoluto; tracking, crenature, font e stili locali rimangono quelli del testo. Righe senza spazi non acquistano spaziatura artificiale fra lettere; quelle troppo larghe non vengono compresse.

IText conserva la larghezza automatica, determinata dalla riga esplicita più lunga; Textbox conserva larghezza fissa e ritorno a capo. Forzare IText in un box fisso aveva aggiunto una riga nel primo sorgente reale: corretto senza modificare testo o geometria per far passare il confronto.

Nell’ispettore, «Parametri giustificazione» permette di scegliere «Tra parole e lettere» o «Solo tra parole (spazi uguali)» e se giustificare l’ultima riga. I predefiniti tipografici restano parole 80/100/133%, lettere 0/15/30%. Passare alla modalità tipografica con testo giustificato fissa la larghezza attuale nello stesso comando validato. Manuale, AI simulata, Undo/Redo, JSON e archivio condividono le impostazioni; nessuna lista parallela di posizioni congelate dei glifi.

## SVG e cache miniature

L’esportatore dichiara `preserveAspectRatio="none"` sulla radice SVG, con le due misure in mm e il viewBox. Elimina piccoli margini dovuti a `meet` quando il viewport intrinseco viene arrotondato in pixel CSS. Coordinate canoniche, testo editabile e ritagli conservati.

Le ipotesi font-size, spessore e clip non erano la causa. Il solo attributo corretto ha eliminato le differenze nel riferimento indipendente; nessuna normalizzazione del riferimento o soglia più permissiva rimane nei test. Renderer miniature aggiornato a `png-2-fabric-7.4.0-explicit-axes`: una rigenerazione per il nuovo output, poi cache riutilizzata; i soli metadati non invalidano la grafica.

## Letture condivise dell’archivio

Il vecchio processo Vite è terminato per heap esaurito durante una verifica reale: i lettori temporanei del resolver font analizzavano nuovamente l’archivio completo accanto alla cache del server. Nessun aumento dell’heap per risolverlo.

Le istanze predefinite di `EditorAdminStore` condividono ora la cache per directory risolta, con riferimenti deboli e un numero limitato di chiavi. `readFonts()` copia soltanto i contenitori dei font; resolver e download non chiedono più una copia dei progetti. Modifiche su disco invalidano lo snapshot fra istanze. La lettura a freddo carica ancora una volta il JSON monolitico: non è un database né un nuovo blocco di scrittura fra processi. [Capacità e limiti](iteration-editor-archive-capacity.md).

Server ripristinato senza opzioni aggiuntive dell’heap. Prova reale di **18 richieste**, 12 sequenziali e sei concorrenti, Myriad Pro 400 e Myriad Pro Cond 700: tutti gli hash verificati, nessun fallback, archivio invariato e server attivo. RSS osservato prima/dopo circa 445/853 MiB mentre girava la suite browser: non misura il picco né costituisce un benchmark isolato. Rapporto privato `.local/shared-font-reads-report.json`.

## Prove e campioni

- **870 unitari / 129 file**, build locale e tipi passati. Prima esecuzione: aspettativa obsoleta su `read()` nel test download. Aggiornata a `readFonts()`, conservate lettura unica e invalidazione; seconda esecuzione completa verde.
- **19 browser tipografici** passati: 16 combinazioni IText/Textbox, rotazione, stili misti e tracking; due interfacce desktop/mobile e cursore/selezione/scrittura. Altri **due SVG senza testo** passati. Punti dei glifi confrontati con riferimento nativo indipendente, tolleranza sotto 0,000001 mm; soglie pixel originali. Verifica privata Fabric 3.4.0: 16 combinazioni passate.
- Campione portabile `justification.source.TEST.json` → `justification.TEST.json/svg`, **160 × 100 mm**, Arimo/Tinos incorporati, due box, uno ruotato. Generatore `scripts/capture-editor-justification.ts`: manuale/AI, Undo e JSON/SVG. Pixel differenti zero, errore medio 0,0000144/255, delta massimo glifi circa 2,85 × 10⁻¹⁴ mm.
- **46 campioni** riaperti/esportati, zero errori browser o richieste esterne. Il verificatore attende ora l’editor pronto prima di caricare la prima fixture.
- **Cinque browser amministrativi** ricontrollati: pagina 2 → editor → ritorno, filtri/selezione/posizione, dettagli desktop/mobile e recupero anteprime. Template reale «Qui si spara a vista»: zero errori/scritture, hash archivio/media invariati. [Navigazione](iteration-editor-admin-navigation.md).

Suite completa: **565/566 in 28,4 minuti**, log `.local/justify-release-check.log`. Unico fallimento il confronto esatto con il campione SVG storico, cui mancava il nuovo attributo degli assi fisici: aggiornato soltanto quell’attributo, verificati invariati tutti gli altri byte e ricontrollo passato. Dopo la [correzione del lampeggio dei controlli font](editor-font-flicker-diagnosis.md), **873 unitari**, **46 browser pertinenti**, altri due ricontrolli finali, build/schemi/segreti, pacchetto e runtime Worker locali e **13 browser pubblici locali** passati. Bundle pubblico invariato. Non è una seconda suite completa verde. Illustrator da collaudare per tavola, allineamenti, font, rotazione e modificabilità.

## Sorgenti reali

Quattro candidati preparati senza salvataggi:

| Template | Esito |
|---|---|
| Timbro per scheda fornitura professionale | Importato dopo il collaudo: tre testi, 60 × 40 mm, font originali; zero pixel differenti, errore medio 0,0000315/255 |
| Timbro per fatturazione di libero professionista | Stili riferiti a una riga assente: segnalati, nessuna rimozione silenziosa |
| 25x45 con stemmaa | Manca l’originale verificato dell’immagine; anteprima esclusa dalla produzione |
| 25x45 senza stemma | Stesso blocco sull’originale |

Dopo il collaudo è stato importato soltanto il primo candidato. Archivio a **270 template, due composizioni, 219 file font, revisione 554**, SHA `9b34b3a31b385fa5e7b5a73230f5794d2e915b0941b239a098dc4d5cd67875c6`. Backup della revisione 553, SHA `c765f99c6a5dc795edbe43dd362434beaddb5ccc35ad8328f35f3c4354f37849`, in `.local/pitchprint-migration/justification-local-import/backup-revision-553-c765f99c6a5d.json`. Record, font, impostazioni, profili e priorità preesistenti conservati; nuovo record con provenienza, colori e tag «Da verificare», senza associazioni prodotto.

Riaperto il record effettivamente salvato, confrontando oggetti, font e area con il documento d’archivio. Miniatura generata e verificata dopo il ricaricamento dalla cache, **zero richieste del record nella fase cache**, zero errori/scritture e checksum invariato. Rapporti privati `report-compact.json`, `reopen-report.json` e `thumbnails-report.json` nella stessa cartella. Restano 75 sorgenti a pagina singola di priorità normale non importati, 25 a priorità bassa e 103 multipagina esclusi. I tre candidati bloccati sopra non sono stati salvati.

Diagnosi privata successiva di «Timbro per fatturazione»: Fabric 3.4.0 produce geometria e SVG identici con o senza gli stili della riga assente. Tuttavia la copia diagnostica completa conserva differenze grafiche oltre soglia (rapporto 0,05045, errore medio 1,102/255). Nessuna capacità generale o importazione aggiunta per ignorare quegli stili: serve prima individuare anche le altre differenze. I due Passo carrabile non hanno un originale recuperabile dal frammento SVG incorporato (`href="undefined"`); non è stato ricostruito un URL arbitrario.

Nessun deploy, modifica a negozio/tema/PitchPrint/BSS/prezzi/acquisti o chiamata AI a pagamento. Multipagina e testi curvi non aggiunti.
