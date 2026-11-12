# Multipagina e livelli di riferimento — 12 novembre 2026

L’editor locale conserva ora tutte le pagine di un progetto, con formati e nomi indipendenti. Navigazione, pagina vuota, duplicazione, rinomina, riordino ed eliminazione con conferma passano dagli stessi comandi validati manuali/AI. Copia e Incolla funzionano anche fra pagine e documenti. L’ispettore mostra «Larghezza fissa del box»: la spunta ha semantica inversa al vecchio `autoWidth`, senza migrare o alterare i testi salvati; altezza sempre automatica.

## Documento e compatibilità

Il formato monopagina precedente rimane leggibile e invariato. La scena attiva occupa la radice storica, le altre compaiono una sola volta in `otherPages`; `pageId`, `pageName` e `pageOrder` identificano e ordinano le pagine. Gli ID oggetto sono locali alla pagina; i file font sono condivisi nel progetto e rimangono immutabili. Nessuna seconda copia persistente del canvas.

`revision` resta globale e monotona per rifiutare risposte obsolete. `contentRevision` distingue navigazione e modifica effettiva: cambiare pagina non sporca il progetto né consuma Undo. Undo/Redo ritorna alla pagina modificata. Riapertura/importazione e duplicazione in archivio ribasano entrambi i contatori. Eliminazione di una pagina rispetta blocchi diretti ed ereditati del cliente; amministratore conserva le facoltà previste.

Massimo 100 pagine. I budget esistenti di oggetti, gruppi, testo, vettori e immagini si applicano al progetto intero, non a ogni pagina. I font di tutte le pagine sono controllati con i file incorporati; segnalazioni con nome della pagina e comando per raggiungerla. La correzione dei caratteri non può finire su un oggetto omonimo di un’altra pagina. Sostituire un template nella pagina corrente conserva i file usati dalle altre.

JSON e archivio salvano tutto il progetto. SVG/PNG della pagina corrente, ZIP di tutti gli SVG e PDF locale multipagina con misure fisiche indipendenti. Le esportazioni complete falliscono integralmente se una pagina è invalida. Il riepilogo commerciale locale a singolo SVG è disattivato sui libri, con spiegazione: nessun appiattimento o collegamento al negozio implicito.

Le miniature amministrative rappresentano la prima pagina nell’ordine logico: non dipendono dalla pagina attiva all’ultimo salvataggio. La chiave delle vecchie miniature monopagina rimane stabile; modificare solo una pagina successiva non rigenera inutilmente l’immagine della prima. I riferimenti materiali restano esclusi dalla miniatura produttiva, come dichiarato dall’importatore.

## Cornici, sfondi e fissaggi

Il titolare conferma che la cornice blu dei numeri civici è già sul supporto, ma deve essere conservata nel file tecnico. Direttiva estesa agli sfondi/materiali, in un livello sottostante separato: [piano e fonti](editor-reference-layers-plan.md).

- Output produttivo preesistente: esclude riferimenti e icone dei fissaggi.
- **SVG tecnico con riferimenti**: gruppi nominati Sfondo/materiale sotto, Grafica produttiva al centro, Cornici/fissaggi sopra. I gruppi di riferimento hanno anche una regola CSS di stampa; non presume che ogni importatore vettoriale la mantenga.
- **PDF con livelli di riferimento**, comando amministrativo distinto: livelli OCG visibili a schermo, `PrintState=OFF` e configurazione automatica per l’intento di stampa. Form XObject mantengono vettori, risorse e coordinate di ogni pagina, senza collisioni fra nomi delle risorse. Il produttivo rimane disponibile separatamente.

Il renderer tecnico usa un fondo trasparente fra livelli, mantenendo il colore del supporto nel livello inferiore; il comportamento dei file produttivi ordinari resta invariato. Diametri dei fori fisici solo quando configurati; viti/distanziatori privi di diametro sono simboli di posizione.

Prova effettiva: Poppler visualizza sfondo giallo e cornice blu; Ghostscript con intento `Printed=true` li esclude e conserva il rettangolo nero produttivo. La conversione generica `pdftops` usata inizialmente **non ha rispettato l’impostazione di stampa**. Questo limite è conservato nei log e motiva i file produttivi separati. Non si dichiara compatibilità universale, né collaudo Illustrator.

## Importazione effettiva

Audit storico: tutte le 292 copie precedenti hanno sorgenti acquisiti monopagina, zero importazioni parziali note. L’importatore ora converte tutte le pagine oppure rifiuta l’intero sorgente; «Templates PitchPrint» escluso, Biglietti da Visita ancora a bassa priorità.

Confrontati tutti gli otto sorgenti multipagina prioritari, pagina per pagina, contro il riferimento nativo indipendente, con font esatti e immagini originali identiche:

| Copia importata | Pagine | Formato di ciascuna pagina |
|---|---:|---|
| 80x25 | 2 | 900 × 400 mm nel sorgente |
| 80x25 due righe | 2 | 900 × 400 mm nel sorgente |
| 16x12 modelli | 9 | 160 × 120 mm |
| 15x10 modelli | 9 | 150 × 100 mm |
| 15x10 MODELLI, con variazioni | 9 | 150 × 100 mm |
| 16x12 MODELLI, con variazioni | 9 | 160 × 120 mm |

Titoli originali conservati; i nomi dei cartelli non sono stati interpretati come autorità sulle misure. Tutte le 40 pagine sotto le soglie prefissate; sui numeri civici zero pixel oltre soglia. Cornici originali JPEG conservate come riferimenti del supporto. Categoria lunga «Numero civico con bordo blu (con variazioni)» rappresentata dai due tag «Numero civico con bordo blu» e «Con variazioni», con nome originale registrato nella provenienza.

Sei copie salvate, tag «Da verificare», nessuna associazione commerciale o sovrascrittura. **298 template totali, 296 attivi e due archiviati in attesa; due composizioni, 219 font; revisione 578 → 584.** Backup verificato prima della prima scrittura: `.local/pitchprint-migration/multipage-local-import/backup-revision-578-5152f84dc158.json`, SHA-256 `5152f84dc158d4c1e4cc58649b0e2d99b3447587fe0acced0e3759d3055a32e8`. Record precedenti, impostazioni, font e profili conservati integralmente.

Riaperti i sei record e navigate tutte le 40 pagine reali: font e geometrie pronti, strutture equivalenti, zero errori o scritture durante il controllo. Sei miniature generate e riutilizzate dopo ricaricamento senza ulteriori richieste dei record. Manifest, confronti e originali privati in `.local/pitchprint-migration/multipage-priority-prepared` e `multipage-local-import`.

Due sorgenti prioritari multipagina restano bloccati: **60x20** e **60x20 due righe**, per oggetti testo vuoti presenti nelle pagine originali. Nessuna eliminazione implicita o importazione parziale per aggirare il limite attuale. Restano anche i 53 sorgenti prioritari monopagina precedenti; le due copie con rettangolo totalmente fuori foglio restano archiviate e integre.

## Prove e campioni

**896 unitari / 133 file**, build locale e pubblico, schemi, scansioni segreti; **24 browser pertinenti completi**, altri **tre casi massivi** (libri e monopagina insieme, categoria esclusa anche con maiuscole differenti, interruzione/ripresa), con ricontrollo finale dei casi archivio/livelli, **13 pubblici locali**, runtime Worker senza rete reale e **50 campioni riaperti/riesportati**. Non una nuova suite browser generale. I log intermedi con errori sono conservati: aspettativa della spunta invertita corretta nel test; etichetta del caricamento JSON resa coerente; opacità fra livelli risolta; renderer di stampa scelto esplicitamente e relativo limite documentato.

Nuovi campioni portabili, tutti TEST con font incorporati:

- [Progetto multipagina](../fixtures/illustrator/multipage.TEST.json), [prima pagina SVG](../fixtures/illustrator/multipage.page-1.TEST.svg), [seconda pagina SVG](../fixtures/illustrator/multipage.page-2.TEST.svg), [ZIP SVG](../fixtures/illustrator/multipage.TEST.zip), [PDF multipagina](../fixtures/illustrator/multipage.TEST.pdf).
- [Progetto con riferimenti](../fixtures/illustrator/reference-layers.TEST.json), [SVG produttivo](../fixtures/illustrator/reference-layers.TEST.svg), [SVG tecnico](../fixtures/illustrator/reference-layers.technical.TEST.svg), [PDF tecnico](../fixtures/illustrator/reference-layers.TEST.pdf).

Generatore `scripts/capture-editor-multipage.ts`; verificatore dei 50 campioni `scripts/verify-editor-artifacts.ts`. Schermate desktop esaminate, rapporti privati in `.local/multipage-capture`. Illustrator rimane da verificare manualmente: testo modificabile, livelli e stampa dei riferimenti, misure delle due pagine e riapertura.

Prossimi incrementi già richiesti: proporzioni collegate di default con icona catena e maniglie laterali indipendenti; superficie interattiva/maniglie fuori foglio e recupero delle due copie archiviate; supporto coerente dei box vuoti per i due cartelli rimasti. Nessun deploy, generazione immagini AI o modifica a Shopify/PitchPrint/BSS/prezzi/acquisti.
