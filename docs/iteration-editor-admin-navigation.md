# Amministrazione: anteprime e ritorno dall’editor — 12 novembre 2026

## Risultato

L’elenco conserva nella stessa scheda **pagina, ricerca, filtri AND/OR, ordinamento, voce selezionata e posizione di scorrimento**. Template e composizioni hanno viste separate. Chiudendo l’editor, la voce precedente viene riletta nella sua versione attuale e resta evidenziata nella pagina da cui era stata aperta. L’ancora su una riga visibile conserva la posizione anche se i pannelli dei filtri cambiano altezza; dopo rimozioni o cambi di contenuto la pagina viene ricondotta all’intervallo disponibile.

La vista è validata e salvata soltanto in `sessionStorage`, senza documenti grafici o operazioni massive selezionate. Dati corrotti, spazio esaurito o storage disabilitato lasciano utilizzabile l’elenco. Non è un salvataggio delle modifiche del progetto o dei metadati ancora da confermare.

Il pannello destro esiste anche prima della selezione, così le colonne non cambiano larghezza quando si apre un template. Su desktop segue lo scorrimento mantenendosi nel viewport; la sua altezza usa lo spazio effettivamente disponibile e i dettagli lunghi scorrono al suo interno. In basso all’elenco non viene spinto oltre il bordo superiore. Su mobile torna al flusso normale, senza overflow orizzontale, e una selezione porta ai suoi dettagli. Le letture superate da una nuova selezione vengono annullate.

## Anteprime

Verifica nella finestra Brave già aperta del titolare: la scheda stava usando moduli precedenti, con l’errore di esportazione `textStrokeFromFabric` e schemi incapaci di riconoscere `backgroundGroupId` e i contorni dei testi. Una pagina caricata con i moduli attuali genera le immagini. Il pulsante **Aggiorna** ora riprova anche le miniature fallite, riutilizzando quelle valide dalla cache. Un contratto o modulo vecchio mostra un avviso leggibile e **Ricarica amministrazione**, senza cancellare dati o avviare ricaricamenti automatici durante l’editing dei metadati.

Gli errori reali dei font rimangono distinti e non vengono nascosti con sostituzioni. Chiavi del contenuto, cache PNG persistente e invalidazione soltanto quando cambia la grafica restano quelle esistenti. Nessuna modifica ai template per risolvere l’errore di interfaccia.

## Prove

**Ricontrollo successivo del 12 novembre:** cinque scenari mirati nuovamente passati nella versione corrente, insieme alla prova in sola lettura di «Qui si spara a vista». Anteprima visibile, dettagli Y 16 dopo scroll, desktop/mobile senza overflow, zero errori o scritture. Archivio alla revisione 553 conservato per hash (`c765f99c…`); media invariati. Log `.local/admin-navigation-recheck-2026-11-12.log` e `.local/admin-navigation-real-recheck-2026-11-12.log`. I numeri sotto descrivono il primo collaudo.

- **857 unitari / 127 file** passati, compresi isolamento delle viste, dati corrotti/storage bloccato e classificazione degli errori. Build laboratorio/pubblico e scansioni dei segreti passate.
- **37 browser pertinenti** passati in 1,5 minuti, più **sette** su tag e operazioni massive: **44 scenari**. Coprono il percorso reale pagina 2 → editor → chiusura → stessa pagina/filtri/voce/posizione, pannello fisso fino al fondo dell’elenco, recupero dopo 503, scheda con contratto superato, viewport 1440 e 390, cache e flussi amministrativi preesistenti. Non è una nuova esecuzione completa di tutta la suite.
- **13 browser pubblici locali** passati. JavaScript pubblico `index-BG2r_x-8.js` e CSS `index-L8Ls1asZ.css` invariati; nessun deploy.
- Prova reale in sola lettura su «Qui si spara a vista»: miniature e anteprima visibili, screenshot desktop, desktop dopo scroll e mobile ispezionati. Pannello a inizio pagina Y 291,5 / altezza 576,5; dopo scroll Y 16 / altezza 852 su viewport alto 900. Zero errori o scritture; archivio e libreria media invariati per checksum. Archivio ancora a revisione **543**, 259 template, due composizioni e 219 font.

Log `.local/admin-navigation-*.log`, schermate e manifest privati in `.local/admin-navigation-capture/`. Nel primo ricontrollo il pannello superava il bordo in fondo all’elenco: corretti margine e altezza disponibile. Un messaggio istruttivo statico era stato marcato come `status`, rendendo ambiguo il controllo del salvataggio: ora soltanto il caricamento dinamico ha quel ruolo. Sistemata anche una parentesi nel nuovo test unitario e l’attesa di visibilità della miniatura dopo la comparsa dell’avviso; nessuna soglia o timeout allargati. Il lotto finale è passato integralmente.

Nessun cambiamento al documento canonico, ai comandi grafici manuali/AI o ai file SVG/JSON; i 44 campioni dell’incremento grafico precedente non sono stati rigenerati per questa modifica di navigazione. Nessuna scrittura su Shopify, tema, PitchPrint, BSS, prezzi, carrello o checkout, nessuna chiamata AI a pagamento.
