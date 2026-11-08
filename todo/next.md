status med senaste kod: den säger fortfarande inget och fungerar inte. Dock behöver vi lägga till något visuellt sätt att veta att vi kör denna nibba-fix v0.1 t.ex. i webbgränssnittet.

OCI-Containern som ska representera en nibe-pi (konfigurerad raspberry pi som kör hela nibe image:n från http://anerdins.se/NibePi/nibepi_1.1.1.rar, som baserar sig på repot https://github.com/anerdins/nibepi.git) behöver visa att det faktiskt fungera, för att klassa att det verkligen är testat.

Jag har nu med en flows.json som förväntas ligga i .node-red mappen bredvid t.ex. change.js, detta gör att vi har ett definierat flöde i web route:n /ui applikationen.
