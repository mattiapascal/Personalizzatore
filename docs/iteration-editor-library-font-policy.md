# Font incorporati obbligatori e apertura rapida — 10 novembre 2026

## Decisione e perimetro

Il titolare esclude tutti i font del computer dalla composizione grafica. La libreria e i file già incorporati nei progetti sono le sole fonti ammesse. I nomi storici rimangono leggibili nello schema per recuperare i documenti; non sono scelte utilizzabili. La tipografia dell’interfaccia è distinta dai font del progetto.

Il menu non offre più le sette famiglie di sistema e non aggiunge il suffisso «Libreria». La bozza iniziale attende un solo file della libreria (Arial Regular, se presente; altrimenti il primo nome disponibile). Il file scelto viene incorporato nella bozza, senza reinterpretare il font di un progetto esistente. Libreria vuota: foglio con geometrie utilizzabili, aggiunta testo impedita con indicazione di caricare un font.

## Comandi, recupero e importazioni

Prima delle misurazioni/rendering vengono rifiutati font non registrati da file, anche negli stili dei caratteri. I comandi manuali e AI simulata condividono il controllo; un errore conserva documento e cronologia. Anche il controllo produttivo del server blocca i font non incorporati.

Un JSON/template/progetto d’archivio con nomi storici apre una scelta esplicita dei file sostitutivi, distinta per famiglia, grassetto e corsivo. Nessuna associazione automatica basata sul solo nome. La conferma prepara una copia e passa dal normale open/import validato; annullando, l’originale e la scena corrente restano invariati. Dopo una sostituzione occorre controllare l’impaginazione. I vecchi campioni di collaudo che usano font del computer richiedono la medesima scelta; non sono diventati automaticamente portabili.

SVG editabile/contorni: risoluzione delle famiglie e delle varianti esclusivamente dalla libreria; file aggiunti al documento. La conversione locale in contorni rifiuta testi non riferiti alle risorse ricevute. PDF: font non incorporati rifiutati prima della conversione, sia per contorni sia per testo editabile. Il cliente deve riesportare incorporando i font o trasformando i testi in contorni.

B/I rimangono i controlli principali, secondo la preferenza del titolare. «Altri stili» è chiuso inizialmente e appare solo con più varianti; nessuna simulazione sostitutiva di una variante mancante.

## Correzione della schermata di caricamento

La prima modifica attendeva l’intera libreria prima di mostrare il foglio. Corretto: solo font del progetto/default in primo piano; caricamento degli altri in sottofondo, quattro per volta. File già caricati non riscaricati al ritorno sulla finestra.

Inoltre ogni GET di un font rileggeva e validava l’intero archivio locale, di circa 30 MB alla prova. I GET ora condividono una lettura validata; inode, dimensione e tempi del file invalidano la cache quando l’archivio cambia, anche da un’altra istanza. Nessuna scrittura/migrazione dell’archivio personale.

Due aperture con la libreria reale: **1711 ms e 1350 ms** fino al canvas, un file font incorporato nella bozza, nessuna scrittura amministrativa. Sono misure di questa postazione, non una garanzia su altri dispositivi.

## Evidenze

- 606 unitari / 88 file superati, inclusi due casi Poppler reali per PDF con Helvetica non incorporato, nelle due modalità.
- 12 browser pertinenti superati: 7 nuovi casi della politica/caricamento, varianti B/I, rotella/hover, alias PitchPrint validi/alterati e faccia esatta SVG.
- TypeScript/build e scansione dei segreti del client superati.
- Campione OFL `pitchprint-font-alias.TEST.json/svg` rigenerato: 100×40 mm, tre oggetti, un file, zero glifi mancanti, comandi manuali/AI simulata e Undo/Redo, zero scritture amministrative.
- La precedente suite browser completa era stata superata prima della nuova politica. La suite storica contiene casi che richiedono intenzionalmente font del computer: va aggiornata con fixture incorporate e flussi di scelta esplicita prima del prossimo controllo completo. Non viene dichiarata una nuova esecuzione completa né un collaudo Illustrator.

Nessun deploy, modifica al negozio, alla chat pubblicata o ai dati personali dei font.
