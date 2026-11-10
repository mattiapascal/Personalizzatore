# Spaziatura e crenatura locale — 9 novembre 2026

Richiesta: passi piccoli del selettore e modifica dei soli intervalli scelti. Precisazione del titolare: con il cursore tra due caratteri il valore è una correzione della coppia, aggiunta alla spaziatura generale del box.

## Contratto e UI

`letterSpacingPt` rimane la spaziatura generale. Nuovo campo opzionale `CharacterStyle.kerningPt`, in punti fisici, applicato all’avanzamento dopo un carattere. Valori TEST da −2 a 10 pt; passo UI 0,1 pt, conservando gli offset precisi importati. Nessun campo di crenatura nella radice dell’oggetto.

- Box selezionato: «Spaziatura (pt)» cambia il valore generale conservando le correzioni locali.
- Cursore di editing tra due caratteri: «Crenatura (pt)» modifica solo quella coppia. 0,2 pt generali e −0,1 pt locali producono 0,1 pt aggiuntivi sulla coppia, oltre alla crenatura naturale del font.
- Selezione di più caratteri: stessa correzione per gli intervalli interni. Gli intervalli esterni e gli a capo restano esclusi; valori differenti indicati come misti.
- Inizio/fine testo o selezioni prive di coppie: controllo disabilitato. Zero rimuove la correzione locale. Font, riempimento e decorazioni degli altri caratteri restano intatti.

Un solo `updateObject` validato, come gli stili esistenti; è supportato anche il comando AI simulato. Revisioni, Undo e JSON preservati. Cambiare la spaziatura generale modifica gli avanzamenti complessivi senza cancellare le correzioni locali. La scala uniforme della selezione scala le quantità fisiche insieme al testo. La successiva [dilatazione del testo](iteration-editor-text-stretch.md) agisce sui due rapporti dell’oggetto: glifi, spazi e correzioni vengono trasformati senza cambiare i valori fisici di base; Alt non cambia più il corpo tramite maniglie. Modificare il solo corpo nel pannello resta uno stile.

## Renderer

Il Fabric 7.4.0 installato non tratta la spaziatura locale come proprietà standard dei caratteri. `EditorTextBox` aggiunge quindi la correzione agli ingombri dei glifi, alle misure delle righe e al ritorno a capo, con sottrazione della coda non disegnata. Cursore e selezione usano gli stessi bounds. Canvas e SVG disegnano i glifi nelle posizioni misurate, senza poligonizzare i caratteri: testo e stili restano testo nel progetto e nello SVG. Decorazioni e box sempre in altezza automatica.

La correzione viene trasportata come metadato della vista Fabric e ricondotta a `kerningPt` durante la scrittura; non viene affidata a un attributo SVG arbitrario o a un secondo stato grafico. Il documento canonico rimane la fonte.

## Prove

Quattro unitari del contratto: coppia, intervalli interni/misti, a capo/estremità/rifiuti/zero, comandi condivisi e scala. Browser: passo 0,1 pt, coppia ai lati del cursore, misure prima/dopo, posizione dei glifi/tspan SVG e fine cursore; selezione limitata, stili conservati e riapertura JSON; wrapping e coda di riga. Le prove mirate sono passate; esito della regressione completa finale riportato nello stato corrente.

Campione `refinements.TEST.json/svg` e anteprime nello script `capture-editor-refinements.ts`. **Illustrator non collaudato**: verificare posizioni, decorazioni, font, riscrittura del testo e misure fisiche prima di dichiarare produttivo lo SVG.
