# Font PitchPrint: associazioni CSS verificate — 11 novembre 2026

Il recupero richiesto dal titolare comprende ora **Alida e altri 17 file originali**. L’archivio locale contiene **219 file, 218 attivi e uno già archiviato**. Sono risolte **82 delle 83 combinazioni famiglia/peso/corsivo** dei 370 sorgenti a pagina singola. Le quantità sono diverse: una combinazione richiesta può usare un file già presente o un alias CSS.

I [primi 16 file dopo Alida](iteration-editor-font-recovery.md) erano già installati con backup. In questa iterazione è stato recuperato un ulteriore originale: `kuenstler_script_lt_std_medium_b.woff`, 30.304 byte, SHA-256 `34ed67cec3363b0d0aa93606409bca09454416951048923d7629ee4c168e1532`. Il nome interno è **KuenstlerScriptLTStd-Black, peso 750**. Questa è la faccia servita da PitchPrint per la richiesta «Kuenstler Script LT Std Medium, bold», non una scelta di un carattere simile.

Installazione tramite API amministrativa locale, revisione **370 → 371**, dopo prova del caricamento/disegno in Chrome, controllo dei caratteri di «Dott. Paolo Casoni» e backup verificato. Font precedenti, ordine, categorie, documenti, impostazioni e profili conservati per valore. Nessun ripristino sopra modifiche concorrenti. Backup, file e manifest privati in `.local/font-recovery-kuenstler/`; nessun binario proprietario pubblicato nel repository.

## Perché il peso dichiarato era diverso

Lo [script pubblico di PitchPrint](https://pitchprint.io/rsc/js/app.js), letto senza eseguirlo, costruisce le facce personalizzate usando il nome della famiglia per il file normale e il suffisso `_b` per quello grassetto. I descrittori CSS sono nominalmente 400/700, anche quando il peso interno del file è diverso. Script acquisito SHA-256 `9e8c1790e1d24c7247f044bb34b2f776b42538486913ea26ee069d42f4e1518d`.

| Richiesta originale | Peso CSS | Peso del file verificato |
|---|---:|---:|
| Nexa Bold | 400 | 700 |
| tekton | 400 | 500 |
| URW DIN SemiCond Black | 400 | 900 |
| Zurich Light Extra Condensed | 400 | 300 |
| Kuenstler Script LT Std Medium bold | 700 | 750 |

Il collegamento è **chiuso a questi cinque URL/hash**, in `pitchprint-css-faces.ts`. Server e browser verificano richiesta, hash, provenienza, peso e corsivo; il browser ricontrolla l’hash dei byte ricevuti. Il progetto contiene la faccia con i **metadati reali** e la disegna tramite un alias univoco, senza stili sintetici. Un file attivo già installato può risolvere un originale non più elencato nel catalogo solo se corrisponde a questa prova completa; file simili o archiviati non soddisfano tale percorso. Nessun permesso generale di ignorare il peso.

## Un caso ancora irrisolto

**Gloria Hallelujah 700**: il normale è installato; la richiesta Google Fonts della variante 700 risponde HTTP 400 indicando che non è disponibile. L’URL candidato PitchPrint `_b.woff` risponde HTTP 403. Non è prova dell’assenza assoluta di altri file, ma manca un originale verificabile per quella dichiarazione. Nessuna sostituzione o simulazione automatica applicata.

Aggiornato il rapporto privato `font-da-installare.md` scaricabile dall’importatore, conservando la versione precedente. Le vecchie liste di sei casi sono storiche. Copertura Unicode, particolari caratteri mancanti e protezione globale delle metriche restano controlli distinti: non dichiarare completa tutta la politica font.

## Verifiche

- **Cinque facce originali**: caricamento, confronto Canvas2D tra descrittore CSS nominale e alias canonico, confronto SVG con ricostruzione indipendente. Nessuna differenza nei pixel dei campioni «ABC abc 123»; JSON riaperto e comandi manuali/AI con doppio Undo conservano documento e file.
- Matrice unitaria per famiglia, peso, corsivo, URL, hash errati e prova contraffatta: rifiuti espliciti. Rimangono i test su omonimi, catalogo alterato e identità Unicode.
- Archivio invariato durante i controlli successivi all’installazione, zero scritture amministrative ed errori browser. Rapporti privati in `.local/font-css-faces/` e `.local/font-recovery-batch/audit-css-final.json`.

La verifica complessiva dell’incremento comprende 674 unitari/104 file e sette regressioni browser, oltre alle prove dei cinque originali; build, schemi e scansione segreti passati. [Ricontrollo finale dei template: 227/370, 13 recuperi senza regressioni](iteration-editor-pitchprint-primitives.md).

Il controllo dei file non certifica automaticamente ogni template. Nessun nuovo template importato nell’archivio del titolare; nessun collaudo Illustrator, deploy o modifica a Shopify, tema, chat pubblicata, PitchPrint o BSS.
