# Libreria font: organizzazione e dati descrittivi

Incremento locale del 9 novembre 2026. Dal backend `/editor/admin`, sezione **Font**, è disponibile una libreria con ricerca per nome/famiglia/stile/note e filtri indipendenti per stato e formato. L’elenco indica quante risorse corrispondono ai filtri; lo stato iniziale mostra anche gli archiviati.

> Aggiornamento successivo: [anteprime automatiche e informazioni richiudibili](iteration-editor-archive-tags-shop.md). Le anteprime ora si caricano all’apertura della libreria; il pulsante manuale descritto nel checkpoint iniziale sotto è stato rimosso.

## Uso

- Il testo di anteprima è personalizzabile. I file installati vengono caricati automaticamente, con tre richieste concorrenti; non contatta Google o altri servizi per i font già installati. Il campione consente un’ispezione visiva, non sostituisce il controllo dei caratteri del progetto.
- **Scarica file font** restituisce gli stessi byte conservati nell’archivio, con l’estensione corretta, anche per un font archiviato.
- **Licenza e provenienza** mostra la fonte e il testo registrato, con un link esterno soltanto per indirizzi HTTP/HTTPS validi. Un campo vuoto è indicato come licenza non registrata: il programma non deduce diritti d’uso dal solo formato del file.
- **Dati del font** modifica nome descrittivo, note, pagina fonte e licenza dei file manuali. Per Google Fonts si possono modificare le note; nome, fonte e licenza restano quelli importati. Anche il caricamento manuale permette di registrare fonte e licenza.
- Archiviazione/riattivazione restano reversibili. Il filtro Attivi nasconde subito un font archiviato; il filtro Archiviati consente di ritrovarlo e riattivarlo.

## Contratto e compatibilità

Nuovo comando locale `updateFontMetadata`, con revisione attesa dell’archivio. Schema stretto: non accetta file, ID sostitutivi, formato, peso o altre metriche tipografiche. Rifiuta risorse inesistenti, URL non HTTP/HTTPS e revisioni obsolete senza scritture parziali. Provenienza Google protetta anche lato API, non solo tramite campi in sola lettura.

Stesso ID e stessi byte del file. I progetti/template/configurazioni già salvati conservano i font incorporati e i loro metadati; nessuna riscrittura retroattiva. I dati aggiornati della libreria vengono usati nelle successive aperture dell’editor. Non viene analizzata o certificata automaticamente la validità legale della licenza.

Le risorse di anteprima vengono rimosse da `document.fonts` all’uscita dal pannello. Errori di download/decodifica sono mostrati nella libreria senza alterare il font. Il nome del file scaricato viene ripulito da separatori e caratteri non adatti.

Le etichette sommate a nomi interni lunghi vengono limitate a 160 unità UTF-16 senza spezzare coppie Unicode; questo evita che un dato descrittivo valido nel backend impedisca il caricamento nel frontend. File e nomi canonici non vengono modificati. Prova unitaria del confine Unicode e browser con nome interno da 120 caratteri più etichetta da 80.

## Prove

Due nuovi unitari controllano conservazione esatta dei byte/progetti, metadati persistenti, conflitti, URL non sicuri, tentativi di sostituzione di dati/metriche, risorse mancanti e protezione della provenienza Google anche per font archiviati.

Una nuova prova browser usa l’originale WOFF2 ABeeZee TEST: campione caricato nativamente, download confrontato byte per byte, modifica e riapertura, ricerca anche nelle note, filtri di formato/stato e archiviazione/riattivazione; controllo del layout mobile. Le prove usano archivi temporanei e non modificano la libreria personale del titolare. Checkpoint e log nello [stato locale](editor-local-status.md).

Gestione font ancora da completare: assi variabili, analisi completa dei font di sistema, distribuzione remota autenticata/backup e collaudo Illustrator. Nessun servizio nuovo, dipendenza, deploy o modifica commerciale.
