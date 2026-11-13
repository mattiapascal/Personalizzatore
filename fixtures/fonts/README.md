# Fixture font WOFF2

ABeeZee, subset TEST del campione fisso «ABeeZee Aa Città 0123», scaricato il 9 novembre 2026. Nessun testo cliente.

Origine CSS: https://fonts.googleapis.com/css2?family=ABeeZee&display=swap&text=ABeeZee%20Aa%20Citt%C3%A0%200123

File restituito: https://fonts.gstatic.com/l/font?kit=esDR31xSG-6AGleN6te2gp82I6KVWYiD77DlPcxWNp3QWsj4Y8OY&skey=abecda27d5b3409a&v=v23

Licenza originale inclusa in ABeeZee-OFL.txt, fonte https://raw.githubusercontent.com/google/fonts/main/ofl/abeezee/OFL.txt. Il file è conservato per test offline del decoder nativo del browser e dell’analisi locale delle tabelle.

## Famiglie complete per i collaudi dell’editor

Arimo (normale, grassetto, corsivo, grassetto corsivo), Tinos e Cousine (ciascuno con normale, grassetto, corsivo e grassetto corsivo) sono fixture TEST scaricate direttamente dal CSS Google Fonts, senza copiare i font personali dell’archivio o quelli del sistema operativo. I dodici file mantengono i byte ricevuti; URL, hash SHA-256, identità e varianti sono registrati in `editor-fonts.TEST.sources.json`. Le licenze originali OFL dei tre progetti sono conservate accanto ai file. Font e licenze non sono modificati.

Fonti ufficiali: [Arimo](https://github.com/googlefonts/arimo), [Tinos](https://github.com/googlefonts/tinos), [Cousine](https://github.com/googlefonts/cousine). I file riportano i rispettivi copyright nei metadati; i test verificano nome, peso, corsivo e hash.

Questi font vengono serviti soltanto dagli archivi fittizi dei test. Non vengono installati nella libreria personale, distribuiti come opzioni predefinite dell’applicazione o usati per sostituire automaticamente font di progetti reali. `tests/helpers/editor-fonts.ts` contiene la scelta esplicita usata per nuove fixture e per copie dei campioni storici; il campione storico originale resta conservato.

`tests/helpers/compressed-fonts.ts` costruisce inoltre un WOFF 1.0 reale da Arimo normale TEST, conservando le tabelle originali e comprimendole separatamente. Il cmap è effettivamente compresso. Serve al collaudo del renderer PDF insieme al subset ABeeZee WOFF2; i sorgenti TTF/WOFF2 qui conservati non vengono modificati. Il campione `fixtures/illustrator/pdf-fonts.TEST.json/svg` incorpora i file e le licenze, senza font di sistema o dati personali.
