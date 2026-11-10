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

## Archiviazione/eliminazione dopo aggiornamenti concorrenti

Segnalazione del titolare su **Alliance No.2 Light**: la pagina poteva conservare una revisione precedente dopo aggiornamenti alle categorie, e ogni clic veniva rifiutato. L’errore generale in cima alla pagina non era visibile vicino alla voce.

Per le sole azioni confermate su un font, l’interfaccia legge la revisione corrente, controlla ID e identità del file (SHA-256 nella snapshot), quindi invia lo stesso comando validato. Una modifica concorrente fra lettura e scrittura consente un solo nuovo tentativo; un file differente blocca l’azione. Font già eliminato o già nello stato richiesto: esito idempotente. Nessuna estensione di questo comportamento a modifiche generiche, prezzi o altri archivi. Il server continua a rifiutare revisioni obsolete, con codice `revision_conflict` e HTTP 409.

Esito, errore e possibilità di riprovare sono mostrati vicino ai pulsanti. Archiviare conserva il font nella vista **Tutti**, indicandolo come Archiviato e proponendo Riattiva; non viene proposto nelle nuove aperture dell’editor. Eliminazione con conferma esplicita; progetti che incorporano il file restano indipendenti.

Evidenze: prima prova del difetto fallita come atteso (`.local/editor-font-delete-before.log`), poi cinque regressioni passate (`.local/editor-font-delete-after.log`), quattro casi su concorrenza/errori/upload e tre ripetizioni dopo il solo adeguamento grafico. **590 test unitari / 84 file, build e controllo segreti passati**. Prova sulla copia temporanea della libreria reale: Alliance No.2 archiviato/eliminato correttamente, altri font e progetti conservati, zero errori browser e zero scritture all’archivio reale (`.local/editor-alliance-font-actions.log`). Il font reale non è stato rimosso dall’agente.

## Ricontrollo della lista dei font richiesti

Alla revisione locale 162: 125 file, 124 attivi. Tutte le 39 varianti Google precedentemente installate risultano presenti. Delle 57 voci della vecchia lista manuale: per la pagina singola, 3 sono coperte esattamente, 4 hanno file presenti da collegare/verificare, 47 non hanno un file corrispondente verificato. Altre 3 voci riguardano soltanto documenti multipagina e sono escluse dal lavoro attuale.

I 370 template a pagina singola richiedono 83 combinazioni dichiarate: 32 esatte (29 Google + 3 manuali), 4 da collegare e 47 da completare/verificare. I numeri riguardano nome/peso/stile, con alias ripetuti, non altrettanti file fisici. Le voci presenti da allineare sono DIN Pro Cond, DIN Pro Regular, Gloria Hallelujah 700 (file 400) e Nexa Bold dichiarato 400 (file Bold 700). Non è autorizzata una sostituzione automatica.

Report aggiornato in `.local/pitchprint-migration/font-audit/font-da-installare-aggiornato.md`, JSON con riscontri e nomi interni; il pulsante di download nell’importatore usa la copia aggiornata, verificata byte per byte (`.local/editor-current-font-report-http.log`). Vecchia lista conservata separatamente. Nessun file installato o modificato durante il ricontrollo.
