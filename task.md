**Grundidé:** Hijacka Tibber-flödet att använda det öppna API:et från elprisetjustnu.se.
Tanken är att när man specificar en "speciell" token för Tibber så ska det "hijackade flödet" aktiveras, där vill man även ha feedback i web GUI:et för att säkerställa att det har hänt.

Alltså kommer det bli kod-ändring på tvä ställen
Utifrån min egna research så finns tibber saker här: node-red-contrib-nibepi\config_node.js

Det grafiska webb-gränssnittet finns någonstans i nibepi

Sedan vet jag inte riktigt hur dessa pratar med varandra

**Andra resurser:**
https://www.elprisetjustnu.se/api/v1/prices/2026/10-30_SE4.json
Här tror jag att API:et fungerar så att delarna av API:ets route är kopplat till datum och vilket El-område man ska hämta data för.
I mitt fall så är det SE4 som gäller.

Om möjligt, gör funktionaliteten så lik tibber som möjligt och så fullfjädrad, samtidigt som det ska vara simpelt

Här finns dokumentation: https://www.elprisetjustnu.se/elpris-api

Fråga mig om något du inte förstår, annars ta och implementera lösningen