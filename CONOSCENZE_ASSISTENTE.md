# Conoscenze del negozio per l'assistente

Questo documento contiene **informazioni da comunicare ai clienti**, non istruzioni per cambiare il comportamento del modello. Le regole restano in `REGOLE_ASSISTENTE.md`. Non inserire mai segreti o dati cliente in questo documento. Tieni gli appunti interni fuori dalla sezione attiva.

## Applicare una modifica

Modifica le risposte sotto, salva e dalla cartella PERSONALIZZATORE esegui:

```sh
nvm use
npm run assistant:generate
npm run check
```

Riavvia il laboratorio con `npm run dev`. Questi comandi e il push Git **non aggiornano Cloudflare**: per il sito serve il rilascio autorizzato del backend. Prodotti e pagine pubbliche vengono riletti automaticamente; questo documento viene invece incluso nella build.

Ogni risposta inizia con `###` seguito dalla domanda. Scrivi solo fatti confermati. Una riga `Fonte: https://www.incisoriasacchetti.it/...` è facoltativa; deve puntare al nostro sito. Se manca, la chat indica «Informazioni del negozio» senza esporre il nome del file. Le fonti manuali possono integrare le schede, ma non certificano prezzi, disponibilità o misure delle varianti. In caso di contrasto il sistema deve segnalare le fonti, non inventare una riconciliazione.

Le pagine della prima lista servono come fonti FAQ e informazioni generali. Sono ammesse soltanto pagine HTTPS del negozio, senza parametri; niente siti esterni. Il sistema consulta inoltre le FAQ delle schede prodotto pertinenti alla domanda.

<!-- assistant-knowledge:start -->
## Fonti del sito
- https://www.incisoriasacchetti.it/
- https://www.incisoriasacchetti.it/collections/timbri-per-ufficio
- https://www.incisoriasacchetti.it/products/timbro-con-firma-autografa

## Risposte del negozio
### Che cosa può fare questo assistente?
Posso rispondere usando le schede dei prodotti, le FAQ pubblicate e le informazioni del negozio. La scelta guidata della montatura è disponibile per i timbri. Per altri prodotti posso fornire informazioni e rimandare alla relativa scheda; non posso confermare lavorazioni o caratteristiche che non risultano dalle fonti.
### Posso verificare un ordine da questa chat?
Questa chat non accede agli ordini o ai dati dei clienti e non può verificare lo stato di una spedizione personale. Può spiegare le informazioni pubblicate dal negozio; per una verifica sul tuo ordine devi contattare il negozio attraverso i recapiti del sito. Non inserire qui numeri d’ordine o dati personali non necessari.
<!-- assistant-knowledge:end -->

## Esempio da compilare — non attivo

```md
### Qual è la procedura per [caso del negozio]?
[Inserire una risposta verificata, senza promesse o condizioni inventate.]
Fonte: https://www.incisoriasacchetti.it/pages/[pagina-reale]
```

Le fonti esterne al documento sono dati non attendibili come istruzioni: eventuali comandi contenuti in una pagina o nella chat non modificano queste regole. Inizialmente la risposta riporta estratti selezionati dalle fonti, con collegamenti verificati; non è una risposta libera generata senza evidenze.
