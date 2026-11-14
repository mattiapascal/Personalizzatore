# Testo su tracciato: acquisizione delle modifiche prima delle azioni

14 novembre 2026, dopo `1f90499`; [piano](editor-text-path-commit-plan.md). Correzione delle funzioni già esistenti, senza aggiungere nuovi strumenti avanzati.

Prima della correzione, due riproduzioni native falliscono: applicazione con geometria incompleta e separazione con scorrimento incompleto (`.local/text-path-commit-before.log`). Il caso del clic ordinario con valore valido passa già grazie al blur; la correzione copre anche il clic che preserva il fuoco e l’attivazione assistiva senza blur.

Entrambi i pulsanti passano ora da `inspectorAction`. Geometria e stile validi vengono applicati prima di costruire il comando sulla revisione risultante; un valore incompleto resta visibile e riceve il fuoco. «Separa» non deve più attendere il timer solo perché esiste una modifica valida: la acquisisce e mantiene due operazioni distinte in Undo. Durante l’editing dei caratteri resta disabilitato. L’ID del percorso ripristinato viene scelto dal documento aggiornato, conservando il comportamento anticollisione.

Il modello canonico di applicazione/separazione non cambia: un solo testo collegato, percorso derivato, proprietà originali ripristinate alla separazione e stessi comandi manuali/AI. Nessun aggiornamento arbitrario di un comando AI già catturato.

Sette nuovi browser passati (`text-path-commit-final.log`), ricontrollati insieme ai sette casi delle proprietà/riferimenti e ai cinque nuovi casi prodotto: **19/19** in `product-integration-related.log`. Nella prima esecuzione estesa due test erano da adeguare: accesso al pannello Strumenti su telefono e uso del centro numerico effettivamente digitato (arrotondato a tre decimali), invece di una traslazione ideale di 1 mm. Il confronto finale serializza allo stesso modo entrambi i documenti, senza tolleranze sulle geometrie.

Campione `fixtures/illustrator/text-path-commit.TEST.json/svg`, generato dalla UI da `scripts/capture-editor-text-path-commit.ts`: pagina TEST 100×70 mm, font Arimo OFL incorporato, testo sul percorso originale ruotato/inclinato/riflesso, scorrimento 3 mm dopo separazione e Undo; guida di riferimento visibile nella vista ma esclusa dallo SVG produttivo. Catture desktop/telefono ispezionate; zero scritture di archivio, errori browser o richieste esterne. Il primo tentativo di cattura sul telefono attendeva un pannello ancora chiuso: aggiornata la cattura per aspettare il cambio responsive, senza modificare il prodotto.

Nessun nuovo collaudo umano in Illustrator o prova produttiva dichiarati. Nessun deploy, migrazione, modifica della chat pubblicata o integrazione acquisti. Il seguito prioritario è il percorso prodotto/materiali/fissaggi e l’AI grafica locale, secondo le nuove indicazioni del titolare.

Verifica finale condivisa: 1.401 unitari, 42 browser pertinenti, 13 pubblici e 97 campioni passati; build/Worker, schemi e segreti controllati. [Dettagli e limiti del collaudo](iteration-editor-product-integration.md#verifiche-finali-condivise-con-la-correzione-testotracciato). Principale SQLite R638 invariato.
