# Proprietà e gerarchia dei gruppi — 11 novembre 2026

## Comportamento

L’importazione precedente conservava la grafica dei gruppi, ma bloccava i contenitori con label o priorità proprie. Il documento canonico ora conserva anche queste informazioni: `SceneGroup` include `parentId` e proprietà opzionali `editor`. I membri rimangono ID di oggetti con coordinate assolute in mm; i gruppi non introducono una seconda scena o ulteriori trasformazioni geometriche.

I padri precedono i figli nel documento. Il validatore verifica appartenenza, contiguità dei livelli, ID unici, assenza di cicli e di sovrapposizioni fra gruppi indipendenti. Un contenitore con un solo elemento viene conservato: può avere un nome, regole o un ruolo nel modulo. I vecchi gruppi senza metadati restano leggibili; nessuna migrazione dell’archivio personale.

La selezione grafica agisce sul gruppo esterno. Nell’ispettore amministrativo compaiono label, ordine, blocchi, inclusione nel modulo e riferimento; le proprietà dei sottogruppi sono in un elenco espandibile. I livelli mostrano anche il nome del gruppo. La separazione amministrativa rimuove un contenitore e promuove i suoi sottogruppi, conservandone le proprietà. Non è stato aggiunto un nuovo strumento per creare gruppi annidati.

## Regole e modulo cliente

Blocchi di trasformazione/selezione/eliminazione, menu nascosti e riferimenti sono ereditati dai contenitori. Sono calcolati dal documento: non vengono copiati nelle proprietà dei figli. Un figlio non può annullare una restrizione del padre. I riferimenti, compresi i loro discendenti, non entrano nella grafica produttiva o nel modulo cliente.

Label e priorità sono proprie di ogni oggetto/contenitore. Il modulo le ordina in senso crescente, indipendentemente dai livelli. Un gruppo grafico ha un pulsante di selezione, non un falso campo di testo; eventuali campi testuali dei figli restano separati. Se un campo appartiene a un contenitore più grande, il pulsante indica il gruppo esterno che verrà effettivamente selezionato. Un gruppo non trasforma automaticamente tutti i suoi figli in campi compilabili.

Il cliente può compilare un testo o sostituire un’immagine dichiarati nel modulo senza separare il gruppo: gli stessi `setText` / `replaceImageSource` validano contenuto e vincoli. Un testo bloccato conserva il proprio centro. Il cliente non può cambiare i metadati né eliminare un contenitore con proprietà significative lasciandone i figli: la separazione di questi gruppi è amministrativa, per non aggirare i blocchi del template. La normale separazione dei gruppi anonimi senza regole resta disponibile.

`setGroupProperties` è un comando validato amministrativo, con revisione e ID del gruppo. Manuale e AI simulata usano lo stesso contratto e le stesse autorizzazioni. Copia/incolla, duplicazione, applicazione template, salvataggio e storico conservano metadati e rimappano tutti gli ID della gerarchia. Anche modificare l’appartenenza tramite `applyTemplate` non permette di sottrarre un oggetto ai blocchi del padre.

I gruppi con un solo elemento usano i comandi di insieme per tastiera, trascinamento, trasformazioni, ordine livelli, duplicazione ed eliminazione. Corretta inoltre la chiusura del pannello dati quando il focus passa all’ispettore, in coerenza con il pannello livelli.

Il controllo delle selezioni include tutti gli ID dei comandi di duplicazione e applicazione template, anche quando il membro bloccato non è quello principale. Il pannello dati mantiene l’apertura iniziale prevista per le targhe e si chiude quando il focus passa dai suoi controlli all’ispettore.

Se la libreria non risponde, la schermata iniziale offre anche **Apri progetto JSON**: con file portatile prepara font e immagini e apre il progetto conservandone il formato originale. Un file invalido resta nella schermata di recupero; non viene creata una composizione sostitutiva.

## Prove

- **627 unitari in 93 file**: gerarchia, riferimenti, blocchi manuali/AI, tentativi di rimozione delle regole, copia profonda, rimappatura, Undo/Redo, campi testuali nel gruppo e convalida dei dati.
- TypeScript/build e schemi JSON rigenerati. Sei browser pertinenti coperti fra i confronti grafici e le prove UI; due percorsi nuovi includono ispettore, priorità, sottogruppi, duplicazione/appunti, archivio/riapertura e gruppo singolo.
- **20 campioni JSON riaperti ed esportati**, zero errori browser e richieste esterne.
- **374 browser della suite completa passati** sul codice finale; **13 regressioni pubbliche locali e controllo segreti passati**. La prima esecuzione aveva dato 369/373: tre casi del pannello fissaggi e uno del recupero offline sono stati corretti e ricontrollati, mantenendo il log intermedio.

Campione [sorgente nativo TEST](../fixtures/illustrator/pitchprint-groups.source.TEST.json), [JSON](../fixtures/illustrator/pitchprint-groups.TEST.json) e [SVG](../fixtures/illustrator/pitchprint-groups.TEST.svg) aggiornato: 100 × 60 mm, sei oggetti, due gruppi esterni e un sottogruppo; label `Logo TEST`, `Simbolo TEST`, `Segno TEST`, priorità e un file Arimo OFL incorporato. Stessi comandi manuali/AI, Undo/Redo e controllo glifi. Il confronto con il riferimento separato resta a 9 pixel differenti su 9006 pixel dell’inchiostro, circa 0,10%.

Rigenerazione: `node --import tsx scripts/capture-editor-pitchprint-groups.ts`. Anteprime ispezionate: `.local/previews/editor-pitchprint-groups.png` e `.local/previews/editor-pitchprint-group-properties.png`. Il JSON conserva la gerarchia editoriale; SVG/PDF/PNG sono artefatti produttivi distinti. Illustrator non è stato collaudato.

## Riscontro sui sorgenti reali

Analisi delle stesse 370 copie locali, con opzioni TEST esplicite nero/bianco e sfondo/materiale escluso: **112 → 117 convertibili, cinque recuperati e nessun caso perso**. Le 24 sorgenti prima bloccate dalle proprietà del gruppo superano quel controllo; cinque diventano convertibili, 19 incontrano altri limiti già espliciti (asset grandi, contorni, filtri/ritagli o formattazione parziale). Nessun controllo sui font è stato allentato.

Zero scritture amministrative e zero errori browser; grafica, impostazioni e file font del titolare invariati. Rapporti privati: `.local/pitchprint-migration/group-properties-analysis.TEST.report.json`, `.local/editor-group-properties-comparison.json`, `.local/editor-group-properties-real-analysis.log`. Convertibile non equivale ad approvato per la produzione: anteprima e collaudo restano necessari.

Prossimo incremento individuato dai dati: dieci sorgenti si fermano sul limite TEST di contorno a 2 mm. L’analisi geometrica in sola lettura rileva contorni fra **3,49 e 9,20 mm**, in formati fra 200 × 300 e 400 × 600 mm: il limite del laboratorio impedisce casi reali di cartellonistica. Rapporto `.local/group-stroke-ceiling-audit.json`. L’estensione dovrà aggiornare coerentemente modello, importatori e controlli, conservando le regole produttive distinte; nessun limite è stato allentato in questo incremento.

Nessun deploy o modifica a Shopify, tema, PitchPrint, BSS, prezzi, carrello, checkout o chat pubblicata. Nessun template salvato nell’archivio reale per il solo collaudo.

## Stato al termine di questa iterazione — superato dall’importazione a colori

L’autorizzazione e il salvataggio successivi sono documentati in [Template con colori originali](iteration-editor-pitchprint-colors.md). Le informazioni seguenti descrivono la preparazione precedente al via libera.

Su richiesta del titolare sono stati preparati i JSON completi delle 117 conversioni in `.local/pitchprint-migration/import-plans/prepared-drafts.jsonl` (circa 61 MB, privati e ignorati da Git), senza errori o scritture amministrative. L’archivio reale resta a due record preesistenti e zero template PitchPrint importati. Il salvataggio attende la scelta esplicita richiesta da AGENTS.md per le migrazioni.

La revisione dell’aspetto distingue **79 sorgenti vettoriali già in B/N**, **37 con colori che queste conversioni TEST renderebbero B/N** e **uno con immagine**. Sfondi/materiali sono esclusi. La seconda domanda al titolare sostituisce la prima richiesta generica di importare 117 bozze, perché esplicita queste differenze. Manifest e liste private in `import-plans/ready-drafts.json` e `ready-drafts.md`; nessuna conversione viene presentata come copia produttiva già approvata.
