**13 novembre:** [primo collegamento canonico](iteration-editor-production-profile-link.md) disponibile: snapshot/versione, misure fisse o della pagina, testo/immagini e guide visuali. Margini/zone non sono ancora blocchi geometrici; le indicazioni sotto descrivono la destinazione completa. Nessuna applicazione automatica ai template esistenti.

# Profili produttivi e template: responsabilità

Raccomandazione per la richiesta del titolare del 9 novembre 2026. Descrive la destinazione del modello: il canvas attuale mantiene ancora i profili TEST e non applica automaticamente i nuovi profili amministrativi.

## Regole proprie del prodotto

Il profilo prodotto/lavorazione versionato è la fonte per area utile effettiva, margini tecnici, colori e immagini consentiti, minimi produttivi, zone meccaniche di datari/numeratori e schemi di fissaggio. Devono valere per qualsiasi composizione, anche creata da zero o dall’AI. Un template non può ridurre un minimo tecnico o permettere di disegnare nella parte meccanica del prodotto.

Il limite di 7 pt e il B/N riguardano i timbri indicati dal titolare; punta da 0,5 mm e distanza di 30 mm fra vernici differenti riguardano le targhe incise. Non devono diventare regole ereditate da una targa soltanto stampata.

## Scelte proprie del template

Nel template risiedono composizione iniziale, stili, testi e segnaposto, oggetti modificabili/bloccati e le eventuali zone protette proprie del layout. Può riferirsi a più prodotti compatibili e aggiungere restrizioni editoriali; non sostituisce la geometria fisica dei prodotti associati.

Salvare tutti i parametri nel template replicherebbe gli stessi vincoli su molti record. Una modifica della montatura o il passaggio a un modello diverso potrebbe lasciarli incoerenti; il problema esiste anche con una composizione creata senza template. Il riferimento versionato al profilo evita questo disallineamento.

## Definizione visuale delle zone

La separazione dei dati non impone un’interfaccia solo numerica. Il nuovo strumento visuale del profilo permette già di disegnare/spostare/ridimensionare le zone nel backend. La destinazione completa rimane:

- in modalità **Prodotto**, salva una zona tecnica nel profilo del modello;
- in modalità **Template**, salva una zona o un oggetto bloccato del layout;
- nella vista cliente, mostra i vincoli risultanti e consente soltanto le modifiche ammesse.

La zona meccanica deve restare legata al prodotto durante un cambio formato; le zone del layout devono seguire una politica di adattamento esplicita. La preview prima della conferma deve mostrare entrambe. Nessuno spostamento o ridimensionamento silenzioso di una zona fisica.

Tutte le operazioni manuali e AI sul progetto dovranno usare gli stessi controlli, anche dopo importazioni, copia/incolla e trasformazioni. Il disegno delle zone nell’interfaccia, da solo, non costituisce un blocco produttivo: serve il rifiuto dei comandi non validi e la verifica finale sulla revisione approvata.

La definizione visuale delle zone del profilo e lo storico sono ora implementati: [dettagli e limiti](iteration-editor-profile-zones-shop-acceptance.md). Prossimo incremento: collegare un profilo reale verificato al documento e applicarne i vincoli a tutti i comandi, poi aggiungere le zone dei template. Nessuna misura o eccezione viene inventata per completare la dimostrazione.

## Misure variabili senza duplicare profili

Precisazione del titolare del 10 novembre: le dimensioni concrete provengono dalla variante oppure dai campi personalizzati del modulo BSS. Il profilo condiviso definisce come ottenere/validare dimensioni e area utile; non deve diventare una copia diversa per ogni coppia larghezza/altezza. Fissaggi scelti dal cliente e grafica usano quelle dimensioni effettive. Il template è indipendente dalla sorgente commerciale delle misure. [Contratto, fonti e limiti](editor-catalog-signage-study-2026-11-10.md#provenienza-delle-misure--precisazione-del-titolare).
