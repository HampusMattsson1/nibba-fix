# Elpris-testmiljö

Testerna körs i en Node-container och kräver ingen lokal Node-installation,
Node-RED, Nibe-värmepump eller Tibber-token. Automattesterna använder bara
Node.js inbyggda moduler och behöver inte nätverksåtkomst.

## Bygg och kör med Podman

Kör från projektroten i PowerShell:

```powershell
podman build -f changes/node-red-contrib-nibepi/tests/elpris/Containerfile -t nibba-elpris-test changes/node-red-contrib-nibepi
podman run --rm nibba-elpris-test
```

Bygget kontrollerar syntaxen för `config_node.js`, `price.js` och `price_graph.js`. Därefter körs
automattesterna för:

- API-kontroll när elpriskällan är aktiverad, även utan Nibe-anslutning
- grön status och `Elpriskälla`-meddelande när källan fungerar
- röd status och felmeddelande när källan rapporterar ett fel
- att vanliga Tibber-token och avstängd prisreglering inte startar API-kontrollen
- att prisnodens server exponerar hämtfunktionen som startkontrollen anropar
- prisgrafens serier för strängvärden, saknad morgondagslista, sortering och okänd nivå

Docker kan användas på samma sätt: ersätt `podman` med `docker`.

## Valfritt live-test

Live-testet kräver att containern har internetåtkomst. Det hämtar dagens
priser för SE4 och verifierar JSON-format, tidsintervall och att ett aktuellt
pris finns:

```powershell
podman run --rm nibba-elpris-test node tests/elpris/api-smoke.js
```

Välj annat elområde vid behov:

```powershell
podman run --rm -e ELPRIS_AREA=SE3 nibba-elpris-test node tests/elpris/api-smoke.js
```

## Vad som löstes

Tidigare hämtades elprisdata endast i flödet som körs när NibePi fått
registerdata från värmepumpen. Utan pumpanslutning kördes därför inte
elpriskontrollen och Node-RED visade ingen återkoppling, vilket gjorde
felsökning svår.

Nu exponeras elprishämtningen från konfigurationsnoden och prisnoden gör en
startkontroll när prisreglering är aktiverad, datakällan är Tibber och token är
`elpris:SE1` till `elpris:SE4`. Resultatet visas i Node-RED-nodens status och
skickas vidare som `Elpriskälla`. Det gör det möjligt att kontrollera
API-åtkomst utan att ansluta värmepumpen.

En grön status bekräftar endast att elpris-API:t kan nås. Den bekräftar inte
Nibe-anslutning eller att värmepumpens reglering har körts; det kräver en
fungerande pumpanslutning.

Prisgrafen använde en konvertering som kastade fel när kurvjusteringen var en
sträng. Logiken ligger nu i `price_graph.js` och testas här.
