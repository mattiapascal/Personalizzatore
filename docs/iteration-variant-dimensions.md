# Dimensioni impronta dai metafield variante — 6 novembre 2026

Repository pulito su main prima delle modifiche. Verifica Admin in sola lettura: `custom.larghezza` e `custom.altezza` appartengono a PRODUCTVARIANT, tipo `number_decimal`, descrizione «Valore espresso in millimetri.». Sul Printy 4913 i valori sono 58.0 e 22.0.

Piano: leggere entrambi su ogni variante; usarli come fonte dimensionale autorevole per selezione, canvas ed export. Non sostituire un valore mancante o non valido con numeri estratti da titoli/descrizioni. Usare titoli/opzioni soltanto per identificare la forma. Conservare eventuali incongruenze descrittive come segnalazioni senza sovrascrivere i metafield. Aggiornare regole/cache/fixture, verificare cambi dimensionali e varianti mancanti, eseguire i controlli automatici e una lettura completa reale. Nessuna scrittura Shopify o chiamata AI a pagamento.

## Risultato

La query legge `imprintWidth` e `imprintHeight` come alias dei due metafield variante, con tipo e jsonValue. `deriveMountProfiles` accetta solo number_decimal, numero o stringa decimale valida, valore >0 e ≤1000 mm. Campi null, mancanti, parziali, zero, negativi, testo con unità o tipi diversi sospendono la variante. Nessun fallback dimensionale: titolo, opzione diametro e descrizione possono soltanto identificare forma e incongruenze.

La coppia alimenta `nominalAreaMm`, poi filtri, motivazioni, documento canonico, canvas e SVG. Se cambia un valore, cambia l'hash catalogo; i requisiti vengono rivalutati e una bozza sulla vecchia versione deve essere rivalidata prima dello SVG. La cache precedente viene invalidata da `mount-rules-v2-variant-metafields`. Il timer di lettura resta all'avvio/ogni cinque minuti, con applicazione UI automatica e protezione dai dati obsoleti.

Una misura descrittiva discordante viene riportata in `dataWarnings` e nei controlli del candidato; non esclude un profilo con metafield validi e forma coerente. Un tondo con lati differenti o una forma quadrata esplicita con lati differenti resta invece da verificare: i due numeri non definiscono una geometria valida per quella forma.

## Evidenze reali

Lettura completa: 228 prodotti, 214 attivi con URL. Il nuovo catalogo ha **66 profili su 64 prodotti**: 46 automatici, 17 tascabili, 3 a secco. Sedici profili hanno avvisi descrittivi. 166 prodotti hanno esclusioni o segnalazioni, comprese le referenze utilizzabili con avvisi: i conteggi si sovrappongono.

**Quindici varianti hanno i campi vuoti**:

| Prodotto | Varianti senza larghezza/altezza |
| --- | ---: |
| Timbro in legno ed ottone | 7 |
| Timbro in legno tondo | 3 |
| Timbro in plastica tondo | 4 |
| Timbro tascabile tondo Colop Pocket Stamp R40 | 1 |

Queste varianti sono sospese. Il supporto per manuali resta implementato: rientreranno automaticamente quando entrambi i campi saranno compilati e validi, salvo altri dati mancanti. Non è stata effettuata alcuna compilazione o scrittura Shopify. Le simulazioni nei test che aggiungono metafield ai manuali sono dichiarate sintetiche, non letture reali.

Backend reale verificato con catalogo fresco, regole v2 e 66 profili. Sul 4913 la provenienza è `custom.larghezza=58 mm, custom.altezza=22 mm` della variante `55021442564476`. Query validata contro Admin 2026-10: VALID, scope read_products.

## Verifiche e prossimi passi

73 test unitari e 19 browser e2e superati, build TypeScript/Vite superata. Copertura: autorità dei metafield, cambi dimensionali e versioni, assenza di fallback, tipi/valori invalidi, varianti e geometrie; tutti i 66 documenti iniziali validi con metriche reali Fabric. Percorso tondo a secco verificato fino a SVG fisico, testo vettoriale e JSON. Nessun costo AI aggiunto. Schemi e catture rigenerati; il campione legno Ø35 precedente rimane soltanto storico. Collaudo Illustrator non eseguito.

Prossima attività sui dati: completare i quindici campi dimensionali di variante e correggere le descrizioni discordanti in un'attività Shopify separatamente autorizzata; nessuna modifica al negozio è inclusa in questo incremento. Confermare sempre area utile, margini, font e specifiche produttive per montatura: leggere le dimensioni corrette non costituisce approvazione produttiva.
