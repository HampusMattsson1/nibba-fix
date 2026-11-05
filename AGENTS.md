**Grundidé:** Hijacka Tibber-flödet att använda det öppna API:et från elprisetjustnu.se.
Tanken är att när man specificar en "speciell" token för Tibber så ska det "hijackade flödet" aktiveras, där vill man även ha feedback i web GUI:et för att säkerställa att det har hänt.

Alltså kommer det bli kod-ändring på tvä ställen
Utifrån min egna research så finns tibber saker här: node-red-contrib-nibepi\config_node.js

Det grafiska webb-gränssnittet finns någonstans i nibepi

Sedan vet jag inte riktigt hur dessa pratar med varandra


**Ändringar som är gjorda ska ligga i changes/ mappen och ha en undermapp för respektive grund-repo som koden först kommer ifrån