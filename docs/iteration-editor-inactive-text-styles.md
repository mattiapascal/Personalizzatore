# Stili di testo residui e contorno assente — 12 novembre 2026

## Problema e risultato grafico

«Timbro per fatturazione di libero professionista» era escluso per 32 stili su una riga ormai assente. La prima copia diagnostica senza quella riga presentava ancora differenze: rapporto pixel 0,0504489, errore medio 1,1019955/255. Non è stata importata.

Confrontati separatamente i quattro oggetti: posizioni di tutti i glifi coincidenti con Fabric 3.4.0 entro circa 2,14 × 10⁻¹⁴ mm; anche i pixel coincidevano per i primi tre testi. Nell’ultimo, «nessun contorno» risultava `undefined` sul box e `transparent` sui primi 29 caratteri. Fabric creava due segmenti di testo invece di uno. La variante diagnostica con segmento uniforme ha eliminato tutte le differenze; ritaglio, kerning e dimensione locale del font non erano la causa.

Corretto il renderer generale: rappresentazione uniforme del contorno assente, a parità degli altri attributi, quando box e caratteri ne sono privi; quando il box ha un contorno colorato, l’override locale trasparente resta esplicito, così lo SVG non eredita il contorno del box. Un colore con alpha zero conserva il suo RGB per la modifica successiva. Gli stili canonici non vengono rimossi o riscritti: restano significativi per le modifiche future. Nessuna correzione precalcolata delle posizioni.

## Stili che non dipingono caratteri

Il parser riconosce righe residue soltanto per **Textbox versione 3.4.0** osservati e verificati. Gli indici devono essere interi canonici e nei budget tecnici: riga sotto 100, colonna fino a 4.000. Non sono nuove righe nel documento. Font, corpo e colori di questi stili non vengono applicati o risolti, perché non appartengono a caratteri esistenti. L’importazione segnala il numero escluso; il sorgente originale resta conservato.

Righe vuote esistenti, colonne oltre il testo su righe esistenti, indici malformati, altre versioni/tipi e proprietà sconosciute rimangono bloccanti. I valori di inserimento esattamente alla fine di una riga non vuota mantengono la politica già esistente. Parser e censimento dei font condividono la classificazione delle posizioni, evitando richieste di file mai dipinti.

Nessun cambiamento di schema canonico o regole produttive. Manuale e AI simulata continuano a usare gli stessi comandi validati, con revisioni e Undo/Redo.

## Evidenza indipendente e limiti

Runtime originale Fabric 3.4.0, testo con due righe esplicite e tre righe visive: rimuovere le righe residue lascia **SVG identico e canvas senza differenze**. Canvas attuale contro canvas originale: zero pixel oltre la soglia, errore medio 0,0014752/255; SVG attuale contro SVG originale: zero differenze. I confronti omogenei mantengono le soglie originali. Rapporto privato `.local/inactive-styles-history-native-proof.json`.

Il campione misto con contorni colorati ha mostrato un limite del vecchio esportatore: `stroke: null` e spessore locale zero non vengono dichiarati nello span SVG, che eredita il contorno del box. Il canvas originale invece lo sopprime. Non viene preso come autorità grafica quello SVG difettoso: il confronto canvas/canvas passa (rapporto 0,0003072), mentre il confronto SVG legacy/attuale aveva rapporto 0,0718047. I primi tentativi falliti restano nei log privati. Anche immagini SVG e canvas, pur equivalenti nei confronti omogenei, hanno coperture dei bordi diverse: il confronto incrociato diagnostico sul solo testo uniforme misurava 0,0214031 e media 0,012744/255. Non viene presentato come una prova pixel perfetta fra superfici o come collaudo Illustrator.

Per gli stili locali assenti con spessore positivo, una regressione separata confronta spessore 0 e 0,4 mm sotto un contorno del box colorato: SVG identici nei pixel, senza far riapparire la linea; il colore locale con alpha zero resta recuperabile. Si evita così di risolvere la segmentazione introducendo un’ereditarietà errata del contorno.

## Campione e prove

`inactive-text-styles.source.TEST.json` → `inactive-text-styles.TEST.json/svg`, **160 × 100 mm**, due box Arimo/Tinos OFL incorporati, ritorni a capo, stili residui e contorni locali veri. Generatore `scripts/capture-editor-inactive-text-styles.ts`: posizione manuale, comando AI sul contorno del box, override locale conservato, Undo, JSON/SVG e screenshot desktop/mobile ispezionati. Due oggetti, revisione 5; confronto SVG indipendente senza differenze, nessun errore, scrittura amministrativa o richiesta esterna.

- **876 unitari / 129 file** passati, inclusi esclusione dei soli stili inattivi e censimento dei font coerente.
- **15 browser iniziali** su contorni, stili, trasparenze, testo su tracciato e controllo font; altri **tre** su campione storico e due nuovi casi, tutti passati.
- **47 campioni** riaperti ed esportati, zero errori browser/richieste esterne.
- **220 regressioni pertinenti passate in 9,1 minuti**, senza modifiche a codice, test o archivio durante l’esecuzione. Ricontrollati i tre casi specifici dopo la rimozione di una variabile inutilizzata nel solo test. Non è una nuova esecuzione completa dei 569 casi del laboratorio.
- Build, schemi e scansioni dei segreti passati; pacchetto Worker soltanto in dry-run, runtime locale e **13 browser pubblici locali** passati. JavaScript pubblico `index-BG2r_x-8.js` e CSS `index-L8Ls1asZ.css` invariati.

Cache miniature aggiornata una volta al renderer `png-3-fabric-7.4.0-text-paint`, necessaria per il nuovo disegno. Contenuto e metadati restano distinti: non una rigenerazione a ogni apertura.

## Template reale e seguito

Il sorgente originale completo, senza rimozioni diagnostiche, supera ora il confronto: **zero differenze**, quattro testi, 60 × 40 mm, font esatti e avviso per i 32 stili residui. Preparato in `.local/pitchprint-migration/inactive-styles-prepared/` e poi salvato con il flusso autorizzato, dopo il collaudo.

Censiti 75 sorgenti prioritari ancora esclusi: solo Fatturazione ha righe residue; dieci hanno stili di contorno assente su box già senza contorno, da confrontare integralmente prima di dichiararli recuperati. Nessun caso prioritario del campione presenta l’override nullo con contorno del box colorato che mette in errore il vecchio SVG. Questo censimento non certifica le conversioni. Report privato `remaining-text-style-history.json`.

Archivio finale: **271 template, due composizioni, 219 font, revisione 555**, SHA `e98f8c0623f1433848f831f51865dd57828d7a44c0d9d9ade9f8179e678664d1`. Backup della revisione 554, SHA `9b34b3a31b385fa5e7b5a73230f5794d2e915b0941b239a098dc4d5cd67875c6`, in `.local/pitchprint-migration/inactive-styles-local-import/backup-revision-554-9b34b3a31b38.json`. Tutti i record, font, impostazioni, profili e priorità preesistenti conservati. Nuovo record con tag «Da verificare», colori/provenienza e nessuna associazione prodotto.

Riaperto il record effettivo, verificati oggetti/font/formato; miniatura generata e riutilizzata dalla cache dopo il ricaricamento senza riletture del record, errori o scritture. Checksum invariato durante entrambi i controlli. Manifest e log privati nella stessa cartella e `.local/inactive-styles-*.log`.

Prossimo: confronto integrale degli altri nove candidati con contorni assenti, poi originali dei due Passo carrabile. Restano **74 sorgenti prioritari non importati**, 25 a priorità bassa e 103 multipagina esclusi. Nessun deploy, modifica online o generazione immagini AI. Illustrator ancora da collaudare.
