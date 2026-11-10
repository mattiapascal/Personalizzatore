# Trasformazioni di selezioni e gruppi — 8 novembre 2026

## Piano prima delle modifiche

Proseguire localmente dalla worktree esistente, senza scartare modifiche e senza interventi online. Completare scala uniforme e rotazione per gruppi e selezioni multiple, con comando tipizzato atomico, maniglie e ispettore live. Riprendere le prove rimaste sospese sui contorni trasparenti e rigenerare il campione selezione dopo l’attesa del ridisegno.

Assunzioni: geometria canonica piatta in mm, font in pt; gli oggetti e i gruppi mantengono ID e ordine. Nessuno skew, specchiatura o scala non uniforme. Trasformazioni intorno al centro dell’ingombro iniziale, con nuovo centro esplicito nel comando. Scalare l’insieme scala anche tratti, angoli arrotondati, font/stili locali e spaziatura, mantenendo i rapporti. Rifiutare tutta l’operazione se un membro viola schema, profilo TEST o visibilità ammessa. Altezza dei testi sempre automatica, nuovi box centrati e clic/doppio clic contestuali conservati.

Rischi da verificare: differenze tra preview Fabric e geometrie dopo il commit; dimensioni del testo e stili misti; limiti font 7–48 pt e contorni fino a 2 mm nel solo profilo TEST; selezioni con cerchi e oggetti già ruotati; annullamento del gesto con Esc; JSON/SVG e zoom; selezione sulle sole linee dipinte. Illustrator richiede collaudo umano separato.

## Implementazione

Aggiunto `transformObjects`: selezione completa, fattore uniforme positivo, angolo relativo e destinazione del centro iniziale. L’operazione rimane una revisione con gli stessi ID, gruppi e livelli; manuale e simulazione AI usano il medesimo schema. Il motore applica una similitudine ai centri dei membri e aggiorna le geometrie effettive. Cerchi sempre circolari; testi/box e stili locali rimangono editabili. Tratti, raggi arrotondati e tracking scalano con la composizione. I limiti del profilo TEST provocano rifiuti atomici, senza adattamento automatico.

Ispettore multiplo: X/Y, larghezza/altezza dell’ingombro collegate in proporzione, rotazione aggiuntiva. L’angolo numerico torna a zero dopo l’applicazione, perché si tratta di un’operazione relativa; gli angoli dei singoli oggetti rimangono nel documento. I gruppi sono ancora a un livello e il frame della selezione viene ricalcolato dall’ingombro dopo ogni comando; non si conserva una matrice Fabric opaca. Le selezioni asimmetriche possono avere un nuovo centro dell’ingombro dopo una rotazione non ortogonale, pur conservando correttamente il pivot iniziale della trasformazione.

Le maniglie degli angoli scalano uniformemente anche premendo Maiusc, quella di rotazione agisce sull’insieme. Nessuno skew o flip. Esc annulla anche scala e rotazione in corso, ripristinando il documento senza revisione. Le maniglie di rotazione vengono mantenute entro il canvas per restare raggiungibili vicino ai bordi. JSON e SVG derivano dagli oggetti canonici, senza incorporare la selezione temporanea.

## Spessore contorno

Ulteriore richiesta del titolare: freccine dello spessore troppo grandi. Impostato un passo di **0,05 mm** invece del passo implicito del browser. Il minimo HTML viene allineato al valore effettivo: misure come `0.2875` restano valide e salgono a `0.3375`, senza salti alla griglia dei centesimi o errori `stepMismatch`. Restano ammessi valori digitati più precisi. Il campo mantiene fino a nove decimali per non invalidare misure scalate arrotondandole soltanto nella vista. Positività e massimo 2 mm restano vincoli del profilo TEST.

## Evidenze

- `npm run check`: **260 unitari, build TypeScript/Vite, controllo segreti e 67 browser laboratorio superati**. Inclusi contorni trasparenti rimasti sospesi, scala/rotazione da ispettore, rifiuti atomici, JSON/SVG e freccine dello spessore.
- Browser con fixture Fabric controllata: confrontati i limiti dei membri prima del rilascio e dopo il commit, sia in Group sia in ActiveSelection, con stili locali del testo e cerchi. Per i cerchi si misura il cerchio effettivo, non il quadrato di controllo ruotato. Provato Esc senza modifiche alla revisione.
- `npm run test:storefront`: **13/13** superati localmente; nessun codice della chat pubblica modificato.
- Il blocco precedente dell’auto-review è risolto in questa iterazione: le prove sui contorni ora sono eseguite. Il primo fallimento era nel test: riutilizzava coordinate del canvas precedenti allo scroll; corrette le coordinate dopo lo scroll corrente.
- `npm run schemas` rigenera il nuovo comando. Golden storico preservato; nessun nuovo pacchetto o servizio.
- `npm run capture:selection -- --transforms` genera `group-transforms.TEST.json/svg` e anteprime `editor-group-transforms-{desktop,mobile}.png`, con rete esterna e API bloccate. Scala 1,05, rotazione 8°, destinazione 29×11 mm. Rigenerato anche il campione selezione di base, con attesa del ridisegno dopo il fit. Illustrator non collaudato.

File principali: `selection.ts`, `model.ts`, `fabric-adapter.ts`, `SelectionInspector.tsx`, `ObjectInspector.tsx`, `EditorLab.tsx`, test unitari/browser, schemi, script/campioni e documentazione. Nessun deploy o cambiamento a Shopify, tema, PitchPrint, BSS o flussi commerciali.
