# Font: classificazione e usabilità — 10 novembre 2026

Richieste: categorie per tutti i file caricati; lista amministrativa compatta con anteprima reale, intestazioni persistenti e nomi grandi; correzione dello scorrimento del menu nell’ispettore; riparazione del file il cui nome interno è «.».

## Categorie della libreria personale

Classificati **123 file su 123** con almeno una delle categorie Serif, Sans-serif, Calligrafici, Decorativi, Monospaziati e Simboli. Possibili più categorie. Riscontro nei metadati interni e nel catalogo ufficiale Google per 99 file; controllo visuale dei 24 restanti, raggruppati in 15 famiglie. Una categoria è una classificazione grafica, non una sostituzione di font.

Le scritture passano da `setFontCategories`, modalità aggiunta, con revisione attesa prima di ogni gruppo. Conservate le spunte preesistenti; prima copia privata di sicurezza. Confronto semantico: progetti, impostazioni, profili e file tipografici invariati. La verifica iniziale basata sull’ordine delle chiavi JSON è stata sostituita con un confronto canonico, perché la validazione riordina le proprietà senza modificarne i valori. Nessun ripristino di dati del titolare.

Google restituisce categorie come `Sans Serif`, `Display` e `Handwriting`; la normalizzazione gestisce maiuscole, spazi e trattini. Le categorie sconosciute restano senza deduzioni. Le nuove installazioni usano lo stesso mapping.

## Lista amministrativa

La matrice è la vista iniziale: una famiglia per riga, varianti raggruppate e spunte accanto al nome. Il nome usa il file vero; SVG interno alla cella dimensionato sulle misure dei glifi, senza stiramento. Il dettaglio per singolo file resta in **Elenco con anteprime**. Operazioni su più font raccolte nel relativo pannello richiudibile.

Intestazione fissa quando la tabella scorre fuori dalla parte alta della pagina, con colonne sincronizzate e scorrimento orizzontale coordinato su mobile; la copia visiva è esclusa dall’albero accessibile. Non ci sono controlli duplicati.

## Menu nell’ispettore

Il vecchio effetto riportava in vista la voce attiva sia quando cambiava l’hover sia quando il menu veniva riposizionato durante uno scroll. Questo contrastava rotella/trackpad e faceva apparire bloccata la lista.

Il menu porta in vista una voce soltanto all’apertura e dopo una navigazione esplicita da tastiera. L’hover evidenzia senza scorrere; lo scroll interno non richiede il riposizionamento del popup. Rotella contenuta nella lista, senza propagazione ai contenitori esterni a fine corsa. La scelta del font continua a passare dal normale comando grafico, senza modifiche durante il semplice passaggio del mouse.

Inoltre grassetto/corsivo conservano i qualificatori di disegno come **Condensed**. Due file differenti con gli stessi metadati non vengono selezionati in base all’ordine: la scelta automatica è bloccata. Anche la ricerca dei font locali per l’importazione PitchPrint preferisce l’identità esplicita e rifiuta le ambiguità.

## Nome del font danneggiato

Il file con etichetta «.» contiene nomi illeggibili sia nella tabella OpenType `name` sia nel nome CFF. Non è stato identificato il nome originale del carattere: non viene inventata un’identità commerciale.

Preparata una copia con nome descrittivo **Font recuperato 2b31c91a**, ricavato dall’hash dell’originale. Corrette le stringhe famiglia, stile, nome completo e PostScript nelle tabelle interessate. Copia riparata installata nell’archivio locale; originale archiviato e conservato con gli stessi byte. I due record compaiono sotto la stessa famiglia descrittiva. Ora 124 record font complessivi, 123 attivi. Progetti, altri font, impostazioni e profili invariati; copyright e dati di licenza non modificati. FontTools 4.63.0 installato soltanto nell’ambiente Python privato `.local/font-tools-env`, senza dipendenze applicative nuove.

Confronto strutturale: 143 glifi, programmi dei contorni e delle subroutine CFF, cmap, metriche, GPOS/GSUB e altre tabelle funzionali invariati. Gli offset interni/checksum cambiano per la ricompilazione delle stringhe. Quattro campioni Chromium: pixel e larghezze identici prima/dopo. Questo non sostituisce il collaudo Illustrator.

I nuovi caricamenti conservano il nome del file originale nell’archivio. Nomi interni senza alcuna lettera o cifra sono rifiutati con un messaggio esplicito, senza adottare il nome del file come prova dell’identità tipografica.

## Evidenze private

- `.local/editor-font-category-assignment.log`, piano/resoconto categorie e copie di sicurezza in `.local/editor-admin/`.
- `.local/editor-fonts-real-matrix.log`: 124 anteprime reali dopo la riparazione, zero errori browser/scritture amministrative, nessun overflow mobile; immagini ispezionate.
- `.local/editor-font-picker-scroll-final.log`: rotella, hover, tastiera, scelta e upload multiplo.
- `.local/editor-font-sticky-final.log`: intestazioni durante scroll pagina/mobile.
- `.local/editor-font-repair.log`, `.local/editor-font-repair-browser.log`, `.local/font-repair/`: originale, copia e verifiche, esclusi da Git e dal server HTTP.
- `.local/editor-bulk-complete-check.log`: 586 test unitari / 83 file, build e controllo segreti passati; prima suite browser 345/346. Un mock Google era privo del raggruppamento realmente restituito dall’importatore: aggiornato il dato simulato, ripetute e passate tutte le dieci prove pertinenti (`.local/editor-font-and-bulk-final.log`). Il primo comando completo rimane documentato come fallito; nessun esito viene riscritto.
- Regressioni della chat pubblica e checkpoint Git nello [stato locale](editor-local-status.md).

Nessuna modifica allo shop, al tema, a PitchPrint/BSS o alla chat pubblicata; nessun deploy o AI a pagamento.
