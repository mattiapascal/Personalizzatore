# Livelli di riferimento nell’interscambio — 12 novembre 2026

Direttiva del titolare: la cornice blu dei numeri civici è già presente sul supporto. Deve comunque poter comparire nel file tecnico, come i fissaggi. Sfondi/materiali di riferimento in un livello sottostante distinto; cornici e fissaggi in un livello superiore. Conservare le grafiche già classificate come stampabili.

Il documento canonico conserva oggetti/gruppi `editor.reference` e la configurazione geometrica dei fissaggi. Nessuna duplicazione permanente dei disegni: gli output sono proiezioni dello stesso stato validato.

- SVG/PDF produttivo: conserva il comportamento esistente, esclude riferimenti e rappresentazioni degli accessori.
- SVG tecnico separato: gruppi nominati, sfondo di riferimento sotto, grafica produttiva al centro, altri riferimenti/fissaggi sopra. Regola CSS print per i riferimenti, **senza garanzia che Illustrator o altri importatori conservino questa semantica**. Non usare il file tecnico come unico output produttivo.
- PDF con riferimenti, esplicito: livelli OCG con visibilità a schermo attiva e stato di stampa disattivato; ogni pagina mantiene misura e contenuti vettoriali. Nessun appiattimento. Verificare struttura e rendering separato schermo/stampa. Compatibilità in Illustrator da collaudare umanamente.
- Progetto JSON: tutte le pagine e tutti i riferimenti riapribili.

Le dimensioni dei fori sono fisiche soltanto quando configurate. Le icone di viti/distanziatori prive di diametro sono simboli di posizione, non sagome costruttive degli accessori.

Fonte tecnica primaria consultata: [Adobe PDFL — PDOCG](https://opensource.adobe.com/dc-acrobat-sdk-docs/pdflsdk/apireference/PD_Layer/PDOCG.html). Non confondere gruppi SVG, livelli opzionali PDF e attributi di stampa dell’applicazione destinataria.

Nessuna modifica a PitchPrint, Shopify, BSS, prezzi o acquisti. Importazioni reali dopo confronto completo di ogni pagina e backup; non riusare le preparazioni storiche che confrontano solo la prima pagina.
