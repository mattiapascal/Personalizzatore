# Curve Bézier — piano locale del 9 novembre 2026

Priorità successiva alla base poligonale: curve cubiche editabili, aperte/chiuse e con più segmenti, conservate nel documento canonico. Nodi con posizione e maniglie entrante/uscente; massimi espliciti e comandi `addObject`/`updateObject`/trasformazioni già condivisi. Nessuna risorsa remota o codice SVG arbitrario nel modello.

Aggiungere tipo `bezier` al v2 senza cambiare i sette tipi esistenti; v1 invariato. Coordinate normalizzate all’ingombro effettivo della curva, calcolato con gli estremi della cubica, non all’ingombro delle maniglie. Maniglie esterne ammesse. Scala/rotazione e centri seguono gli oggetti esistenti; modificare nodi e maniglie conserva gli altri punti nel foglio anche dopo rotazione. Inserimento a metà mediante suddivisione esatta della cubica, non approssimazione poligonale. Chiusura/apertura e riempimento espliciti.

UI: curva iniziale a icona, scheda Nodi con coordinate e maniglie live; controlli diretti sul canvas, ripristino delle maniglie di trasformazione nella scheda Geometria. JSON riapribile e SVG con comandi cubici `C`, PNG dallo stesso renderer. Guide dei nodi escluse dai file. Errore o Esc non devono creare revisioni.

Rischi da verificare: ingombri geometrici rispetto a Fabric, rinormalizzazione dopo spostamenti e chiusure, maniglie in rotazione, selezione sul solo tratto delle curve vuote, uscita parziale, gruppi/copie/clipboard e storico. Restano distinti il collaudo browser e quello umano Illustrator.

Fonte geometrica: [SVG 2, curve cubiche](https://www.w3.org/TR/SVG2/paths.html#PathDataCubicBezierCommands); API controllate nel Fabric 7.4.0 installato, inclusi Path e createPathControls. Solo locale; nessun deploy, AI immagini o modifica commerciale.

Estensione manuale prevista nella stessa iterazione: penna Bézier distinta dalla penna poligonale. Clic crea un nodo angoloso; trascinare dal nodo imposta due maniglie simmetriche. Anteprima transitoria, Maiusc a 45°, agganci/Alt condivisi; Invio/doppio clic termina, clic iniziale con almeno tre nodi o pulsante chiude, Backspace toglie l’ultimo nodo, Esc annulla. Massimo 64 nodi; una sola revisione alla fine, nessuna scena o formato alternativo. Verificare preview senza salvataggi parziali, doppio clic senza duplicati, chiusura e blocco file/zoom durante la costruzione.

## Implementazione e prove

Tipo `bezier` aggiunto al documento v2, v1 invariato. Ingombro analitico delle cubiche; coordinate normalizzate all’ingombro del tratto, con maniglie esterne. Per il solo controllo di intersezione in editing si usa una suddivisione adattiva a 0,001 mm con margine conservativo 0,002 mm; nessuna poligonizzazione nel documento o nell’export SVG/PNG. Limite 64 nodi e budget di suddivisione esplicito.

Icona per curva iniziale e penna manuale; ispettore Nodi live con coordinate, abilitazione maniglie, suddivisione esatta a metà, eliminazione, chiusura/apertura, inversione e riflessioni. Il nodo porta con sé le sue maniglie; muovere una maniglia lascia gli altri punti fermi, anche in rotazione. Scheda Geometria ripristina i normali controlli. La penna crea nodi angolosi con un clic e maniglie simmetriche con trascinamento; al completamento produce un solo `addObject` validato.

Controlli nativi dedicati per il nodo scelto e le sue maniglie. Anteprima calcolata dallo stesso helper della modifica finale; trascinamento relativo al punto di presa, così anche un clic sul bordo del controllo non fa saltare il nodo. Canonico invariato durante il gesto, un solo `updateObject` al rilascio, Esc annulla. Guide/maniglie escluse dai file. I gruppi devono essere separati prima di modificare un singolo nodo, anche via comando AI simulato.

**`npm run check` superato: 376 unitari, 160 browser laboratorio, build e controllo segreti.** I 18 nuovi browser verificano penna, maniglie entranti/uscenti a 0/30/90°, anteprima fisica uguale al commit, punti non modificati fermi, clic con offset, Esc, conteggio/limite, Maiusc/Alt, chiusure/doppio clic, JSON/SVG, contorni trasparenti, gruppi/clipboard e rifiuti atomici dei comandi simulati. Log `.local/editor-bezier-check.log`. La prima esecuzione completa si è fermata per una tupla non tipizzata in un nuovo test: corretta e suite rieseguita integralmente.

Campione `bezier.TEST.json/svg` generato con `node --import tsx scripts/capture-editor-bezier.ts`: curva aperta a due nodi e curva chiusa a tre nodi disegnate con la penna, titolo editabile. Anteprime desktop/mobile ispezionate; nessun overflow orizzontale o errore browser. Nove campioni riaperti/esportati senza errori o richieste esterne con `scripts/verify-editor-artifacts.ts`. I file storici del timbro e il codice pubblico/backend/tema non sono cambiati.

**Illustrator e lavorazione fisica non collaudati.** Collegamento automatico delle maniglie, testo su curva e import SVG restano incrementi successivi. Stato: verificato solo localmente.
