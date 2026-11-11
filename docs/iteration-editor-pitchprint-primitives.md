# Primitive e residui senza area PitchPrint — 11 novembre 2026

Alcuni sorgenti continuavano a fermarsi su «SVG senza elementi visibili» anche dopo il recupero dei font. Contenevano cerchi di raggio zero e rettangoli senza area, privi di contorno effettivo e di proprietà operative. Ora l’importatore riconosce questi residui **solo per rettangoli, cerchi ed ellissi con dimensioni/raggi coerenti**, li esclude con un avviso esplicito e conserva gli ID originali degli altri elementi.

Non si deduce che un tracciato, gruppo, testo o immagine sia vuoto dal suo ingombro memorizzato. Un contorno effettivo, una label/proprietà operativa, un hook, uno sfondo o l’appartenenza a un gruppo impediscono lo scarto. Tali casi richiedono ancora revisione.

Le primitive con area positiva e senza contorno passano direttamente nel modello geometrico. **Le guide trasparenti mantengono geometria e proprietà**, senza introdurre un bordo stampabile. Un cerchio con scale diverse sui due assi diventa un’ellisse esatta; misure dell’ispettore, centro e rotazione seguono il modello canonico già esistente. Nessuna nuova via di modifica parallela ai comandi validati.

I cerchi completi Fabric 3 possono dichiarare la fine dell’arco come **2π radianti**, mentre le versioni successive usano **360 gradi**. Entrambi i casi completi sono riconosciuti; gli archi parziali restano rifiutati dal nuovo percorso diretto. Corretto anche il riferimento indipendente di prova affinché Fabric 7 non interpreti 2π come un arco di sei gradi. Non dichiarare implementata l’importazione generale degli archi.

## Riscontri e limiti

Analisi finale in sola lettura: **227/370 sorgenti convertibili, 143 bloccati**, contro 214 prima di questo incremento. **13 recuperi, zero regressioni**, zero scritture amministrative/errori browser e hash dell’archivio invariato durante l’analisi. Rapporto privato `.local/pitchprint-migration/css-primitives-analysis.report.json`. I recuperi comprendono quattro template Alida, Trodat 4924 e gli otto resi convertibili dalle associazioni CSS dei font; non sono approvazioni produttive né nuove importazioni.

Nei cinque sorgenti Alida erano presenti due residui senza area ciascuno. Quattro ora producono JSON e SVG: «Modello vuoto», «Circolare 51x51 mm», «Circolare 41x41 mm» e «Rettangolare 51x25 mm». Le cornici grigie restano grafica del sorgente: non sono state trasformate arbitrariamente in guide o eliminate. **Q12 resta bloccato perché contiene testo sotto il minimo attuale di 7 pt**, indipendentemente dalla disponibilità di Alida. Il minimo globale è ancora da distinguere dai vincoli dei singoli profili produttivi.

Confronto visivo affiancato ispezionato sui quattro convertibili. Differenza della maschera d’inchiostro a 1200 px: 1,07%, 0,85%, 0% e **6,41% sul rettangolare**; differenze RGB sopra soglia: 1,08%, 0,91%, 0% e 6,38%. Il rettangolare supera la soglia iniziale del confronto automatico: mantenere questo dato come questione aperta sulla resa, non come certificazione di equivalenza. File e rapporti privati in `.local/alida-templates/`; nessun nuovo template salvato nell’archivio del titolare.

**674 unitari/104 file passati**, con ulteriore controllo mirato dopo la correzione dei radianti. **Sette regressioni browser** passate: primitive, residui, gruppi annidati/trasformati, font originali, errori e proprietà operative. Il nuovo campione browser conserva ID, colori e guide, riapre il JSON, esporta SVG e annulla i comandi manuali/AI del gruppo. Build, schemi e scansione segreti passati. I [cinque collegamenti CSS dei font](iteration-editor-pitchprint-css-fonts.md) hanno un collaudo distinto sui file originali.

Nessun nuovo collaudo Illustrator o produttivo, nessuna importazione aggiuntiva o associazione prodotto. Shopify, tema, chat pubblicata, PitchPrint, BSS e acquisti reali preservati; nessun deploy.
