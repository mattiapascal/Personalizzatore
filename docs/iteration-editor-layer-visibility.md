# Mostra/nascondi oggetti e gruppi — 13 novembre 2026

Nel pannello **Livelli**, l’occhio mostra o nasconde singoli oggetti e gruppi. Le icone hanno una colonna dedicata, anche nei sottogruppi. Il titolo del pulsante chiarisce che la visibilità vale anche per i file esportati. Gli elementi nascosti rimangono nell’elenco, attenuati, e nel progetto JSON: non vengono eliminati o privati delle risorse originali.

## Contratto e comportamento

- Proprietà `visible` opzionale su oggetti/gruppi, senza valori predefiniti inseriti nei documenti precedenti. I template personali esistenti restano visibili e identici. Nessuna conversione automatica dei template e nessun elemento nascosto per aggirare un blocco d’importazione.
- Comandi `setObjectVisibility` e `setGroupVisibility`, con revisione/pagina e ambito esplicito per il membro di un gruppo. Manuale e simulazione AI condividono validazione, revisioni e Undo/Redo. Le modifiche non cambiano ID, ordine, coordinate, stili o file.
- La visibilità del gruppo prevale sui membri, conservando le loro impostazioni individuali. Mostrare nuovamente il gruppo non rivela un figlio nascosto separatamente. Separare un gruppo nascosto in modalità amministrativa conserva l’aspetto nascosto; copia/incolla e archivi mantengono i flag.
- I nascosti non si selezionano direttamente e non intercettano il clic attraverso di essi. Le prese dei livelli possono ancora riordinarli o cambiarne il contenitore senza selezione. I blocchi selection/delete del cliente impediscono il cambio di visibilità, anche se richiesto tramite gruppo o aggiornamento generico; l’amministratore resta distinto.
- La geometria canonica del gruppo comprende anche i membri nascosti: nascondere non sposta il suo centro o altera le trasformazioni. Verificato con un membro lontano dal resto del gruppo, confronto dell’ingombro Fabric e ridimensionamento manuale/AI identico. Gli elementi nascosti non generano bersagli di aggancio.
- Un testo nascosto con glifi mancanti non viene disegnato con un font sostitutivo. Quando viene mostrato torna il segnaposto recuperabile e la segnalazione. La geometria dell’intero gruppo continua a richiedere font verificati per tutti i membri; nascondere non autorizza misure stimate. Rimane obbligatorio incorporare le risorse dei font referenziati nel documento.

## Output, riferimenti e persistenza

`visibleDocument` è una proiezione derivata, senza mutare il progetto. Produzione, SVG/PNG/PDF, miniature e controlli produttivi escludono i nascosti. I campi nascosti non compaiono nel modulo e non generano errori di formato non produttivi. I riferimenti non stampabili restano distinti: un riferimento visibile può essere incluso nell’output tecnico, mentre uno nascosto è escluso anche da quello.

La chiave delle miniature dipende dall’aspetto effettivo: cambiare un oggetto già nascosto non rigenera l’immagine; ripristinarlo senza altre modifiche permette di riusare la chiave precedente. Verificati sia il produttore PNG sia i pixel della miniatura effettivamente mostrata sotto il canvas. Nessun cambio globale della versione del renderer o delle cache dei template precedenti.

Roundtrip e duplicazione verificati su archivi **JSON e SQLite temporanei**, con rilettura e apertura SQLite in sola lettura. Lo schema SQL non cambia. I sei schemi JSON generati riflettono il campo opzionale del documento, inclusi quelli che lo incorporano: nessuna nuova operazione commerciale o modifica al codice del carrello.

## Evidenze e limiti

**1.214 test unitari / 173 file passati**, inclusi 14 nuovi casi su visibilità, gerarchia, permessi, cache, font, vincoli del timbro e persistenza. Log `delivery-units.log`.

**78 browser pertinenti distinti passati**: 46 tra visibilità/font/geometria, 25 regressioni dei livelli/gruppi/pannelli, sei PDF esistenti e un nuovo PDF. Le sette prove della visibilità sono state ricontrollate con clic Option/Alt, PNG, miniatura reale e trascinamento dei nascosti; altri due passaggi desktop/mobile dopo la rifinitura grafica non sono conteggiati due volte. Log `browser-delivery.log`, `browser-accepted.log`, `browser-final-regressions.log`, `pdf-regressions.log`, `pdf.log`, `browser-icons.log`. Non è una nuova esecuzione della suite browser generale.

PDF dal vero endpoint locale, con e senza riferimenti: dimensioni 100×60 mm, testo/font incorporati, sintassi e PNG renderizzati controllati. Entrambi escludono testi/gruppi nascosti; soltanto il tecnico contiene la guida visibile. Anteprime ispezionate conservate in `.local/previews/editor-layer-visibility-pdf-{production,technical}.png`; intermedi di questa prova rimossi. Skill PDF applicata; nessun PDF personale modificato.

Campione [JSON](../fixtures/illustrator/layer-visibility.TEST.json) / [SVG](../fixtures/illustrator/layer-visibility.TEST.svg) generato con sole risorse OFL TEST, quattro oggetti conservati e rettangolo rosso nascosto. Catture desktop/mobile ispezionate; nessuna scrittura amministrativa o richiesta esterna (`capture-accepted.log`). Illustrator resta da collaudare manualmente.

**73 coppie JSON/SVG riaperte/esportate**, senza errori, richieste esterne o caricamenti di font personali (`artifacts.log`). Build/tipi e schemi generati verificati. Archivio principale invariato: **SQLite R638, 346 template, due composizioni, 219 font di cui 218 attivi, un profilo** (`archive.json`). Log locali in `.local/layer-visibility/`.

**13 browser pubblici passati** (`public-tests.log`). Build pubblica e scansioni dei segreti locale/pubblica passate (`release-public-build.log`, `release-secrets.log`, `release-public-secrets.log`); JavaScript della chat invariato `index-BG2r_x-8.js`.

Nessuna migrazione o modifica automatica ai progetti personali. Nessun deploy, immagine AI o modifica al negozio/tema/PitchPrint/BSS/prezzi/carrello/checkout. La roadmap resta aperta.
